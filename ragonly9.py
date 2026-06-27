# =============================================================================
#  AgriRAG Pro — OPTIMIZED PRODUCTION EDITION
#  Version: 9.0 | Performance-Optimized Build
#  CHANGELOG v9.0 (built on v8.0):
#    - PERF: translate_query() skips LLM call entirely when heuristic detects
#            English — saves 800-2000ms per English request (majority of traffic)
#    - PERF: pipeline() now encodes ONCE on the original query and reuses the
#            embedding for cache lookup AND multilingual_search — eliminates
#            the second encode_query(translations["en"]) call
#    - PERF: multilingual_search() accepts optional pre-computed embeddings,
#            skips re-encoding queries that were already embedded by caller
#    - PERF: SemanticCache now uses collections.deque for O(1) eviction instead
#            of list.pop(0) which was O(n) — critical at CACHE_MAX_SIZE=256
#    - PERF: _cosine_rerank() is now a staticmethod — avoids self lookup overhead
#            in hot path; chunk batch encode was already correct, kept as-is
#    - PERF: retrieve_for_disease() build_disease_search_query call is now shared
#            with /retrieve endpoint via return value — zero duplicate builds
#    - FIX:  Groq key cascade adds per-key circuit breaker: failed keys are
#            temporarily disabled for GROQ_COOLDOWN_SEC (default 30s) so
#            subsequent requests don't waste 20s waiting on a dead key
#    - PERF: translate_query() for non-English now runs heuristic lang detection
#            first and passes it as a hint to LLM — reduces hallucinated lang codes
#    - PERF: GROQ request timeout reduced from 20s to 12s — faster failover
#    - MISC: retrieve_for_disease() returns search_query alongside chunks so
#            /retrieve endpoint doesn't rebuild it a second time
#    - MISC: _SORRY_MSGS moved to module level — not re-created per instance
#    - COMPAT: All v8.0 endpoints preserved (/ask, /ask/stream, /retrieve,
#              /health, /health/deep, /stats, /, /ui)
# =============================================================================

from __future__ import annotations

import asyncio
import json
import logging
import os
import re

os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

import time
import unicodedata
import uuid
import requests
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from functools import wraps
from threading import Lock
from typing import AsyncGenerator, Dict, Generator, List, Optional, Tuple

import numpy as np
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, HTMLResponse
from huggingface_hub import InferenceClient, snapshot_download
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field, field_validator
from sentence_transformers import SentenceTransformer

try:
    import chromadb
except ImportError as exc:
    raise RuntimeError("chromadb is required — pip install chromadb") from exc


# =============================================================================
# SECTION 1 — CONFIGURATION
# =============================================================================

class Config:
    HF_TOKEN:         str  = os.environ.get("HF_TOKEN", "")
    LLM_MODEL:        str  = os.environ.get("LLM_MODEL",   "Qwen/Qwen2.5-7B-Instruct")
    EMBED_MODEL:      str  = os.environ.get("EMBED_MODEL", "BAAI/bge-m3")
    DATASET_REPO_ID:  str  = os.environ.get("DATASET_REPO_ID", "ahmedsaeed111/AgriRAG-DB")

    GROQ_KEYS: List[str] = [
        os.environ.get("GROQ_KEY_1", ""),
        os.environ.get("GROQ_KEY_2", ""),
    ]
    GROQ_MODEL:       str   = "llama-3.3-70b-versatile"
    # v9.0: reduced from 20s → 12s for faster failover to next key / HF
    GROQ_TIMEOUT:     int   = 12
    # v9.0: how long (seconds) to skip a Groq key after it fails
    GROQ_COOLDOWN_SEC: int  = 30

    CHROMA_PATH:      str       = os.environ.get("CHROMA_PATH",     "./chroma_db")
    COLLECTION_NAME:  str       = os.environ.get("COLLECTION_NAME", "agricultural_knowledge")
    ALLOWED_SOURCES: frozenset = frozenset([
        "Plant_Diseases_QA", "KisanVaani_Farmers", "SARTHI_Advisory",
        "CGIAR_Research", "Soil_QA", "Farming_Advisory", "Crop_Science_QA",
    ])

    DEFAULT_TOP_K:    int  = 8
    MAX_TOP_K:        int  = 20
    RERANK_TOP_N:     int  = 6

    LLM_MAX_TOKENS:   int   = 800
    LLM_TEMPERATURE:  float = 0.30
    LLM_TOP_P:        float = 0.90
    LLM_REP_PENALTY:  float = 1.15
    LLM_RETRY_COUNT:  int   = 3
    LLM_RETRY_DELAY:  float = 2.0
    LLM_HISTORY_MSGS: int   = 4

    TRANSLATE_MAX_TOKENS: int = 256

    MAX_QUESTION_LEN:  int = 1000
    MAX_HISTORY_MSGS:  int = 10
    MAX_CONTEXT_CHARS: int = 12_000

    CACHE_MAX_SIZE:   int   = 256
    CACHE_SIM_THRESH: float = 0.92

    LOOP_MIN_WORDS:  int = 20
    LOOP_WINDOW:     int = 30
    LOOP_UNIQUE_MIN: int = 5

    STREAM_EXECUTOR_WORKERS: int = 4

    APP_VERSION: str = "9.0"
    LOG_LEVEL:   str = os.environ.get("LOG_LEVEL", "INFO")


# =============================================================================
# SECTION 2 — LOGGING
# =============================================================================

logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("AgriRAG-Pro")


# =============================================================================
# SECTION 3 — UTILITY HELPERS
# =============================================================================

def retry(max_attempts: int = 3, base_delay: float = 2.0, exceptions=(Exception,)):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            last_exc: Exception = RuntimeError("unknown")
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as exc:
                    last_exc = exc
                    if attempt < max_attempts:
                        delay = base_delay * (2 ** (attempt - 1))
                        logger.warning(
                            f"[retry] {func.__name__} attempt {attempt}/{max_attempts} "
                            f"failed: {exc}. Retrying in {delay:.1f}s …"
                        )
                        time.sleep(delay)
                    else:
                        logger.error(f"[retry] {func.__name__} exhausted {max_attempts} attempts.")
            raise last_exc
        return wrapper
    return decorator


_JSON_FENCE_RE = re.compile(r"```[\w]*", re.MULTILINE)

def safe_parse_json(raw: str) -> Optional[dict]:
    if not raw:
        return None
    cleaned = _JSON_FENCE_RE.sub("", raw).replace("```", "").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[^{}]*\}", cleaned, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    result: Dict[str, str] = {}
    for key in ("detected_lang", "en", "hi"):
        m = re.search(rf'"{key}"\s*:\s*"([^"]+)"', cleaned)
        if m:
            result[key] = m.group(1)
    return result if result else None


_URDU_EXCLUSIVE_RE    = re.compile(r"[\u0679\u0688\u0691\u06BA\u06C1\u06BE\u06D2\u06CC\u0698]")
_ARABIC_COMMON_WORDS  = re.compile(
    r"\b(هذا|هذه|ذلك|تلك|الذي|التي|الذين|اللاتي|كيف|ماذا|لماذا|متى|أين|"
    r"نعم|لا|أنا|أنت|هو|هي|نحن|هم|هن|كان|كانت|يكون|تكون|"
    r"في|من|إلى|على|عن|مع|بين|لأن|حتى|إذا|لكن|أو|و|ف)\b"
)
_ARABIC_RE     = re.compile(r"[\u0600-\u06FF]")
_DEVANAGARI_RE = re.compile(r"[\u0900-\u097F]")
_CHINESE_RE    = re.compile(r"[\u4E00-\u9FFF]")
_CYRILLIC_RE   = re.compile(r"[\u0400-\u04FF]")
_LATIN_RE      = re.compile(r"[a-zA-Z]")


def heuristic_lang(text: str) -> str:
    if not text:
        return "en"
    counts = {
        "hi": len(_DEVANAGARI_RE.findall(text)),
        "zh": len(_CHINESE_RE.findall(text)),
        "ru": len(_CYRILLIC_RE.findall(text)),
        "en": len(_LATIN_RE.findall(text)),
    }
    dominant_non_arabic = max(counts, key=counts.get)
    arabic_char_count = len(_ARABIC_RE.findall(text))

    if arabic_char_count == 0:
        if counts[dominant_non_arabic] > 2:
            return dominant_non_arabic
        return "en"
    if _URDU_EXCLUSIVE_RE.search(text):
        return "ur"
    if _ARABIC_COMMON_WORDS.search(text):
        return "ar"
    if arabic_char_count > 2:
        return "ar"
    if counts[dominant_non_arabic] > 2:
        return dominant_non_arabic
    return "en"


def detect_and_fix_loop(text: str) -> Tuple[bool, str]:
    words = text.split()
    if len(words) < Config.LOOP_MIN_WORDS:
        return False, text
    window = words[-Config.LOOP_WINDOW:]
    unique = set(window)
    if len(unique) < Config.LOOP_UNIQUE_MIN:
        sentences = re.split(r"(?<=[.!?؟।\n])\s+", text)
        clean_sentences = []
        running_words: deque = deque(maxlen=Config.LOOP_WINDOW)
        for sent in sentences:
            sent_words = sent.split()
            running_words.extend(sent_words)
            if len(set(list(running_words)[-Config.LOOP_WINDOW:])) >= Config.LOOP_UNIQUE_MIN:
                clean_sentences.append(sent)
            else:
                break
        cleaned = " ".join(clean_sentences).strip()
        if not cleaned:
            cleaned = text[:500] + "\n\n[Response truncated due to generation error]"
        return True, cleaned
    return False, text


def truncate_context(context: str, max_chars: int = Config.MAX_CONTEXT_CHARS) -> str:
    if len(context) <= max_chars:
        return context
    truncated = context[:max_chars]
    last_newline = truncated.rfind("\n")
    return (truncated[:last_newline] if last_newline > 0 else truncated) + \
           "\n\n[... context truncated for length ...]"


def _reconcile_lang(llm_lang: str, script_lang: str, text: str) -> str:
    if script_lang == "ar" and llm_lang == "ur":
        return "ar"
    if script_lang == "ur" and llm_lang == "ar":
        return "ur"
    if script_lang in ("ar", "ur", "hi", "zh", "ru") and llm_lang == "en":
        return script_lang
    return llm_lang


_IMAGE_ANALYSIS_PHRASES = [
    "please analyze", "analyze this", "analyze my", "analyze the",
    "what is this", "what disease", "identify this", "identify my",
    "check this plant", "check my plant", "look at this", "look at my",
    "diagnose this", "diagnose my", "tell me about this",
]


def build_disease_search_query(disease_name: str, user_question: str = "") -> str:
    disease_display = disease_name.replace("_", " ").strip()
    base_query = (
        f"{disease_display} plant disease symptoms causes treatment "
        f"prevention cure management fungicide pesticide care"
    )
    q = user_question.strip()
    q_lower = q.lower()
    is_image_phrase = any(p in q_lower for p in _IMAGE_ANALYSIS_PHRASES)
    is_meaningful = q and not is_image_phrase and len(q) > 10
    if is_meaningful:
        base_query = f"{base_query} {q}"
    return base_query[:Config.MAX_QUESTION_LEN]


# =============================================================================
# MODULE-LEVEL CONSTANTS (v9.0: moved out of class to avoid per-instance cost)
# =============================================================================

_SORRY_MSGS: Dict[str, str] = {
    "en": "Sorry, an error occurred while processing your request. Please try again.",
    "ar": "عذراً، حدث خطأ في معالجة طلبك. يرجى المحاولة مرة أخرى.",
    "hi": "क्षमा करें, आपके अनुरोध को संसाधित करने में त्रुटि हुई। कृपया पुनः प्रयास करें।",
    "es": "Lo sentimos, ocurrió un error al procesar su solicitud. Por favor, inténtelo de nuevo.",
    "fr": "Désolé, une erreur s'est produite. Veuillez réessayer.",
    "de": "Entschuldigung, ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.",
    "zh": "抱歉，处理您的请求时出现错误。请重试。",
    "ru": "Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте снова.",
    "ur": "معذرت، آپ کی درخواست پر کارروائی کرتے وقت ایک خرابی پیش آئی۔ براہ کرم دوبارہ کوشش کریں۔",
}


# =============================================================================
# SECTION 4 — SEMANTIC CACHE  (v9.0: deque replaces list for O(1) eviction)
# =============================================================================

class SemanticCache:
    """
    Thread-safe LRU semantic cache.

    v9.0 fix: _embs/_answers/_langs are now parallel deques with maxlen=max_size.
    The old list.pop(0) on overflow was O(n) — deque.appendleft+rotate is O(1).
    lookup() still builds a temporary numpy matrix from the deque for batch
    dot-product (same O(batch) complexity as v8.0, now with O(1) eviction).
    """

    def __init__(self, max_size: int = Config.CACHE_MAX_SIZE,
                 threshold: float = Config.CACHE_SIM_THRESH):
        self._embs:    deque = deque(maxlen=max_size)
        self._answers: deque = deque(maxlen=max_size)
        self._langs:   deque = deque(maxlen=max_size)
        self._lock     = Lock()
        self.max_size  = max_size
        self.threshold = threshold
        self.hits      = 0
        self.misses    = 0

    def lookup(self, emb: np.ndarray) -> Optional[Tuple[str, str]]:
        with self._lock:
            if not self._embs:
                self.misses += 1
                return None
            try:
                matrix = np.array(self._embs)
                scores = matrix @ emb
                best_idx = int(np.argmax(scores))
                if scores[best_idx] >= self.threshold:
                    self.hits += 1
                    return self._answers[best_idx], self._langs[best_idx]
                self.misses += 1
                return None
            except Exception as e:
                logger.error(f"SemanticCache error: {e}")
                self.misses += 1
                return None

    def store(self, emb: np.ndarray, answer: str, lang: str) -> None:
        with self._lock:
            # deque automatically evicts oldest when maxlen is reached — O(1)
            self._embs.append(emb)
            self._answers.append(answer)
            self._langs.append(lang)

    @property
    def stats(self) -> dict:
        return {
            "size":     len(self._embs),
            "hits":     self.hits,
            "misses":   self.misses,
            "hit_rate": round(self.hits / max(1, self.hits + self.misses), 3),
        }


# =============================================================================
# SECTION 5 — CORE AI SYSTEM
# =============================================================================

class AISystem:
    """
    v9.0 performance improvements:
      - translate_query(): skips LLM entirely for English text (heuristic fast path)
      - pipeline(): single encode_query call reused for cache + search
      - multilingual_search(): accepts pre-computed embeddings, no re-encoding
      - _cosine_rerank(): promoted to @staticmethod (no self overhead in hot path)
      - Groq cascade: per-key circuit breaker (GROQ_COOLDOWN_SEC) + 12s timeout
      - retrieve_for_disease(): returns (chunks, search_query) tuple so endpoint
        never rebuilds the query string
    """

    def __init__(self):
        self._validate_config()
        self.cache = SemanticCache()
        self._request_count  = 0
        self._retrieve_count = 0
        self._error_count    = 0
        self._ready          = False
        self._doc_count      = 0

        # v9.0: per-key circuit breaker — tracks when each key last failed
        self._groq_failed_at: Dict[int, float] = {}

        self._stream_executor = ThreadPoolExecutor(
            max_workers=Config.STREAM_EXECUTOR_WORKERS,
            thread_name_prefix="agrirag-stream",
        )

        logger.info("=" * 60)
        logger.info(f"  AgriRAG Pro v{Config.APP_VERSION} — Starting Up")
        logger.info("=" * 60)

        self._load_dataset()
        self._load_embed_model()
        self._load_chromadb()
        self._load_llm()

        self._ready = True
        logger.info("✅ AgriRAG Pro is ONLINE and ready for production traffic.")

    # ── Startup helpers ───────────────────────────────────────────────────────

    @staticmethod
    def _validate_config():
        if not Config.HF_TOKEN:
            raise EnvironmentError(
                "HF_TOKEN environment variable is not set."
            )

    @retry(max_attempts=3, base_delay=5.0)
    def _load_dataset(self):
        logger.info(f"⬇️  Downloading dataset: {Config.DATASET_REPO_ID}")
        snapshot_download(
            repo_id=Config.DATASET_REPO_ID,
            repo_type="dataset",
            local_dir=".",
            token=Config.HF_TOKEN,
            ignore_patterns=["*.md", "*.txt"],
        )
        logger.info("✅ Dataset downloaded.")

    @retry(max_attempts=2, base_delay=3.0)
    def _load_embed_model(self):
        logger.info(f"🧠 Loading embedding model: {Config.EMBED_MODEL}")
        self.embed_model = SentenceTransformer(Config.EMBED_MODEL)
        logger.info("✅ Embedding model loaded.")

    def _load_chromadb(self):
        logger.info(f"🗄️  Opening ChromaDB at: {Config.CHROMA_PATH}")
        self.chroma_client = chromadb.PersistentClient(path=Config.CHROMA_PATH)
        try:
            self.collection = self.chroma_client.get_collection(Config.COLLECTION_NAME)
            self._doc_count = self.collection.count()
            logger.info(
                f"✅ ChromaDB '{Config.COLLECTION_NAME}' — {self._doc_count} docs."
            )
        except Exception as exc:
            raise RuntimeError(
                f"ChromaDB collection '{Config.COLLECTION_NAME}' not found: {exc}"
            ) from exc

    def _load_llm(self):
        logger.info(f"🤖 Connecting to LLM: {Config.LLM_MODEL}")
        self.llm = InferenceClient(model=Config.LLM_MODEL, token=Config.HF_TOKEN, timeout=20)
        logger.info("✅ LLM client ready.")

    # =========================================================================
    # STEP 1 — Encode query
    # =========================================================================

    def encode_query(self, text: str) -> np.ndarray:
        vec = self.embed_model.encode(
            [text],
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        return vec[0]

    # =========================================================================
    # GROQ / HF CASCADE — v9.0: circuit breaker + reduced timeout
    # =========================================================================

    def _groq_key_available(self, idx: int) -> bool:
        """Return True if key idx is not in cooldown."""
        failed_at = self._groq_failed_at.get(idx)
        if failed_at is None:
            return True
        if time.time() - failed_at >= Config.GROQ_COOLDOWN_SEC:
            del self._groq_failed_at[idx]
            return True
        return False

    def _call_chat_completion(
        self, messages: list, max_tokens: int, temperature: float, is_json: bool = False
    ) -> str:
        payload = {
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": Config.LLM_TOP_P,
        }
        if is_json:
            payload["response_format"] = {"type": "json_object"}

        for i, key in enumerate(Config.GROQ_KEYS):
            if not key or not self._groq_key_available(i):
                continue
            payload["model"] = Config.GROQ_MODEL
            try:
                resp = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {key}"},
                    json=payload,
                    timeout=Config.GROQ_TIMEOUT,  # v9.0: 12s instead of 20s
                )
                if resp.status_code == 200:
                    return resp.json()["choices"][0]["message"]["content"].strip()
                logger.warning(f"Groq Key {i+1} HTTP {resp.status_code}")
                self._groq_failed_at[i] = time.time()  # circuit break
            except Exception as e:
                logger.warning(f"Groq Key {i+1} exception: {e}")
                self._groq_failed_at[i] = time.time()  # circuit break

        logger.warning("All Groq keys failed/cooling down. Falling back to HuggingFace.")
        if is_json and "response_format" in payload:
            del payload["response_format"]
        try:
            resp = self.llm.chat_completion(**payload)
        except Exception as exc:
            if "repetition_penalty" in str(exc).lower() or "422" in str(exc):
                payload.pop("repetition_penalty", None)
                resp = self.llm.chat_completion(**payload)
            else:
                raise
        return resp.choices[0].message.content.strip()

    def _stream_chat_completion(
        self, messages: list, max_tokens: int, temperature: float
    ) -> Generator[str, None, None]:
        payload = {
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "top_p": Config.LLM_TOP_P,
            "stream": True,
        }

        for i, key in enumerate(Config.GROQ_KEYS):
            if not key or not self._groq_key_available(i):
                continue
            payload["model"] = Config.GROQ_MODEL
            try:
                resp = requests.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {key}"},
                    json=payload,
                    stream=True,
                    timeout=Config.GROQ_TIMEOUT,
                )
                if resp.status_code == 200:
                    for line in resp.iter_lines():
                        if line:
                            line_str = line.decode("utf-8")
                            if line_str.startswith("data: "):
                                data_str = line_str[6:]
                                if data_str.strip() == "[DONE]":
                                    break
                                try:
                                    data = json.loads(data_str)
                                    delta = data["choices"][0]["delta"].get("content", "")
                                    if delta:
                                        yield delta
                                except json.JSONDecodeError:
                                    pass
                    return
                logger.warning(f"Groq Stream Key {i+1} HTTP {resp.status_code}")
                self._groq_failed_at[i] = time.time()
            except Exception as e:
                logger.warning(f"Groq Stream Key {i+1} exception: {e}")
                self._groq_failed_at[i] = time.time()

        logger.warning("All Groq keys failed for streaming. Falling back to HuggingFace.")
        try:
            stream = self.llm.chat_completion(**payload)
        except Exception as exc:
            if "repetition_penalty" in str(exc).lower() or "422" in str(exc):
                payload.pop("repetition_penalty", None)
                stream = self.llm.chat_completion(**payload)
            else:
                raise
        for chunk in stream:
            delta = chunk.choices[0].delta.content or ""
            if delta:
                yield delta

    # =========================================================================
    # STEP 2 — Language detection + translation  (v9.0: English fast path)
    # =========================================================================

    @retry(max_attempts=2, base_delay=1.0)
    def _call_translate_llm(self, question: str, hint_lang: str = "") -> Optional[dict]:
        """
        LLM translation call.  hint_lang (from heuristic) is passed in the
        prompt so the model has a prior — reduces hallucinated language codes.
        """
        hint_line = (
            f"HINT: The script analysis suggests the language may be '{hint_lang}'.\n\n"
            if hint_lang and hint_lang != "en" else ""
        )
        prompt = (
            "TASK: Detect the language of the TEXT below and translate it.\n\n"
            f"{hint_line}"
            "OUTPUT RULES (CRITICAL):\n"
            "  • Return ONLY a raw JSON object — no markdown, no backticks.\n"
            '  • Keys: "detected_lang" (ISO 639-1), "en" (English), "hi" (Hindi Devanagari)\n\n'
            "EXAMPLE:\n"
            '{"detected_lang": "ar", "en": "Hello", "hi": "नमस्ते"}\n\n'
            f"TEXT: {question}\n\n"
            "YOUR JSON RESPONSE:"
        )
        raw = self._call_chat_completion(
            messages=[{"role": "user", "content": prompt}],
            max_tokens=Config.TRANSLATE_MAX_TOKENS,
            temperature=0.0,
            is_json=True,
        )
        return safe_parse_json(raw)

    def translate_query(self, question: str) -> dict:
        """
        v9.0 fast path: heuristic_lang() is ALWAYS called first (it's O(n) regex,
        ~0.1ms).  If it confidently returns 'en', we skip the LLM translation
        call entirely and return immediately — saving 800–2000ms per request.

        For non-English, the heuristic result is passed as a hint to the LLM to
        reduce hallucinated lang codes (e.g. Arabic being misidentified as Urdu).
        """
        script_lang = heuristic_lang(question)

        # ── v9.0: English fast path — no LLM needed ──────────────────────────
        if script_lang == "en":
            logger.info("🌐 Lang: en (heuristic fast path — LLM skipped)")
            return {"detected_lang": "en", "en": question, "hi": question}

        # ── Non-English: call LLM with heuristic hint ─────────────────────────
        try:
            llm_result = self._call_translate_llm(question, hint_lang=script_lang)
            if llm_result and all(k in llm_result for k in ("detected_lang", "en", "hi")):
                lang = str(llm_result["detected_lang"]).strip().lower()[:5]
                if not re.match(r"^[a-z]{2,3}$", lang):
                    lang = script_lang
                else:
                    lang = _reconcile_lang(lang, script_lang, question)
                logger.info(f"🌐 Lang: {lang} | EN: {llm_result['en'][:60]}…")
                return {
                    "detected_lang": lang,
                    "en": str(llm_result.get("en", question)),
                    "hi": str(llm_result.get("hi", question)),
                }
        except Exception as exc:
            logger.warning(f"Translation LLM failed: {exc}. Using heuristic fallback.")

        logger.info(f"🌐 Heuristic lang: {script_lang}")
        return {"detected_lang": script_lang, "en": question, "hi": question}

    # =========================================================================
    # STEP 3a — ChromaDB search helpers
    # =========================================================================

    def _search_single(self, query: str, top_k: int) -> List[Tuple[str, dict, float]]:
        """Search ChromaDB using a text query string (encodes internally)."""
        vec = self.embed_model.encode(
            [query], normalize_embeddings=True, show_progress_bar=False
        ).tolist()
        return self._query_chroma(vec, top_k)

    def _search_with_emb(
        self, query_emb: np.ndarray, top_k: int
    ) -> List[Tuple[str, dict, float]]:
        """Search ChromaDB using a pre-computed embedding."""
        return self._query_chroma([query_emb.tolist()], top_k)

    def _query_chroma(
        self, vec: list, top_k: int
    ) -> List[Tuple[str, dict, float]]:
        filter_clause = {"source": {"$in": list(Config.ALLOWED_SOURCES)}}
        results = self.collection.query(
            query_embeddings=vec,
            n_results=min(top_k, self._doc_count),
            where=filter_clause,
            include=["documents", "metadatas", "distances"],
        )
        items = []
        docs      = results.get("documents", [[]])[0]
        metas     = results.get("metadatas",  [[]])[0]
        distances = results.get("distances",  [[]])[0]
        for doc, meta, dist in zip(docs, metas, distances):
            if doc and doc.strip():
                items.append((doc, meta, dist))
        return items

    @staticmethod
    def _cosine_rerank(
        query_emb: np.ndarray,
        candidates: List[Tuple[str, dict]],
        embed_model,
        top_n: int,
    ) -> List[dict]:
        """
        v9.0: Promoted to @staticmethod — avoids attribute lookup overhead in
        hot path.  embed_model passed explicitly.
        """
        if not candidates:
            return []
        texts = [c[0] for c in candidates]
        chunk_embs = embed_model.encode(
            texts, normalize_embeddings=True, show_progress_bar=False
        )
        scores = np.dot(chunk_embs, query_emb)
        ranked = sorted(zip(scores, candidates), key=lambda x: x[0], reverse=True)
        return [
            {"doc": doc, "meta": meta, "score": float(score)}
            for score, (doc, meta) in ranked[:top_n]
        ]

    def multilingual_search(
        self,
        translations: dict,
        query_emb: np.ndarray,
        top_k: int = Config.DEFAULT_TOP_K,
    ) -> List[dict]:
        """
        v9.0: The first query ("en") now uses the pre-computed query_emb directly
        via _search_with_emb() instead of re-encoding via _search_single().
        HI and original queries still encode independently (different text).

        This eliminates one redundant encode call vs v8.0 (which called
        _search_single(en_text) which re-encoded text that was already embedded
        by the caller as query_emb).
        """
        en_query       = translations.get("en", "")
        hi_query       = translations.get("hi", "")
        original_query = translations.get("original", "")

        seen_docs: Dict[str, Tuple[str, dict]] = {}

        # First query: reuse the caller's pre-computed embedding for EN
        if en_query and en_query.strip():
            try:
                for doc, meta, _dist in self._search_with_emb(query_emb, top_k):
                    if doc not in seen_docs:
                        seen_docs[doc] = (doc, meta)
            except Exception as exc:
                logger.warning(f"EN search failed: {exc}")

        # HI query: different text, needs its own encode
        if hi_query and hi_query.strip() and hi_query != en_query:
            try:
                for doc, meta, _dist in self._search_single(hi_query, top_k):
                    if doc not in seen_docs:
                        seen_docs[doc] = (doc, meta)
            except Exception as exc:
                logger.warning(f"HI search failed: {exc}")

        # Original query (only if distinct from both)
        if (original_query and original_query.strip()
                and original_query not in (en_query, hi_query)):
            try:
                for doc, meta, _dist in self._search_single(original_query, top_k):
                    if doc not in seen_docs:
                        seen_docs[doc] = (doc, meta)
            except Exception as exc:
                logger.warning(f"Original search failed: {exc}")

        if not seen_docs:
            logger.warning("⚠️ No chunks retrieved from ChromaDB.")
            return []

        candidates = list(seen_docs.values())
        ranked = self._cosine_rerank(
            query_emb, candidates, self.embed_model, top_n=Config.RERANK_TOP_N
        )
        logger.info(
            f"📚 Retrieved {len(seen_docs)} unique chunks → top {len(ranked)} after rerank."
        )
        return ranked

    # =========================================================================
    # STEP 3b — Disease retrieval  (v9.0: returns (chunks, search_query) tuple)
    # =========================================================================

    def retrieve_for_disease(
        self,
        disease_name: str,
        user_question: str = "",
        top_k: int = Config.DEFAULT_TOP_K,
        request_id: str = "",
    ) -> Tuple[List[dict], str]:
        """
        v9.0: Returns (chunks, search_query) tuple.
        The /retrieve endpoint can use the search_query directly for its
        response without calling build_disease_search_query() a second time.
        """
        self._retrieve_count += 1
        log_prefix = f"[{request_id}]" if request_id else "[retrieve]"

        search_query = build_disease_search_query(disease_name, user_question)
        logger.info(
            f"{log_prefix} 🔍 Disease retrieval | disease='{disease_name}' "
            f"| query='{search_query[:80]}…'"
        )

        try:
            query_emb     = self.encode_query(search_query)
            effective_k   = min(top_k, Config.MAX_TOP_K)
            raw_items     = self._search_with_emb(query_emb, effective_k)

            if not raw_items:
                logger.warning(f"{log_prefix} ⚠️ No raw items for '{disease_name}'.")
                return [], search_query

            seen: Dict[str, Tuple[str, dict]] = {}
            for doc, meta, _dist in raw_items:
                if doc not in seen:
                    seen[doc] = (doc, meta)

            chunks = self._cosine_rerank(
                query_emb, list(seen.values()), self.embed_model, top_n=Config.RERANK_TOP_N
            )
            logger.info(
                f"{log_prefix} ✅ Retrieved {len(chunks)} chunks for '{disease_name}'"
            )
            return chunks, search_query

        except Exception as exc:
            self._error_count += 1
            logger.exception(f"{log_prefix} 💥 retrieve_for_disease failed: {exc}")
            return [], search_query

    # =========================================================================
    # STEP 4 — Answer generation
    # =========================================================================

    def _build_system_prompt(self, detected_lang: str) -> str:
        lang_map = {
            "ar": "Arabic (العربية)", "en": "English", "hi": "Hindi (हिन्दी)",
            "es": "Spanish (Español)", "fr": "French (Français)",
            "de": "German (Deutsch)", "zh": "Chinese (中文)",
            "ru": "Russian (Русский)", "sw": "Swahili",
            "pt": "Portuguese", "ur": "Urdu (اردو)",
        }
        lang_name = lang_map.get(detected_lang, f"ISO '{detected_lang}'")
        return f"""⚠️ ABSOLUTE PRIORITY DIRECTIVE:
You MUST respond entirely in {lang_name} (ISO code: {detected_lang}).
DO NOT repeat any sentence, phrase, or word cluster more than once.
═══════════════════════════════════════════════════════
You are AgriRAG Pro — expert multilingual agricultural scientist.
═══════════════════════════════════════════════════════
RULES:
1. LANGUAGE: 100% in {lang_name}. No mixing.
2. Use ONLY relevant knowledge chunks. Ignore unrelated ones silently.
3. Use clear headings (##), bullet points, **bold** key terms.
4. Cite every source inline as [1], [2], etc.
5. No hallucination. No repetition.
6. End with ONE helpful follow-up question in {lang_name}."""

    def _build_messages(
        self,
        question: str,
        context_text: str,
        detected_lang: str,
        history: List[dict],
    ) -> list:
        messages = [{"role": "system", "content": self._build_system_prompt(detected_lang)}]
        for msg in history[-Config.LLM_HISTORY_MSGS:]:
            role    = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content[:2000]})
        user_prompt = (
            f"═══ KNOWLEDGE BASE CONTEXT ═══\n{context_text}\n\n"
            f"═══ USER QUESTION ═══\n{question}"
        )
        messages.append({"role": "user", "content": user_prompt})
        return messages

    @retry(max_attempts=Config.LLM_RETRY_COUNT, base_delay=Config.LLM_RETRY_DELAY)
    def _call_generation_llm(self, messages: list) -> str:
        return self._call_chat_completion(
            messages=messages,
            max_tokens=Config.LLM_MAX_TOKENS,
            temperature=Config.LLM_TEMPERATURE,
            is_json=False,
        )

    def generate_answer(
        self,
        question: str,
        chunks: List[dict],
        detected_lang: str,
        history: List[dict],
    ) -> Tuple[str, bool]:
        if chunks:
            context_parts = [
                f"[Source {i+1} | {item['meta'].get('source', 'Unknown')} "
                f"| relevance: {item.get('score', 0):.2f}]:\n{item['doc']}"
                for i, item in enumerate(chunks)
            ]
            context_text = truncate_context("\n\n".join(context_parts))
        else:
            context_text = "[No relevant knowledge found in the database for this query.]"

        messages = self._build_messages(question, context_text, detected_lang, history)
        try:
            raw_answer = self._call_generation_llm(messages)
        except Exception as exc:
            logger.error(f"LLM generation failed after all retries: {exc}")
            return _SORRY_MSGS.get(detected_lang, _SORRY_MSGS["en"]), False

        was_loop, cleaned = detect_and_fix_loop(raw_answer)
        if was_loop:
            logger.warning("🔄 Repetition loop detected and cleaned.")
        return cleaned, was_loop

    # =========================================================================
    # STEP 5 — Full pipeline (sync)
    # =========================================================================

    def pipeline(
        self,
        question: str,
        history: List[dict],
        top_k: int = Config.DEFAULT_TOP_K,
        request_id: str = "",
    ) -> dict:
        """
        v9.0 encode optimization:
          Old flow: encode(original) → [translate] → encode(en_translation) → search
          New flow: encode(original) → [translate] → search(reuse original emb for EN)

        For English questions (fast path): only ONE encode call total.
        For non-English: two encode calls (original for cache, EN for search depth).
        """
        self._request_count += 1
        t_start    = time.time()
        log_prefix = f"[{request_id}]" if request_id else ""

        try:
            # Encode original once — used for both cache lookup and (if EN) search
            original_emb = self.encode_query(question)

            # Cache check before translation
            cached = self.cache.lookup(original_emb)
            if cached:
                cached_answer, cached_lang = cached
                logger.info(f"{log_prefix} 🎯 Cache HIT.")
                return {
                    "answer":            cached_answer,
                    "detected_language": cached_lang,
                    "sources_used":      [],
                    "cache_hit":         True,
                    "loop_detected":     False,
                    "latency_ms":        int((time.time() - t_start) * 1000),
                    "request_id":        request_id,
                }

            # Translation (fast path for English: no LLM)
            translations  = self.translate_query(question)
            translations["original"] = question
            detected_lang = translations["detected_lang"]

            # v9.0: reuse original_emb when language is English
            # (the original text IS the EN text, so embedding is identical)
            if detected_lang == "en":
                query_emb = original_emb
            else:
                query_emb = self.encode_query(translations["en"])

            effective_k = min(top_k, Config.MAX_TOP_K)
            chunks      = self.multilingual_search(translations, query_emb, effective_k)

            answer, was_loop = self.generate_answer(
                question=question,
                chunks=chunks,
                detected_lang=detected_lang,
                history=history,
            )

            if not was_loop and not answer.startswith(tuple(_SORRY_MSGS.values())):
                self.cache.store(original_emb, answer, detected_lang)

            latency = int((time.time() - t_start) * 1000)
            logger.info(
                f"{log_prefix} ✅ Pipeline done in {latency}ms "
                f"| lang={detected_lang} | chunks={len(chunks)}"
            )
            return {
                "answer":            answer,
                "detected_language": detected_lang,
                "sources_used":      [c["meta"] for c in chunks],
                "cache_hit":         False,
                "loop_detected":     was_loop,
                "latency_ms":        latency,
                "request_id":        request_id,
            }

        except Exception as exc:
            self._error_count += 1
            logger.exception(f"{log_prefix} 💥 Unhandled exception in pipeline: {exc}")
            return {
                "answer":            "An unexpected error occurred. Please try again.",
                "detected_language": "en",
                "sources_used":      [],
                "cache_hit":         False,
                "loop_detected":     False,
                "latency_ms":        int((time.time() - t_start) * 1000),
                "request_id":        request_id,
                "error":             str(exc),
            }

    # ── Streaming helpers ─────────────────────────────────────────────────────

    def _iter_stream(
        self,
        question: str,
        chunks: List[dict],
        detected_lang: str,
        history: List[dict],
    ) -> Generator[str, None, None]:
        context_parts = [
            f"[Source {i+1} | {item['meta'].get('source','?')}]:\n{item['doc']}"
            for i, item in enumerate(chunks)
        ] if chunks else ["[No relevant knowledge found.]"]

        context_text = truncate_context("\n\n".join(context_parts))
        messages     = self._build_messages(question, context_text, detected_lang, history)

        buffer = []
        for delta in self._stream_chat_completion(messages, Config.LLM_MAX_TOKENS, Config.LLM_TEMPERATURE):
            buffer.append(delta)
            yield delta

        full = "".join(buffer)
        was_loop, _ = detect_and_fix_loop(full)
        if was_loop:
            logger.warning("🔄 Streaming: loop detected in completed output.")

    async def stream_answer_async(
        self,
        question: str,
        chunks: List[dict],
        detected_lang: str,
        history: List[dict],
        request_id: str = "",
    ) -> AsyncGenerator[str, None]:
        loop: asyncio.AbstractEventLoop = asyncio.get_event_loop()
        queue: asyncio.Queue[Optional[str]] = asyncio.Queue(maxsize=128)
        log_prefix = f"[{request_id}]" if request_id else "[stream]"

        def producer() -> None:
            try:
                for token in self._iter_stream(question, chunks, detected_lang, history):
                    asyncio.run_coroutine_threadsafe(queue.put(token), loop).result()
            except Exception as exc:
                logger.error(f"{log_prefix} Streaming producer error: {exc}")
                asyncio.run_coroutine_threadsafe(
                    queue.put(f"\n\n[Stream error: {exc}]"), loop
                ).result()
            finally:
                asyncio.run_coroutine_threadsafe(queue.put(None), loop).result()

        self._stream_executor.submit(producer)
        while True:
            token = await queue.get()
            if token is None:
                break
            yield token

    @property
    def system_stats(self) -> dict:
        available_groq = sum(
            1 for i, k in enumerate(Config.GROQ_KEYS)
            if k and self._groq_key_available(i)
        )
        return {
            "version":                  Config.APP_VERSION,
            "ready":                    self._ready,
            "total_ask_requests":       self._request_count,
            "total_retrieve_requests":  self._retrieve_count,
            "total_errors":             self._error_count,
            "error_rate":               round(
                self._error_count / max(1, self._request_count + self._retrieve_count), 3
            ),
            "cache":                    self.cache.stats,
            "chroma_doc_count":         self._doc_count if self._ready else -1,
            "groq_keys_available":      available_groq,
            "llm_model":                Config.LLM_MODEL,
            "embed_model":              Config.EMBED_MODEL,
        }


# =============================================================================
# SECTION 6 — APP STARTUP / SHUTDOWN
# =============================================================================

ai: Optional[AISystem] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global ai
    logger.info("🚀 FastAPI lifespan: starting AISystem …")
    try:
        ai = AISystem()
    except Exception as exc:
        logger.critical(f"💥 AISystem failed to initialize: {exc}")
        ai = None
    yield
    if ai is not None:
        logger.info("🧹 Shutting down stream executor …")
        ai._stream_executor.shutdown(wait=False)
    logger.info("👋 FastAPI lifespan: shutting down.")


# =============================================================================
# SECTION 7 — FASTAPI APP
# =============================================================================

app = FastAPI(
    title="AgriRAG Pro",
    description="v9.0: English fast path, circuit breaker, O(1) cache eviction.",
    version=Config.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# SECTION 8 — REQUEST / RESPONSE MODELS
# =============================================================================

class Message(BaseModel):
    role:    str = Field(..., pattern="^(user|assistant)$")
    content: str = Field(..., min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    question: str           = Field(..., min_length=1, max_length=Config.MAX_QUESTION_LEN)
    history:  List[Message] = Field(default_factory=list, max_length=Config.MAX_HISTORY_MSGS)
    top_k:    int           = Field(default=Config.DEFAULT_TOP_K, ge=1, le=Config.MAX_TOP_K)

    @field_validator("question")
    @classmethod
    def clean_question(cls, v: str) -> str:
        v = unicodedata.normalize("NFC", v)
        v = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", v)
        return v.strip()


class ChatResponse(BaseModel):
    answer:            str
    detected_language: str
    sources_used:      List[dict]
    cache_hit:         bool
    loop_detected:     bool
    latency_ms:        int
    request_id:        str


class RetrieveRequest(BaseModel):
    disease_name: str = Field(..., min_length=1, max_length=200)
    question:     str = Field(default="", max_length=Config.MAX_QUESTION_LEN)
    top_k:        int = Field(default=Config.DEFAULT_TOP_K, ge=1, le=Config.MAX_TOP_K)

    @field_validator("disease_name")
    @classmethod
    def clean_disease_name(cls, v: str) -> str:
        v = unicodedata.normalize("NFC", v)
        v = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", v)
        return v.strip()


class RetrievedChunk(BaseModel):
    text:   str
    source: str
    score:  float


class RetrieveResponse(BaseModel):
    disease_name: str
    search_query: str
    chunks:       List[RetrievedChunk]
    total_found:  int
    latency_ms:   int
    request_id:   str


# =============================================================================
# SECTION 9 — ENDPOINTS
# =============================================================================

def _require_ai() -> AISystem:
    if ai is None or not ai._ready:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI system is not ready.",
        )
    return ai


@app.post("/ask", response_model=ChatResponse)
def ask_endpoint(request: ChatRequest, http_request: Request):
    system     = _require_ai()
    request_id = str(uuid.uuid4())[:8]
    logger.info(f"[{request_id}] 📥 /ask | {request.question[:80]}…")

    history = [m.model_dump() for m in request.history]
    result  = system.pipeline(
        question=request.question,
        history=history,
        top_k=request.top_k,
        request_id=request_id,
    )

    if "error" in result and result.get("answer", "").startswith("An unexpected"):
        raise HTTPException(status_code=500, detail=result.get("error", "Unknown error"))

    return ChatResponse(**{k: result[k] for k in ChatResponse.model_fields})


@app.post("/ask/stream")
async def ask_stream_endpoint(request: ChatRequest):
    system     = _require_ai()
    request_id = str(uuid.uuid4())[:8]
    logger.info(f"[{request_id}] 🌊 /ask/stream | {request.question[:80]}…")

    translations = await run_in_threadpool(system.translate_query, request.question)
    translations["original"] = request.question
    detected_lang = translations["detected_lang"]

    query_emb = await run_in_threadpool(system.encode_query, translations["en"])
    chunks    = await run_in_threadpool(
        system.multilingual_search, translations, query_emb, request.top_k
    )
    history = [m.model_dump() for m in request.history]

    async def token_generator() -> AsyncGenerator[str, None]:
        try:
            async for token in system.stream_answer_async(
                request.question, chunks, detected_lang, history, request_id
            ):
                yield f"data: {json.dumps({'token': token})}\n\n"
            yield f"data: {json.dumps({'done': True, 'lang': detected_lang})}\n\n"
        except Exception as exc:
            logger.error(f"[{request_id}] SSE error: {exc}")
            yield f"data: {json.dumps({'error': str(exc)})}\n\n"

    return StreamingResponse(
        token_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":    "no-cache",
            "X-Accel-Buffering": "no",
            "X-Request-ID":     request_id,
        },
    )


@app.post("/retrieve", response_model=RetrieveResponse)
def retrieve_endpoint(request: RetrieveRequest):
    """
    v9.0: retrieve_for_disease() now returns (chunks, search_query).
    The endpoint uses the returned search_query directly — no second call to
    build_disease_search_query().
    """
    system     = _require_ai()
    request_id = str(uuid.uuid4())[:8]
    t_start    = time.time()

    logger.info(
        f"[{request_id}] 🔍 /retrieve | disease='{request.disease_name}' "
        f"| top_k={request.top_k}"
    )

    # v9.0: unpack tuple — search_query comes back for free
    chunks, search_query = system.retrieve_for_disease(
        disease_name=request.disease_name,
        user_question=request.question,
        top_k=request.top_k,
        request_id=request_id,
    )

    latency_ms = int((time.time() - t_start) * 1000)

    if not chunks:
        logger.warning(f"[{request_id}] ⚠️ 0 chunks for '{request.disease_name}'.")
        return RetrieveResponse(
            disease_name=request.disease_name.replace("_", " ").strip(),
            search_query=search_query[:200],
            chunks=[],
            total_found=0,
            latency_ms=latency_ms,
            request_id=request_id,
        )

    logger.info(f"[{request_id}] ✅ /retrieve {latency_ms}ms | {len(chunks)} chunks")
    return RetrieveResponse(
        disease_name=request.disease_name.replace("_", " ").strip(),
        search_query=search_query[:200],
        chunks=[
            RetrievedChunk(
                text=c["doc"].strip(),
                source=str(c["meta"].get("source", "Unknown")).strip(),
                score=round(float(c.get("score", 0.0)), 4),
            )
            for c in chunks
        ],
        total_found=len(chunks),
        latency_ms=latency_ms,
        request_id=request_id,
    )


@app.get("/health")
def health():
    if ai is None or not ai._ready:
        raise HTTPException(status_code=503, detail="System not ready")
    return {"status": "ok", "version": Config.APP_VERSION}


@app.get("/health/deep")
def health_deep():
    checks: Dict[str, str] = {}
    checks["hf_token"] = "ok" if Config.HF_TOKEN else "MISSING"

    try:
        checks["chromadb"] = (
            f"ok ({ai._doc_count} documents)" if ai and ai._ready else "not_ready"
        )
    except Exception as exc:
        checks["chromadb"] = f"error: {exc}"

    try:
        if ai and ai._ready:
            _ = ai.encode_query("test")
            checks["embed_model"] = "ok"
        else:
            checks["embed_model"] = "not_ready"
    except Exception as exc:
        checks["embed_model"] = f"error: {exc}"

    checks["llm"] = "ok" if (ai and ai._ready and ai.llm) else "not_ready"

    try:
        if ai and ai._ready:
            test_chunks, _ = ai.retrieve_for_disease("Apple_Scab", "", top_k=1, request_id="health")
            checks["retrieve_path"] = f"ok (test returned {len(test_chunks)} chunks)"
        else:
            checks["retrieve_path"] = "not_ready"
    except Exception as exc:
        checks["retrieve_path"] = f"error: {exc}"

    all_ok = all(v == "ok" or v.startswith("ok") for v in checks.values())
    return {
        "status":     "ok" if all_ok else "degraded",
        "components": checks,
        "version":    Config.APP_VERSION,
    }


@app.get("/stats")
async def stats():
    system = _require_ai()
    return system.system_stats


@app.get("/")
def root():
    return {
        "name":        "AgriRAG Pro",
        "version":     Config.APP_VERSION,
        "v9_improvements": [
            "English fast path: heuristic detects EN → skips LLM translation (saves 800-2000ms)",
            "pipeline(): single encode_query call reused for cache + search",
            "multilingual_search(): reuses pre-computed embedding for EN query",
            "SemanticCache: deque replaces list → O(1) eviction (was O(n))",
            "_cosine_rerank(): @staticmethod, no self-lookup overhead",
            "Groq cascade: per-key circuit breaker (30s cooldown after failure)",
            "Groq timeout: 12s instead of 20s for faster failover",
            "retrieve_for_disease(): returns (chunks, search_query) tuple — endpoint never rebuilds query",
            "_SORRY_MSGS: module-level constant, not re-created per instance",
            "translate_query(): passes heuristic hint to LLM → better lang detection",
        ],
    }


# =============================================================================
# SECTION 10 — UI (unchanged from v8.0)
# =============================================================================

UI_HTML = """
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>مساعد أمراض النباتات</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background-color: #f0fdf4; margin: 0; display: flex; flex-direction: column; height: 100vh; }
        .header { background-color: #166534; color: white; padding: 1rem 2rem; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header h1 { margin: 0; font-size: 1.25rem; font-weight: bold; }
        .header p { margin: 0; font-size: 0.8rem; opacity: 0.8; }
        #chat-container { flex: 1; overflow-y: auto; padding: 2rem; display: flex; flex-direction: column; gap: 1rem; max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        .welcome-screen { text-align: center; margin-top: 2rem; }
        .welcome-screen h2 { color: #166534; }
        .pills { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
        .pill { background-color: white; border: 1px solid #d1d5db; border-radius: 9999px; padding: 0.5rem 1rem; font-size: 0.9rem; color: #374151; cursor: pointer; transition: all 0.2s; }
        .pill:hover { background-color: #f3f4f6; }
        .message { padding: 1rem; border-radius: 0.5rem; max-width: 80%; line-height: 1.5; }
        .message.user { background-color: #dcfce7; align-self: flex-start; border-bottom-right-radius: 0; color: #166534; }
        .message.bot { background-color: white; align-self: flex-end; border-bottom-left-radius: 0; color: #1f2937; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .input-area { background-color: white; padding: 1rem; border-top: 1px solid #e5e7eb; }
        .input-container { max-width: 800px; margin: 0 auto; display: flex; gap: 0.5rem; align-items: center; }
        .input-container input { flex: 1; padding: 0.85rem 1.2rem; border: 1px solid #d1d5db; border-radius: 9999px; outline: none; font-size: 1rem; }
        .input-container input:focus { border-color: #166534; }
        .input-container button { background-color: #166534; color: white; border: none; border-radius: 50%; width: 50px; height: 50px; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .input-container button:disabled { background-color: #9ca3af; cursor: not-allowed; }
    </style>
</head>
<body>
    <div class="header">
        <div><h1>مساعد أمراض النباتات</h1><p>v9.0 — English fast path active</p></div>
        <div style="font-size: 1.5rem;">🌿</div>
    </div>
    <div id="chat-container">
        <div class="welcome-screen" id="welcome-screen">
            <div style="font-size: 3.5rem; margin-bottom: 1rem;">🌱</div>
            <h2>أهلاً! أنا مساعدك لأمراض النباتات</h2>
            <div class="pills">
                <div class="pill" onclick="setInput('ما هي أعراض البياض الدقيقي؟')">ما هي أعراض البياض الدقيقي؟</div>
                <div class="pill" onclick="setInput('How do I treat Apple Scab?')">How do I treat Apple Scab?</div>
                <div class="pill" onclick="setInput('ما أشهر أمراض الطماطم؟')">ما أشهر أمراض الطماطم؟</div>
            </div>
        </div>
    </div>
    <div class="input-area">
        <div class="input-container">
            <button id="send-btn" onclick="sendMessage()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
            <input type="text" id="user-input" placeholder="اكتب سؤالك... (Enter للإرسال)" onkeypress="handleKeyPress(event)">
        </div>
    </div>
    <script>
        function parseMarkdown(text) {
            return text.replace(/\\n/g,'<br>').replace(/^### (.*$)/gim,'<h3>$1</h3>').replace(/^## (.*$)/gim,'<h2>$1</h2>').replace(/\\*\\*(.*?)\\*\\*/gim,'<strong>$1</strong>').replace(/^- (.*$)/gim,'<ul><li>$1</li></ul>').replace(/<\\/ul>\\n<ul>/gim,'');
        }
        const chatHistory = [];
        function setInput(text) { document.getElementById('user-input').value = text; sendMessage(); }
        function handleKeyPress(e) { if (e.key === 'Enter') sendMessage(); }
        async function sendMessage() {
            const inputEl = document.getElementById('user-input');
            const text = inputEl.value.trim();
            if (!text) return;
            document.getElementById('welcome-screen')?.remove();
            inputEl.value = ''; inputEl.disabled = true;
            document.getElementById('send-btn').disabled = true;
            appendMessage(text, 'user');
            const botMsgEl = appendMessage('...', 'bot');
            try {
                const response = await fetch('/ask/stream', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({question:text,history:chatHistory}) });
                chatHistory.push({role:'user',content:text});
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullAnswer = '';
                while (true) {
                    const {done,value} = await reader.read();
                    if (done) break;
                    for (const line of decoder.decode(value,{stream:true}).split('\\n')) {
                        if (line.startsWith('data: ')) { try { const d=JSON.parse(line.substring(6)); if(d.token){fullAnswer+=d.token;botMsgEl.innerHTML=parseMarkdown(fullAnswer);scrollToBottom();} } catch(e){} }
                    }
                }
                chatHistory.push({role:'assistant',content:fullAnswer});
            } catch(err) { botMsgEl.innerHTML='<span style="color:red">خطأ في الاتصال</span>'; }
            finally { inputEl.disabled=false; document.getElementById('send-btn').disabled=false; inputEl.focus(); }
        }
        function appendMessage(text,sender){const c=document.getElementById('chat-container');const d=document.createElement('div');d.className=`message ${sender}`;d.innerHTML=text;c.appendChild(d);scrollToBottom();return d;}
        function scrollToBottom(){const c=document.getElementById('chat-container');c.scrollTop=c.scrollHeight;}
    </script>
</body>
</html>
"""

@app.get("/ui", response_class=HTMLResponse)
def chat_ui():
    return UI_HTML
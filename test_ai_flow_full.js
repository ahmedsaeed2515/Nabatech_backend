/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║           NABATECH - Full AI Flow Test Script                              ║
 * ║   يختبر الفلو الكامل: Login → Chat (نص) → Chat (صورة) → Image Diagnosis   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * Usage:
 *   node test_ai_flow_full.js
 *   node test_ai_flow_full.js --base-url http://localhost:10000
 *   node test_ai_flow_full.js --image ./tomato.jpg
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");
const FormData = require("form-data");

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const BASE_URL = process.argv.includes("--base-url")
  ? process.argv[process.argv.indexOf("--base-url") + 1]
  : "http://localhost:10000";

const IMAGE_PATH = process.argv.includes("--image")
  ? process.argv[process.argv.indexOf("--image") + 1]
  : path.join(__dirname, "tomato.jpg");

const TEST_USER = {
  email: "testflow@nabatech.com",
  password: "TestFlow123!",
  name: "Test Flow User",
};

const TEST_MESSAGES = [
  "مرحبا، نباتتي عندها مشكلة",
  "How do I treat powdery mildew on my tomato plant?",
  "What is the best fertilizer for roses?",
  "ما هي أسباب اصفرار أوراق النبات؟",
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgGreen: "\x1b[42m",
  bgRed: "\x1b[41m",
  bgBlue: "\x1b[44m",
  bgYellow: "\x1b[43m",
};

const log = {
  header: (msg) => console.log(`\n${COLORS.bright}${COLORS.cyan}${"═".repeat(70)}${COLORS.reset}\n${COLORS.bright}${COLORS.cyan}  ${msg}${COLORS.reset}\n${COLORS.bright}${COLORS.cyan}${"═".repeat(70)}${COLORS.reset}`),
  step: (num, msg) => console.log(`\n${COLORS.bright}${COLORS.blue}[STEP ${num}]${COLORS.reset} ${COLORS.bright}${msg}${COLORS.reset}`),
  info: (msg) => console.log(`  ${COLORS.cyan}ℹ${COLORS.reset}  ${msg}`),
  success: (msg) => console.log(`  ${COLORS.green}✅${COLORS.reset}  ${COLORS.green}${msg}${COLORS.reset}`),
  warn: (msg) => console.log(`  ${COLORS.yellow}⚠️${COLORS.reset}   ${COLORS.yellow}${msg}${COLORS.reset}`),
  error: (msg) => console.log(`  ${COLORS.red}❌${COLORS.reset}  ${COLORS.red}${msg}${COLORS.reset}`),
  data: (key, val) => {
    const valStr = typeof val === "object" ? JSON.stringify(val, null, 2) : String(val);
    const preview = valStr.length > 300 ? valStr.substring(0, 300) + "..." : valStr;
    console.log(`  ${COLORS.magenta}→${COLORS.reset} ${COLORS.bright}${key}:${COLORS.reset} ${preview}`);
  },
  time: (ms) => {
    const color = ms > 10000 ? COLORS.red : ms > 5000 ? COLORS.yellow : COLORS.green;
    return `${color}${ms}ms${COLORS.reset}`;
  },
  divider: () => console.log(`  ${COLORS.cyan}${"─".repeat(66)}${COLORS.reset}`),
};

let results = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  steps: [],
  startTime: Date.now(),
};

function recordResult(name, passed, details = {}) {
  results.total++;
  if (passed) results.passed++;
  else results.failed++;
  results.steps.push({ name, passed, ...details });
}

// ─── HTTP REQUEST HELPER ──────────────────────────────────────────────────────
async function request(opts) {
  return new Promise((resolve, reject) => {
    const url = new URL(opts.url);
    const isHttps = url.protocol === "https:";
    const lib = isHttps ? https : http;

    const reqOpts = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: opts.method || "GET",
      headers: { ...opts.headers },
    };

    const req = lib.request(reqOpts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });

    req.on("error", reject);
    req.setTimeout(60000, () => {
      req.destroy();
      reject(new Error("Request timeout (60s)"));
    });

    if (opts.body) {
      if (typeof opts.body === "string") {
        req.write(opts.body);
      } else if (Buffer.isBuffer(opts.body)) {
        req.write(opts.body);
      } else {
        req.write(JSON.stringify(opts.body));
      }
    }

    req.end();
  });
}

async function jsonRequest(method, path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return request({
    url: `${BASE_URL}${path}`,
    method,
    headers,
    body,
  });
}

async function formRequest(method, path, formData, token) {
  const headers = { ...formData.getHeaders() };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const isHttps = url.protocol === "https:";
    const lib = isHttps ? https : http;

    const reqOpts = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname,
      method,
      headers,
    };

    const req = lib.request(reqOpts, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        resolve({ status: res.statusCode, data: parsed, headers: res.headers });
      });
    });

    req.on("error", reject);
    req.setTimeout(90000, () => {
      req.destroy();
      reject(new Error("Form request timeout (90s)"));
    });

    formData.pipe(req);
  });
}

// ─── TEST STEPS ───────────────────────────────────────────────────────────────

async function step_health_check() {
  log.step(1, "Health Check - التحقق من صحة السيرفر");
  log.info(`Base URL: ${BASE_URL}`);
  const start = Date.now();

  try {
    const res = await request({ url: `${BASE_URL}/health/live` });
    const ms = Date.now() - start;
    log.data("Status", res.status);
    log.data("Response", res.data);
    log.data("Latency", `${ms}ms`);

    if (res.status === 200 && res.data?.success) {
      log.success(`Server is live! (${log.time(ms)})`);
      recordResult("Health Check", true, { latencyMs: ms });
      return true;
    } else {
      log.error(`Server health check failed - Status: ${res.status}`);
      recordResult("Health Check", false, { status: res.status });
      return false;
    }
  } catch (err) {
    log.error(`Cannot reach server: ${err.message}`);
    log.warn("Make sure the backend is running: npm run dev");
    recordResult("Health Check", false, { error: err.message });
    return false;
  }
}

async function step_register_or_login() {
  log.step(2, "Authentication - التسجيل / تسجيل الدخول");

  // Try login first
  log.info(`Trying login with: ${TEST_USER.email}`);
  const start = Date.now();
  try {
    const res = await jsonRequest("POST", "/api/auth/login", {
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    const ms = Date.now() - start;

    if (res.status === 200 && (res.data?.token || res.data?.data?.accessToken)) {
      const token = res.data?.token || res.data?.data?.accessToken;
      log.success(`Login successful! (${log.time(ms)})`);
      log.data("Token (first 40 chars)", token.substring(0, 40) + "...");
      log.data("User ID", res.data?.data?.user?._id || res.data?.user?.id || "N/A");
      recordResult("Login", true, { latencyMs: ms });
      return token;
    }
  } catch (e) {
    log.warn(`Login failed: ${e.message}`);
  }

  // Try register
  log.info("Login failed, trying registration...");
  try {
    const res = await jsonRequest("POST", "/api/auth/register", {
      name: TEST_USER.name,
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    const ms = Date.now() - start;

    if (res.status === 201 && (res.data?.token || res.data?.data?.accessToken)) {
      const token = res.data?.token || res.data?.data?.accessToken;
      log.success(`Registration successful! (${log.time(ms)})`);
      log.data("Token (first 40 chars)", token.substring(0, 40) + "...");
      recordResult("Register", true, { latencyMs: ms });
      return token;
    } else {
      log.error(`Registration failed - Status: ${res.status}`);
      log.data("Response", res.data);
      recordResult("Register", false, { status: res.status, response: res.data });
      return null;
    }
  } catch (err) {
    log.error(`Auth error: ${err.message}`);
    recordResult("Auth", false, { error: err.message });
    return null;
  }
}

async function step_text_chat(token, conversationId) {
  log.step(3, "Text Chat - اختبار المحادثة النصية");
  log.info(`Testing ${TEST_MESSAGES.length} messages...`);

  let history = [];
  let allPassed = true;

  for (let i = 0; i < TEST_MESSAGES.length; i++) {
    const msg = TEST_MESSAGES[i];
    log.divider();
    log.info(`Message ${i + 1}: "${msg}"`);

    const start = Date.now();
    try {
      const res = await jsonRequest("POST", "/api/chat/", {
        text: msg,
        conversationId,
        history,
      }, token);
      const ms = Date.now() - start;

      if (res.status === 200 && res.data?.success) {
        log.success(`Response received! (${log.time(ms)})`);
        log.data("Source/Provider", `${res.data.source || "N/A"} / ${res.data.provider?.name || "N/A"}`);
        log.data("Message ID", res.data.messageId || "N/A");
        log.data("AI Response (preview)", res.data.message?.substring(0, 200) || "EMPTY");

        // Add to history for next message
        history.push({ role: "user", content: msg });
        history.push({ role: "assistant", content: res.data.message });

        recordResult(`Text Chat: "${msg.substring(0, 30)}..."`, true, {
          latencyMs: ms,
          provider: res.data.provider?.name,
          source: res.data.source,
          responseLength: res.data.message?.length,
        });
      } else {
        log.error(`Chat failed - Status: ${res.status}`);
        log.data("Response", res.data);
        allPassed = false;
        recordResult(`Text Chat: "${msg.substring(0, 30)}..."`, false, {
          status: res.status,
          response: res.data,
        });
      }
    } catch (err) {
      log.error(`Request error: ${err.message}`);
      allPassed = false;
      recordResult(`Text Chat: "${msg.substring(0, 30)}..."`, false, { error: err.message });
    }
  }

  return { allPassed, history };
}

async function step_chat_history(token, conversationId) {
  log.step(4, "Chat History - التحقق من حفظ المحادثات");
  log.info(`Fetching history for conversationId: ${conversationId}`);

  const start = Date.now();
  try {
    const res = await jsonRequest("GET", `/api/chat/history?conversationId=${conversationId}&limit=20`, null, token);
    const ms = Date.now() - start;

    if (res.status === 200 && res.data?.success) {
      const items = res.data?.data?.items || res.data?.messages || [];
      log.success(`History fetched! (${log.time(ms)})`);
      log.data("Messages count", items.length);
      log.data("Has next page", res.data?.data?.pageInfo?.hasNextPage || false);

      if (items.length > 0) {
        log.info("Last 3 messages in history:");
        items.slice(-3).forEach((msg, i) => {
          log.data(`  [${msg.role || msg.sender}]`, msg.text?.substring(0, 100) || "N/A");
        });
      }

      recordResult("Chat History", true, { latencyMs: ms, messageCount: items.length });
      return true;
    } else {
      log.error(`Failed to fetch history - Status: ${res.status}`);
      log.data("Response", res.data);
      recordResult("Chat History", false, { status: res.status });
      return false;
    }
  } catch (err) {
    log.error(`Request error: ${err.message}`);
    recordResult("Chat History", false, { error: err.message });
    return false;
  }
}

async function step_image_chat(token, conversationId) {
  log.step(5, "Image + Chat - اختبار إرسال صورة مع رسالة (الـ flow الرئيسي)");

  // Check image exists
  if (!fs.existsSync(IMAGE_PATH)) {
    log.warn(`Image not found: ${IMAGE_PATH}`);
    log.warn("Skipping image test. Provide a valid image with --image flag");
    log.warn("Example: node test_ai_flow_full.js --image ./tomato.jpg");
    results.skipped++;
    recordResult("Image Chat", false, { skipped: true, reason: "Image file not found" });
    return null;
  }

  const imageStats = fs.statSync(IMAGE_PATH);
  log.info(`Image: ${IMAGE_PATH}`);
  log.info(`Size: ${(imageStats.size / 1024).toFixed(2)} KB`);
  log.info("Building multipart/form-data request...");

  const form = new FormData();
  form.append("file", fs.createReadStream(IMAGE_PATH), {
    filename: path.basename(IMAGE_PATH),
    contentType: "image/jpeg",
  });
  form.append("text", "ما هو المرض الذي يظهر على هذه النبتة؟ وكيف أعالجها؟");
  form.append("conversationId", conversationId);
  form.append("history", JSON.stringify([]));
  form.append("top_k", "5");

  log.info("Sending image+text to /api/ai/assistant ...");
  log.info("⏳ This may take 30-60 seconds (CNN + RAG + LLM pipeline)...");

  const start = Date.now();
  try {
    const res = await formRequest("POST", "/api/ai/assistant", form, token);
    const ms = Date.now() - start;

    if (res.status === 200 && res.data?.success) {
      log.success(`Image chat response received! (${log.time(ms)})`);
      log.divider();
      log.data("Mode", res.data.mode);
      log.data("Source", res.data.source);
      log.data("Provider", res.data.provider);
      log.divider();

      if (res.data.diagnosis) {
        log.info("🔬 CNN Diagnosis Result:");
        log.data("  Prediction", res.data.diagnosis.prediction);
        log.data("  Confidence", res.data.diagnosis.confidence ? `${(res.data.diagnosis.confidence * 100).toFixed(1)}%` : "N/A");
        log.data("  Provider", res.data.diagnosis.provider);
        if (res.data.diagnosis.candidates?.length) {
          log.data("  Top Candidates", res.data.diagnosis.candidates.slice(0, 3).map(c => `${c.label} (${((c.confidence||0)*100).toFixed(1)}%)`).join(", "));
        }
        log.divider();
      }

      if (res.data.lowConfidenceWarning) {
        log.warn(`Low Confidence: ${res.data.lowConfidenceWarning}`);
      }

      log.info("💬 AI Response:");
      console.log(`\n  ${COLORS.green}${res.data.message?.substring(0, 500) || "EMPTY"}${COLORS.reset}\n`);

      if (res.data.ragContext) {
        log.data("RAG Context (length)", res.data.ragContext.length + " chars");
      }
      if (res.data.kbAdvice) {
        log.data("KB Advice", res.data.kbAdvice?.substring(0, 100));
      }
      if (res.data.kbSeverity) {
        log.data("KB Severity", res.data.kbSeverity);
      }
      if (res.data.providerChain) {
        log.data("Provider Chain", res.data.providerChain.join(" → "));
      }

      recordResult("Image Chat (with CNN+RAG+LLM)", true, {
        latencyMs: ms,
        mode: res.data.mode,
        source: res.data.source,
        provider: res.data.provider,
        prediction: res.data.diagnosis?.prediction,
        confidence: res.data.diagnosis?.confidence,
        responseLength: res.data.message?.length,
        hasRagContext: !!res.data.ragContext,
        hasCommunityContext: !!res.data.communityContext,
      });
      return res.data;
    } else {
      log.error(`Image chat failed - Status: ${res.status}`);
      log.data("Response", res.data);
      recordResult("Image Chat (with CNN+RAG+LLM)", false, { status: res.status, response: res.data });
      return null;
    }
  } catch (err) {
    log.error(`Image request error: ${err.message}`);
    recordResult("Image Chat (with CNN+RAG+LLM)", false, { error: err.message });
    return null;
  }
}

async function step_standalone_diagnosis(token) {
  log.step(6, "Standalone Diagnosis - اختبار تشخيص الصورة منفرداً (/api/diagnosis/predict)");

  if (!fs.existsSync(IMAGE_PATH)) {
    log.warn("Image not found, skipping standalone diagnosis test");
    results.skipped++;
    recordResult("Standalone Diagnosis", false, { skipped: true });
    return null;
  }

  const form = new FormData();
  // /api/diagnosis/predict uses upload.single("image") — field must be "image"
  form.append("image", fs.createReadStream(IMAGE_PATH), {
    filename: path.basename(IMAGE_PATH),
    contentType: "image/jpeg",
  });

  log.info("Sending image to /api/diagnosis/predict ...");
  log.info("⏳ Waiting for ML service response...");

  const start = Date.now();
  try {
    const res = await formRequest("POST", "/api/diagnosis/predict", form, token);
    const ms = Date.now() - start;

    if (res.status === 200 && res.data?.success) {
      log.success(`Diagnosis received! (${log.time(ms)})`);
      log.data("Disease", res.data.prediction?.diseaseNameEn || res.data.prediction?.prediction || "N/A");
      log.data("Confidence", res.data.prediction?.confidence ? `${(res.data.prediction.confidence * 100).toFixed(1)}%` : "N/A");
      log.data("History ID", res.data.historyId || "N/A");
      recordResult("Standalone Diagnosis", true, { latencyMs: ms, prediction: res.data.prediction });
    } else {
      log.error(`Diagnosis failed - Status: ${res.status}`);
      log.data("Response", res.data);
      recordResult("Standalone Diagnosis", false, { status: res.status, response: res.data });
    }
    return res.data;
  } catch (err) {
    log.error(`Diagnosis error: ${err.message}`);
    recordResult("Standalone Diagnosis", false, { error: err.message });
    return null;
  }
}

async function step_test_assistant_no_auth() {
  log.step(7, "Test Assistant (No Auth) - اختبار /api/ai/test_assistant بدون تسجيل دخول");

  if (!fs.existsSync(IMAGE_PATH)) {
    log.warn("Image not found, testing text-only mode");
    const start = Date.now();
    try {
      const form = new FormData();
      form.append("question", "What is early blight disease in tomatoes?");
      const res = await formRequest("POST", "/api/ai/test_assistant", form, null);
      const ms = Date.now() - start;
      if (res.status === 200) {
        log.success(`Test assistant (text) worked! (${log.time(ms)})`);
        log.data("Response preview", res.data?.message?.substring(0, 200) || JSON.stringify(res.data).substring(0, 200));
        recordResult("Test Assistant (no auth, text)", true, { latencyMs: ms });
      } else {
        log.error(`Test assistant failed - Status: ${res.status}`);
        log.data("Response", res.data);
        recordResult("Test Assistant (no auth, text)", false, { status: res.status });
      }
    } catch (err) {
      log.error(`Error: ${err.message}`);
      recordResult("Test Assistant (no auth, text)", false, { error: err.message });
    }
    return;
  }

  const form = new FormData();
  form.append("file", fs.createReadStream(IMAGE_PATH), {
    filename: path.basename(IMAGE_PATH),
    contentType: "image/jpeg",
  });
  form.append("question", "Describe the disease in this plant image and provide treatment recommendations");

  log.info("Testing /api/ai/test_assistant with image (no auth required)...");
  log.info("⏳ This tests the full CNN→RAG→LLM pipeline without authentication...");

  const start = Date.now();
  try {
    const res = await formRequest("POST", "/api/ai/test_assistant", form, null);
    const ms = Date.now() - start;

    if (res.status === 200 && res.data?.success) {
      log.success(`Test assistant response received! (${log.time(ms)})`);
      log.data("Mode", res.data.mode);
      log.data("Source", res.data.source);
      if (res.data.diagnosis) {
        log.data("Diagnosis", res.data.diagnosis.prediction);
        log.data("Confidence", res.data.diagnosis.confidence ? `${(res.data.diagnosis.confidence * 100).toFixed(1)}%` : "N/A");
      }
      log.data("Response", res.data.message?.substring(0, 300) || "EMPTY");
      recordResult("Test Assistant (no auth, image)", true, {
        latencyMs: ms,
        prediction: res.data.diagnosis?.prediction,
        confidence: res.data.diagnosis?.confidence,
      });
    } else {
      log.error(`Test assistant failed - Status: ${res.status}`);
      log.data("Response", res.data);
      recordResult("Test Assistant (no auth, image)", false, { status: res.status, response: res.data });
    }
  } catch (err) {
    log.error(`Error: ${err.message}`);
    recordResult("Test Assistant (no auth, image)", false, { error: err.message });
  }
}

async function step_provider_check() {
  log.step(8, "AI Provider Status - فحص حالة مزودي الـ AI");

  // Try to get provider info from settings endpoint
  const start = Date.now();
  try {
    // Try the ENV-based settings info (debug endpoint)
    const res = await request({ url: `${BASE_URL}/health/debug` });
    const ms = Date.now() - start;

    if (res.status === 200) {
      log.success(`Debug info retrieved (${log.time(ms)})`);
      log.data("MongoDB configured", res.data?.data?.hasMongo ? "✅ Yes" : "❌ No");
      log.data("JWT Secret", res.data?.data?.hasJwtSecret ? "✅ Yes" : "❌ No");
      log.data("Environment", res.data?.data?.nodeEnv || "Unknown");
      recordResult("Health Debug", true, { latencyMs: ms });
    } else {
      log.info("Debug endpoint not available (expected in production)");
      recordResult("Health Debug", true, { note: "Endpoint hidden in production" });
    }
  } catch (err) {
    log.warn(`Debug check error: ${err.message}`);
    recordResult("Health Debug", false, { error: err.message });
  }
}

// ─── FINAL REPORT ─────────────────────────────────────────────────────────────

function printFinalReport() {
  const totalTime = Date.now() - results.startTime;
  log.header("FINAL TEST REPORT - تقرير الاختبار النهائي");

  const passColor = results.passed === results.total ? COLORS.green : COLORS.yellow;
  console.log(`\n  ${COLORS.bright}Total Time:${COLORS.reset} ${log.time(totalTime)}`);
  console.log(`  ${COLORS.bright}Tests Run:${COLORS.reset}  ${results.total}`);
  console.log(`  ${COLORS.bright}${COLORS.green}Passed:${COLORS.reset}     ${COLORS.green}${results.passed}${COLORS.reset}`);
  console.log(`  ${COLORS.bright}${COLORS.red}Failed:${COLORS.reset}     ${COLORS.red}${results.failed}${COLORS.reset}`);
  if (results.skipped > 0) {
    console.log(`  ${COLORS.bright}${COLORS.yellow}Skipped:${COLORS.reset}    ${COLORS.yellow}${results.skipped}${COLORS.reset}`);
  }

  log.divider();
  console.log(`\n  ${COLORS.bright}Detailed Results:${COLORS.reset}`);

  results.steps.forEach((step, i) => {
    const icon = step.passed ? `${COLORS.green}✅` : step.skipped ? `${COLORS.yellow}⏭️` : `${COLORS.red}❌`;
    const latency = step.latencyMs ? ` (${step.latencyMs}ms)` : "";
    console.log(`  ${icon}${COLORS.reset} ${step.name}${latency}`);
    if (!step.passed && !step.skipped) {
      if (step.error) console.log(`     ${COLORS.red}Error: ${step.error}${COLORS.reset}`);
      if (step.status) console.log(`     ${COLORS.red}HTTP Status: ${step.status}${COLORS.reset}`);
    }
  });

  log.divider();

  // Flow diagram
  console.log(`\n  ${COLORS.bright}AI FLOW DIAGRAM:${COLORS.reset}`);
  console.log(`
  ${COLORS.cyan}Flutter App${COLORS.reset}
      │
      ▼
  ${COLORS.blue}[1]${COLORS.reset} POST /api/chat/  (text message)
      │  OR
      ▼
  ${COLORS.blue}[2]${COLORS.reset} POST /api/ai/assistant  (image + text)
      │
      ├─► ${COLORS.magenta}Auth Middleware${COLORS.reset} (JWT verify)
      │
      ├─► ${COLORS.yellow}Chat Controller${COLORS.reset} / ${COLORS.yellow}AI Assistant Controller${COLORS.reset}
      │       │
      │       ├─► Load DB History (MongoDB)
      │       │
      │       └─► orchestrateChat() / orchestrateAssistantRequest()
      │                │
      │                ├─► ${COLORS.green}[IMAGE?]${COLORS.reset} CNN Provider → HuggingFace Space
      │                │       └─► Confidence check → Low? → Expert Escalation
      │                │
      │                ├─► ${COLORS.green}[RAG]${COLORS.reset} Search LLM → RAG Provider
      │                │       └─► Retrieve relevant agricultural chunks
      │                │
      │                ├─► ${COLORS.green}[MEMORY]${COLORS.reset} MemoryManager (user profile facts)
      │                │
      │                ├─► ${COLORS.green}[COMMUNITY]${COLORS.reset} Community Knowledge Retriever
      │                │
      │                └─► ${COLORS.green}[LLM]${COLORS.reset} Agent Loop (Tool Calling)
      │                        └─► Provider Manager (Failover)
      │                                ├─► Provider 1 (priority)
      │                                ├─► Provider 2 (fallback)
      │                                └─► HF RAG /ask (emergency)
      │
      └─► Save to MongoDB (Messages/DiagnosisHistory)
              │
              ▼
          JSON Response → Flutter App
  `);

  if (results.failed === 0) {
    console.log(`  ${COLORS.bgGreen}${COLORS.bright}  🎉 ALL TESTS PASSED! AI FLOW IS WORKING CORRECTLY  ${COLORS.reset}\n`);
  } else if (results.passed > 0) {
    console.log(`  ${COLORS.bgYellow}${COLORS.bright}  ⚠️  PARTIAL SUCCESS: ${results.passed}/${results.total} tests passed  ${COLORS.reset}\n`);
  } else {
    console.log(`  ${COLORS.bgRed}${COLORS.bright}  ❌ ALL TESTS FAILED - Check server and configuration  ${COLORS.reset}\n`);
  }

  // Save report to file
  const reportPath = path.join(__dirname, "ai_flow_test_report.json");
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    imagePath: IMAGE_PATH,
    totalTimeMs: totalTime,
    summary: {
      total: results.total,
      passed: results.passed,
      failed: results.failed,
      skipped: results.skipped,
      successRate: `${((results.passed / results.total) * 100).toFixed(1)}%`,
    },
    steps: results.steps,
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`  ${COLORS.cyan}📄 Full report saved to: ${reportPath}${COLORS.reset}\n`);
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  log.header("NABATECH AI FLOW - Full E2E Test");
  console.log(`  ${COLORS.cyan}Target:${COLORS.reset} ${BASE_URL}`);
  console.log(`  ${COLORS.cyan}Image:${COLORS.reset}  ${IMAGE_PATH}`);
  console.log(`  ${COLORS.cyan}Time:${COLORS.reset}   ${new Date().toLocaleString()}`);

  // Step 1: Health check
  const isAlive = await step_health_check();
  if (!isAlive) {
    log.error("\nServer is not reachable. Aborting tests.");
    printFinalReport();
    process.exit(1);
  }

  // Step 2: Auth
  const token = await step_register_or_login();
  if (!token) {
    log.error("\nCould not authenticate. Some tests will be skipped.");
  }

  // Generate a unique conversation ID for this test session
  const conversationId = `test-conv-${Date.now()}`;
  log.info(`\n  Using conversationId: ${conversationId}`);

  // Step 3: Text chat
  if (token) {
    await step_text_chat(token, conversationId);
  } else {
    log.warn("Skipping text chat (no token)");
    results.skipped++;
  }

  // Step 4: Chat history
  if (token) {
    await step_chat_history(token, conversationId);
  } else {
    log.warn("Skipping chat history (no token)");
    results.skipped++;
  }

  // Step 5: Image chat (main AI flow)
  if (token) {
    await step_image_chat(token, conversationId);
  } else {
    log.warn("Skipping image chat (no token)");
    results.skipped++;
  }

  // Step 6: Standalone diagnosis
  if (token) {
    await step_standalone_diagnosis(token);
  } else {
    log.warn("Skipping standalone diagnosis (no token)");
    results.skipped++;
  }

  // Step 7: Test assistant (no auth needed)
  await step_test_assistant_no_auth();

  // Step 8: Provider check
  await step_provider_check();

  // Final report
  printFinalReport();

  process.exit(results.failed > 0 ? 1 : 0);
}

// Handle unhandled rejections
process.on("unhandledRejection", (reason) => {
  log.error(`Unhandled rejection: ${reason}`);
  process.exit(1);
});

main().catch((err) => {
  log.error(`Fatal error: ${err.message}`);
  console.error(err);
  process.exit(1);
});

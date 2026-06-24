import requests
import time

url = "https://ahmedsaeed111-rag-only.hf.space/ask"
payload = {"question": "ما هي أعراض البياض الدقيقي؟"}

print(f"Sending POST to {url}...")
start = time.time()
try:
    resp = requests.post(url, json=payload)
    latency = time.time() - start
    print(f"Status: {resp.status_code}")
    print(f"Latency: {latency:.2f}s")
    print(resp.text)
except Exception as e:
    print(f"Error: {e}")

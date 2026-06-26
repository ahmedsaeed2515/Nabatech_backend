import axios from "axios";

const BASE_URL = "https://ahmedsaeed111-rag-only.hf.space";

async function testV8() {
  console.log(`=== Testing AgriRAG Pro v8.0 at ${BASE_URL} ===\n`);

  // 1. /health
  try {
    console.log("1. Testing GET /health ...");
    const start = Date.now();
    const res = await axios.get(`${BASE_URL}/health`, { timeout: 30000 });
    console.log(`   ✅ Success (${Date.now() - start}ms):`, JSON.stringify(res.data));
  } catch (e: any) {
    console.log(`   ❌ Failed: ${e.message}`);
  }

  // 2. /health/deep
  try {
    console.log("\n2. Testing GET /health/deep ...");
    const start = Date.now();
    const res = await axios.get(`${BASE_URL}/health/deep`, { timeout: 60000 });
    console.log(`   ✅ Success (${Date.now() - start}ms):`, JSON.stringify(res.data));
  } catch (e: any) {
    console.log(`   ❌ Failed: ${e.message}`);
  }

  // 3. /stats
  try {
    console.log("\n3. Testing GET /stats ...");
    const start = Date.now();
    const res = await axios.get(`${BASE_URL}/stats`, { timeout: 30000 });
    console.log(`   ✅ Success (${Date.now() - start}ms):`, JSON.stringify(res.data));
  } catch (e: any) {
    console.log(`   ❌ Failed: ${e.message}`);
  }

  // 4. /retrieve (NEW in v7/v8)
  try {
    console.log("\n4. Testing POST /retrieve (Pure RAG) ...");
    const start = Date.now();
    const payload = { disease_name: "Apple_Scab" };
    console.log(`   Sending payload:`, payload);
    const res = await axios.post(`${BASE_URL}/retrieve`, payload, { timeout: 45000 });
    console.log(`   ✅ Success (${Date.now() - start}ms):`);
    const data: any = res.data;
    console.log(`      Retrieved Chunks: ${data.chunks?.length || 0}`);
    console.log(`      Total Found: ${data.total_found}`);
    if (data.chunks?.length > 0) {
      console.log(`      Snippet[0]: ${data.chunks[0].text.slice(0, 100).replace(/\n/g, " ")}...`);
    }
  } catch (e: any) {
    console.log(`   ❌ Failed: ${e.message}`);
    if (e.response) console.log(`      Response:`, e.response.data);
  }

  // 5. /ask (Full LLM)
  try {
    console.log("\n5. Testing POST /ask (Full LLM Pipeline) ...");
    const start = Date.now();
    const payload = { question: "كيف أعالج تجعد أوراق الخوخ؟" };
    console.log(`   Sending payload:`, payload);
    const res = await axios.post(`${BASE_URL}/ask`, payload, { timeout: 60000 });
    console.log(`   ✅ Success (${Date.now() - start}ms):`);
    const data: any = res.data;
    console.log(`      Answer Snippet: ${data.answer?.slice(0, 150).replace(/\n/g, " ")}...`);
    console.log(`      Rag Sources: ${data.rag_context?.total_found || 0}`);
  } catch (e: any) {
    console.log(`   ❌ Failed: ${e.message}`);
    if (e.response) console.log(`      Response:`, e.response.data);
  }

  console.log("\n=== Testing Complete ===");
}

testV8().catch(console.error);



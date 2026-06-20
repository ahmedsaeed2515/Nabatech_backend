const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function runLiveTests() {
  console.log("=== Testing Real Nabatech APIs ===\n");

  try {
    // 1. Authenticate (Assuming test user or we just create one)
    console.log("[POST] /api/auth/register");
    const testEmail = `test_${Date.now()}@nabatech.com`;
    let res = await axios.post(`${BASE_URL}/auth/register`, {
      name: "API Tester",
      email: testEmail,
      password: "Password123!"
    });
    
    const token = res.data.token;
    console.log("-> Registered successfully. Token obtained.\n");

    const headers = { Authorization: `Bearer ${token}` };

    // --- 1. My Plants API ---
    console.log("=== 1. My Plants API ===");
    const plantReq = {
      name: "Ficus Lyrata",
      species: "Ficus",
      location: "indoor",
      waterFrequencyDays: 5,
      lastWatered: new Date().toISOString(),
      healthStatus: "Healthy",
      clientOperationId: `op-${Date.now()}`
    };
    console.log("[POST] /my-plants Input:", JSON.stringify(plantReq, null, 2));
    res = await axios.post(`${BASE_URL}/my-plants`, plantReq, { headers });
    console.log("[POST] /my-plants Output Status:", res.status);
    console.log("[POST] /my-plants Output:", JSON.stringify(res.data, null, 2));

    res = await axios.get(`${BASE_URL}/my-plants`, { headers });
    console.log(`\n[GET] /my-plants Output Status:`, res.status);
    console.log("[GET] /my-plants Output:", JSON.stringify(res.data, null, 2));

    // --- 2. Notifications API ---
    console.log("\n=== 2. Notifications API ===");
    res = await axios.get(`${BASE_URL}/notifications`, { headers });
    console.log("[GET] /notifications Output Status:", res.status);
    console.log("[GET] /notifications Output:", JSON.stringify(res.data, null, 2));

    // --- 3. Diagnosis History API ---
    console.log("\n=== 3. Diagnosis History API ===");
    res = await axios.get(`${BASE_URL}/history`, { headers });
    console.log("[GET] /history Output Status:", res.status);
    console.log("[GET] /history Output:", JSON.stringify(res.data, null, 2));

    // --- 4. Disease Map API ---
    console.log("\n=== 4. Disease Map API ===");
    res = await axios.get(`${BASE_URL}/explore/outbreaks`, { headers });
    console.log("[GET] /explore/outbreaks Output Status:", res.status);
    console.log("[GET] /explore/outbreaks Output:", JSON.stringify(res.data, null, 2));

  } catch (error) {
    if (error.response) {
      console.error("API Error Response:", error.response.status, error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

runLiveTests();

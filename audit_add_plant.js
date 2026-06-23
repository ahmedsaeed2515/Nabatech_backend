const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://nabatech-backend.vercel.app/api';

async function runAudit() {
  console.log("=== NABATECH ADD PLANT AUDIT ===");
  console.log(`Base URL: ${BASE_URL}\n`);

  // 1. Register or Login to get Token
  const email = `audit_user_${Date.now()}@example.com`;
  const password = "password123";
  let token = "";
  
  try {
    console.log("-> Registering test user to obtain token...");
    const regRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: "Audit User",
      email,
      password
    });
    token = regRes.data.token;
    console.log("Registration successful. Token acquired.\n");
  } catch (e) {
    console.error("Registration failed:", e.response?.data || e.message);
    return;
  }

  const headers = { Authorization: `Bearer ${token}` };

  // 2. Trace GET /api/gardens (the Flutter app called this on load)
  console.log("=========================================");
  console.log("STEP 1: Load Gardens (Reproduce 404 error)");
  console.log("=========================================");
  try {
    console.log(`Request: GET ${BASE_URL}/gardens`);
    console.log("Headers:", headers);
    const res = await axios.get(`${BASE_URL}/gardens`, { headers });
    console.log("Response:", res.status, res.data);
  } catch (e) {
    console.error("EXPECTED ERROR:", e.response?.status, e.response?.statusText);
    console.error("Response Body:", e.response?.data);
    console.error("Conclusion: /api/gardens returns 404 because the correct route is /api/v1/gardens.\n");
  }

  // 3. Add Plant (My Plants)
  console.log("=========================================");
  console.log("STEP 2: Add Plant Manually");
  console.log("=========================================");
  let plantId = "";
  try {
    const payload = {
      name: "Audit Test Plant",
      species: "Testus Plantus",
      location: "indoor",
      waterFrequencyDays: 7,
      clientOperationId: "audit-op-123",
      healthStatus: "excellent"
    };
    console.log(`Request: POST ${BASE_URL}/my-plants`);
    console.log("Headers:", headers);
    console.log("Payload:", payload);
    const res = await axios.post(`${BASE_URL}/my-plants`, payload, { headers });
    console.log("Response Status:", res.status);
    console.log("Response Data:", res.data);
    plantId = res.data.data?.plant?.id || res.data.plant?.id || res.data.data?.id;
    console.log(`Conclusion: Plant added successfully with ID: ${plantId}\n`);
  } catch (e) {
    console.error("Add Plant Failed:", e.response?.status, e.response?.data || e.message);
    return;
  }

  // 4. Upload Image
  console.log("=========================================");
  console.log("STEP 3: Upload Plant Image");
  console.log("=========================================");
  try {
    // Create a dummy image file
    const dummyImagePath = path.join(__dirname, 'dummy_plant.jpg');
    // A tiny 1x1 valid jpeg hex: ffd8ffe000104a46494600010101004800480000ffdb0043000302020302020303030304030304050805050404050a070706080c0a0c0c0b0a0b0b0d0e12100d0e110e0b0b1016101113141515150c0f171816141812141514ffdb00430103040405040509050509140d0b0d1414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414c0011080001000103012200021101031101ffc4001f0000010501010101010100000000000000000102030405060708090a0bffc400b5100002010303020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffc400140100000000000000000000000000000000ffc400201100000000000000000000000000000000ffda000c03010002110311003f00f2200007fffd9
    fs.writeFileSync(dummyImagePath, Buffer.from("ffd8ffe000104a46494600010101004800480000ffdb0043000302020302020303030304030304050805050404050a070706080c0a0c0c0b0a0b0b0d0e12100d0e110e0b0b1016101113141515150c0f171816141812141514ffdb00430103040405040509050509140d0b0d1414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414141414c0011080001000103012200021101031101ffc4001f0000010501010101010100000000000000000102030405060708090a0bffc400b5100002010303020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffc400140100000000000000000000000000000000ffc400201100000000000000000000000000000000ffda000c03010002110311003f00f2200007fffd9", 'hex'));

    const formData = new FormData();
    formData.append('file', fs.createReadStream(dummyImagePath));
    formData.append('clientOperationId', 'audit-op-456');

    console.log(`Request: POST ${BASE_URL}/my-plants/${plantId}/image`);
    console.log("Headers:", { ...headers, ...formData.getHeaders() });
    console.log("FormData Fields: file (stream), clientOperationId");
    
    const uploadRes = await axios.post(`${BASE_URL}/my-plants/${plantId}/image`, formData, {
      headers: { ...headers, ...formData.getHeaders() }
    });
    
    console.log("Upload Response Status:", uploadRes.status);
    console.log("Upload Response Data:", uploadRes.data);
    console.log(`Conclusion: Image uploaded successfully to Cloudinary. URL: ${uploadRes.data.imageUrl}\n`);
  } catch (e) {
    console.error("Upload Failed:", e.response?.status, e.response?.data || e.message);
  }
}

runAudit();

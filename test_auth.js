const https = require('https');

const baseUrl = 'https://nabatech-backend.vercel.app/api';
const testEmail = `testuser_${Date.now()}@example.com`;
const testPassword = 'Password123';

async function fetchJSON(url, method, body) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(body);

    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };

    const req = https.request(url, options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(responseBody) });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseBody });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (body) req.write(dataString);
    req.end();
  });
}

async function runTests() {
  console.log('--- TESTING LIVE VERCEL BACKEND ---');
  
  console.log(`\n1. Registering user: ${testEmail}`);
  const registerRes = await fetchJSON(`${baseUrl}/auth/register`, 'POST', {
    name: 'Test User',
    email: testEmail,
    password: testPassword
  });
  
  console.log(`Status: ${registerRes.status}`);
  console.log(`Response: ${JSON.stringify(registerRes.data, null, 2)}`);
  
  if (registerRes.status >= 400) {
    console.error('Registration failed, aborting login test.');
    return;
  }
  
  console.log(`\n2. Logging in as: ${testEmail}`);
  const loginRes = await fetchJSON(`${baseUrl}/auth/login`, 'POST', {
    email: testEmail,
    password: testPassword
  });
  
  console.log(`Status: ${loginRes.status}`);
  console.log(`Response: ${JSON.stringify(loginRes.data, null, 2)}`);
  
  if (loginRes.status === 200 && loginRes.data.success) {
    console.log('\n✅ TEST PASSED: Authentication flow works perfectly on Vercel!');
  } else {
    console.error('\n❌ TEST FAILED: Login did not succeed.');
  }
}

runTests();

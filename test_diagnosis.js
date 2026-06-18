const https = require('https');
const fs = require('fs');
const path = require('path');

const baseUrl = 'https://nabatech-backend.vercel.app/api';
const testEmail = `diag_user_${Date.now()}@example.com`;
const testPassword = 'Password123';

// 1. Create a tiny 1x1 GIF to act as our image file
const tinyGifBase64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const tempFilePath = path.join(__dirname, 'temp_test_image.gif');
fs.writeFileSync(tempFilePath, Buffer.from(tinyGifBase64, 'base64'));

console.log(`Created temporary image at: ${tempFilePath}`);

function postMultipart(url, filePath, token) {
  return new Promise((resolve, reject) => {
    const boundary = `----TestBoundary${Date.now().toString(16)}`;
    const filename = path.basename(filePath);
    
    // Construct the multipart body buffer
    const fileBuffer = fs.readFileSync(filePath);
    
    let header = `--${boundary}\r\n`;
    header += `Content-Disposition: form-data; name="image"; filename="${filename}"\r\n`;
    header += `Content-Type: image/gif\r\n\r\n`;
    
    let footer = `\r\n--${boundary}--\r\n`;
    
    const totalLength = Buffer.byteLength(header) + fileBuffer.length + Buffer.byteLength(footer);
    
    const parsedUrl = new URL(url);
    const options = {
      method: 'POST',
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': totalLength
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', (e) => reject(e));
    
    // Write multipart parts
    req.write(Buffer.from(header));
    req.write(fileBuffer);
    req.write(Buffer.from(footer));
    req.end();
  });
}

async function fetchJSON(url, method, body, token) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(body);
    const parsedUrl = new URL(url);

    const options = {
      method: method,
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };
    
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = https.request(options, (res) => {
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

async function runTest() {
  try {
    console.log('1. Registering user...');
    const registerRes = await fetchJSON(`${baseUrl}/auth/register`, 'POST', {
      name: 'Tester User',
      email: testEmail,
      password: testPassword
    });
    
    if (registerRes.status !== 201) {
      console.error('Registration failed:', registerRes.data);
      return;
    }
    
    const token = registerRes.data.data.accessToken;
    console.log('✅ Registered successfully. Token acquired.');

    console.log('\n2. Testing text chat route (/api/chat)...');
    const chatRes = await fetchJSON(`${baseUrl}/chat`, 'POST', {
      question: "Hello, how do I care for my plants?",
      history: []
    }, token);
    console.log(`Status: ${chatRes.status}`);
    console.log(`Response:`, JSON.stringify(chatRes.data, null, 2));

    console.log('\n3. Testing plant diagnosis route (/api/diagnosis/predict) without saving to Cloudinary...');
    const diagRes = await postMultipart(`${baseUrl}/diagnosis/predict`, tempFilePath, token);
    console.log(`Status: ${diagRes.status}`);
    console.log(`Response:`, JSON.stringify(diagRes.data, null, 2));
    
    if (diagRes.status === 200 && diagRes.data.success) {
      console.log('\n🎉 SUCCESS: All image flows tested and validated successfully!');
    } else {
      console.log('\n⚠️ Diagnosis response succeeded but check error logs (e.g. if CNN provider failed/mocked).');
    }
  } catch (error) {
    console.error('Test script error:', error);
  } finally {
    // Clean up local temp file
    try {
      fs.unlinkSync(tempFilePath);
      console.log(`\nCleaned up temporary file.`);
    } catch (_) {}
  }
}

runTest();

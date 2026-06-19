const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { performance } = require('perf_hooks');

const IMAGE_API_URL = 'https://abdallah110-cnnn.hf.space/predict';

async function downloadImage(url, filename) {
  const writer = fs.createWriteStream(filename);
  const response = await axios({ url, method: 'GET', responseType: 'stream', headers: { 'User-Agent': 'Mozilla/5.0' } });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function testCNN() {
  const images = [
    { name: "Tomato Leaf", url: "https://upload.wikimedia.org/wikipedia/commons/8/89/Tomato_je.jpg", file: "tomato.jpg" },
    { name: "Potato Leaf", url: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Potato_leaves.jpg", file: "potato.jpg" },
    { name: "Corn Leaf", url: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Maize_leaf.jpg", file: "corn.jpg" }
  ];

  console.log("Downloading real images...");
  for (const img of images) {
    await downloadImage(img.url, img.file);
  }

  const results = [];
  console.log("Starting CNN Inference Tests...");

  for (const img of images) {
    try {
      const start = performance.now();
      const form = new FormData();
      form.append('file', fs.createReadStream(img.file));
      
      const res = await axios.post(IMAGE_API_URL, form, { 
        headers: form.getHeaders(),
        timeout: 20000 
      });
      const lat = performance.now() - start;
      
      console.log(`[${img.name}] Status: ${res.status}`);
      console.log(`[${img.name}] Latency: ${lat.toFixed(2)}ms`);
      console.log(`[${img.name}] Prediction: ${res.data.prediction || res.data.class || res.data.label}`);
      console.log(`[${img.name}] Confidence: ${res.data.confidence || res.data.score || res.data.probability}`);
      console.log(`[${img.name}] Raw:`, JSON.stringify(res.data));
      
      results.push({
        name: img.name,
        status: res.status,
        latency: lat,
        prediction: res.data.prediction || res.data.class || res.data.label,
        confidence: res.data.confidence || res.data.score || res.data.probability,
        raw: res.data
      });
    } catch(e) {
      console.log(`[${img.name}] ERROR:`, e.message);
      if (e.response) {
        console.log(`[${img.name}] Error Data:`, e.response.data);
      }
      results.push({ name: img.name, error: e.message, status: e.response?.status });
    }
  }

  fs.writeFileSync('cnn_test_results.json', JSON.stringify(results, null, 2));
}

testCNN();

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function test() {
  while (true) {
    try {
      await axios.get('http://localhost:10000/health/live');
      console.log("Server is up. Sending POST...");
      break;
    } catch (e) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const form = new FormData();
  form.append('question', 'ما هو مرض هذا النبات؟');
  form.append('file', fs.createReadStream('potato.jpg'));

  try {
    const res = await axios.post('http://localhost:10000/api/ai/test_assistant', form, {
      headers: {
        ...form.getHeaders(),
        'Accept-Language': 'ar'
      }
    });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    if (err.response) {
      console.error(JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
  }
}
test();

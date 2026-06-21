const axios = require('axios');
axios.post('https://ahmedsaeed111-rag-only.hf.space/ask', {
  question: 'test',
  history: [],
  top_k: 5
}).then(console.log).catch(err => {
  console.log(JSON.stringify(err.response.data, null, 2));
});

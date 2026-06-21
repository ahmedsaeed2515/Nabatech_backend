const axios = require('axios');
axios.get('https://ahmedsaeed111-rag-only.hf.space/openapi.json').then(res => {
  console.log(JSON.stringify(res.data.paths['/ask'], null, 2));
}).catch(console.error);

const axios = require('axios');
const fs = require('fs');
async function run() {
  const url = 'https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Tomato___Bacterial_spot/00416648-be6e-4bd4-bc8d-82f43f8a7240___GCREC_Bact.Sp_3110.JPG';
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  fs.writeFileSync('test_leaf.jpg', response.data);
  console.log('Downloaded test_leaf.jpg, size:', response.data.length);
}
run().catch(console.error);

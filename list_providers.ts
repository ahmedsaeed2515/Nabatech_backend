const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const AiProviderSettings = require('./src/models/ai_provider_settings_model').default;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nabatech')
  .then(async () => {
    try {
      const providers = await AiProviderSettings.find();
      console.log('Providers:');
      providers.forEach(p => console.log(`- ${p.providerName} (priority: ${p.priority}, enabled: ${p.enabled})`));
    } catch(err) {
      console.error(err);
    } finally {
      process.exit(0);
    }
  });

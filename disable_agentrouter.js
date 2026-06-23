const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  await mongoose.connection.collection('aiprovidersettings').updateMany(
    { providerName: { $in: ['agentrouter-flash', 'agentrouter-pro', 'agentrouter-glm'] } },
    { $set: { enabled: false, status: 'failed' } }
  );
  console.log('AgentRouter models disabled successfully to prevent WAF errors.');
  process.exit();
}).catch(console.error);

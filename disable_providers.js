/**
 * Script to disable AgentRouter and Groq providers from MongoDB
 * and set HuggingFace as the primary provider.
 */
const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://ahmedsaeed2515_db_user:tdx7j8mKgH7Q7vMg@nabatech.jpiebma.mongodb.net/?appName=nabatech';

async function disableProblematicProviders() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('aiproviderssettings');

    // Find all providers first
    const all = await collection.find({}).toArray();
    console.log(`\nFound ${all.length} providers:`);
    all.forEach(p => {
      console.log(`  - ${p.providerName} | priority: ${p.priority} | enabled: ${p.enabled}`);
    });

    // Disable AgentRouter (any provider with agentrouter in name or URL)
    const agentRouterResult = await collection.updateMany(
      {
        $or: [
          { providerName: { $regex: /agentrouter/i } },
          { baseUrl: { $regex: /agentrouter\.org/i } },
        ]
      },
      { $set: { enabled: false, status: 'disabled', lastError: 'Disabled: WAF blocks Arabic content and datacenter IPs' } }
    );
    console.log(`\n🔴 Disabled AgentRouter providers: ${agentRouterResult.modifiedCount}`);

    // Disable Groq (any provider with groq in name or URL)
    const groqResult = await collection.updateMany(
      {
        $or: [
          { providerName: { $regex: /groq/i } },
          { baseUrl: { $regex: /api\.groq\.com/i } },
        ]
      },
      { $set: { enabled: false, status: 'disabled', lastError: 'Disabled: Free tier rate limits cause 429 errors' } }
    );
    console.log(`🔴 Disabled Groq providers: ${groqResult.modifiedCount}`);

    // Show remaining enabled providers
    const remaining = await collection.find({ enabled: true }).sort({ priority: 1 }).toArray();
    console.log(`\n✅ Remaining enabled providers (${remaining.length}):`);
    remaining.forEach(p => {
      console.log(`  - ${p.providerName} | priority: ${p.priority} | model: ${p.llmModel}`);
    });

    // Also update AI settings: set aiModePriority to use HF spaces directly
    const aiSettingsCollection = db.collection('aisettings');
    const settingsResult = await aiSettingsCollection.updateOne(
      { key: 'default' },
      {
        $set: {
          aiModePriority: ['hf_v62', 'hf_v8', 'rag_openai'],
          'pipeline.lowConfidenceBehavior': 'warn',
          'cnn.confidenceThreshold': 0.40,
        }
      }
    );
    console.log(`\n✅ Updated AI settings: ${settingsResult.modifiedCount} document(s) modified`);

    await mongoose.disconnect();
    console.log('\n✅ Done! Disconnected from MongoDB.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

disableProblematicProviders();

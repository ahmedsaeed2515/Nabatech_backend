const axios = require('axios');

const baseUrl = 'https://ahmedsaeed111-rag-only.hf.space';

async function runTests() {
    console.log('==================================================');
    console.log('🧪 TEST 1: Real CNN Output -> Pure Retrieval RAG');
    console.log('==================================================');
    try {
        const retrieveRes = await axios.post(`${baseUrl}/retrieve`, {
            disease_name: 'Potato_Early_blight',
            question: 'My plant has dark spots on the leaves, what should I do?',
            top_k: 2
        });
        
        console.log(`✅ Success! Retrieved ${retrieveRes.data.chunks.length} chunks.`);
        console.log('--- Sample Context Returned (Chunk 1) ---');
        if (retrieveRes.data.chunks.length > 0) {
            console.log(`[Source: ${retrieveRes.data.chunks[0].source}]`);
            console.log(retrieveRes.data.chunks[0].text);
        }
    } catch (e) {
        console.error('❌ Failed /retrieve:', e.response ? e.response.data : e.message);
    }

    console.log('\n==================================================');
    console.log('🧪 TEST 2: Real User Chat Question -> Full LLM RAG');
    console.log('==================================================');
    try {
        const askRes = await axios.post(`${baseUrl}/ask`, {
            question: 'أوراق نبات الطماطم بها بقع بنية داكنة، كيف يمكنني علاجها؟',
            history: []
        });
        
        console.log('✅ Success! Answer Generated:');
        console.log('--- Response from LLM ---');
        console.log(askRes.data.answer);
    } catch (e) {
        console.error('❌ Failed /ask:', e.response ? e.response.data : e.message);
    }
}

runTests();

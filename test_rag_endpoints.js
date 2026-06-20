const axios = require('axios');

const baseUrl = 'https://ahmedsaeed111-rag-only.hf.space';

async function testAll() {
    console.log('Testing RAG Endpoints...');

    // 1. GET /health
    try {
        const res = await axios.get(`${baseUrl}/health`);
        console.log('✅ GET /health:', res.data);
    } catch (e) {
        console.error('❌ GET /health:', e.message);
    }

    // 2. GET /health/deep
    try {
        const res = await axios.get(`${baseUrl}/health/deep`);
        console.log('✅ GET /health/deep:', res.data);
    } catch (e) {
        console.error('❌ GET /health/deep:', e.message);
    }

    // 3. GET /stats
    try {
        const res = await axios.get(`${baseUrl}/stats`);
        console.log('✅ GET /stats:', res.data);
    } catch (e) {
        console.error('❌ GET /stats:', e.message);
    }

    // 4. POST /retrieve
    try {
        const res = await axios.post(`${baseUrl}/retrieve`, {
            disease_name: 'Tomato_Early_blight',
            question: 'What should I do?',
            top_k: 2
        });
        console.log('✅ POST /retrieve: Success. Chunks retrieved:', res.data.chunks?.length);
    } catch (e) {
        console.error('❌ POST /retrieve:', e.response ? e.response.data : e.message);
    }

    // 5. POST /ask
    try {
        const res = await axios.post(`${baseUrl}/ask`, {
            question: 'How to treat tomato early blight?',
            history: []
        });
        console.log('✅ POST /ask: Success.', res.data.answer ? 'Answer received.' : '');
    } catch (e) {
        console.error('❌ POST /ask:', e.response ? e.response.data : e.message);
    }
}

testAll();

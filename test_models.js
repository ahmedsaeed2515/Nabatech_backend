const fs = require('fs');
const path = require('path');

const fetchWithTimeout = async (url, options, timeout = 30000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
};

async function testModels() {
    console.log("==========================================");
    console.log(" TESTING LLM MODELS ");
    console.log("==========================================");

    const llmPayloadNew = {
        question: "ما هي أعراض البياض الدقيقي؟",
        top_k: 3,
        history: []
    };

    try {
        console.log("\n[2] Testing New LLM (abdallah110-htf.hf.space)...");
        const t2 = Date.now();
        const resNewLlm = await fetchWithTimeout("https://abdallah110-htf.hf.space/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(llmPayloadNew)
        });
        const dataNewLlm = await resNewLlm.json();
        console.log(`Time: ${Date.now() - t2}ms | Status: ${resNewLlm.status}`);
        console.log("Result:", JSON.stringify(dataNewLlm, null, 2).substring(0, 500) + '...');
    } catch(e) {
        console.error("Error testing new LLM:", e.message);
    }

    console.log("\n==========================================");
    console.log(" TESTING CNN MODELS ");
    console.log("==========================================");
    
    const imagePath = path.join(__dirname, 'tomato.jpg');
    if (!fs.existsSync(imagePath)) {
        console.log("tomato.jpg not found.");
        return;
    }
    
    const fileBuffer = fs.readFileSync(imagePath);
    
    try {
        const formDataNew = new FormData();
        const blobNew = new Blob([fileBuffer], { type: 'image/jpeg' });
        formDataNew.append('file', blobNew, 'tomato.jpg');

        console.log("\n[4] Testing New CNN (abdulrhmanHelmy-plantvillage-disease-detectorr.hf.space)...");
        const t4 = Date.now();
        const resNewCnn = await fetchWithTimeout("https://abdulrhmanHelmy-plantvillage-disease-detectorr.hf.space/predict?top_k=1", {
            method: "POST",
            headers: { "accept": "application/json" },
            body: formDataNew
        });
        const dataNewCnn = await resNewCnn.json();
        console.log(`Time: ${Date.now() - t4}ms | Status: ${resNewCnn.status}`);
        console.log("Result:", JSON.stringify(dataNewCnn, null, 2));
    } catch(e) {
        console.error("Error testing new CNN:", e.message);
    }

    try {
        const formDataOld = new FormData();
        const blobOld = new Blob([fileBuffer], { type: 'image/jpeg' });
        formDataOld.append('file', blobOld, 'tomato.jpg');

        console.log("\n[3] Testing Current CNN (abdallah110-cnnn.hf.space)...");
        const t3 = Date.now();
        const resOldCnn = await fetchWithTimeout("https://abdallah110-cnnn.hf.space/predict", {
            method: "POST",
            headers: { "accept": "application/json" },
            body: formDataOld
        });
        const dataOldCnn = await resOldCnn.json();
        console.log(`Time: ${Date.now() - t3}ms | Status: ${resOldCnn.status}`);
        console.log("Result:", JSON.stringify(dataOldCnn, null, 2));
    } catch(e) {
        console.error("Error testing current CNN:", e.message);
    }
}

testModels();

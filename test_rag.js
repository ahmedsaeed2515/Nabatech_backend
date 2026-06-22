const axios = require("axios");
async function run() {
  try {
    const res = await axios.post("https://ahmedsaeed111-rag-only.hf.space/retrieve", {
      disease_name: "Tomato_Healthy",
      question: "",
      top_k: 8,
      language: "en",
      crop: "Tomato"
    });
    console.log("Success:", res.data);
  } catch (err) {
    if (err.response) {
      console.log("Error status:", err.response.status);
      console.log("Error body:", JSON.stringify(err.response.data, null, 2));
    } else {
      console.log("Network error:", err.message);
    }
  }
}
run();

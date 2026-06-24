"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const ai_settings_model_1 = __importDefault(require("./models/ai_settings_model"));
async function run() {
    const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nabatech";
    await mongoose_1.default.connect(MONGO_URI);
    let settings = await ai_settings_model_1.default.findOne({ key: "default" });
    if (settings) {
        settings.aiModePriority = ["rag_openai", "hf_v8", "hf_v62"];
        await settings.save();
        console.log("Successfully updated AI Settings priority in DB!");
    }
    else {
        console.log("Settings not found in DB. The app will use the updated ai_config_service.ts defaults.");
    }
    await mongoose_1.default.disconnect();
}
run().catch(console.error);

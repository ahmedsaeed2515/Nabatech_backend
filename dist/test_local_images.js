"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const cnn_provider_1 = require("./services/ai/cnn_provider");
const ai_config_service_1 = require("./services/ai/ai_config_service");
const form_data_1 = __importDefault(require("form-data"));
dotenv_1.default.config();
async function run() {
    await mongoose_1.default.connect(process.env.MONGODB_URI);
    const settings = await (0, ai_config_service_1.getAiSettings)();
    const files = ["tomato.jpg", "test.jpg", "potato.jpg"];
    for (const f of files) {
        const p = path_1.default.join(__dirname, "../", f);
        if (!fs_1.default.existsSync(p))
            continue;
        const buf = fs_1.default.readFileSync(p);
        if (buf.length === 0)
            continue;
        const formData = new form_data_1.default();
        formData.append("file", buf, { filename: f });
        try {
            const res = await (0, cnn_provider_1.runCnnDiagnosis)(settings, formData, formData.getHeaders());
            console.log(`${f}: ${res.prediction} (${res.confidence}%)`);
        }
        catch (e) {
            console.log(`${f} failed: ${e.message}`);
        }
    }
    process.exit(0);
}
run().catch(console.error);

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askAI = void 0;
const axios_1 = __importDefault(require("axios"));
const askAI = async (message) => {
    const response = await axios_1.default.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }],
    }, {
        headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
        },
    });
    return response.data.choices[0].message.content;
};
exports.askAI = askAI;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
async function handler(req, res) {
    res.status(200).json({
        success: true,
        message: "Hello from Vercel! Your basic routing works. The full app is temporarily disabled for debugging."
    });
}
module.exports = handler;

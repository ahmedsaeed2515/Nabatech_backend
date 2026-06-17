"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const outbox_worker_1 = require("../workers/outbox_worker");
const env_1 = require("../config/env");
const router = (0, express_1.Router)();
router.get('/drain', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!env_1.env.CRON_SECRET) {
        return res.status(503).json({ success: false, message: 'CRON_SECRET not configured' });
    }
    if (authHeader !== `Bearer ${env_1.env.CRON_SECRET}`) {
        return res.status(403).json({ success: false, message: 'AUTH_FORBIDDEN' });
    }
    try {
        let maxJobs = parseInt(req.query.maxJobs, 10) || 50;
        if (maxJobs > 100)
            maxJobs = 100;
        const result = await (0, outbox_worker_1.processOutboxJobs)(maxJobs);
        return res.status(200).json({
            success: true,
            data: result,
            requestId: req.requestId || res.locals.requestId
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'INTERNAL_ERROR' });
    }
});
exports.default = router;

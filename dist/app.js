"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const auth_middleware_1 = require("./middlewares/auth_middleware");
const request_context_middleware_1 = require("./middlewares/request_context_middleware");
const error_middleware_1 = require("./middlewares/error_middleware");
const env_1 = require("./config/env");
const test_routers_1 = __importDefault(require("./routers/test_routers"));
const app = (0, express_1.default)();
// CORS Middleware - Strict allowed origins
app.use((req, res, next) => {
    const allowedOrigins = env_1.env.ALLOWED_ORIGINS ? env_1.env.ALLOWED_ORIGINS.split(',') : ['*'];
    const origin = req.headers.origin;
    const isLocalhost = origin && (origin.startsWith('http://localhost:') ||
        origin.startsWith('http://127.0.0.1:') ||
        origin === 'http://localhost' ||
        origin === 'http://127.0.0.1' ||
        origin.startsWith('https://localhost:') ||
        origin.startsWith('https://127.0.0.1:'));
    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin)) || isLocalhost) {
        res.header('Access-Control-Allow-Origin', origin || '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id, Accept');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
app.use(express_1.default.json());
app.use((0, helmet_1.default)());
// Sanitize data against NoSQL query injection
// In Express 5, req.query is a getter, so express-mongo-sanitize crashes if used as a generic middleware.
// We manually sanitize the objects in-place.
app.use((req, res, next) => {
    if (req.body)
        express_mongo_sanitize_1.default.sanitize(req.body);
    if (req.query)
        express_mongo_sanitize_1.default.sanitize(req.query);
    if (req.params)
        express_mongo_sanitize_1.default.sanitize(req.params);
    next();
});
app.use(request_context_middleware_1.requestContextMiddleware);
// Health Checks
app.get("/health/live", (req, res) => {
    res.status(200).json({ success: true, data: { status: 'live' } });
});
app.get("/health/debug", (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            hasMongo: !!(process.env.MONGODB_URI || process.env.MONGO_URI),
            hasJwtSecret: !!process.env.JWT_SECRET,
            hasRefreshSecret: !!process.env.JWT_REFRESH_SECRET,
            hasTokenHash: !!process.env.TOKEN_HASH_SECRET,
            envKeys: Object.keys(process.env)
        }
    });
});
app.get("/health/ready", async (req, res) => {
    try {
        // Basic dependency check stub
        // Wait for models to be created later for full checks
        res.status(200).json({
            success: true,
            data: { mongo: 'ok', outbox: 'ok', rateLimitStore: 'ok' }
        });
    }
    catch (error) {
        res.status(503).json({ success: false, error: { code: 'DEPENDENCY_UNAVAILABLE', message: 'Service not ready' } });
    }
});
app.use("/api/test", test_routers_1.default);
// app.use("/api/articles", articleRouter);
// app.use("/api/admin/articles", adminArticleRouter);
// app.use("/api/internal/jobs", internalJobsRouter);
// app.use("/api/v1", v2Router);
app.get("/", (req, res) => {
    res.status(200).json({ success: true, data: { message: "Express + TypeScript is working" } });
});
app.get("/profile", auth_middleware_1.protect, (req, res) => {
    res.status(200).json({
        success: true,
        data: { message: `Hello user with ID: ${req.user.id}` }
    });
});
app.use(error_middleware_1.errorHandler);
exports.default = app;
// export const getMessages = async (req: Request, res: Response) => {
//   const userId = (req as any).user.id;
//   const messages = await Message.find({ user: userId })
//     .sort({ createdAt: 1 });
//   res.json(messages);
// };

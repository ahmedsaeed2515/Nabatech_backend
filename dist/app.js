"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = __importDefault(require("./docs/swagger"));
const helmet_1 = __importDefault(require("helmet"));
const express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
const auth_middleware_1 = require("./middlewares/auth_middleware");
const request_context_middleware_1 = require("./middlewares/request_context_middleware");
const error_middleware_1 = require("./middlewares/error_middleware");
const env_1 = require("./config/env");
const ai_assistant_router_1 = __importDefault(require("./routers/ai_assistant_router"));
const ai_models_router_1 = __importDefault(require("./routers/ai_models_router"));
const ai_settings_router_1 = __importDefault(require("./routers/ai_settings_router"));
const auth_router_1 = __importDefault(require("./routers/auth_router"));
const chat_routes_1 = __importDefault(require("./routers/chat_routes"));
const community_router_1 = __importDefault(require("./routers/community_router"));
const diagnosis_router_1 = __importDefault(require("./routers/diagnosis_router"));
const diary_router_1 = __importDefault(require("./routers/diary_router"));
const explore_router_1 = __importDefault(require("./routers/explore_router"));
const history_router_1 = __importDefault(require("./routers/history_router"));
const home_tools_router_1 = __importDefault(require("./routers/home_tools_router"));
const my_plants_router_1 = __importDefault(require("./routers/my_plants_router"));
const plant_library_router_1 = __importDefault(require("./routers/plant_library_router"));
const reminders_router_1 = __importDefault(require("./routers/reminders_router"));
const admin_reminders_router_1 = __importDefault(require("./routers/admin_reminders_router"));
const admin_diagnosis_router_1 = __importDefault(require("./routers/admin_diagnosis_router"));
// import testRouter from "./routers/test_routers";
const upload_routes_1 = __importDefault(require("./routers/upload_routes"));
const user_router_1 = __importDefault(require("./routers/user_router"));
const internal_jobs_router_1 = __importDefault(require("./routers/internal_jobs_router"));
const admin_plant_library_router_1 = __importDefault(require("./routers/admin_plant_library_router"));
const admin_specialist_offers_router_1 = __importDefault(require("./routers/admin_specialist_offers_router"));
const admin_community_router_1 = __importDefault(require("./routers/admin_community_router"));
const admin_home_tools_router_1 = __importDefault(require("./routers/admin_home_tools_router"));
const admin_my_plants_router_1 = __importDefault(require("./routers/admin_my_plants_router"));
const admin_user_plants_router_1 = __importDefault(require("./routers/admin_user_plants_router"));
const admin_gardens_router_1 = __importDefault(require("./routers/admin_gardens_router"));
const article_router_1 = __importDefault(require("./routers/article_router"));
const admin_article_router_1 = __importDefault(require("./routers/admin_article_router"));
const expert_router_1 = __importDefault(require("./routers/expert_router"));
const admin_tickets_router_1 = __importDefault(require("./routers/admin_tickets_router"));
const user_tickets_router_1 = __importDefault(require("./routers/user_tickets_router"));
const v2_1 = __importDefault(require("./routers/v2"));
const notification_router_1 = __importDefault(require("./routers/notification_router"));
const admin_ai_control_router_1 = __importDefault(require("./routers/admin_ai_control_router"));
const admin_ai_os_router_1 = __importDefault(require("./routers/admin_ai_os_router"));
const admin_home_experience_router_1 = __importDefault(require("./routers/admin_home_experience_router"));
const admin_chat_logs_router_1 = __importDefault(require("./routes/admin_chat_logs_router"));
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
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id, Accept, X-CSRF-Token, Idempotency-Key');
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
    // Only expose diagnostic info in non-production environments
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ success: false });
    }
    res.status(200).json({
        success: true,
        data: {
            hasMongo: !!(process.env.MONGODB_URI || process.env.MONGO_URI),
            hasJwtSecret: !!process.env.JWT_SECRET,
            hasRefreshSecret: !!process.env.JWT_REFRESH_SECRET,
            hasTokenHash: !!process.env.TOKEN_HASH_SECRET,
            nodeEnv: process.env.NODE_ENV
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
// app.use("/api/test", testRouter);
app.use("/api/auth", auth_router_1.default);
app.use("/api/upload", upload_routes_1.default);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.default));
app.use("/api/chat", chat_routes_1.default);
app.use("/api/users", user_router_1.default);
app.use("/api/my-plants", my_plants_router_1.default);
app.use("/api/reminders", reminders_router_1.default);
app.use("/api/diary", diary_router_1.default);
app.use("/api/community", community_router_1.default);
app.use("/api/explore", explore_router_1.default);
app.use("/api/diagnosis", diagnosis_router_1.default);
app.use("/api/history", history_router_1.default);
app.use("/api/plant-library", plant_library_router_1.default);
app.use("/api/admin/plant-library", admin_plant_library_router_1.default);
app.use("/api/home-tools", home_tools_router_1.default);
app.use("/api/ai-models", ai_models_router_1.default);
app.use("/api/admin/ai-settings", ai_settings_router_1.default);
app.use("/api/admin/reminders", admin_reminders_router_1.default);
app.use("/api/admin/diagnoses", admin_diagnosis_router_1.default);
app.use("/api/admin/specialist-offers", admin_specialist_offers_router_1.default);
app.use("/api/admin/community", admin_community_router_1.default);
app.use("/api/admin/home-tools", admin_home_tools_router_1.default);
app.use("/api/admin/my-plants", admin_my_plants_router_1.default);
app.use("/api/admin/user-plants", admin_user_plants_router_1.default);
app.use("/api/admin/gardens", admin_gardens_router_1.default);
app.use("/api/ai", ai_assistant_router_1.default);
app.use("/api/articles", article_router_1.default);
app.use("/api/admin/articles", admin_article_router_1.default);
app.use("/api/experts", expert_router_1.default);
app.use("/api/internal/jobs", internal_jobs_router_1.default);
app.use("/api/admin/tickets", admin_tickets_router_1.default);
app.use("/api/tickets", user_tickets_router_1.default);
app.use("/api/v1", v2_1.default);
app.use("/api/notifications", notification_router_1.default);
app.use("/api/admin/ai", admin_ai_control_router_1.default);
app.use("/api/admin/ai-os", admin_ai_os_router_1.default);
app.use("/api/admin/home", admin_home_experience_router_1.default);
app.use("/api/admin/chat-logs", admin_chat_logs_router_1.default);
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

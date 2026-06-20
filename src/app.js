"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = __importDefault(require("express"));
var swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
var swagger_1 = __importDefault(require("./docs/swagger"));
var helmet_1 = __importDefault(require("helmet"));
var express_mongo_sanitize_1 = __importDefault(require("express-mongo-sanitize"));
var auth_middleware_1 = require("./middlewares/auth_middleware");
var request_context_middleware_1 = require("./middlewares/request_context_middleware");
var error_middleware_1 = require("./middlewares/error_middleware");
var env_1 = require("./config/env");
var ai_assistant_router_1 = __importDefault(require("./routers/ai_assistant_router"));
var ai_models_router_1 = __importDefault(require("./routers/ai_models_router"));
var ai_settings_router_1 = __importDefault(require("./routers/ai_settings_router"));
var auth_router_1 = __importDefault(require("./routers/auth_router"));
var chat_routes_1 = __importDefault(require("./routers/chat_routes"));
var community_router_1 = __importDefault(require("./routers/community_router"));
var diagnosis_router_1 = __importDefault(require("./routers/diagnosis_router"));
var diary_router_1 = __importDefault(require("./routers/diary_router"));
var explore_router_1 = __importDefault(require("./routers/explore_router"));
var history_router_1 = __importDefault(require("./routers/history_router"));
var home_tools_router_1 = __importDefault(require("./routers/home_tools_router"));
var my_plants_router_1 = __importDefault(require("./routers/my_plants_router"));
var plant_library_router_1 = __importDefault(require("./routers/plant_library_router"));
var reminders_router_1 = __importDefault(require("./routers/reminders_router"));
var admin_reminders_router_1 = __importDefault(require("./routers/admin_reminders_router"));
var admin_diagnosis_router_1 = __importDefault(require("./routers/admin_diagnosis_router"));
// import testRouter from "./routers/test_routers";
var upload_routes_1 = __importDefault(require("./routers/upload_routes"));
var user_router_1 = __importDefault(require("./routers/user_router"));
var internal_jobs_router_1 = __importDefault(require("./routers/internal_jobs_router"));
var admin_plant_library_router_1 = __importDefault(require("./routers/admin_plant_library_router"));
var admin_specialist_offers_router_1 = __importDefault(require("./routers/admin_specialist_offers_router"));
var admin_community_router_1 = __importDefault(require("./routers/admin_community_router"));
var admin_home_tools_router_1 = __importDefault(require("./routers/admin_home_tools_router"));
var admin_my_plants_router_1 = __importDefault(require("./routers/admin_my_plants_router"));
var admin_user_plants_router_1 = __importDefault(require("./routers/admin_user_plants_router"));
var admin_gardens_router_1 = __importDefault(require("./routers/admin_gardens_router"));
var article_router_1 = __importDefault(require("./routers/article_router"));
var admin_article_router_1 = __importDefault(require("./routers/admin_article_router"));
var expert_router_1 = __importDefault(require("./routers/expert_router"));
var admin_tickets_router_1 = __importDefault(require("./routers/admin_tickets_router"));
var user_tickets_router_1 = __importDefault(require("./routers/user_tickets_router"));
var v2_1 = __importDefault(require("./routers/v2"));
var notification_router_1 = __importDefault(require("./routers/notification_router"));
var admin_ai_control_router_1 = __importDefault(require("./routers/admin_ai_control_router"));
var admin_ai_os_router_1 = __importDefault(require("./routers/admin_ai_os_router"));
var admin_home_experience_router_1 = __importDefault(require("./routers/admin_home_experience_router"));
var admin_chat_logs_router_1 = __importDefault(require("./routes/admin_chat_logs_router"));
var app = (0, express_1.default)();
// CORS Middleware - Strict allowed origins
app.use(function (req, res, next) {
    var allowedOrigins = env_1.env.ALLOWED_ORIGINS ? env_1.env.ALLOWED_ORIGINS.split(',') : ['*'];
    var origin = req.headers.origin;
    var isLocalhost = origin && (origin.startsWith('http://localhost:') ||
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
app.use(function (req, res, next) {
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
app.get("/health/live", function (req, res) {
    res.status(200).json({ success: true, data: { status: 'live' } });
});
app.get("/health/debug", function (req, res) {
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
app.get("/health/ready", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
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
        return [2 /*return*/];
    });
}); });
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
app.get("/", function (req, res) {
    res.status(200).json({ success: true, data: { message: "Express + TypeScript is working" } });
});
app.get("/profile", auth_middleware_1.protect, function (req, res) {
    res.status(200).json({
        success: true,
        data: { message: "Hello user with ID: ".concat(req.user.id) }
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

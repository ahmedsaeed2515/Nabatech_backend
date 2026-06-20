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
var supertest_1 = __importDefault(require("supertest"));
var mongoose_1 = __importDefault(require("mongoose"));
var app_1 = __importDefault(require("./src/app"));
var user_model_1 = __importDefault(require("./src/models/user_model"));
var generate_token_1 = require("./src/utils/generate_token");
var mongodb_memory_server_1 = require("mongodb-memory-server");
var mongoServer;
var token;
var userId;
var plantId;
var diagnosisId;
var notificationId;
var outbreakId;
function runTests() {
    return __awaiter(this, void 0, void 0, function () {
        var user, addPlantReq, res, notif, diag, feedbackReq, spot;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Starting Real API Tests...\n");
                    return [4 /*yield*/, mongodb_memory_server_1.MongoMemoryServer.create()];
                case 1:
                    mongoServer = _a.sent();
                    return [4 /*yield*/, mongoose_1.default.connect(mongoServer.getUri())];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, user_model_1.default.create({
                            name: "Test User",
                            email: "test@nabatech.com",
                            password: "Password123!",
                        })];
                case 3:
                    user = _a.sent();
                    userId = user._id.toString();
                    token = (0, generate_token_1.generateToken)(userId);
                    // 1. My Plants API
                    console.log("=== 1. My Plants API ===");
                    addPlantReq = {
                        name: "Ficus Lyrata",
                        species: "Ficus",
                        location: "indoor",
                        waterFrequencyDays: 5,
                        lastWatered: new Date().toISOString(),
                        healthStatus: "Healthy",
                        clientOperationId: "123e4567-e89b-12d3-a456-426614174000"
                    };
                    console.log("[POST] /api/my-plants");
                    console.log("Input:", JSON.stringify(addPlantReq, null, 2));
                    return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                            .post("/api/my-plants")
                            .set("Authorization", "Bearer ".concat(token))
                            .send(addPlantReq)];
                case 4:
                    res = _a.sent();
                    console.log("Status:", res.status);
                    console.log("Output:", JSON.stringify(res.body, null, 2));
                    plantId = res.body.data.plant.id;
                    console.log("\n[GET] /api/my-plants");
                    return [4 /*yield*/, (0, supertest_1.default)(app_1.default).get("/api/my-plants").set("Authorization", "Bearer ".concat(token))];
                case 5:
                    res = _a.sent();
                    console.log("Status:", res.status);
                    console.log("Output:", JSON.stringify(res.body, null, 2));
                    // 2. Notifications API
                    console.log("\n=== 2. Notifications API ===");
                    import NotificationModel from "./src/models/notification_model";
                    return [4 /*yield*/, notification_model_1.default.create({
                            user: userId,
                            title: "Old Title",
                            body: "Old Body",
                            titleAr: "إشعار تجريبي",
                            titleEn: "Test Notification",
                            bodyAr: "هذا إشعار لتجربة الـ API",
                            bodyEn: "This is an API test notification",
                            type: "WATERING_REMINDER",
                            read: false
                        })];
                case 6:
                    notif = _a.sent();
                    notificationId = notif._id.toString();
                    console.log("[GET] /api/notifications");
                    return [4 /*yield*/, (0, supertest_1.default)(app_1.default).get("/api/notifications").set("Authorization", "Bearer ".concat(token))];
                case 7:
                    res = _a.sent();
                    console.log("Status:", res.status);
                    console.log("Output:", JSON.stringify(res.body, null, 2));
                    console.log("\n[PUT] /api/notifications/".concat(notificationId, "/read"));
                    return [4 /*yield*/, (0, supertest_1.default)(app_1.default).put("/api/notifications/".concat(notificationId, "/read")).set("Authorization", "Bearer ".concat(token))];
                case 8:
                    res = _a.sent();
                    console.log("Status:", res.status);
                    console.log("Output:", JSON.stringify(res.body, null, 2));
                    // 3. Diagnosis History API
                    console.log("\n=== 3. Diagnosis History API ===");
                    import DiagnosisHistory from "./src/models/diagnosis_history_model";
                    return [4 /*yield*/, diagnosis_history_model_1.default.create({
                            user: userId,
                            imageUrl: "https://example.com/plant.jpg",
                            diseaseNameAr: "مرض تجريبي",
                            diseaseNameEn: "Test Disease",
                            confidence: 0.95,
                            severity: "high",
                            isOffline: false,
                            version: 1
                        })];
                case 9:
                    diag = _a.sent();
                    diagnosisId = diag._id.toString();
                    console.log("[GET] /api/history");
                    return [4 /*yield*/, (0, supertest_1.default)(app_1.default).get("/api/history").set("Authorization", "Bearer ".concat(token))];
                case 10:
                    res = _a.sent();
                    console.log("Status:", res.status);
                    console.log("Output:", JSON.stringify(res.body, null, 2));
                    feedbackReq = { status: "confirmed", version: 1, clientOperationId: "abc-123" };
                    console.log("\n[PUT] /api/history/".concat(diagnosisId, "/feedback"));
                    console.log("Input:", JSON.stringify(feedbackReq, null, 2));
                    return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                            .put("/api/history/".concat(diagnosisId, "/feedback"))
                            .set("Authorization", "Bearer ".concat(token))
                            .send(feedbackReq)];
                case 11:
                    res = _a.sent();
                    console.log("Status:", res.status);
                    console.log("Output:", JSON.stringify(res.body, null, 2));
                    // 4. Disease Map API
                    console.log("\n=== 4. Disease Map API ===");
                    import OutbreakSpot from "./src/models/outbreak_spot_model";
                    return [4 /*yield*/, outbreak_spot_model_1.default.create({
                            region: "Riyadh",
                            disease: "Leaf Spot",
                            severity: "high",
                            cases: 42,
                            trendPercent: 12,
                            mapX: 0.5,
                            mapY: 0.5,
                            colorHex: "#FF0000"
                        })];
                case 12:
                    spot = _a.sent();
                    console.log("[GET] /api/explore/outbreaks");
                    return [4 /*yield*/, (0, supertest_1.default)(app_1.default).get("/api/explore/outbreaks").set("Authorization", "Bearer ".concat(token))];
                case 13:
                    res = _a.sent();
                    console.log("Status:", res.status);
                    console.log("Output:", JSON.stringify(res.body, null, 2));
                    return [4 /*yield*/, mongoose_1.default.disconnect()];
                case 14:
                    _a.sent();
                    return [4 /*yield*/, mongoServer.stop()];
                case 15:
                    _a.sent();
                    console.log("\nDone!");
                    return [2 /*return*/];
            }
        });
    });
}
runTests().catch(console.error);

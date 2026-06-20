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
exports.uploadAvatar = exports.uploadImage = void 0;
var cloudinary_1 = __importDefault(require("../config/cloudinary"));
var user_model_1 = __importDefault(require("../models/user_model"));
var uploadImage = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var uploadResult, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (!req.file) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "No file uploaded" })];
                }
                console.log("Received file:", req.file);
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        var stream = cloudinary_1.default.uploader.upload_stream({ folder: "users" }, function (error, result) {
                            if (error)
                                return reject(error);
                            resolve({ secure_url: result.secure_url });
                        });
                        stream.end(req.file.buffer);
                    })];
            case 1:
                uploadResult = _a.sent();
                res.status(200).json({ success: true, data: { url: uploadResult.secure_url } });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500).json({ success: false, message: "Image upload failed", error: error_1 });
                console.error("Upload error:", error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.uploadImage = uploadImage;
var uploadAvatar = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, streamUpload, imageUrl, user, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                if (!req.file) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "No file uploaded" })];
                }
                userId = req.user.id;
                streamUpload = function (fileBuffer) {
                    return new Promise(function (resolve, reject) {
                        var stream = cloudinary_1.default.uploader.upload_stream({ folder: "users" }, function (error, result) {
                            if (error)
                                return reject(error);
                            resolve(result.secure_url);
                        });
                        stream.end(fileBuffer);
                    });
                };
                return [4 /*yield*/, streamUpload(req.file.buffer)];
            case 1:
                imageUrl = _a.sent();
                return [4 /*yield*/, user_model_1.default.findByIdAndUpdate(userId, { avatarUrl: imageUrl }, { new: true }).select("-password")];
            case 2:
                user = _a.sent();
                res.json({
                    success: true,
                    message: "Avatar uploaded",
                    data: { user: user }
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                console.error(error_2);
                res.status(500).json({ success: false, message: "Upload failed", error: error_2 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.uploadAvatar = uploadAvatar;

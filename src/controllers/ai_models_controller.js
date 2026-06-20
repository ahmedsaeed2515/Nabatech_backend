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
exports.getAiModelProxyUrl = exports.deleteAiModelManifestItem = exports.updateAiModelManifestItem = exports.createAiModelManifestItem = exports.getAiModelsManifest = void 0;
var ai_model_manifest_item_model_1 = __importDefault(require("../models/ai_model_manifest_item_model"));
var toManifestPayload = function (item) { return ({
    id: item.id,
    name: item.name,
    architecture: item.architecture,
    classes: item.classes,
    sizeMb: item.sizeMb,
    inputSize: item.inputSize !== undefined ? item.inputSize : 224,
    normalization: item.normalization || "zero_to_one",
    quantization: item.quantization,
    modelUrl: item.modelUrl,
    labelsUrl: item.labelsUrl,
    sha256: item.sha256,
    recommended: item.recommended,
    manifestVersion: item.manifestVersion || "1.0",
    platform: item.platform || "all",
    minAppVersion: item.minAppVersion || "0.0.0",
    active: item.active !== undefined ? item.active : true,
    rollbackOf: item.rollbackOf,
    publishedAt: item.publishedAt,
}); };
var isValidSecureUrl = function (urlString) {
    try {
        var url = new URL(urlString);
        return url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1";
    }
    catch (_a) {
        return false;
    }
};
var isValidSha256 = function (sha256) {
    return /^[a-fA-F0-9]{64}$/.test(sha256);
};
// @desc    Get AI models manifest
// @route   GET /api/ai-models/manifest
// @access  Public
var getAiModelsManifest = function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var items, mapped, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ai_model_manifest_item_model_1.default.find({ active: true }).sort({ recommended: -1, name: 1 })];
            case 1:
                items = _a.sent();
                mapped = items.map(function (item) { return toManifestPayload(item); });
                return [2 /*return*/, res
                        .status(200)
                        .json({
                        success: true,
                        manifestVersion: "1.0",
                        data: mapped,
                        models: mapped // For Flutter dynamic downloader compatibility
                    })];
            case 2:
                error_1 = _a.sent();
                return [2 /*return*/, res
                        .status(500)
                        .json({ success: false, message: "Failed to fetch AI model manifest" })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAiModelsManifest = getAiModelsManifest;
// @desc    Create AI model manifest item
// @route   POST /api/ai-models/manifest
// @access  Private/Admin
var createAiModelManifestItem = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, name_1, architecture, classes, sizeMb, inputSize, normalization, quantization, modelUrl, labelsUrl, sha256, recommended, manifestVersion, platform, minAppVersion, active, rollbackOf, created, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, name_1 = _a.name, architecture = _a.architecture, classes = _a.classes, sizeMb = _a.sizeMb, inputSize = _a.inputSize, normalization = _a.normalization, quantization = _a.quantization, modelUrl = _a.modelUrl, labelsUrl = _a.labelsUrl, sha256 = _a.sha256, recommended = _a.recommended, manifestVersion = _a.manifestVersion, platform = _a.platform, minAppVersion = _a.minAppVersion, active = _a.active, rollbackOf = _a.rollbackOf;
                if (!id ||
                    !name_1 ||
                    !architecture ||
                    classes === undefined ||
                    sizeMb === undefined ||
                    !quantization ||
                    !modelUrl ||
                    !labelsUrl ||
                    !sha256) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ success: false, message: "Missing required manifest fields" })];
                }
                if (!isValidSha256(sha256)) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "sha256 must be a valid 64-character hex string" })];
                }
                if (!isValidSecureUrl(modelUrl) || !isValidSecureUrl(labelsUrl)) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "modelUrl and labelsUrl must be secure HTTPS URLs (or localhost)" })];
                }
                return [4 /*yield*/, ai_model_manifest_item_model_1.default.create({
                        id: String(id).trim(),
                        name: String(name_1).trim(),
                        architecture: String(architecture).trim(),
                        classes: Number(classes),
                        sizeMb: Number(sizeMb),
                        inputSize: inputSize !== undefined ? Number(inputSize) : 224,
                        normalization: normalization ? String(normalization).trim() : "zero_to_one",
                        quantization: String(quantization).trim(),
                        modelUrl: String(modelUrl).trim(),
                        labelsUrl: String(labelsUrl).trim(),
                        sha256: String(sha256).trim(),
                        recommended: Boolean(recommended),
                        manifestVersion: manifestVersion ? String(manifestVersion).trim() : "1.0",
                        platform: platform ? String(platform).trim() : "all",
                        minAppVersion: minAppVersion ? String(minAppVersion).trim() : "0.0.0",
                        active: active !== undefined ? Boolean(active) : true,
                        rollbackOf: rollbackOf ? String(rollbackOf).trim() : undefined,
                    })];
            case 1:
                created = _b.sent();
                return [2 /*return*/, res.status(201).json({ success: true, data: toManifestPayload(created) })];
            case 2:
                error_2 = _b.sent();
                if ((error_2 === null || error_2 === void 0 ? void 0 : error_2.code) === 11000) {
                    return [2 /*return*/, res.status(409).json({ success: false, message: "Manifest item already exists or recommended uniqueness violated" })];
                }
                return [2 /*return*/, res
                        .status(500)
                        .json({ success: false, message: "Failed to create AI model manifest item" })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createAiModelManifestItem = createAiModelManifestItem;
// @desc    Update AI model manifest item
// @route   PUT /api/ai-models/manifest/:id
// @access  Private/Admin
var updateAiModelManifestItem = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var item, fields, _i, fields_1, field, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, ai_model_manifest_item_model_1.default.findOne({ id: req.params.id })];
            case 1:
                item = _a.sent();
                if (!item) {
                    return [2 /*return*/, res
                            .status(404)
                            .json({ success: false, message: "AI model manifest item not found" })];
                }
                fields = [
                    "name",
                    "architecture",
                    "classes",
                    "sizeMb",
                    "inputSize",
                    "normalization",
                    "quantization",
                    "modelUrl",
                    "labelsUrl",
                    "sha256",
                    "recommended",
                    "manifestVersion",
                    "platform",
                    "minAppVersion",
                    "active",
                    "rollbackOf"
                ];
                for (_i = 0, fields_1 = fields; _i < fields_1.length; _i++) {
                    field = fields_1[_i];
                    if (req.body[field] !== undefined) {
                        if (field === "sha256" && !isValidSha256(req.body[field])) {
                            return [2 /*return*/, res.status(400).json({ success: false, message: "sha256 must be a valid 64-character hex string" })];
                        }
                        if ((field === "modelUrl" || field === "labelsUrl") && !isValidSecureUrl(req.body[field])) {
                            return [2 /*return*/, res.status(400).json({ success: false, message: "Urls must be secure HTTPS URLs (or localhost)" })];
                        }
                        item[field] = req.body[field];
                    }
                }
                return [4 /*yield*/, item.save()];
            case 2:
                _a.sent();
                return [2 /*return*/, res.status(200).json({ success: true, data: toManifestPayload(item) })];
            case 3:
                error_3 = _a.sent();
                if ((error_3 === null || error_3 === void 0 ? void 0 : error_3.code) === 11000) {
                    return [2 /*return*/, res.status(409).json({ success: false, message: "Update violated recommended uniqueness" })];
                }
                return [2 /*return*/, res
                        .status(500)
                        .json({ success: false, message: "Failed to update AI model manifest item" })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateAiModelManifestItem = updateAiModelManifestItem;
// @desc    Delete AI model manifest item
// @route   DELETE /api/ai-models/manifest/:id
// @access  Private/Admin
var deleteAiModelManifestItem = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var deleted, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ai_model_manifest_item_model_1.default.findOneAndDelete({ id: req.params.id })];
            case 1:
                deleted = _a.sent();
                if (!deleted) {
                    return [2 /*return*/, res
                            .status(404)
                            .json({ success: false, message: "AI model manifest item not found" })];
                }
                return [2 /*return*/, res.status(200).json({ success: true, data: { id: deleted.id } })];
            case 2:
                error_4 = _a.sent();
                return [2 /*return*/, res
                        .status(500)
                        .json({ success: false, message: "Failed to delete AI model manifest item" })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteAiModelManifestItem = deleteAiModelManifestItem;
// @desc    Get proxy URL for manifest item
// @route   GET /api/ai-models/manifest/:id/proxy-url
// @access  Private
var getAiModelProxyUrl = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var item, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ai_model_manifest_item_model_1.default.findOne({ id: req.params.id })];
            case 1:
                item = _a.sent();
                if (!item) {
                    return [2 /*return*/, res
                            .status(404)
                            .json({ success: false, message: "AI model manifest item not found" })];
                }
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: {
                            modelUrl: item.modelUrl,
                            labelsUrl: item.labelsUrl,
                            sha256: item.sha256,
                            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Dummy expiresAt representing a presigned url pattern
                        },
                    })];
            case 2:
                error_5 = _a.sent();
                return [2 /*return*/, res
                        .status(500)
                        .json({ success: false, message: "Failed to get proxy URL" })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAiModelProxyUrl = getAiModelProxyUrl;

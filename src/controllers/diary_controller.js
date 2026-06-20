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
exports.deleteDiaryEntry = exports.updateDiaryEntry = exports.createDiaryEntry = exports.getDiaryEntries = void 0;
var diary_entry_model_1 = __importDefault(require("../models/diary_entry_model"));
// @desc    Get all diary entries of the user
// @route   GET /api/diary
// @access  Private
var getDiaryEntries = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, plantId, query, entries, payload, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.user.id;
                plantId = req.query.plantId;
                query = { user: userId };
                if (plantId)
                    query.plantId = plantId;
                return [4 /*yield*/, diary_entry_model_1.default.find(query).sort({ date: -1 })];
            case 1:
                entries = _a.sent();
                payload = entries.map(function (e) { return ({
                    id: e._id,
                    plantId: e.plantId,
                    title: e.title,
                    notes: e.notes,
                    date: e.date,
                    moodCode: e.moodCode,
                    healthScore: e.healthScore
                }); });
                res.status(200).json({
                    success: true,
                    entries: payload
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                res.status(500).json({ message: "Failed to fetch diary entries", error: error_1 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getDiaryEntries = getDiaryEntries;
// @desc    Create a diary entry
// @route   POST /api/diary
// @access  Private
var createDiaryEntry = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, plantId, title, notes, date, moodCode, healthScore, entry, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = req.user.id;
                _a = req.body, plantId = _a.plantId, title = _a.title, notes = _a.notes, date = _a.date, moodCode = _a.moodCode, healthScore = _a.healthScore;
                if (!plantId || !title || !notes) {
                    return [2 /*return*/, res.status(400).json({ message: "Plant ID, title and notes are required" })];
                }
                return [4 /*yield*/, diary_entry_model_1.default.create({
                        user: userId,
                        plantId: plantId,
                        title: title.trim(),
                        notes: notes.trim(),
                        date: date ? new Date(date) : undefined,
                        moodCode: moodCode !== undefined ? Number(moodCode) : undefined,
                        healthScore: healthScore !== undefined ? Number(healthScore) : undefined,
                    })];
            case 1:
                entry = _b.sent();
                res.status(201).json({
                    success: true,
                    entry: {
                        id: entry._id,
                        plantId: entry.plantId,
                        title: entry.title,
                        notes: entry.notes,
                        date: entry.date,
                        moodCode: entry.moodCode,
                        healthScore: entry.healthScore,
                        createdAt: entry.createdAt,
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                res.status(500).json({ message: "Failed to create diary entry", error: error_2 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createDiaryEntry = createDiaryEntry;
// @desc    Update a diary entry
// @route   PUT /api/diary/:id
// @access  Private
var updateDiaryEntry = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, plantId, title, notes, date, moodCode, healthScore, entry, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                userId = req.user.id;
                _a = req.body, plantId = _a.plantId, title = _a.title, notes = _a.notes, date = _a.date, moodCode = _a.moodCode, healthScore = _a.healthScore;
                return [4 /*yield*/, diary_entry_model_1.default.findOne({ _id: req.params.id, user: userId })];
            case 1:
                entry = _b.sent();
                if (!entry) {
                    return [2 /*return*/, res.status(404).json({ message: "Diary entry not found" })];
                }
                if (plantId !== undefined)
                    entry.plantId = plantId;
                if (title !== undefined)
                    entry.title = title.trim();
                if (notes !== undefined)
                    entry.notes = notes.trim();
                if (date !== undefined)
                    entry.date = new Date(date);
                if (moodCode !== undefined)
                    entry.moodCode = Number(moodCode);
                if (healthScore !== undefined)
                    entry.healthScore = Number(healthScore);
                return [4 /*yield*/, entry.save()];
            case 2:
                _b.sent();
                res.status(200).json({
                    success: true,
                    entry: {
                        id: entry._id,
                        plantId: entry.plantId,
                        title: entry.title,
                        notes: entry.notes,
                        date: entry.date,
                        moodCode: entry.moodCode,
                        healthScore: entry.healthScore,
                        createdAt: entry.createdAt,
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _b.sent();
                res.status(500).json({ message: "Failed to update diary entry", error: error_3 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateDiaryEntry = updateDiaryEntry;
// @desc    Delete a diary entry
// @route   DELETE /api/diary/:id
// @access  Private
var deleteDiaryEntry = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, entry, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.user.id;
                return [4 /*yield*/, diary_entry_model_1.default.findOneAndDelete({ _id: req.params.id, user: userId })];
            case 1:
                entry = _a.sent();
                if (!entry) {
                    return [2 /*return*/, res.status(404).json({ message: "Diary entry not found or unauthorized" })];
                }
                res.status(200).json({
                    success: true,
                    message: "Diary entry deleted successfully"
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                res.status(500).json({ message: "Failed to delete diary entry", error: error_4 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteDiaryEntry = deleteDiaryEntry;

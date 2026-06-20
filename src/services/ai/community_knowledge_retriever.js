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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveCommunityContext = void 0;
var diagnosis_history_model_1 = __importDefault(require("../../models/diagnosis_history_model"));
var community_post_model_1 = __importDefault(require("../../models/community_post_model"));
var comment_model_1 = __importDefault(require("../../models/comment_model"));
var specialist_offer_model_1 = __importDefault(require("../../models/specialist_offer_model"));
var user_model_1 = require("../../models/user_model");
/**
 * Clean and extract keywords from the user question for regex matching.
 * Filters out common English and Arabic stopwords to prevent broad matching.
 */
var extractKeywords = function (text) {
    var words = text.toLowerCase()
        .replace(/[^\w\s\u0600-\u06FF]/g, "") // Support Arabic and English letters
        .split(/\s+/)
        .filter(function (w) {
        var isEnglishStop = ["the", "and", "for", "with", "this", "that", "your", "have", "what", "how", "leaves", "leaf", "plant", "plants", "disease", "help", "about", "care", "my"].includes(w);
        var isArabicStop = ["سقي", "أوراق", "نبتة", "مرض", "عندي", "في", "من", "على", "ما", "كيف", "أصفر", "أوراق", "علاج", "الريحان", "الطماطم"].includes(w);
        return w.length > 2 && !isEnglishStop && !isArabicStop;
    });
    return __spreadArray([], new Set(words), true);
};
/**
 * Retrieves anonymized and ranked community knowledge context.
 * Follows the AI Trust Hierarchy:
 * 1. Verified Expert Accepted Solutions (Highest Trust)
 * 2. Expert Comments (Medium Trust)
 * 3. Community Comments & Posts (Lower/Lowest Trust)
 */
var retrieveCommunityContext = function (diseaseNameEn, question) { return __awaiter(void 0, void 0, void 0, function () {
    var started, meta, matchedDiseaseName, _a, _b, fourteenDaysAgo, _c, matchingHistories, postQueryConditions, cleanDiseaseName, plantName, keywords, regexes, posts, postIds, acceptedOffers, comments, expertComments, normalComments, contextLines_1, hasData, validPosts, error_1;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                started = Date.now();
                meta = {
                    similarCasesCount: 0,
                    confirmedCount: 0,
                    recentOutbreaksCount: 0,
                    acceptedOffersCount: 0,
                    expertCommentsCount: 0,
                };
                _d.label = 1;
            case 1:
                _d.trys.push([1, 13, , 14]);
                matchedDiseaseName = diseaseNameEn === null || diseaseNameEn === void 0 ? void 0 : diseaseNameEn.trim();
                if (!matchedDiseaseName) return [3 /*break*/, 5];
                _a = meta;
                return [4 /*yield*/, diagnosis_history_model_1.default.countDocuments({
                        diseaseNameEn: { $regex: new RegExp("^".concat(matchedDiseaseName, "$"), "i") },
                        feedbackStatus: { $ne: "rejected" }
                    })];
            case 2:
                _a.similarCasesCount = _d.sent();
                _b = meta;
                return [4 /*yield*/, diagnosis_history_model_1.default.countDocuments({
                        diseaseNameEn: { $regex: new RegExp("^".concat(matchedDiseaseName, "$"), "i") },
                        feedbackStatus: "confirmed"
                    })];
            case 3:
                _b.confirmedCount = _d.sent();
                fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
                _c = meta;
                return [4 /*yield*/, diagnosis_history_model_1.default.countDocuments({
                        diseaseNameEn: { $regex: new RegExp("^".concat(matchedDiseaseName, "$"), "i") },
                        diagnosedAt: { $gte: fourteenDaysAgo }
                    })];
            case 4:
                _c.recentOutbreaksCount = _d.sent();
                _d.label = 5;
            case 5:
                matchingHistories = [];
                if (!matchedDiseaseName) return [3 /*break*/, 7];
                return [4 /*yield*/, diagnosis_history_model_1.default.find({
                        diseaseNameEn: { $regex: new RegExp("^".concat(matchedDiseaseName, "$"), "i") }
                    }).select("_id").lean()];
            case 6:
                matchingHistories = _d.sent();
                _d.label = 7;
            case 7:
                postQueryConditions = [];
                if (matchingHistories.length > 0) {
                    postQueryConditions.push({ linkedDiagnosis: { $in: matchingHistories.map(function (h) { return h._id; }) } });
                }
                cleanDiseaseName = matchedDiseaseName
                    ? matchedDiseaseName.replace(/___/g, " ").replace(/_/g, " ").trim()
                    : "";
                if (cleanDiseaseName) {
                    postQueryConditions.push({ title: { $regex: new RegExp(cleanDiseaseName, "i") } });
                    postQueryConditions.push({ content: { $regex: new RegExp(cleanDiseaseName, "i") } });
                }
                plantName = "";
                if (matchedDiseaseName) {
                    if (matchedDiseaseName.includes("___")) {
                        plantName = matchedDiseaseName.split("___")[0].replace(/_/g, " ").trim();
                    }
                    else {
                        plantName = matchedDiseaseName.split("_")[0].trim();
                    }
                    if (plantName) {
                        postQueryConditions.push({ title: { $regex: new RegExp("\\b".concat(plantName, "\\b"), "i") } });
                    }
                }
                // For text-only chats, extract keywords from question
                if (!matchedDiseaseName && question && question.trim()) {
                    keywords = extractKeywords(question);
                    if (keywords.length > 0) {
                        regexes = keywords.map(function (kw) { return new RegExp(kw, "i"); });
                        postQueryConditions.push({ title: { $in: regexes } });
                        postQueryConditions.push({ content: { $in: regexes } });
                    }
                }
                posts = [];
                if (!(postQueryConditions.length > 0)) return [3 /*break*/, 9];
                return [4 /*yield*/, community_post_model_1.default.find({
                        $or: postQueryConditions,
                        status: "visible"
                    })
                        .limit(6)
                        .lean()];
            case 8:
                posts = _d.sent();
                _d.label = 9;
            case 9:
                postIds = posts.map(function (p) { return p._id; });
                acceptedOffers = [];
                comments = [];
                if (!(postIds.length > 0)) return [3 /*break*/, 12];
                return [4 /*yield*/, specialist_offer_model_1.default.find({
                        post: { $in: postIds },
                        status: "accepted"
                    })
                        .limit(3)
                        .lean()];
            case 10:
                // 3. Retrieve Accepted Specialist Offers (Highest Trust)
                acceptedOffers = _d.sent();
                meta.acceptedOffersCount = acceptedOffers.length;
                return [4 /*yield*/, comment_model_1.default.find({
                        post: { $in: postIds },
                        status: "visible"
                    })
                        .populate({
                        path: "author",
                        select: "role"
                    })
                        .lean()];
            case 11:
                // 4. Retrieve Comments (Expert comments are Medium Trust; Users are Low Trust)
                comments = _d.sent();
                _d.label = 12;
            case 12:
                expertComments = comments.filter(function (c) { return c.author && c.author.role === user_model_1.UserRole.EXPERT; });
                meta.expertCommentsCount = expertComments.length;
                normalComments = comments.filter(function (c) { return !c.author || c.author.role !== user_model_1.UserRole.EXPERT; }).slice(0, 3);
                contextLines_1 = [];
                // Header
                contextLines_1.push("=== NABATECH COMMUNITY INTELLIGENCE CONTEXT ===");
                if (matchedDiseaseName) {
                    contextLines_1.push("Disease Target: ".concat(matchedDiseaseName));
                    contextLines_1.push("Community Statistics:");
                    contextLines_1.push("- Similar cases in community: ".concat(meta.similarCasesCount));
                    contextLines_1.push("- Confirmed cases of this disease: ".concat(meta.confirmedCount));
                    contextLines_1.push("- Recent cases diagnosed (last 14 days): ".concat(meta.recentOutbreaksCount));
                    contextLines_1.push("");
                }
                hasData = false;
                // Trust Rank 1: Accepted Specialist Solutions
                if (acceptedOffers.length > 0) {
                    hasData = true;
                    contextLines_1.push("[TRUST RANK 1: VERIFIED EXPERT ACCEPTED CURE PLANS]");
                    acceptedOffers.forEach(function (offer) {
                        contextLines_1.push("- Specialist ".concat(offer.specialistName, " provided a custom curing plan that was ACCEPTED by the farmer:"));
                        contextLines_1.push("  Cure Plan Details: \"".concat(offer.plan, "\""));
                    });
                    contextLines_1.push("");
                }
                // Trust Rank 2: Expert Comments
                if (expertComments.length > 0) {
                    hasData = true;
                    contextLines_1.push("[TRUST RANK 2: VERIFIED EXPERT RECOMMENDATIONS]");
                    expertComments.forEach(function (comment) {
                        contextLines_1.push("- Expert ".concat(comment.authorName, " recommended:"));
                        contextLines_1.push("  \"".concat(comment.text, "\""));
                    });
                    contextLines_1.push("");
                }
                // Trust Rank 3: Normal User Comments (Anonymized to protect privacy)
                if (normalComments.length > 0) {
                    hasData = true;
                    contextLines_1.push("[TRUST RANK 3: ANONYMOUS PEER COMMENTS]");
                    normalComments.forEach(function (comment) {
                        var initial = comment.authorName ? comment.authorName.charAt(0).toUpperCase() : "A";
                        var anonName = "Farmer ".concat(initial, ".");
                        contextLines_1.push("- ".concat(anonName, " suggested: \"").concat(comment.text, "\""));
                    });
                    contextLines_1.push("");
                }
                validPosts = posts.slice(0, 3);
                if (validPosts.length > 0) {
                    hasData = true;
                    contextLines_1.push("[TRUST RANK 4: RELATED DISCUSSION THREADS]");
                    validPosts.forEach(function (post) {
                        var initial = post.authorName ? post.authorName.charAt(0).toUpperCase() : "A";
                        var anonName = "Farmer ".concat(initial, ".");
                        contextLines_1.push("- Post by ".concat(anonName, " (Tag: ").concat(post.plantTag, "): \"").concat(post.title, "\""));
                        contextLines_1.push("  Content: \"".concat(post.content.substring(0, 160), "...\""));
                    });
                    contextLines_1.push("");
                }
                contextLines_1.push("===============================================");
                return [2 /*return*/, {
                        text: contextLines_1.join("\n"),
                        hasData: hasData,
                        meta: meta,
                    }];
            case 13:
                error_1 = _d.sent();
                console.warn("Community Knowledge Retrieval failed:", error_1);
                return [2 /*return*/, {
                        text: "",
                        hasData: false,
                        meta: meta,
                    }];
            case 14: return [2 /*return*/];
        }
    });
}); };
exports.retrieveCommunityContext = retrieveCommunityContext;

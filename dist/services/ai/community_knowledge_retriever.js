"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveCommunityContext = void 0;
const diagnosis_history_model_1 = __importDefault(require("../../models/diagnosis_history_model"));
const community_post_model_1 = __importDefault(require("../../models/community_post_model"));
const comment_model_1 = __importDefault(require("../../models/comment_model"));
const specialist_offer_model_1 = __importDefault(require("../../models/specialist_offer_model"));
const user_model_1 = require("../../models/user_model");
/**
 * Clean and extract keywords from the user question for regex matching.
 * Filters out common English and Arabic stopwords to prevent broad matching.
 */
const extractKeywords = (text) => {
    const words = text.toLowerCase()
        .replace(/[^\w\s\u0600-\u06FF]/g, "") // Support Arabic and English letters
        .split(/\s+/)
        .filter(w => {
        const isEnglishStop = ["the", "and", "for", "with", "this", "that", "your", "have", "what", "how", "leaves", "leaf", "plant", "plants", "disease", "help", "about", "care", "my"].includes(w);
        const isArabicStop = ["سقي", "أوراق", "نبتة", "مرض", "عندي", "في", "من", "على", "ما", "كيف", "أصفر", "أوراق", "علاج", "الريحان", "الطماطم"].includes(w);
        return w.length > 2 && !isEnglishStop && !isArabicStop;
    });
    return [...new Set(words)];
};
/**
 * Retrieves anonymized and ranked community knowledge context.
 * Follows the AI Trust Hierarchy:
 * 1. Verified Expert Accepted Solutions (Highest Trust)
 * 2. Expert Comments (Medium Trust)
 * 3. Community Comments & Posts (Lower/Lowest Trust)
 */
const retrieveCommunityContext = async (diseaseNameEn, question) => {
    const started = Date.now();
    const meta = {
        similarCasesCount: 0,
        confirmedCount: 0,
        recentOutbreaksCount: 0,
        acceptedOffersCount: 0,
        expertCommentsCount: 0,
    };
    try {
        let matchedDiseaseName = diseaseNameEn?.trim();
        // 1. Gather stats from DiagnosisHistory if a disease prediction is available
        if (matchedDiseaseName) {
            meta.similarCasesCount = await diagnosis_history_model_1.default.countDocuments({
                diseaseNameEn: { $regex: new RegExp(`^${matchedDiseaseName}$`, "i") },
                feedbackStatus: { $ne: "rejected" }
            });
            meta.confirmedCount = await diagnosis_history_model_1.default.countDocuments({
                diseaseNameEn: { $regex: new RegExp(`^${matchedDiseaseName}$`, "i") },
                feedbackStatus: "confirmed"
            });
            const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
            meta.recentOutbreaksCount = await diagnosis_history_model_1.default.countDocuments({
                diseaseNameEn: { $regex: new RegExp(`^${matchedDiseaseName}$`, "i") },
                diagnosedAt: { $gte: fourteenDaysAgo }
            });
        }
        // 2. Resolve matching Community Posts
        let matchingHistories = [];
        if (matchedDiseaseName) {
            matchingHistories = await diagnosis_history_model_1.default.find({
                diseaseNameEn: { $regex: new RegExp(`^${matchedDiseaseName}$`, "i") }
            }).select("_id").lean();
        }
        const postQueryConditions = [];
        if (matchingHistories.length > 0) {
            postQueryConditions.push({ linkedDiagnosis: { $in: matchingHistories.map(h => h._id) } });
        }
        // Attempt keyword search on community posts
        const cleanDiseaseName = matchedDiseaseName
            ? matchedDiseaseName.replace(/___/g, " ").replace(/_/g, " ").trim()
            : "";
        if (cleanDiseaseName) {
            postQueryConditions.push({ title: { $regex: new RegExp(cleanDiseaseName, "i") } });
            postQueryConditions.push({ content: { $regex: new RegExp(cleanDiseaseName, "i") } });
        }
        // Parse plant name from classification label
        let plantName = "";
        if (matchedDiseaseName) {
            if (matchedDiseaseName.includes("___")) {
                plantName = matchedDiseaseName.split("___")[0].replace(/_/g, " ").trim();
            }
            else {
                plantName = matchedDiseaseName.split("_")[0].trim();
            }
            if (plantName) {
                postQueryConditions.push({ title: { $regex: new RegExp(`\\b${plantName}\\b`, "i") } });
            }
        }
        // For text-only chats, extract keywords from question
        if (!matchedDiseaseName && question && question.trim()) {
            const keywords = extractKeywords(question);
            if (keywords.length > 0) {
                const regexes = keywords.map(kw => new RegExp(kw, "i"));
                postQueryConditions.push({ title: { $in: regexes } });
                postQueryConditions.push({ content: { $in: regexes } });
            }
        }
        let posts = [];
        if (postQueryConditions.length > 0) {
            posts = await community_post_model_1.default.find({
                $or: postQueryConditions,
                status: "visible"
            })
                .limit(6)
                .lean();
        }
        const postIds = posts.map(p => p._id);
        let acceptedOffers = [];
        let comments = [];
        if (postIds.length > 0) {
            // 3. Retrieve Accepted Specialist Offers (Highest Trust)
            acceptedOffers = await specialist_offer_model_1.default.find({
                post: { $in: postIds },
                status: "accepted"
            })
                .limit(3)
                .lean();
            meta.acceptedOffersCount = acceptedOffers.length;
            // 4. Retrieve Comments (Expert comments are Medium Trust; Users are Low Trust)
            comments = await comment_model_1.default.find({
                post: { $in: postIds },
                status: "visible"
            })
                .populate({
                path: "author",
                select: "role"
            })
                .lean();
        }
        const expertComments = comments.filter(c => c.author && c.author.role === user_model_1.UserRole.EXPERT);
        meta.expertCommentsCount = expertComments.length;
        const normalComments = comments.filter(c => !c.author || c.author.role !== user_model_1.UserRole.EXPERT).slice(0, 3);
        // 5. Build context representation following Trust priority
        const contextLines = [];
        // Header
        contextLines.push("=== NABATECH COMMUNITY INTELLIGENCE CONTEXT ===");
        if (matchedDiseaseName) {
            contextLines.push(`Disease Target: ${matchedDiseaseName}`);
            contextLines.push(`Community Statistics:`);
            contextLines.push(`- Similar cases in community: ${meta.similarCasesCount}`);
            contextLines.push(`- Confirmed cases of this disease: ${meta.confirmedCount}`);
            contextLines.push(`- Recent cases diagnosed (last 14 days): ${meta.recentOutbreaksCount}`);
            contextLines.push("");
        }
        let hasData = false;
        // Trust Rank 1: Accepted Specialist Solutions
        if (acceptedOffers.length > 0) {
            hasData = true;
            contextLines.push("[TRUST RANK 1: VERIFIED EXPERT ACCEPTED CURE PLANS]");
            acceptedOffers.forEach(offer => {
                contextLines.push(`- Specialist ${offer.specialistName} provided a custom curing plan that was ACCEPTED by the farmer:`);
                contextLines.push(`  Cure Plan Details: "${offer.plan}"`);
            });
            contextLines.push("");
        }
        // Trust Rank 2: Expert Comments
        if (expertComments.length > 0) {
            hasData = true;
            contextLines.push("[TRUST RANK 2: VERIFIED EXPERT RECOMMENDATIONS]");
            expertComments.forEach(comment => {
                contextLines.push(`- Expert ${comment.authorName} recommended:`);
                contextLines.push(`  "${comment.text}"`);
            });
            contextLines.push("");
        }
        // Trust Rank 3: Normal User Comments (Anonymized to protect privacy)
        if (normalComments.length > 0) {
            hasData = true;
            contextLines.push("[TRUST RANK 3: ANONYMOUS PEER COMMENTS]");
            normalComments.forEach(comment => {
                const initial = comment.authorName ? comment.authorName.charAt(0).toUpperCase() : "A";
                const anonName = `Farmer ${initial}.`;
                contextLines.push(`- ${anonName} suggested: "${comment.text}"`);
            });
            contextLines.push("");
        }
        // Trust Rank 4: Related Community Posts (Anonymized)
        const validPosts = posts.slice(0, 3);
        if (validPosts.length > 0) {
            hasData = true;
            contextLines.push("[TRUST RANK 4: RELATED DISCUSSION THREADS]");
            validPosts.forEach(post => {
                const initial = post.authorName ? post.authorName.charAt(0).toUpperCase() : "A";
                const anonName = `Farmer ${initial}.`;
                contextLines.push(`- Post by ${anonName} (Tag: ${post.plantTag}): "${post.title}"`);
                contextLines.push(`  Content: "${post.content.substring(0, 160)}..."`);
            });
            contextLines.push("");
        }
        contextLines.push("===============================================");
        return {
            text: contextLines.join("\n"),
            hasData,
            meta,
        };
    }
    catch (error) {
        console.warn("Community Knowledge Retrieval failed:", error);
        return {
            text: "",
            hasData: false,
            meta,
        };
    }
};
exports.retrieveCommunityContext = retrieveCommunityContext;

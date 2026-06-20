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
exports.updateSpecialistOfferStatus = exports.getReceivedSpecialistOffers = exports.getSentSpecialistOffers = exports.createSpecialistOffer = void 0;
var community_post_model_1 = __importDefault(require("../models/community_post_model"));
var specialist_offer_model_1 = __importDefault(require("../models/specialist_offer_model"));
var user_model_1 = __importDefault(require("../models/user_model"));
var logger_1 = require("../utils/logger");
var toOfferPayload = function (offer) { return ({
    id: offer._id,
    postId: offer.post,
    specialistId: offer.specialist,
    specialistName: offer.specialistName,
    farmerId: offer.farmer,
    farmerName: offer.farmerName,
    plan: offer.plan,
    price: offer.price,
    status: offer.status,
    createdAt: offer.createdAt,
}); };
// @desc    Create specialist cure plan offer
// @route   POST /api/community/offers
// @access  Private
var createSpecialistOffer = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var specialistUser, _a, postId, plan, price, clientOperationId, existing, post, farmer, offer, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                specialistUser = req.user;
                if (specialistUser.role !== 'expert') {
                    return [2 /*return*/, res.status(403).json({ success: false, message: 'AUTH_FORBIDDEN', code: 'AUTH_FORBIDDEN' })];
                }
                _a = req.body, postId = _a.postId, plan = _a.plan, price = _a.price, clientOperationId = _a.clientOperationId;
                if (!postId || !plan || price === undefined || !clientOperationId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'VALIDATION_FAILED', code: 'VALIDATION_FAILED' })];
                }
                return [4 /*yield*/, specialist_offer_model_1.default.findOne({
                        specialist: specialistUser._id,
                        post: postId,
                        clientOperationId: clientOperationId,
                    })];
            case 1:
                existing = _b.sent();
                if (existing) {
                    return [2 /*return*/, res.status(201).json({ success: true, data: { offer: toOfferPayload(existing) } })];
                }
                return [4 /*yield*/, community_post_model_1.default.findById(postId)];
            case 2:
                post = _b.sent();
                if (!post) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Post not found', code: 'RESOURCE_NOT_FOUND' })];
                }
                return [4 /*yield*/, user_model_1.default.findById(post.author)];
            case 3:
                farmer = _b.sent();
                if (!farmer) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Farmer user not found', code: 'RESOURCE_NOT_FOUND' })];
                }
                return [4 /*yield*/, specialist_offer_model_1.default.create({
                        post: post._id,
                        specialist: specialistUser._id,
                        specialistName: specialistUser.name,
                        farmer: farmer._id,
                        farmerName: farmer.name,
                        plan: String(plan).trim(),
                        price: Number(price),
                        status: 'pending',
                        clientOperationId: clientOperationId,
                        version: 0,
                    })];
            case 4:
                offer = _b.sent();
                logger_1.logger.info('Specialist offer created', {
                    event: 'specialist_offers.create',
                    requestId: req.id,
                    actorId: specialistUser._id,
                    targetId: offer._id,
                    payload: { postId: postId, plan: plan, price: price, clientOperationId: clientOperationId },
                });
                return [2 /*return*/, res.status(201).json({ success: true, data: { offer: toOfferPayload(offer) } })];
            case 5:
                error_1 = _b.sent();
                if (error_1.code === 11000) {
                    return [2 /*return*/, res.status(409).json({ success: false, message: 'Conflict on create', code: 'CONFLICT' })];
                }
                logger_1.logger.error('Failed to create specialist offer', { event: 'specialist_offers.create.error', error: error_1 });
                return [2 /*return*/, res.status(500).json({ success: false, message: 'Failed to create specialist offer' })];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.createSpecialistOffer = createSpecialistOffer;
// @desc    Get offers created by specialist
// @route   GET /api/community/offers/sent
// @access  Private
var getSentSpecialistOffers = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var specialistId, _a, cursor, limit, status_1, qLimit, query, offers, hasNextPage, nextCursor, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                specialistId = req.user.id;
                _a = req.query, cursor = _a.cursor, limit = _a.limit, status_1 = _a.status;
                qLimit = limit ? parseInt(limit, 10) : 50;
                query = { specialist: specialistId };
                if (status_1)
                    query.status = status_1;
                if (cursor)
                    query._id = { $lt: cursor };
                return [4 /*yield*/, specialist_offer_model_1.default.find(query).sort({ _id: -1 }).limit(qLimit + 1)];
            case 1:
                offers = _b.sent();
                hasNextPage = offers.length > qLimit;
                if (hasNextPage)
                    offers.pop();
                nextCursor = offers.length > 0 ? offers[offers.length - 1]._id : null;
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: {
                            items: offers.map(function (offer) { return toOfferPayload(offer); }),
                            pageInfo: { hasNextPage: hasNextPage, nextCursor: nextCursor }
                        }
                    })];
            case 2:
                error_2 = _b.sent();
                logger_1.logger.error('Failed to fetch sent offers', { event: 'specialist_offers.list_sent.error', error: error_2 });
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to fetch sent offers" })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getSentSpecialistOffers = getSentSpecialistOffers;
// @desc    Get offers received by farmer
// @route   GET /api/community/offers/received
// @access  Private
var getReceivedSpecialistOffers = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var farmerId, _a, cursor, limit, status_2, qLimit, query, offers, hasNextPage, nextCursor, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                farmerId = req.user.id;
                _a = req.query, cursor = _a.cursor, limit = _a.limit, status_2 = _a.status;
                qLimit = limit ? parseInt(limit, 10) : 50;
                query = { farmer: farmerId };
                if (status_2)
                    query.status = status_2;
                if (cursor)
                    query._id = { $lt: cursor };
                return [4 /*yield*/, specialist_offer_model_1.default.find(query).sort({ _id: -1 }).limit(qLimit + 1)];
            case 1:
                offers = _b.sent();
                hasNextPage = offers.length > qLimit;
                if (hasNextPage)
                    offers.pop();
                nextCursor = offers.length > 0 ? offers[offers.length - 1]._id : null;
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: {
                            items: offers.map(function (offer) { return toOfferPayload(offer); }),
                            pageInfo: { hasNextPage: hasNextPage, nextCursor: nextCursor }
                        }
                    })];
            case 2:
                error_3 = _b.sent();
                logger_1.logger.error('Failed to fetch received offers', { event: 'specialist_offers.list_received.error', error: error_3 });
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to fetch received offers" })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getReceivedSpecialistOffers = getReceivedSpecialistOffers;
// @desc    Update offer status
// @route   PATCH /api/community/offers/:id/status
// @access  Private
var updateSpecialistOfferStatus = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, status_3, version, offer, isValidTransition, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                userId = req.user.id;
                _a = req.body, status_3 = _a.status, version = _a.version;
                return [4 /*yield*/, specialist_offer_model_1.default.findById(req.params.id)];
            case 1:
                offer = _b.sent();
                if (!offer) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Offer not found", code: 'RESOURCE_NOT_FOUND' })];
                }
                if (offer.version !== version) {
                    return [2 /*return*/, res.status(409).json({ success: false, message: "Version mismatch", code: 'CONFLICT' })];
                }
                if (offer.status !== 'pending') {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Offer is no longer pending", code: 'INVALID_STATE_TRANSITION' })];
                }
                isValidTransition = false;
                if (offer.farmer.toString() === userId) {
                    isValidTransition = status_3 === 'accepted' || status_3 === 'rejected';
                }
                else if (offer.specialist.toString() === userId) {
                    isValidTransition = status_3 === 'cancelled';
                }
                if (!isValidTransition) {
                    return [2 /*return*/, res.status(403).json({ success: false, message: "Not authorized or invalid state transition", code: 'AUTH_FORBIDDEN' })];
                }
                offer.status = status_3;
                if (status_3 === 'accepted')
                    offer.acceptedAt = new Date();
                else if (status_3 === 'rejected')
                    offer.rejectedAt = new Date();
                else if (status_3 === 'cancelled')
                    offer.cancelledAt = new Date();
                offer.version += 1;
                return [4 /*yield*/, offer.save()];
            case 2:
                _b.sent();
                logger_1.logger.info('Specialist offer status updated', {
                    event: 'specialist_offers.update_status',
                    requestId: req.id,
                    actorId: userId,
                    offerId: offer._id,
                    newStatus: status_3,
                    version: offer.version,
                });
                return [2 /*return*/, res.status(200).json({ success: true, data: { offer: toOfferPayload(offer) } })];
            case 3:
                error_4 = _b.sent();
                logger_1.logger.error('Failed to update offer status', { event: 'specialist_offers.update_status.error', error: error_4 });
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to update offer status" })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateSpecialistOfferStatus = updateSpecialistOfferStatus;

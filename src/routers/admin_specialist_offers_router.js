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
var express_1 = require("express");
var specialist_offer_model_1 = __importDefault(require("../models/specialist_offer_model"));
var logger_1 = require("../utils/logger");
var auth_middleware_1 = require("../middlewares/auth_middleware");
var validate_request_middleware_1 = require("../middlewares/validate_request_middleware");
var specialist_offer_schemas_1 = require("../validation/specialist_offer_schemas");
var router = (0, express_1.Router)();
// Admin list offers with cursor pagination
router.get('/', auth_middleware_1.protect, auth_middleware_1.admin, (0, validate_request_middleware_1.validateRequest)(specialist_offer_schemas_1.adminOffersQuerySchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, cursor, limit, status_1, adminStatus, farmerId, specialistId, qLimit, query, offers, hasNextPage, nextCursor, toPayload, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, cursor = _a.cursor, limit = _a.limit, status_1 = _a.status, adminStatus = _a.adminStatus, farmerId = _a.farmerId, specialistId = _a.specialistId;
                qLimit = limit ? parseInt(limit, 10) : 20;
                query = {};
                if (status_1)
                    query.status = status_1;
                if (adminStatus)
                    query.adminStatus = adminStatus;
                if (farmerId)
                    query.farmer = farmerId;
                if (specialistId)
                    query.specialist = specialistId;
                if (cursor)
                    query._id = { $lt: cursor };
                return [4 /*yield*/, specialist_offer_model_1.default.find(query)
                        .sort({ _id: -1 })
                        .limit(qLimit + 1)];
            case 1:
                offers = _b.sent();
                hasNextPage = offers.length > qLimit;
                if (hasNextPage)
                    offers.pop();
                nextCursor = offers.length > 0 ? offers[offers.length - 1]._id : null;
                toPayload = function (offer) { return ({
                    id: offer._id,
                    postId: offer.post,
                    specialistId: offer.specialist,
                    specialistName: offer.specialistName,
                    farmerId: offer.farmer,
                    farmerName: offer.farmerName,
                    plan: offer.plan,
                    price: offer.price,
                    status: offer.status,
                    adminStatus: offer.adminStatus,
                    createdAt: offer.createdAt,
                }); };
                logger_1.logger.info('Listed admin specialist offers', { event: 'admin.specialist_offers.list', requestId: req.id, limit: qLimit });
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: {
                            items: offers.map(toPayload),
                            pageInfo: { hasNextPage: hasNextPage, nextCursor: nextCursor }
                        }
                    })];
            case 2:
                error_1 = _b.sent();
                logger_1.logger.error('Failed to list specialist offers', { event: 'admin.specialist_offers.list.error', error: error_1 });
                return [2 /*return*/, res.status(500).json({ success: false, message: 'Failed to list specialist offers' })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Admin moderate offer
router.patch('/:id/moderation', auth_middleware_1.protect, auth_middleware_1.admin, (0, validate_request_middleware_1.validateRequest)(specialist_offer_schemas_1.adminModerationSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, action, reason, version, offer, newAdminStatus, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, action = _a.action, reason = _a.reason, version = _a.version;
                return [4 /*yield*/, specialist_offer_model_1.default.findById(req.params.id)];
            case 1:
                offer = _b.sent();
                if (!offer) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Offer not found', code: 'RESOURCE_NOT_FOUND' })];
                }
                if (offer.version !== version) {
                    return [2 /*return*/, res.status(409).json({ success: false, message: 'Version mismatch', code: 'CONFLICT' })];
                }
                newAdminStatus = action === 'flag' ? 'flagged' : action === 'clear' ? 'cleared' : 'voided';
                offer.adminStatus = newAdminStatus;
                // Note: Do not change the normal business status or accept/reject.
                // If we wanted to store the admin reason, we could add a field `adminModerationReason` to the model.
                offer.version += 1;
                return [4 /*yield*/, offer.save()];
            case 2:
                _b.sent();
                logger_1.logger.info('Moderated admin specialist offer', {
                    event: 'admin.specialist_offers.moderate',
                    requestId: req.id,
                    offerId: offer._id,
                    action: action,
                    adminStatus: newAdminStatus,
                    reason: reason
                });
                return [2 /*return*/, res.status(200).json({ success: true, data: { offer: { id: offer._id, adminStatus: offer.adminStatus } } })];
            case 3:
                error_2 = _b.sent();
                logger_1.logger.error('Failed to update admin status', { event: 'admin.specialist_offers.moderate.error', error: error_2 });
                return [2 /*return*/, res.status(500).json({ success: false, message: 'Failed to update admin status' })];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = router;

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
exports.stopOutboxPolling = exports.startOutboxPolling = exports.processOutboxJobs = void 0;
var outbox_job_model_1 = __importDefault(require("../models/outbox_job_model"));
var email_service_1 = require("../services/email_service");
var logger_1 = require("../utils/logger");
var processOutboxJobs = function () {
    var args_1 = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args_1[_i] = arguments[_i];
    }
    return __awaiter(void 0, __spreadArray([], args_1, true), void 0, function (maxJobs) {
        var processedCount, retriedCount, deadLetteredCount, now, jobsToProcess, _a, jobsToProcess_1, job, leaseTime, acquired, error_1, errorMessage, attempts, backoffMinutes, nextAvailable;
        if (maxJobs === void 0) { maxJobs = 100; }
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    processedCount = 0;
                    retriedCount = 0;
                    deadLetteredCount = 0;
                    now = new Date();
                    return [4 /*yield*/, outbox_job_model_1.default.find({
                            $or: [
                                { status: 'pending', availableAt: { $lte: now } },
                                { status: 'processing', leaseUntil: { $lte: now } },
                                { status: 'failed', availableAt: { $lte: now }, attemptCount: { $lt: 8 } }
                            ]
                        }).sort({ availableAt: 1 }).limit(maxJobs)];
                case 1:
                    jobsToProcess = _b.sent();
                    _a = 0, jobsToProcess_1 = jobsToProcess;
                    _b.label = 2;
                case 2:
                    if (!(_a < jobsToProcess_1.length)) return [3 /*break*/, 17];
                    job = jobsToProcess_1[_a];
                    leaseTime = new Date(Date.now() + 60 * 1000);
                    return [4 /*yield*/, outbox_job_model_1.default.findOneAndUpdate({
                            _id: job._id,
                            // Ensure the job hasn't been picked up by another worker
                            $or: [
                                { status: 'pending' },
                                { status: 'processing', leaseUntil: { $lte: now } },
                                { status: 'failed' }
                            ]
                        }, {
                            status: 'processing',
                            leaseUntil: leaseTime,
                            $inc: { attemptCount: 1 }
                        }, { new: true })];
                case 3:
                    acquired = _b.sent();
                    if (!acquired) {
                        return [3 /*break*/, 16]; // Another worker got it
                    }
                    _b.label = 4;
                case 4:
                    _b.trys.push([4, 11, , 16]);
                    if (!(job.type === 'email_verification')) return [3 /*break*/, 6];
                    return [4 /*yield*/, (0, email_service_1.sendVerificationEmail)(job.payload.email, job.payload.token)];
                case 5:
                    _b.sent();
                    return [3 /*break*/, 9];
                case 6:
                    if (!(job.type === 'password_reset')) return [3 /*break*/, 8];
                    return [4 /*yield*/, (0, email_service_1.sendPasswordResetEmail)(job.payload.email, job.payload.token)];
                case 7:
                    _b.sent();
                    return [3 /*break*/, 9];
                case 8: throw new Error("Unknown job type: ".concat(job.type));
                case 9: 
                // Success
                return [4 /*yield*/, outbox_job_model_1.default.updateOne({ _id: job._id }, { status: 'completed' })];
                case 10:
                    // Success
                    _b.sent();
                    processedCount++;
                    logger_1.logger.info('outbox.job.succeeded', { jobId: job._id, type: job.type });
                    return [3 /*break*/, 16];
                case 11:
                    error_1 = _b.sent();
                    errorMessage = error_1.message || String(error_1);
                    attempts = acquired.attemptCount;
                    if (!(attempts >= 8)) return [3 /*break*/, 13];
                    // Dead letter
                    return [4 /*yield*/, outbox_job_model_1.default.updateOne({ _id: job._id }, {
                            status: 'dead_letter',
                            lastError: errorMessage,
                            deadLetteredAt: new Date()
                        })];
                case 12:
                    // Dead letter
                    _b.sent();
                    deadLetteredCount++;
                    logger_1.logger.error('outbox.job.dead_lettered', { jobId: job._id, type: job.type, error: errorMessage });
                    return [3 /*break*/, 15];
                case 13:
                    backoffMinutes = Math.pow(2, attempts);
                    nextAvailable = new Date(Date.now() + backoffMinutes * 60 * 1000);
                    return [4 /*yield*/, outbox_job_model_1.default.updateOne({ _id: job._id }, {
                            status: 'failed',
                            lastError: errorMessage,
                            availableAt: nextAvailable
                        })];
                case 14:
                    _b.sent();
                    retriedCount++;
                    logger_1.logger.warn('outbox.job.failed', { jobId: job._id, type: job.type, attempt: attempts, error: errorMessage });
                    _b.label = 15;
                case 15: return [3 /*break*/, 16];
                case 16:
                    _a++;
                    return [3 /*break*/, 2];
                case 17: return [2 /*return*/, { processed: processedCount, retried: retriedCount, deadLettered: deadLetteredCount }];
            }
        });
    });
};
exports.processOutboxJobs = processOutboxJobs;
// Background polling for single-instance mode
var isPolling = false;
var pollingInterval = null;
var startOutboxPolling = function (intervalMs) {
    if (intervalMs === void 0) { intervalMs = 10000; }
    if (isPolling)
        return;
    isPolling = true;
    var poll = function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, exports.processOutboxJobs)(50)];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    logger_1.logger.error('Error polling outbox jobs', { error: error_2 });
                    return [3 /*break*/, 3];
                case 3:
                    if (isPolling) {
                        pollingInterval = setTimeout(poll, intervalMs);
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    poll();
};
exports.startOutboxPolling = startOutboxPolling;
var stopOutboxPolling = function () {
    isPolling = false;
    if (pollingInterval) {
        clearTimeout(pollingInterval);
        pollingInterval = null;
    }
};
exports.stopOutboxPolling = stopOutboxPolling;

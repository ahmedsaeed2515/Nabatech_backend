"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runIdempotentAdminMutation = void 0;
const idempotency_record_model_1 = __importDefault(require("../models/idempotency_record_model"));
const mongoose_1 = __importDefault(require("mongoose"));
const app_error_1 = require("../utils/app_error");
const runIdempotentAdminMutation = async (actorId, scope, key, requestHash, mutationFn) => {
    if (!key) {
        throw new app_error_1.AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: 'Idempotency-Key is required' });
    }
    // Check if we already have this key
    const existing = await idempotency_record_model_1.default.findOne({ actor: actorId, scope, key });
    if (existing) {
        if (existing.requestHash !== requestHash) {
            throw new app_error_1.AppError({
                code: 'CONFLICT',
                statusCode: 409,
                message: 'Idempotency key already used with a different request payload'
            });
        }
        if (existing.state === 'completed') {
            return { result: existing.resultReference, statusCode: existing.statusCode || 200 };
        }
        if (existing.state === 'started') {
            throw new app_error_1.AppError({
                code: 'CONFLICT',
                statusCode: 409,
                message: 'A request with this idempotency key is already in progress'
            });
        }
    }
    // Start new idempotency
    const session = await mongoose_1.default.startSession();
    let result;
    let finalStatusCode;
    try {
        session.startTransaction();
        const record = new idempotency_record_model_1.default({
            actor: new mongoose_1.default.Types.ObjectId(actorId),
            scope,
            key,
            requestHash,
            state: 'started',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Keep for 24h
        });
        await record.save({ session });
        // Execute the actual mutation
        const mutationOutput = await mutationFn(session);
        result = mutationOutput.result;
        finalStatusCode = mutationOutput.statusCode;
        // Update record
        record.state = 'completed';
        record.resultReference = result;
        record.statusCode = finalStatusCode;
        await record.save({ session });
        await session.commitTransaction();
        return { result, statusCode: finalStatusCode };
    }
    catch (error) {
        await session.abortTransaction();
        // If it failed, mark idempotency as failed so it can be retried safely
        await idempotency_record_model_1.default.findOneAndUpdate({ actor: actorId, scope, key }, { state: 'failed', resultReference: { error: String(error) } }).catch(e => console.error("Failed to update idempotency error state", e));
        throw error;
    }
    finally {
        session.endSession();
    }
};
exports.runIdempotentAdminMutation = runIdempotentAdminMutation;

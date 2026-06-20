"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expert_escalation_service_1 = require("../../../services/expert_escalation_service");
const expert_escalation_model_1 = __importDefault(require("../../../models/expert_escalation_model"));
const NotificationService_1 = require("../../../services/NotificationService");
const UserRepository_1 = require("../../../repositories/UserRepository");
jest.mock('../../../models/expert_escalation_model');
jest.mock('../../../services/NotificationService');
jest.mock('../../../repositories/UserRepository');
describe('[UNIT] ExpertEscalationService - Phase 6', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('PASS: Should create expert review request and notify matching experts', async () => {
        const mockSave = jest.fn();
        expert_escalation_model_1.default.mockImplementation(() => ({
            _id: 'mock_request_id',
            userId: 'user_1',
            save: mockSave
        }));
        UserRepository_1.UserRepository.prototype.find.mockResolvedValueOnce([
            { _id: 'expert_1', role: 'expert', fcmToken: 'expert_token_1' }
        ]);
        const result = await expert_escalation_service_1.ExpertEscalationService.requestExpertReview({
            userId: 'user_1',
            aiPrediction: 'Tomato Blight',
            aiConfidence: 0.45
        });
        expect(mockSave).toHaveBeenCalledTimes(1);
        expect(UserRepository_1.UserRepository.prototype.find).toHaveBeenCalled();
        expect(NotificationService_1.NotificationService.prototype.sendPushNotification).toHaveBeenCalledWith('expert_token_1', expect.objectContaining({
            data: expect.objectContaining({ type: 'EXPERT_ESCALATION' })
        }));
    });
    it('PASS: Should fetch pending requests', async () => {
        const mockFind = jest.fn().mockReturnValue({
            sort: jest.fn().mockResolvedValue([{ _id: 'req_1' }, { _id: 'req_2' }])
        });
        expert_escalation_model_1.default.find = mockFind;
        const result = await expert_escalation_service_1.ExpertEscalationService.getPendingRequests();
        expect(result.length).toBe(2);
        expect(mockFind).toHaveBeenCalledWith({ status: 'pending' });
    });
    it('PASS: Should update request status and notify original user', async () => {
        expert_escalation_model_1.default.findByIdAndUpdate.mockResolvedValueOnce({
            _id: 'req_1',
            userId: 'user_1',
            status: 'reviewed'
        });
        UserRepository_1.UserRepository.prototype.findById.mockResolvedValueOnce({
            _id: 'user_1',
            fcmToken: 'user_token_1'
        });
        await expert_escalation_service_1.ExpertEscalationService.updateRequestStatus('req_1', 'reviewed', 'expert_1', 'Use fungicide');
        expect(expert_escalation_model_1.default.findByIdAndUpdate).toHaveBeenCalledWith('req_1', { status: 'reviewed', expertId: 'expert_1', expertResponse: 'Use fungicide' }, { new: true });
        expect(NotificationService_1.NotificationService.prototype.sendPushNotification).toHaveBeenCalledWith('user_token_1', expect.objectContaining({
            data: expect.objectContaining({ type: 'EXPERT_REVIEW_COMPLETE' })
        }));
    });
    it('FAIL: Should throw error if updating non-existent request', async () => {
        expert_escalation_model_1.default.findByIdAndUpdate.mockResolvedValueOnce(null);
        await expect(expert_escalation_service_1.ExpertEscalationService.updateRequestStatus('invalid_req', 'reviewed', 'expert_1', 'response')).rejects.toThrow('Escalation request not found');
    });
});

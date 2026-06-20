import { ExpertEscalationService } from '../../../services/expert_escalation_service';
import ExpertEscalation from '../../../models/expert_escalation_model';
import { NotificationService } from '../../../services/NotificationService';
import { UserRepository } from '../../../repositories/UserRepository';

jest.mock('../../../models/expert_escalation_model');
jest.mock('../../../services/NotificationService');
jest.mock('../../../repositories/UserRepository');

describe('[UNIT] ExpertEscalationService - Phase 6', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('PASS: Should create expert review request and notify matching experts', async () => {
    const mockSave = jest.fn();
    (ExpertEscalation as any).mockImplementation(() => ({
      _id: 'mock_request_id',
      userId: 'user_1',
      save: mockSave
    }));

    (UserRepository.prototype.find as jest.Mock).mockResolvedValueOnce([
      { _id: 'expert_1', role: 'expert', fcmToken: 'expert_token_1' }
    ]);

    const result = await ExpertEscalationService.requestExpertReview({
      userId: 'user_1',
      aiPrediction: 'Tomato Blight',
      aiConfidence: 0.45
    });

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(UserRepository.prototype.find).toHaveBeenCalled();
    expect(NotificationService.prototype.sendPushNotification).toHaveBeenCalledWith(
      'expert_token_1',
      expect.objectContaining({
        data: expect.objectContaining({ type: 'EXPERT_ESCALATION' })
      })
    );
  });

  it('PASS: Should fetch pending requests', async () => {
    const mockFind = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([{ _id: 'req_1' }, { _id: 'req_2' }])
    });
    (ExpertEscalation.find as jest.Mock) = mockFind;

    const result = await ExpertEscalationService.getPendingRequests();

    expect(result.length).toBe(2);
    expect(mockFind).toHaveBeenCalledWith({ status: 'pending' });
  });

  it('PASS: Should update request status and notify original user', async () => {
    (ExpertEscalation.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce({
      _id: 'req_1',
      userId: 'user_1',
      status: 'reviewed'
    });

    (UserRepository.prototype.findById as jest.Mock).mockResolvedValueOnce({
      _id: 'user_1',
      fcmToken: 'user_token_1'
    });

    await ExpertEscalationService.updateRequestStatus('req_1', 'reviewed', 'expert_1', 'Use fungicide');

    expect(ExpertEscalation.findByIdAndUpdate).toHaveBeenCalledWith(
      'req_1',
      { status: 'reviewed', expertId: 'expert_1', expertResponse: 'Use fungicide' },
      { new: true }
    );
    expect(NotificationService.prototype.sendPushNotification).toHaveBeenCalledWith(
      'user_token_1',
      expect.objectContaining({
        data: expect.objectContaining({ type: 'EXPERT_REVIEW_COMPLETE' })
      })
    );
  });

  it('FAIL: Should throw error if updating non-existent request', async () => {
    (ExpertEscalation.findByIdAndUpdate as jest.Mock).mockResolvedValueOnce(null);

    await expect(
      ExpertEscalationService.updateRequestStatus('invalid_req', 'reviewed', 'expert_1', 'response')
    ).rejects.toThrow('Escalation request not found');
  });
});

import { orchestrateChat } from '../../services/ai/ai_orchestrator_service';
import { MemoryManager } from '../../services/ai/memory_manager';
import { createFakeUser } from '../factories';
import UserModel from '../../models/user_model';

describe('[E2E] Agent Long-Term Memory', () => {

  let userId: string;

  beforeEach(async () => {
    const user = await UserModel.create(createFakeUser());
    userId = user._id.toString();
  });

  it('يجب يستخرج ويخزن facts بعد المحادثة — FIX TASK-1.1', async () => {
    const saveSpy = jest.spyOn(MemoryManager, 'saveLongTermMemory').mockResolvedValue(undefined);

    // Simulate a conversation where user reveals their location
    await orchestrateChat({
      userId,
      question: 'I live in Egypt and I prefer organic treatments for my plants',
      history: [],
      onProgress: jest.fn()
    });

    // Memory should have been saved
    expect(saveSpy).toHaveBeenCalled();
    const savedKeys = saveSpy.mock.calls.map((call: any) => call[1]);
    expect(savedKeys.some((k: any) => k.includes('location') || k.includes('egypt'))).toBe(true);
  });

  it('يجب يحقن الـ long-term memory في الـ context بعدين', async () => {
    // Pre-seed memory
    await MemoryManager.saveLongTermMemory(userId, 'location', 'Egypt');
    await MemoryManager.saveLongTermMemory(userId, 'treatment_preference', 'organic');

    const memory = await MemoryManager.getLongTermMemory(userId);

    expect(memory).toContain('Egypt');
    expect(memory).toContain('organic');
  });
});

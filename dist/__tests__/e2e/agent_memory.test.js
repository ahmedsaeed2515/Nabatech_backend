"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ai_orchestrator_service_1 = require("../../services/ai/ai_orchestrator_service");
const memory_manager_1 = __importDefault(require("../../services/ai/memory_manager"));
const factories_1 = require("../factories");
const user_model_1 = __importDefault(require("../../models/user_model"));
describe('[E2E] Agent Long-Term Memory', () => {
    let userId;
    beforeEach(async () => {
        const user = await user_model_1.default.create((0, factories_1.createFakeUser)());
        userId = user._id.toString();
    });
    it('يجب يستخرج ويخزن facts بعد المحادثة — FIX TASK-1.1', async () => {
        const saveSpy = jest.spyOn(memory_manager_1.default, 'saveLongTermMemory').mockResolvedValue(undefined);
        // Simulate a conversation where user reveals their location
        const orchestrator = new ai_orchestrator_service_1.AiOrchestratorService();
        await orchestrator.processChat({
            userId,
            question: 'I live in Egypt and I prefer organic treatments for my plants',
            history: [],
            onProgress: jest.fn()
        });
        // Memory should have been saved
        expect(saveSpy).toHaveBeenCalled();
        const savedKeys = saveSpy.mock.calls.map((call) => call[1]);
        expect(savedKeys.some((k) => k.includes('location') || k.includes('egypt'))).toBe(true);
    });
    it('يجب يحقن الـ long-term memory في الـ context بعدين', async () => {
        // Pre-seed memory
        await memory_manager_1.default.saveLongTermMemory(userId, 'location', 'Egypt');
        await memory_manager_1.default.saveLongTermMemory(userId, 'treatment_preference', 'organic');
        const memory = await memory_manager_1.default.getLongTermMemory(userId);
        expect(memory).toContain('Egypt');
        expect(memory).toContain('organic');
    });
});

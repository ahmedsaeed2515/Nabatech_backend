"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nock_1 = __importDefault(require("nock"));
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const user_model_1 = __importDefault(require("../../models/user_model"));
const plant_dna_model_1 = __importDefault(require("../../models/plant_dna_model"));
const factories_1 = require("../factories");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
describe('[E2E] AI Agent — Full Chat Flows', () => {
    let authToken;
    let userId;
    beforeEach(async () => {
        const user = await user_model_1.default.create((0, factories_1.createFakeUser)());
        userId = user._id.toString();
        authToken = jsonwebtoken_1.default.sign({ _id: userId }, process.env.JWT_SECRET || 'test-secret');
        await plant_dna_model_1.default.create((0, factories_1.createFakePlantDna)({ species: 'Tomato' }));
        // Mock OpenAI API
        process.env.OPENAI_API_KEY = 'test-key';
        nock_1.default.cleanAll();
    });
    afterEach(() => {
        nock_1.default.cleanAll();
    });
    describe('Agent Chat with Tool Calling', () => {
        it('يجب يكمل multi-step task: add plant + confirm', async () => {
            // Mock OpenAI — first call returns tool_call, second returns final message
            (0, nock_1.default)('https://api.openai.com')
                .post('/v1/chat/completions')
                .reply(200, {
                choices: [{
                        message: {
                            role: 'assistant',
                            tool_calls: [{
                                    id: 'call_1',
                                    type: 'function',
                                    function: {
                                        name: 'add_plant_to_garden',
                                        arguments: JSON.stringify({ plantName: 'Tomato' })
                                    }
                                }]
                        },
                        finish_reason: 'tool_calls'
                    }]
            })
                .post('/v1/chat/completions')
                .reply(200, {
                choices: [{
                        message: {
                            role: 'assistant',
                            content: 'I have successfully added Tomato to your garden!'
                        },
                        finish_reason: 'stop'
                    }]
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/ai/chat')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ message: 'Please add a tomato plant to my garden' });
            expect(res.status).toBe(200);
            expect(res.body.message).toContain('Tomato');
        });
        it('يجب يتوقف قبل infinite loop — maxIterations check', async () => {
            // Mock OpenAI to always return tool calls (never finish)
            (0, nock_1.default)('https://api.openai.com')
                .post('/v1/chat/completions')
                .times(20) // More than maxIterations
                .reply(200, {
                choices: [{
                        message: {
                            role: 'assistant',
                            tool_calls: [{
                                    id: `call_${Date.now()}`,
                                    type: 'function',
                                    function: {
                                        name: 'garden_analytics',
                                        arguments: '{}'
                                    }
                                }]
                        },
                        finish_reason: 'tool_calls'
                    }]
            });
            const startTime = Date.now();
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/ai/chat')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ message: 'Analyze my garden' });
            const duration = Date.now() - startTime;
            // Should stop after maxIterations (15), not hang forever
            expect(duration).toBeLessThan(30000); // Max 30 seconds
            expect(res.status).toBeLessThan(500); // Should not crash
        });
    });
    describe('RAG Integration in Chat', () => {
        it('يجب يستخدم RAG knowledge في الرد على سؤال عن مرض', async () => {
            // Mock RAG endpoint
            (0, nock_1.default)('https://fake-rag.hf.space')
                .post('/retrieve')
                .reply(200, {
                chunks: ['Powdery mildew treatment: Apply neem oil spray every 7 days. Remove affected leaves.']
            });
            // Mock OpenAI using RAG context
            (0, nock_1.default)('https://api.openai.com')
                .post('/v1/chat/completions')
                .reply(200, {
                choices: [{
                        message: {
                            role: 'assistant',
                            content: 'Based on agricultural knowledge, powdery mildew can be treated with neem oil.'
                        },
                        finish_reason: 'stop'
                    }]
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/ai/chat')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ message: 'How do I treat powdery mildew on my tomato?' });
            expect(res.status).toBe(200);
            expect(res.body.message.toLowerCase()).toContain('mildew');
        });
    });
    describe('Weather Tool in Agent', () => {
        it('يجب يجيب weather forecast ويديها للـ user', async () => {
            // Mock OpenWeatherMap
            (0, nock_1.default)('https://api.openweathermap.org')
                .get('/data/2.5/forecast')
                .query(true)
                .reply(200, {
                list: [
                    { dt_txt: '2026-06-21 12:00:00', main: { temp: 38, humidity: 45 }, weather: [{ main: 'Clear', description: 'clear sky' }], rain: {} },
                    { dt_txt: '2026-06-22 12:00:00', main: { temp: 32, humidity: 60 }, weather: [{ main: 'Rain', description: 'light rain' }], rain: { '3h': 3.2 } }
                ]
            });
            // Mock OpenAI with tool call for weather
            (0, nock_1.default)('https://api.openai.com')
                .post('/v1/chat/completions')
                .reply(200, {
                choices: [{
                        message: {
                            role: 'assistant',
                            tool_calls: [{
                                    id: 'call_weather',
                                    type: 'function',
                                    function: {
                                        name: 'get_weather_forecast',
                                        arguments: JSON.stringify({ lat: 30.0444, lon: 31.2357 })
                                    }
                                }]
                        },
                        finish_reason: 'tool_calls'
                    }]
            })
                .post('/v1/chat/completions')
                .reply(200, {
                choices: [{
                        message: {
                            role: 'assistant',
                            content: 'Tomorrow will be 38°C. Water your plants today. Rain expected on Sunday — skip watering that day.'
                        },
                        finish_reason: 'stop'
                    }]
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/ai/chat')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ message: 'Should I water my plants today? I\'m in Cairo.' });
            expect(res.status).toBe(200);
        });
    });
});

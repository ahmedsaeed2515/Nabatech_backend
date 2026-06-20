"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const agent_tool_registry_1 = require("../../services/ai/agent_tool_registry");
const plant_dna_model_1 = __importDefault(require("../../models/plant_dna_model"));
const garden_model_1 = __importDefault(require("../../models/garden_model"));
const zone_model_1 = __importDefault(require("../../models/zone_model"));
const plant_model_1 = __importDefault(require("../../models/plant_model"));
const user_model_1 = __importDefault(require("../../models/user_model"));
const factories_1 = require("../factories");
describe('[INTEGRATION] AgentTool — add_plant_to_garden', () => {
    let registry;
    let userId;
    beforeEach(async () => {
        const user = await user_model_1.default.create((0, factories_1.createFakeUser)());
        userId = user._id.toString();
        // Seed PlantDna
        await plant_dna_model_1.default.create((0, factories_1.createFakePlantDna)({ species: 'Tomato' }));
        registry = new agent_tool_registry_1.AgentToolRegistry();
    });
    it('يجب ينشئ zone تلقائي لو مفيش وينضم النبات — FIX TASK-0.3', async () => {
        const result = await registry.executeTool('add_plant_to_garden', { plantName: 'Tomato' }, userId);
        // Check result message
        expect(result).toContain('Successfully added');
        expect(result).toContain('Tomato');
        // Check Zone was created
        const zone = await zone_model_1.default.findOne({ user: userId });
        expect(zone).not.toBeNull();
        expect(zone.name).toBe('Default Zone');
        // Check Plant was created with REAL zone ID
        const plant = await plant_model_1.default.findOne({ user: userId });
        expect(plant).not.toBeNull();
        expect(plant.zone.toString()).toBe(zone._id.toString());
        // Must NOT be a random non-existent ObjectId
        const zoneExists = await zone_model_1.default.findById(plant.zone);
        expect(zoneExists).not.toBeNull();
    });
    it('يجب يستخدم الـ zone الموجود لو عنده واحد', async () => {
        // Pre-create garden and zone
        const garden = await garden_model_1.default.create({
            user: userId, name: 'Existing Garden', type: 'OUTDOOR'
        });
        await zone_model_1.default.create({
            user: userId, garden: garden._id, name: 'Existing Zone', type: 'FULL_SUN'
        });
        await registry.executeTool('add_plant_to_garden', { plantName: 'Tomato' }, userId);
        // Should only have 1 zone still
        const zoneCount = await zone_model_1.default.countDocuments({ user: userId });
        expect(zoneCount).toBe(1);
    });
    it('يجب يرجع error message لو النبات مش موجود في الـ library', async () => {
        const result = await registry.executeTool('add_plant_to_garden', { plantName: 'SomeFakePlantXYZ999' }, userId);
        expect(result).toContain('not found');
        expect(result).toContain('Try:');
        // No plant should be created
        const plantCount = await plant_model_1.default.countDocuments({ user: userId });
        expect(plantCount).toBe(0);
    });
});

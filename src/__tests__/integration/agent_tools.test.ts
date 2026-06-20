import { AgentToolRegistry } from '../../services/ai/agent_tool_registry';
import PlantDnaModel from '../../models/plant_dna_model';
import GardenModel from '../../models/garden_model';
import ZoneModel from '../../models/zone_model';
import PlantModel from '../../models/plant_model';
import UserModel from '../../models/user_model';
import mongoose from 'mongoose';
import { createFakeUser, createFakePlantDna } from '../factories';

describe('[INTEGRATION] AgentTool — add_plant_to_garden', () => {

  let registry: AgentToolRegistry;
  let userId: string;

  beforeEach(async () => {
    const user = await UserModel.create(createFakeUser());
    userId = user._id.toString();

    // Seed PlantDna
    await PlantDnaModel.create(createFakePlantDna({ species: 'Tomato' }));

    registry = new AgentToolRegistry();
  });

  it('يجب ينشئ zone تلقائي لو مفيش وينضم النبات — FIX TASK-0.3', async () => {
    const result = await registry.executeTool(
      'add_plant_to_garden',
      { plantName: 'Tomato' },
      userId
    );

    // Check result message
    expect(result).toContain('Successfully added');
    expect(result).toContain('Tomato');

    // Check Zone was created
    const zone = await ZoneModel.findOne({ user: userId });
    expect(zone).not.toBeNull();
    expect(zone!.name).toBe('Default Zone');

    // Check Plant was created with REAL zone ID
    const plant = await PlantModel.findOne({ user: userId });
    expect(plant).not.toBeNull();
    expect(plant!.zone.toString()).toBe(zone!._id.toString());
    // Must NOT be a random non-existent ObjectId
    const zoneExists = await ZoneModel.findById(plant!.zone);
    expect(zoneExists).not.toBeNull();
  });

  it('يجب يستخدم الـ zone الموجود لو عنده واحد', async () => {
    // Pre-create garden and zone
    const garden = await GardenModel.create({
      user: userId, name: 'Existing Garden', type: 'OUTDOOR'
    });
    await ZoneModel.create({
      user: userId, garden: garden._id, name: 'Existing Zone', type: 'FULL_SUN'
    });

    await registry.executeTool('add_plant_to_garden', { plantName: 'Tomato' }, userId);

    // Should only have 1 zone still
    const zoneCount = await ZoneModel.countDocuments({ user: userId });
    expect(zoneCount).toBe(1);
  });

  it('يجب يرجع error message لو النبات مش موجود في الـ library', async () => {
    const result = await registry.executeTool(
      'add_plant_to_garden',
      { plantName: 'SomeFakePlantXYZ999' },
      userId
    );

    expect(result).toContain('not found');
    expect(result).toContain('Try:');

    // No plant should be created
    const plantCount = await PlantModel.countDocuments({ user: userId });
    expect(plantCount).toBe(0);
  });
});

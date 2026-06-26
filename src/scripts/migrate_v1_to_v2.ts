import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load env
dotenv.config();

// V2 Models
import UserModel from '../models/user_model';
import GardenModel from '../models/garden_model';
import ZoneModel, { ZoneType } from '../models/zone_model';
import PlantDnaModel from '../models/plant_dna_model';
import PlantModel, { PlantStage } from '../models/plant_model';
import CareActionModel, { CareActionType } from '../models/care_action_model';
import TaskModel, { TaskStatus } from '../models/task_model';

// V1 Models
import MyPlantModel from '../models/my_plant_model';
import WateringLogModel from '../models/watering_log_model';
import FertilizerLogModel from '../models/fertilizer_log_model';
import ReminderModel from '../models/reminder_model';

async function runMigration() {
  logger.info('Starting V1 to V2 Data Migration...');

  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    logger.info('Connected to MongoDB');

    // 1. Dictionary Migration (`plants` collection without `user` -> `plant_dnas`)
    logger.info('--- Phase 1: Dictionary Migration ---');
    
    // We use the raw db instance because PlantModel is now mapped to V2 schema
    const db = mongoose.connection.db;
    if (!db) throw new Error('DB connection failed');
    
    // Find plants that don't have a user (legacy dictionary)
    const legacyPlants = await db.collection('plants').find({ user: { $exists: false } }).toArray();
    logger.info(`Found ${legacyPlants.length} legacy dictionary plants`);

    for (const legacyPlant of legacyPlants) {
      // Check if it already exists in DNA to be safe
      const exists = await PlantDnaModel.findOne({ scientificName: legacyPlant.scientificName });
      if (!exists) {
        await PlantDnaModel.create({
          _id: legacyPlant._id, // Preserve ID for foreign keys
          species: legacyPlant.scientificName || legacyPlant.nameEn || legacyPlant.name || 'Unknown',
          commonName: legacyPlant.name || legacyPlant.nameAr || 'Unknown',
          waterNeeds: legacyPlant.waterRequirements || 'Medium',
          sunlightNeeds: legacyPlant.lightRequirements || 'Medium',
          soilType: legacyPlant.soilRequirements || 'Well-draining',
          hardinessZone: legacyPlant.temperatureRange || 'Unknown',
          toxicity: legacyPlant.toxicityLevel || 'Unknown',
          wateringFrequency: legacyPlant.wateringFrequency || 7
        });
      }
      
      // Delete from old plants to avoid conflict with V2 user plants
      await db.collection('plants').deleteOne({ _id: legacyPlant._id });
    }
    logger.info('Phase 1 completed.');

    // 2. Hierarchy Generation (`users` -> `gardens` & `zones`)
    logger.info('--- Phase 2: Hierarchy Generation ---');
    const users = await UserModel.find();
    logger.info(`Found ${users.length} users to process.`);

    const userZoneMap = new Map<string, { indoorId: string; outdoorId: string }>();

    for (const user of users) {
      let garden = await GardenModel.findOne({ user: user._id });
      if (!garden) {
        garden = await GardenModel.create({
          user: user._id,
          name: 'My Home Garden',
          location: 'Home'
        });
      }

      let indoorZone = await ZoneModel.findOne({ user: user._id, type: ZoneType.INDOOR_WINDOW });
      if (!indoorZone) {
        indoorZone = await ZoneModel.create({
          user: user._id,
          garden: garden._id,
          name: 'Indoor',
          type: ZoneType.INDOOR_WINDOW
        });
      }

      let outdoorZone = await ZoneModel.findOne({ user: user._id, type: ZoneType.FULL_SUN });
      if (!outdoorZone) {
        outdoorZone = await ZoneModel.create({
          user: user._id,
          garden: garden._id,
          name: 'Outdoor',
          type: ZoneType.FULL_SUN
        });
      }

      userZoneMap.set(user._id.toString(), {
        indoorId: indoorZone._id.toString(),
        outdoorId: outdoorZone._id.toString()
      });
    }
    logger.info('Phase 2 completed.');

    // 3. User Plants Migration (`myplants` -> `plants`)
    logger.info('--- Phase 3: MyPlants Migration ---');
    const myPlants = await MyPlantModel.find();
    logger.info(`Found ${myPlants.length} legacy user plants`);

    for (const legacy of myPlants) {
      const existingPlant = await PlantModel.findById(legacy._id);
      if (!existingPlant) {
        const zones = userZoneMap.get(legacy.user.toString());
        if (!zones) continue;

        // Map location enum
        const isOutdoor = legacy.location === 'outdoor' || legacy.location === 'خارجي';
        const zoneId = isOutdoor ? zones.outdoorId : zones.indoorId;

        // If plantLibraryId is missing, fallback to a generic DNA or handle gracefully
        let dnaId = legacy.plantLibraryId;
        if (!dnaId) {
          // Find or create a generic DNA
          let genericDna = await PlantDnaModel.findOne({ species: 'Unknown' });
          if (!genericDna) {
            genericDna = await PlantDnaModel.create({ species: 'Unknown', commonName: 'Custom Plant' });
          }
          dnaId = genericDna._id as any;
        }

        await PlantModel.create({
          _id: legacy._id, // Preserve ID so logs and reminders map correctly
          user: legacy.user,
          zone: zoneId,
          dna: dnaId,
          name: legacy.name,
          imageUrl: legacy.imageUrl,
          stage: PlantStage.MATURE,
          healthScore: legacy.healthStatus === 'excellent' || legacy.healthStatus === 'ممتازة' ? 100 : 70,
          lastWatered: legacy.lastWatered,
          createdAt: legacy.createdAt,
          updatedAt: legacy.updatedAt
        });
      }
    }
    logger.info('Phase 3 completed.');

    // 4. Care Actions Migration (`watering_logs`, `fertilizer_logs` -> `care_actions`)
    logger.info('--- Phase 4: Care Actions Migration ---');
    const wateringLogs = await WateringLogModel.find();
    for (const log of wateringLogs) {
      const existing = await CareActionModel.findById(log._id);
      if (!existing) {
        await CareActionModel.create({
          _id: log._id,
          plant: log.plant,
          user: log.user,
          actionType: CareActionType.WATER,
          date: log.wateredAt,
          notes: log.note || 'Migrated from V1'
        });
      }
    }

    const fertilizerLogs = await FertilizerLogModel.find();
    for (const log of fertilizerLogs) {
      const existing = await CareActionModel.findById(log._id);
      if (!existing) {
        await CareActionModel.create({
          _id: log._id,
          plant: log.plant,
          user: log.user,
          actionType: CareActionType.FERTILIZER,
          date: (log as any).fertilizedAt || log.createdAt,
          notes: (log as any).note || 'Migrated from V1'
        });
      }
    }
    logger.info(`Migrated ${wateringLogs.length} watering logs and ${fertilizerLogs.length} fertilizer logs.`);
    logger.info('Phase 4 completed.');

    // 5. Task Migration (`reminders` -> `tasks`)
    logger.info('--- Phase 5: Task Migration ---');
    const reminders = await ReminderModel.find();
    let migratedTasks = 0;
    
    for (const rem of reminders) {
      const existing = await TaskModel.findById(rem._id);
      if (!existing) {
        // Only active/pending tasks
        if (rem.enabled) {
          await TaskModel.create({
            _id: rem._id,
            user: rem.user,
            plant: rem.plantId,
            title: `Migrated: ${rem.title || 'Reminder'}`,
            dueDate: rem.scheduledAt || new Date(),
            status: TaskStatus.PENDING
          });
          migratedTasks++;
        }
      }
    }
    logger.info(`Migrated ${migratedTasks} pending reminders to tasks.`);
    logger.info('Phase 5 completed.');

    logger.info('--- MIGRATION COMPLETED SUCCESSFULLY ---');
    process.exit(0);

  } catch (err) {
    logger.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigration();



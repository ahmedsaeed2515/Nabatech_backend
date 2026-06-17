"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv = __importStar(require("dotenv"));
const logger_1 = require("../utils/logger");
// Load env
dotenv.config();
// V2 Models
const user_model_1 = __importDefault(require("../models/user_model"));
const garden_model_1 = __importDefault(require("../models/garden_model"));
const zone_model_1 = __importStar(require("../models/zone_model"));
const plant_dna_model_1 = __importDefault(require("../models/plant_dna_model"));
const plant_model_1 = __importStar(require("../models/plant_model"));
const care_action_model_1 = __importStar(require("../models/care_action_model"));
const task_model_1 = __importStar(require("../models/task_model"));
// V1 Models
const my_plant_model_1 = __importDefault(require("../models/my_plant_model"));
const watering_log_model_1 = __importDefault(require("../models/watering_log_model"));
const fertilizer_log_model_1 = __importDefault(require("../models/fertilizer_log_model"));
const reminder_model_1 = __importDefault(require("../models/reminder_model"));
async function runMigration() {
    logger_1.logger.info('Starting V1 to V2 Data Migration...');
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        logger_1.logger.info('Connected to MongoDB');
        // 1. Dictionary Migration (`plants` collection without `user` -> `plant_dnas`)
        logger_1.logger.info('--- Phase 1: Dictionary Migration ---');
        // We use the raw db instance because PlantModel is now mapped to V2 schema
        const db = mongoose_1.default.connection.db;
        if (!db)
            throw new Error('DB connection failed');
        // Find plants that don't have a user (legacy dictionary)
        const legacyPlants = await db.collection('plants').find({ user: { $exists: false } }).toArray();
        logger_1.logger.info(`Found ${legacyPlants.length} legacy dictionary plants`);
        for (const legacyPlant of legacyPlants) {
            // Check if it already exists in DNA to be safe
            const exists = await plant_dna_model_1.default.findOne({ scientificName: legacyPlant.scientificName });
            if (!exists) {
                await plant_dna_model_1.default.create({
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
        logger_1.logger.info('Phase 1 completed.');
        // 2. Hierarchy Generation (`users` -> `gardens` & `zones`)
        logger_1.logger.info('--- Phase 2: Hierarchy Generation ---');
        const users = await user_model_1.default.find();
        logger_1.logger.info(`Found ${users.length} users to process.`);
        const userZoneMap = new Map();
        for (const user of users) {
            let garden = await garden_model_1.default.findOne({ user: user._id });
            if (!garden) {
                garden = await garden_model_1.default.create({
                    user: user._id,
                    name: 'My Home Garden',
                    location: 'Home'
                });
            }
            let indoorZone = await zone_model_1.default.findOne({ user: user._id, type: zone_model_1.ZoneType.INDOOR_WINDOW });
            if (!indoorZone) {
                indoorZone = await zone_model_1.default.create({
                    user: user._id,
                    garden: garden._id,
                    name: 'Indoor',
                    type: zone_model_1.ZoneType.INDOOR_WINDOW
                });
            }
            let outdoorZone = await zone_model_1.default.findOne({ user: user._id, type: zone_model_1.ZoneType.FULL_SUN });
            if (!outdoorZone) {
                outdoorZone = await zone_model_1.default.create({
                    user: user._id,
                    garden: garden._id,
                    name: 'Outdoor',
                    type: zone_model_1.ZoneType.FULL_SUN
                });
            }
            userZoneMap.set(user._id.toString(), {
                indoorId: indoorZone._id.toString(),
                outdoorId: outdoorZone._id.toString()
            });
        }
        logger_1.logger.info('Phase 2 completed.');
        // 3. User Plants Migration (`myplants` -> `plants`)
        logger_1.logger.info('--- Phase 3: MyPlants Migration ---');
        const myPlants = await my_plant_model_1.default.find();
        logger_1.logger.info(`Found ${myPlants.length} legacy user plants`);
        for (const legacy of myPlants) {
            const existingPlant = await plant_model_1.default.findById(legacy._id);
            if (!existingPlant) {
                const zones = userZoneMap.get(legacy.user.toString());
                if (!zones)
                    continue;
                // Map location enum
                const isOutdoor = legacy.location === 'outdoor' || legacy.location === 'خارجي';
                const zoneId = isOutdoor ? zones.outdoorId : zones.indoorId;
                // If plantLibraryId is missing, fallback to a generic DNA or handle gracefully
                let dnaId = legacy.plantLibraryId;
                if (!dnaId) {
                    // Find or create a generic DNA
                    let genericDna = await plant_dna_model_1.default.findOne({ species: 'Unknown' });
                    if (!genericDna) {
                        genericDna = await plant_dna_model_1.default.create({ species: 'Unknown', commonName: 'Custom Plant' });
                    }
                    dnaId = genericDna._id;
                }
                await plant_model_1.default.create({
                    _id: legacy._id, // Preserve ID so logs and reminders map correctly
                    user: legacy.user,
                    zone: zoneId,
                    dna: dnaId,
                    name: legacy.name,
                    imageUrl: legacy.imageUrl,
                    stage: plant_model_1.PlantStage.MATURE,
                    healthScore: legacy.healthStatus === 'excellent' || legacy.healthStatus === 'ممتازة' ? 100 : 70,
                    lastWatered: legacy.lastWatered,
                    createdAt: legacy.createdAt,
                    updatedAt: legacy.updatedAt
                });
            }
        }
        logger_1.logger.info('Phase 3 completed.');
        // 4. Care Actions Migration (`watering_logs`, `fertilizer_logs` -> `care_actions`)
        logger_1.logger.info('--- Phase 4: Care Actions Migration ---');
        const wateringLogs = await watering_log_model_1.default.find();
        for (const log of wateringLogs) {
            const existing = await care_action_model_1.default.findById(log._id);
            if (!existing) {
                await care_action_model_1.default.create({
                    _id: log._id,
                    plant: log.plant,
                    user: log.user,
                    actionType: care_action_model_1.CareActionType.WATER,
                    date: log.wateredAt,
                    notes: log.note || 'Migrated from V1'
                });
            }
        }
        const fertilizerLogs = await fertilizer_log_model_1.default.find();
        for (const log of fertilizerLogs) {
            const existing = await care_action_model_1.default.findById(log._id);
            if (!existing) {
                await care_action_model_1.default.create({
                    _id: log._id,
                    plant: log.plant,
                    user: log.user,
                    actionType: care_action_model_1.CareActionType.FERTILIZER,
                    date: log.fertilizedAt || log.createdAt,
                    notes: log.note || 'Migrated from V1'
                });
            }
        }
        logger_1.logger.info(`Migrated ${wateringLogs.length} watering logs and ${fertilizerLogs.length} fertilizer logs.`);
        logger_1.logger.info('Phase 4 completed.');
        // 5. Task Migration (`reminders` -> `tasks`)
        logger_1.logger.info('--- Phase 5: Task Migration ---');
        const reminders = await reminder_model_1.default.find();
        let migratedTasks = 0;
        for (const rem of reminders) {
            const existing = await task_model_1.default.findById(rem._id);
            if (!existing) {
                // Only active/pending tasks
                if (rem.enabled) {
                    await task_model_1.default.create({
                        _id: rem._id,
                        user: rem.user,
                        plant: rem.plantId,
                        title: `Migrated: ${rem.title || 'Reminder'}`,
                        dueDate: rem.scheduledAt || new Date(),
                        status: task_model_1.TaskStatus.PENDING
                    });
                    migratedTasks++;
                }
            }
        }
        logger_1.logger.info(`Migrated ${migratedTasks} pending reminders to tasks.`);
        logger_1.logger.info('Phase 5 completed.');
        logger_1.logger.info('--- MIGRATION COMPLETED SUCCESSFULLY ---');
        process.exit(0);
    }
    catch (err) {
        logger_1.logger.error('Migration failed:', err);
        process.exit(1);
    }
}
runMigration();

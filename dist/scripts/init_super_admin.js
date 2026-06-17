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
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_model_1 = __importStar(require("../models/user_model"));
dotenv_1.default.config();
const initSuperAdmin = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nabatech');
        console.log('Connected to DB');
        const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@nabatech.local';
        const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SuperSecret123!';
        const existingAdmin = await user_model_1.default.findOne({ email: adminEmail });
        if (existingAdmin) {
            if (existingAdmin.role !== user_model_1.UserRole.SUPER_ADMIN) {
                existingAdmin.role = user_model_1.UserRole.SUPER_ADMIN;
                await existingAdmin.save();
                console.log(`Updated existing user ${adminEmail} to super_admin`);
            }
            else {
                console.log(`Super admin ${adminEmail} already exists`);
            }
            process.exit(0);
        }
        const hashedPassword = await bcryptjs_1.default.hash(adminPassword, 10);
        const superAdmin = new user_model_1.default({
            name: 'Super Admin',
            email: adminEmail,
            password: hashedPassword,
            role: user_model_1.UserRole.SUPER_ADMIN,
            emailVerified: true
        });
        await superAdmin.save();
        console.log(`Super admin created with email: ${adminEmail}`);
        process.exit(0);
    }
    catch (error) {
        console.error('Error creating super admin:', error);
        process.exit(1);
    }
};
initSuperAdmin();

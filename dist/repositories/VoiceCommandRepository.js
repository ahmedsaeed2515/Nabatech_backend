"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceCommandRepository = void 0;
const BaseRepository_1 = require("./BaseRepository");
const voice_command_model_1 = __importDefault(require("../models/voice_command_model"));
class VoiceCommandRepository extends BaseRepository_1.BaseRepository {
    constructor() {
        super(voice_command_model_1.default);
    }
    async findByUser(userId) {
        return this.model.find({ user: userId }).sort({ createdAt: -1 }).exec();
    }
}
exports.VoiceCommandRepository = VoiceCommandRepository;

import { BaseRepository } from './BaseRepository';
import VoiceCommandModel, { VoiceCommand } from '../models/voice_command_model';

export class VoiceCommandRepository extends BaseRepository<VoiceCommand> {
  constructor() {
    super(VoiceCommandModel);
  }

  async findByUser(userId: string): Promise<VoiceCommand[]> {
    return this.model.find({ user: userId }).sort({ createdAt: -1 }).exec();
  }
}

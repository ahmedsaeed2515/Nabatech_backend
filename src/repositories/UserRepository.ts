import UserModel, { User } from '../models/user_model';
import { BaseRepository } from './BaseRepository';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.model.findOne({ email }).exec();
  }
}



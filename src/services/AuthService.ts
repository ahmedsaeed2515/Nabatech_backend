import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/user_model';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(email: string, passwordHash: string): Promise<User> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new Error('Email already in use');
    }

    // Usually passwordHash comes raw from client, we hash it
    const hashed = await bcrypt.hash(passwordHash, 10);
    return this.userRepository.create({ email, passwordHash: hashed });
  }

  async login(email: string, passwordHash: string): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(passwordHash, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign({ userId: user._id, role: user.role }, secret, { expiresIn: '7d' });

    return { user, token };
  }
}

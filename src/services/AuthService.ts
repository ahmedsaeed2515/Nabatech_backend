import bcrypt from 'bcryptjs';
import { UserRepository } from '../repositories/UserRepository';
import { User } from '../models/user_model';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken';

/**
 * AuthService (V2)
 * ─────────────────
 * This service is used by the V2 AuthController (routers/v2/index.ts).
 * It issues tokens compatible with the shared auth middleware (protect / protectV2).
 * Token payload must match generateAccessToken: { id, sub, role, tokenVersion }
 */
export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(email: string, password: string): Promise<User> {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new Error('Email already in use');
    }

    const hashed = await bcrypt.hash(password, 10);
    return this.userRepository.create({ email, passwordHash: hashed });
  }

  async login(email: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Account status gate
    if (user.status === 'disabled') {
      throw new Error('Account is disabled');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Issue tokens using the shared utility so payloads are consistent across V1 and V2
    const accessToken = generateAccessToken(
      user._id.toString(),
      user.role || 'user',
      user.tokenVersion ?? 0
    );
    const { token: refreshToken } = generateRefreshToken(user._id.toString());

    return { user, accessToken, refreshToken };
  }
}

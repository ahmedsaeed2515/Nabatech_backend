import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { registerSchema, loginSchema } from '../validation/v2';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response) => {
    try {
      const parsed = registerSchema.parse(req.body);
      const user = await this.authService.register(parsed.email, parsed.password);
      const userOut = {
        id: (user as any)._id?.toString(),
        email: user.email,
        role: user.role,
      };
      res.status(201).json({ status: 'success', data: { user: userOut } });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.parse(req.body);
      // AuthService now returns { user, accessToken, refreshToken }
      const { user, accessToken, refreshToken } = await this.authService.login(parsed.email, parsed.password);
      const userOut = {
        id: (user as any)._id?.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
        avatarUrl: user.avatarUrl,
      };
      res.status(200).json({
        status: 'success',
        data: { user: userOut, accessToken, refreshToken }
      });
    } catch (err: any) {
      const status = err.message === 'Account is disabled' ? 403 : 401;
      res.status(status).json({ status: 'error', message: err.message });
    }
  };
}

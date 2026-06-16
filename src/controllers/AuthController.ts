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
      res.status(201).json({ status: 'success', data: user });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const { user, token } = await this.authService.login(parsed.email, parsed.password);
      res.status(200).json({ status: 'success', data: { user, token } });
    } catch (err: any) {
      res.status(401).json({ status: 'error', message: err.message });
    }
  };
}

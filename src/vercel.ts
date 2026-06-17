import { Request, Response } from 'express';

export default async function handler(req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: "Hello from Vercel! Your basic routing works. The full app is temporarily disabled for debugging."
  });
}

module.exports = handler;

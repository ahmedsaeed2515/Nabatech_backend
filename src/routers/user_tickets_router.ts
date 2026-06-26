import { Router } from "express";
import {
  createTicket,
  getUserTickets,
  getUserTicketById,
  replyToOwnTicket
} from "../controllers/user_tickets_controller";
import { protect } from "../middlewares/auth_middleware";
import jwt from "jsonwebtoken";
import User from "../models/user_model";
import { Request, Response, NextFunction } from "express";

const router = Router();

// Middleware to optionally populate req.user if a valid token is provided
const optionalProtect = async (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret) as any;
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.status !== 'disabled' && user.tokenVersion === decoded.tokenVersion) {
          (req as any).user = user;
        }
      }
    } catch (error) {
      // Fail silently and proceed as guest
    }
  }
  next();
};

router.post("/", optionalProtect, createTicket);
router.get("/", protect, getUserTickets);
router.get("/:id", protect, getUserTicketById);
router.post("/:id/reply", protect, replyToOwnTicket);

export default router;



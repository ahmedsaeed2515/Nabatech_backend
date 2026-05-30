import { Request , Response , NextFunction } from "express";
import jwt from 'jsonwebtoken';
import User from "../models/user_model";

interface JwtPayload {
      id: string;              
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
            
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).json({ message: "Not authorized, user not found" });
            }
            
            (req as any).user = user;
            return next();
        } catch (error) {
            return res.status(401).json({ message: "Not authorized, token failed" });
        }
    }

    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }
};

export const admin = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (user && user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Not authorized as an admin" });
    }
};
import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import User from "../models/user_model";
import { AppError } from "../utils/app_error";

interface JwtPayload {
    id: string;
    sub: string;
    role: string;
    tokenVersion: number;
}

export const protect = async (req: Request, res: Response, next: NextFunction) => {
    console.log("protect called! Auth header:", req.headers.authorization ? 'present' : 'missing');
    
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return next(new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, missing or invalid token format' }));
    }

    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
        return next(new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, no token provided' }));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as JwtPayload;

        const user = await User.findById(decoded.id).select('-passwordHash');
        if (!user) {
            return next(new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, user not found' }));
        }

        if (user.status === 'disabled') {
            return next(new AppError({ code: 'AUTH_FORBIDDEN', statusCode: 403, message: 'Your account has been disabled' }));
        }

        if (decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
            return next(new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Session expired, please login again' }));
        }

        (req as any).user = user;
        return next();
    } catch (error) {
        console.error("JWT Verification failed:", error);
        return next(new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, token failed' }));
    }
};

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
        console.log("authorizeRoles User:", user ? Object.keys(user) : 'No user', "Role:", user?.role);
        if (!user || !user.role) {
            return next(new AppError({ code: 'AUTH_FORBIDDEN', statusCode: 403, message: 'Access denied: No role assigned' }));
        }

        if (!roles.includes(user.role)) {
            return next(new AppError({ code: 'AUTH_FORBIDDEN', statusCode: 403, message: `Access denied: Requires one of [${roles.join(', ')}]` }));
        }

        next();
    };
};

export const admin = authorizeRoles('admin', 'super_admin');



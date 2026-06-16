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
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new Error('JWT_SECRET is not configured');
            }
            const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return next(new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, user not found' }));
            }
            
            if (user.status === 'disabled') {
                return next(new AppError({ code: 'AUTH_ACCOUNT_DISABLED', statusCode: 401, message: 'Account disabled' }));
            }
            
            if (user.tokenVersion !== decoded.tokenVersion) {
                return next(new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Token invalid or revoked' }));
            }

            (req as any).user = user;
            return next();
        } catch (error) {
            return next(new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, token failed' }));
        }
    }

    if (!token) {
        return next(new AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, no token' }));
    }
};

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;
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

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
    
    // TEMPORARY TESTING MOCK TO BYPASS AUTH
    (req as any).user = { id: "6a34bc5a27f1ee0a94b8f6d9", role: "super_admin" };
    return next();
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

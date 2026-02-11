import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
    user?: any;
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');




    if (!token) {
        console.warn(`[Auth] Missing token for ${req.url}`);
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;


        next();
    } catch (error) {
        console.error(`[Auth] Invalid token for ${req.url}`, error);
        res.status(400).json({ error: 'Invalid token.' });
    }
};

import { Request, Response, NextFunction } from 'express';
import { tokenService } from '../auth/tokenService';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Missing authentication token' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = tokenService.verifyAccessToken(token);
    (req as any).userId = payload.userId;
    (req as any).sessionId = payload.sessionId;
    next();
  } catch (error) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
};

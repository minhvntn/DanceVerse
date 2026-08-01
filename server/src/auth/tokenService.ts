import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';

export interface AccessTokenPayload {
  userId: string;
  sessionId: string;
  role?: string;
}

export const tokenService = {
  generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN as any });
  },

  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
  },

  generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  },

  hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
};

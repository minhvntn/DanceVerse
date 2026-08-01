import { Request, Response } from 'express';
import { authService } from './authService';
import { registerSchema, loginSchema } from './authSchemas';
import { ZodError } from 'zod';
import prisma from '../database/prisma';
import { passwordService } from './passwordService';

const COOKIE_NAME = 'dv_refresh_token';
const IS_PROD = process.env.COOKIE_SECURE === 'true';

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax', // Use lax or strict based on your domain setup
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

const clearRefreshCookie = (res: Response) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    path: '/'
  });
};

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);
      const user = await authService.register(data);
      res.status(201).json({ message: 'User registered successfully', userId: user.id });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ code: 'VALIDATION_ERROR', message: error.issues[0].message });
      }
      res.status(409).json({ code: 'ACCOUNT_EXISTS', message: error.message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);
      const { user, accessToken, refreshToken } = await authService.login(data, req.headers['user-agent'], req.ip);
      
      setRefreshCookie(res, refreshToken);
      res.json({ accessToken, user });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ code: 'VALIDATION_ERROR', message: error.issues[0].message });
      }
      res.status(401).json({ code: 'INVALID_CREDENTIALS', message: error.message });
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies[COOKIE_NAME];
      if (!refreshToken) {
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'No refresh token' });
      }

      const { user, accessToken, refreshToken: newRefreshToken } = await authService.refresh(
        refreshToken, 
        req.headers['user-agent'], 
        req.ip
      );

      setRefreshCookie(res, newRefreshToken);
      res.json({ accessToken, user });
    } catch (error: any) {
      clearRefreshCookie(res);
      res.status(401).json({ code: 'SESSION_EXPIRED', message: error.message });
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const refreshToken = req.cookies[COOKIE_NAME];
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      clearRefreshCookie(res);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      clearRefreshCookie(res);
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Logout failed' });
    }
  },

  async logoutAll(req: Request, res: Response) {
    try {
      const { userId } = req.body; // Requires auth middleware to extract userId
      if (!userId) {
        return res.status(401).json({ code: 'UNAUTHORIZED', message: 'User ID required' });
      }
      await authService.logoutAll(userId);
      clearRefreshCookie(res);
      res.json({ message: 'Logged out from all devices' });
    } catch (error) {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to logout from all devices' });
    }
  },

  async setPassword(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters' });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ code: 'NOT_FOUND' });

      const passwordHash = await passwordService.hash(password);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash }
      });

      res.json({ message: 'Password set successfully' });
    } catch (error) {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to set password' });
    }
  }
};

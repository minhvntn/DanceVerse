import { Request, Response } from 'express';
import prisma from '../database/prisma';

export const userController = {
  async getMe(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { preferences: true }
      });

      if (!user) return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });

      // Remove sensitive data
      const { passwordHash, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch profile' });
    }
  },

  async updateMe(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      if (!userId) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });

      const { displayName, avatarType, avatarConfig, preferences } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          displayName,
          avatarType,
          avatarConfig,
          ...(preferences && {
            preferences: {
              update: preferences
            }
          })
        },
        include: { preferences: true }
      });

      const { passwordHash, ...safeUser } = updatedUser;
      res.json(safeUser);
    } catch (error) {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to update profile' });
    }
  }
};

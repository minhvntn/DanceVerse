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

  async getUserById(req: Request, res: Response) {
    try {
      const targetUserId = req.params.id;
      const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        include: {
          _count: {
            select: { followers: true }
          },
          hostEvents: {
            where: { status: { in: ['scheduled', 'live', 'ended'] } },
            orderBy: { scheduledAt: 'desc' },
            take: 10
          }
        }
      });

      if (!user) return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });

      // Remove sensitive data
      const { passwordHash, email, emailVerifiedAt, ...publicProfile } = user;
      res.json(publicProfile);
    } catch (error) {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch user profile' });
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
  },

  async followUser(req: Request, res: Response) {
    try {
      const followerId = (req as any).userId;
      const followingUserId = req.params.id;

      if (!followerId) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
      if (followerId === followingUserId) return res.status(400).json({ code: 'BAD_REQUEST', message: 'Cannot follow yourself' });

      await prisma.follow.upsert({
        where: { followerId_followingUserId: { followerId, followingUserId } },
        create: { followerId, followingUserId },
        update: {}
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to follow user' });
    }
  },

  async unfollowUser(req: Request, res: Response) {
    try {
      const followerId = (req as any).userId;
      const followingUserId = req.params.id;

      if (!followerId) return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Not authenticated' });

      await prisma.follow.delete({
        where: { followerId_followingUserId: { followerId, followingUserId } }
      }).catch(() => null);

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to unfollow user' });
    }
  }
};

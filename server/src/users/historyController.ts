import { Request, Response } from 'express';
import prisma from '../database/prisma';

export const historyController = {
  async getHistory(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const history = await prisma.roomHistory.findMany({
        where: { userId },
        orderBy: { joinedAt: 'desc' },
        take: 20
      });
      res.json(history);
    } catch (e) {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch history' });
    }
  }
};

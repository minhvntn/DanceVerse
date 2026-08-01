import { Request, Response } from 'express';
import prisma from '../database/prisma';

export const playlistController = {
  async getPlaylists(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const playlists = await prisma.userPlaylist.findMany({
        where: { userId },
        include: { items: true }
      });
      res.json(playlists);
    } catch (e) {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to fetch playlists' });
    }
  },

  async createPlaylist(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { name, description } = req.body;
      const playlist = await prisma.userPlaylist.create({
        data: { name, description, userId }
      });
      res.json(playlist);
    } catch (e) {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to create playlist' });
    }
  },

  async addPlaylistItem(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { playlistId } = req.params;
      const { source, sourceId, title, originalUrl, thumbnailUrl, duration } = req.body;

      const playlist = await prisma.userPlaylist.findUnique({ where: { id: playlistId } });
      if (!playlist || playlist.userId !== userId) {
        return res.status(403).json({ code: 'FORBIDDEN', message: 'Not allowed' });
      }

      const count = await prisma.userPlaylistItem.count({ where: { playlistId } });

      const item = await prisma.userPlaylistItem.create({
        data: {
          playlistId,
          userId,
          source,
          sourceId,
          title,
          originalUrl,
          thumbnailUrl,
          duration,
          position: count
        }
      });
      res.json(item);
    } catch (e) {
      res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Failed to add item' });
    }
  }
};

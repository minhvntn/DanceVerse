import { Request, Response } from 'express';
import { PlaylistService } from './playlist.service';
import { RequestService } from './request.service';
import { ModerationService } from './moderation.service';
import { YoutubeService } from './youtube.service';
import prisma from '../database/prisma';

export class DJController {
  
  // ============================
  // YOUTUBE METADATA
  // ============================
  static async resolveYoutubeUrl(req: Request, res: Response) {
    try {
      const { url } = req.query;
      if (!url || typeof url !== 'string') return res.status(400).json({ message: 'URL is required' });
      
      const metadata = await YoutubeService.fetchMetadata(url);
      res.json(metadata);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // ============================
  // PLAYLIST MANAGEMENT
  // ============================
  static async getPlaylist(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const playlist = await PlaylistService.getPlaylist(eventId);
      res.json(playlist);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  static async addPlaylistItem(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const userId = (req as any).userId;
      
      // Verify Host/Co-host
      await DJController.verifyDjRole(eventId, userId);

      const item = await PlaylistService.addPlaylistItem(eventId, req.body);
      res.status(201).json(item);
    } catch (err: any) {
      res.status(403).json({ message: err.message });
    }
  }

  static async updatePlaylistOrder(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const { orderedIds } = req.body;
      const userId = (req as any).userId;
      
      await DJController.verifyDjRole(eventId, userId);
      
      const playlist = await PlaylistService.updatePlaylistOrder(eventId, orderedIds);
      res.json(playlist);
    } catch (err: any) {
      res.status(403).json({ message: err.message });
    }
  }

  static async removePlaylistItem(req: Request, res: Response) {
    try {
      const { eventId, itemId } = req.params;
      const userId = (req as any).userId;
      
      await DJController.verifyDjRole(eventId, userId);
      await PlaylistService.removePlaylistItem(itemId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(403).json({ message: err.message });
    }
  }

  // ============================
  // SONG REQUESTS
  // ============================
  static async getRequests(req: Request, res: Response) {
    try {
      const requests = await RequestService.getRequests(req.params.eventId);
      res.json(requests);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }

  static async submitRequest(req: Request, res: Response) {
    try {
      const { eventId } = req.params;
      const userId = (req as any).userId;
      const request = await RequestService.submitRequest(eventId, userId, req.body);
      res.status(201).json(request);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  static async updateRequestStatus(req: Request, res: Response) {
    try {
      const { eventId, requestId } = req.params;
      const { status } = req.body;
      const userId = (req as any).userId;

      await DJController.verifyDjRole(eventId, userId);
      const updated = await RequestService.updateRequestStatus(requestId, status);
      res.json(updated);
    } catch (err: any) {
      res.status(403).json({ message: err.message });
    }
  }

  static async toggleVote(req: Request, res: Response) {
    try {
      const { requestId } = req.params;
      const userId = (req as any).userId;
      const isVoted = await RequestService.toggleVote(requestId, userId);
      res.json({ isVoted });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  // ============================
  // ROLE & EVENT HELPERS
  // ============================
  private static async verifyDjRole(eventId: string, userId: string) {
    const event = await prisma.concertEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new Error('Event not found');
    if (event.hostId === userId) return true;

    const role = await prisma.eventRole.findUnique({
      where: { eventId_userId: { eventId, userId } }
    });

    if (role?.role === 'cohost') return true;

    throw new Error('Unauthorized. Must be Host or Co-host.');
  }
}

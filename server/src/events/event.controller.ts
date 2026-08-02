import { Request, Response } from 'express';
import { EventService } from './event.service';
import { RoomManager } from '../rooms/room.manager';
import prisma from '../database/prisma';

export class EventController {
  static async createEvent(req: Request, res: Response) {
    try {
      const hostId = (req as any).userId;
      
      const {
        title,
        description,
        coverImage,
        tags,
        visibility,
        scheduledAt,
        capacity,
        goLiveNow
      } = req.body;

      if (!title || !scheduledAt) {
        return res.status(400).json({ message: 'Title and ScheduledAt are required' });
      }

      // If goLiveNow, we might want to also create the room here, 
      // but usually the frontend emits a socket event or we just set status to live.
      // For now, let's just create the event.
      const status = goLiveNow ? 'live' : 'scheduled';
      const eventDate = new Date(scheduledAt);

      if (!goLiveNow && eventDate < new Date()) {
        return res.status(400).json({ message: 'Cannot schedule in the past' });
      }

      // Create user to get nickname
      const user = await prisma.user.findUnique({ where: { id: hostId } });

      let roomId = null;
      let hostToken = null;

      if (goLiveNow) {
        const roomConfig = {
          name: title,
          password: undefined,
          maxPlayers: capacity || 100,
          visibility: (visibility === 'public' ? 'public' : 'private') as 'public' | 'private',
          allowChat: true,
          allowGuestEmotes: true,
          hostId,
          nickname: user?.displayName || 'Host',
          avatarType: 'Boy' as any
        };
        const result = RoomManager.createRoom(roomConfig);
        roomId = result.roomId;
        hostToken = result.hostToken;
      }

      const event = await EventService.createEvent({
        hostId,
        title,
        description,
        coverImage,
        tags: tags || [],
        visibility: visibility || 'public',
        scheduledAt: eventDate,
        capacity: capacity || 100,
        status: goLiveNow ? 'live' : 'scheduled',
        roomId: roomId || undefined
      });

      res.status(201).json({ event, roomId, hostToken });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }

  static async listEvents(req: Request, res: Response) {
    try {
      const { status, hostId, limit } = req.query;
      const events = await EventService.listEvents({
        status: status as string | string[],
        hostId: hostId as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      // parse JSON tags
      const formatted = events.map(e => ({
        ...e,
        tags: e.tags ? JSON.parse(e.tags) : []
      }));

      res.json(formatted);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }

  static async getFollowingEvents(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      // Get all hosts the user follows
      const follows = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingUserId: true }
      });
      const followingIds = follows.map((f: any) => f.followingUserId);

      if (followingIds.length === 0) {
        return res.json([]);
      }

      const events = await EventService.listEvents({
        hostId: { in: followingIds } as any,
        status: ['scheduled', 'live'],
        orderBy: 'asc'
      });

      const formatted = events.map(e => ({
        ...e,
        tags: e.tags ? JSON.parse(e.tags) : []
      }));

      res.json(formatted);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }

  static async getEventById(req: Request, res: Response) {
    try {
      const event = await EventService.getEventById(req.params.id);
      if (!event) return res.status(404).json({ message: 'Event not found' });
      
      const formatted = {
        ...event,
        tags: event.tags ? JSON.parse(event.tags) : []
      };
      res.json(formatted);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }

  static async cancelEvent(req: Request, res: Response) {
    try {
      const hostId = (req as any).userId;
      const event = await EventService.getEventById(req.params.id);
      
      if (!event) return res.status(404).json({ message: 'Event not found' });
      if (event.hostId !== hostId) return res.status(403).json({ message: 'Unauthorized' });
      
      if (event.status === 'live' || event.status === 'ended') {
        return res.status(400).json({ message: 'Cannot cancel an event that is live or ended' });
      }

      const updated = await EventService.cancelEvent(req.params.id);
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }

  static async startEventEarly(req: Request, res: Response) {
    try {
      const hostId = (req as any).userId;
      const event = await EventService.getEventById(req.params.id);
      
      if (!event) return res.status(404).json({ message: 'Event not found' });
      if (event.hostId !== hostId) return res.status(403).json({ message: 'Unauthorized' });
      if (event.status !== 'scheduled') return res.status(400).json({ message: 'Event is not scheduled' });

      const user = await prisma.user.findUnique({ where: { id: hostId } });

      const roomConfig = {
        name: event.title,
        password: undefined,
        maxPlayers: event.capacity,
        visibility: (event.visibility === 'public' ? 'public' : 'private') as 'public' | 'private',
        allowChat: true,
        allowGuestEmotes: true,
        hostId,
        nickname: user?.displayName || 'Host',
        avatarType: 'Boy' as any
      };
      
      const result = RoomManager.createRoom(roomConfig);

      const updated = await EventService.startEventEarly(req.params.id, result.roomId);
      res.json({ event: updated, roomId: result.roomId, hostToken: result.hostToken });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }

  static async addRSVP(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const eventId = req.params.id;
      await EventService.toggleRSVP(eventId, userId, true);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }

  static async removeRSVP(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const eventId = req.params.id;
      await EventService.toggleRSVP(eventId, userId, false);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }
}

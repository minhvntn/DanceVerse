import prisma from '../database/prisma';

export class EventService {
  static async createEvent(data: {
    hostId: string;
    title: string;
    description?: string;
    coverImage?: string;
    tags: string[];
    visibility: 'public' | 'private';
    scheduledAt: Date;
    capacity: number;
    status?: 'scheduled' | 'live';
    roomId?: string;
  }) {
    return await prisma.concertEvent.create({
      data: {
        hostId: data.hostId,
        title: data.title,
        description: data.description,
        coverImage: data.coverImage,
        tags: JSON.stringify(data.tags),
        visibility: data.visibility,
        scheduledAt: data.scheduledAt,
        capacity: data.capacity,
        status: data.status || 'scheduled',
        roomId: data.roomId,
      },
      include: {
        host: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarType: true,
            profileImageUrl: true,
          }
        },
        _count: {
          select: { rsvps: true }
        }
      }
    });
  }

  static async getEventById(id: string) {
    return await prisma.concertEvent.findUnique({
      where: { id },
      include: {
        host: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarType: true,
            profileImageUrl: true,
          }
        },
        _count: {
          select: { rsvps: true }
        }
      }
    });
  }

  static async listEvents(filters: {
    status?: string | string[];
    hostId?: string;
    limit?: number;
    orderBy?: 'asc' | 'desc';
  }) {
    const whereClause: any = {};
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        whereClause.status = { in: filters.status };
      } else {
        whereClause.status = filters.status;
      }
    }
    if (filters.hostId) {
      whereClause.hostId = filters.hostId;
    }

    return await prisma.concertEvent.findMany({
      where: whereClause,
      include: {
        host: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarType: true,
            profileImageUrl: true,
          }
        },
        _count: {
          select: { rsvps: true }
        }
      },
      orderBy: {
        scheduledAt: filters.orderBy || 'asc'
      },
      take: filters.limit || 50,
    });
  }

  static async updateEvent(id: string, data: any) {
    if (data.tags && Array.isArray(data.tags)) {
      data.tags = JSON.stringify(data.tags);
    }
    return await prisma.concertEvent.update({
      where: { id },
      data
    });
  }

  static async cancelEvent(id: string) {
    return await prisma.concertEvent.update({
      where: { id },
      data: { status: 'cancelled' }
    });
  }

  static async startEventEarly(id: string, roomId: string) {
    return await prisma.concertEvent.update({
      where: { id },
      data: { 
        status: 'live',
        roomId: roomId 
      }
    });
  }

  static async toggleRSVP(eventId: string, userId: string, interested: boolean) {
    if (interested) {
      return await prisma.concertRSVP.upsert({
        where: { userId_concertEventId: { userId, concertEventId: eventId } },
        create: { userId, concertEventId: eventId, status: 'interested' },
        update: { status: 'interested' }
      });
    } else {
      return await prisma.concertRSVP.delete({
        where: { userId_concertEventId: { userId, concertEventId: eventId } }
      }).catch(() => null);
    }
  }
}

import prisma from '../database/prisma';
import { NotificationService } from '../notifications/notification.service';
import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '../../../shared/events';

export class SchedulerService {
  private static io: Server;
  private static intervalId: NodeJS.Timeout | null = null;

  static initialize(io: Server) {
    this.io = io;
    
    if (this.intervalId) clearInterval(this.intervalId);

    // Run every minute
    this.intervalId = setInterval(async () => {
      try {
        await this.checkUpcomingEvents();
      } catch (err) {
        console.error('[SchedulerService] Error:', err);
      }
    }, 60 * 1000);
    
    console.log('[SchedulerService] Initialized.');
  }

  private static async checkUpcomingEvents() {
    const now = new Date();
    
    // Find events scheduled in the next 35 minutes that are still "scheduled"
    // We will specifically trigger notifications for 30 min and 5 min marks
    const events = await prisma.concertEvent.findMany({
      where: {
        status: 'scheduled',
        scheduledAt: {
          gt: now,
          lte: new Date(now.getTime() + 35 * 60000)
        }
      },
      include: {
        rsvps: true,
        host: {
          include: {
            followers: true
          }
        }
      }
    });

    for (const event of events) {
      const msUntilStart = event.scheduledAt.getTime() - now.getTime();
      const minutesUntilStart = Math.floor(msUntilStart / 60000);

      // Trigger 30m reminder if between 29-31 mins
      if (minutesUntilStart >= 29 && minutesUntilStart <= 31) {
        await this.notifyUsers(event, `starts in 30 minutes!`, 'concert_reminder_30');
      }
      
      // Trigger 5m reminder if between 4-6 mins
      if (minutesUntilStart >= 4 && minutesUntilStart <= 6) {
        await this.notifyUsers(event, `starts in 5 minutes!`, 'concert_reminder_5');
      }
    }
  }

  static async notifyUsers(event: any, messageSuffix: string, type: string) {
    const targetUserIds = new Set<string>();

    // Add RSVPs
    event.rsvps.forEach((rsvp: any) => targetUserIds.add(rsvp.userId));
    
    // Add Followers
    event.host.followers.forEach((f: any) => targetUserIds.add(f.followerId));

    const message = `${event.title} ${messageSuffix}`;

    for (const userId of targetUserIds) {
      // Check if we already sent this specific type of notification to prevent spam within the 3 min window
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          type,
          createdAt: {
            gt: new Date(Date.now() - 5 * 60000) // created in last 5 mins
          }
        }
      });

      if (existing) continue;

      const notif = await NotificationService.createNotification(userId, type, {
        message,
        eventId: event.id
      });

      // If user is online, emit via socket (we assume they joined a personal room with their userId)
      this.io.to(userId).emit('notification:new', notif);
    }
  }
}

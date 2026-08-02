import prisma from '../database/prisma';

export class ModerationService {
  static async setSlowMode(eventId: string, slowModeSeconds: number) {
    return prisma.concertEvent.update({
      where: { id: eventId },
      data: { slowMode: slowModeSeconds }
    });
  }

  static async logEvent(eventId: string, userId: string | null, action: string, details: any) {
    return prisma.eventLog.create({
      data: {
        eventId,
        userId,
        action,
        details: JSON.stringify(details)
      }
    });
  }

  static async getEventLogs(eventId: string) {
    return prisma.eventLog.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { displayName: true }
        }
      }
    });
  }

  static async addRole(eventId: string, userId: string, role: string) {
    return prisma.eventRole.upsert({
      where: { eventId_userId: { eventId, userId } },
      update: { role },
      create: { eventId, userId, role }
    });
  }

  static async removeRole(eventId: string, userId: string) {
    return prisma.eventRole.delete({
      where: { eventId_userId: { eventId, userId } }
    });
  }

  static async getRoles(eventId: string) {
    return prisma.eventRole.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, displayName: true, profileImageUrl: true } }
      }
    });
  }
}

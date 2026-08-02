import prisma from '../database/prisma';

export class NotificationService {
  static async createNotification(userId: string, type: string, data: any) {
    const notif = await prisma.notification.create({
      data: {
        userId,
        type,
        data: JSON.stringify(data)
      }
    });
    return {
      ...notif,
      data: JSON.parse(notif.data)
    };
  }

  static async getUserNotifications(userId: string) {
    const notifs = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return notifs.map(n => ({
      ...n,
      data: JSON.parse(n.data)
    }));
  }

  static async markAsRead(id: string, userId: string) {
    return await prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true }
    });
  }

  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
  }
}

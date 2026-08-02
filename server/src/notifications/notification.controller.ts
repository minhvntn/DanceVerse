import { Request, Response } from 'express';
import { NotificationService } from './notification.service';

export class NotificationController {
  static async getNotifications(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const notifs = await NotificationService.getUserNotifications(userId);
      res.json(notifs);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }

  static async markAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      await NotificationService.markAsRead(req.params.id, userId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }

  static async markAllAsRead(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      await NotificationService.markAllAsRead(userId);
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  }
}

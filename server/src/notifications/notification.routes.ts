import { Router } from 'express';
import { NotificationController } from './notification.controller';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/', NotificationController.getNotifications);
router.post('/mark-all-read', NotificationController.markAllAsRead);
router.post('/:id/read', NotificationController.markAsRead);

export default router;

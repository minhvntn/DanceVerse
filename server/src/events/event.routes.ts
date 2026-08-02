import { Router } from 'express';
import { EventController } from './event.controller';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Public routes
router.get('/', EventController.listEvents);
router.get('/:id', EventController.getEventById);

// Protected routes
router.get('/following', requireAuth, EventController.getFollowingEvents);
router.post('/', requireAuth, EventController.createEvent);
router.post('/:id/cancel', requireAuth, EventController.cancelEvent);
router.post('/:id/start-early', requireAuth, EventController.startEventEarly);
router.post('/:id/rsvp', requireAuth, EventController.addRSVP);
router.delete('/:id/rsvp', requireAuth, EventController.removeRSVP);

export default router;

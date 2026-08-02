import { Router } from 'express';
import { DJController } from './dj.controller';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Require auth for all DJ routes
router.use(requireAuth);

// YouTube 
router.get('/youtube/resolve', DJController.resolveYoutubeUrl);

// Playlist
router.get('/:eventId/playlist', DJController.getPlaylist);
router.post('/:eventId/playlist', DJController.addPlaylistItem);
router.put('/:eventId/playlist/order', DJController.updatePlaylistOrder);
router.delete('/:eventId/playlist/:itemId', DJController.removePlaylistItem);

// Requests
router.get('/:eventId/requests', DJController.getRequests);
router.post('/:eventId/requests', DJController.submitRequest);
router.patch('/:eventId/requests/:requestId/status', DJController.updateRequestStatus);
router.post('/:eventId/requests/:requestId/vote', DJController.toggleVote);

export const djRouter = router;

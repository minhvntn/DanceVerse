import { Router } from 'express';
import { userController } from './userController';
import { requireAuth } from '../middleware/authMiddleware';

import { playlistController } from './playlistController';
import { historyController } from './historyController';

const userRouter = Router();

userRouter.use(requireAuth); // Protect all user routes

userRouter.get('/me', userController.getMe);
userRouter.patch('/me', userController.updateMe);
userRouter.get('/:id', userController.getUserById);

userRouter.get('/playlists', playlistController.getPlaylists);
userRouter.post('/playlists', playlistController.createPlaylist);
userRouter.post('/playlists/:playlistId/items', playlistController.addPlaylistItem);

userRouter.get('/history', historyController.getHistory);

userRouter.post('/:id/follow', userController.followUser);
userRouter.delete('/:id/follow', userController.unfollowUser);

export default userRouter;

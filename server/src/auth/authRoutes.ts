import { Router } from 'express';
import { authController } from './authController';
import rateLimit from 'express-rate-limit';

const authRouter = Router();

const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5 });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const refreshLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30 });

import { requireAuth } from '../middleware/authMiddleware';

authRouter.post('/register', registerLimiter, authController.register);
authRouter.post('/login', loginLimiter, authController.login);
authRouter.post('/refresh', refreshLimiter, authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.post('/logout-all', authController.logoutAll);
authRouter.post('/set-password', requireAuth, authController.setPassword);

export default authRouter;

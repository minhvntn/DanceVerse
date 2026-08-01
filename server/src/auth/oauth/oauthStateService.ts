import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { OAuthIntent } from './types';

const STATE_COOKIE_NAME = 'dv_oauth_state';
const IS_PROD = process.env.COOKIE_SECURE === 'true';

interface StatePayload {
  intent: OAuthIntent;
  nonce: string;
}

export const oauthStateService = {
  getSecret(): string {
    const secret = process.env.OAUTH_STATE_SECRET;
    if (!secret) {
      throw new Error('OAUTH_STATE_SECRET is not configured');
    }
    return secret;
  },

  generateState(res: Response, intent: OAuthIntent): string {
    const payload: StatePayload = {
      intent,
      nonce: Math.random().toString(36).substring(2, 15)
    };

    const stateToken = jwt.sign(payload, this.getSecret(), { expiresIn: '15m' });

    res.cookie(STATE_COOKIE_NAME, stateToken, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      path: '/api/auth', // Restrict to auth routes
      maxAge: 15 * 60 * 1000 // 15 mins
    });

    return stateToken;
  },

  verifyAndClearState(req: Request, res: Response, returnedState: string): OAuthIntent {
    const cookieState = req.cookies[STATE_COOKIE_NAME];

    if (!cookieState) {
      throw new Error('OAuth state cookie missing or expired');
    }

    if (cookieState !== returnedState) {
      this.clearState(res);
      throw new Error('OAuth state mismatch. Possible CSRF attack.');
    }

    try {
      const decoded = jwt.verify(cookieState, this.getSecret()) as StatePayload;
      this.clearState(res);
      return decoded.intent;
    } catch (err) {
      this.clearState(res);
      throw new Error('OAuth state is invalid or expired');
    }
  },

  clearState(res: Response) {
    res.clearCookie(STATE_COOKIE_NAME, {
      httpOnly: true,
      secure: IS_PROD,
      sameSite: 'lax',
      path: '/api/auth'
    });
  }
};

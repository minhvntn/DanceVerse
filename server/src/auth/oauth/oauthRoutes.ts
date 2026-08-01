import { Router, Request, Response } from 'express';
import { oauthStateService } from './oauthStateService';
import { oauthService } from './oauthService';
import { OAuthIntent } from './types';
import { requireAuth } from '../../middleware/authMiddleware';
import prisma from '../../database/prisma';

export const oauthRoutes = Router();

function sanitizeReturnTo(returnTo: any): string {
  if (typeof returnTo !== 'string') return '/';
  if (returnTo.startsWith('http://') || returnTo.startsWith('https://') || returnTo.startsWith('//')) {
    return '/'; // Reject external paths
  }
  return returnTo.startsWith('/') ? returnTo : `/${returnTo}`;
}

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('dv_refresh_token', token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

oauthRoutes.get('/:provider', (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const returnTo = sanitizeReturnTo(req.query.returnTo);
    
    const intent: OAuthIntent = {
      type: 'login',
      returnTo
    };

    const state = oauthStateService.generateState(res, intent);
    const redirectUri = oauthService.getCallbackUrl(provider);
    
    const authUrl = oauthService.getProvider(provider).getAuthorizationUrl({ state, redirectUri });
    res.redirect(authUrl);
  } catch (error: any) {
    res.redirect(`${process.env.OAUTH_FAILURE_REDIRECT_URL}?error=${encodeURIComponent(error.message)}`);
  }
});

// Link route requires authentication
oauthRoutes.post('/link/:provider', requireAuth, (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const returnTo = sanitizeReturnTo(req.body.returnTo);
    
    const intent: OAuthIntent = {
      type: 'link',
      returnTo,
      userId: (req as any).userId
    };

    const state = oauthStateService.generateState(res, intent);
    const redirectUri = oauthService.getCallbackUrl(provider);
    
    const authUrl = oauthService.getProvider(provider).getAuthorizationUrl({ state, redirectUri });
    res.json({ url: authUrl });
  } catch (error: any) {
    res.status(400).json({ code: 'OAUTH_PROVIDER_ERROR', message: error.message });
  }
});

oauthRoutes.get('/:provider/callback', async (req: Request, res: Response) => {
  const { provider } = req.params;
  const { code, state, error: providerError } = req.query;

  if (providerError) {
    return res.redirect(`${process.env.OAUTH_FAILURE_REDIRECT_URL}?error=oauth_cancelled`);
  }

  if (!code || !state) {
    return res.redirect(`${process.env.OAUTH_FAILURE_REDIRECT_URL}?error=missing_code_or_state`);
  }

  let intent: OAuthIntent;
  try {
    intent = oauthStateService.verifyAndClearState(req, res, state as string);
  } catch (error: any) {
    return res.redirect(`${process.env.OAUTH_FAILURE_REDIRECT_URL}?error=oauth_state_invalid`);
  }

  try {
    const result = await oauthService.handleCallback(
      provider, 
      code as string, 
      intent, 
      req.headers['user-agent'], 
      req.ip
    );

    if ('linked' in result) {
      // It was a link intent
      return res.redirect(`${process.env.OAUTH_SUCCESS_REDIRECT_URL}?returnTo=${encodeURIComponent(result.returnTo)}&linked=${provider}`);
    }

    // It was a login intent, set cookie and redirect
    if (result.session) {
      setRefreshCookie(res, result.session.refreshToken);
      res.redirect(`${process.env.OAUTH_SUCCESS_REDIRECT_URL}?returnTo=${encodeURIComponent(result.returnTo)}`);
    } else {
      throw new Error('No session returned');
    }
  } catch (error: any) {
    console.error(`[OAuth Callback Error]`, error);
    let errorCode = 'oauth_failed';
    if (error.message === 'OAUTH_EMAIL_CONFLICT') errorCode = 'email_conflict';
    if (error.message === 'OAUTH_ACCOUNT_CONFLICT') errorCode = 'account_already_linked';
    res.redirect(`${process.env.OAUTH_FAILURE_REDIRECT_URL}?error=${errorCode}`);
  }
});

oauthRoutes.delete('/providers/:provider', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { provider } = req.params;

    // Must ensure user has at least one other login method
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { oauthAccounts: true }
    });

    if (!user) return res.status(404).json({ code: 'NOT_FOUND' });

    const totalMethods = (user.passwordHash ? 1 : 0) + user.oauthAccounts.length;
    if (totalMethods <= 1) {
      return res.status(400).json({ code: 'OAUTH_LAST_LOGIN_METHOD', message: 'Cannot disconnect the last sign-in method.' });
    }

    await prisma.oAuthAccount.delete({
      where: {
        userId_provider: {
          userId,
          provider
        }
      }
    });

    res.json({ message: 'Disconnected successfully' });
  } catch (error: any) {
    res.status(500).json({ code: 'INTERNAL_ERROR', message: error.message });
  }
});

oauthRoutes.get('/providers/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { oauthAccounts: true }
    });

    if (!user) return res.status(404).json({ code: 'NOT_FOUND' });

    const providers = {
      password: { enabled: !!user.passwordHash },
      google: { connected: false, email: undefined as string | undefined },
      facebook: { connected: false, email: undefined as string | undefined }
    };

    user.oauthAccounts.forEach(account => {
      if (account.provider === 'google') {
        providers.google = { connected: true, email: account.email || undefined };
      }
      if (account.provider === 'facebook') {
        providers.facebook = { connected: true, email: account.email || undefined };
      }
    });

    res.json(providers);
  } catch (error: any) {
    res.status(500).json({ code: 'INTERNAL_ERROR' });
  }
});

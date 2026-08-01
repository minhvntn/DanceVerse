import { googleProvider } from './providers/googleProvider';
import { facebookProvider } from './providers/facebookProvider';
import { OAuthIntent, OAuthProviderAdapter } from './types';
import { oauthAccountService } from './oauthAccountService';
import { authService } from '../authService';
import prisma from '../../database/prisma';

export const oauthService = {
  getProvider(name: string): OAuthProviderAdapter {
    if (name === 'google') return googleProvider;
    if (name === 'facebook') return facebookProvider;
    throw new Error(`Provider ${name} not supported`);
  },

  getCallbackUrl(providerName: string): string {
    if (providerName === 'google') return process.env.GOOGLE_CALLBACK_URL || '';
    if (providerName === 'facebook') return process.env.FACEBOOK_CALLBACK_URL || '';
    return '';
  },

  async handleCallback(providerName: string, code: string, intent: OAuthIntent, userAgent?: string, ipAddress?: string) {
    const provider = this.getProvider(providerName);
    const redirectUri = this.getCallbackUrl(providerName);

    // 1. Exchange code for token
    const tokenResult = await provider.exchangeCode({ code, redirectUri });

    // 2. Fetch Identity
    const identity = await provider.getIdentity(tokenResult);

    // 3. Handle Linking Intent
    if (intent.type === 'link') {
      if (!intent.userId) throw new Error('OAUTH_LINK_REQUIRES_AUTH');
      await oauthAccountService.linkAccountToUser(intent.userId, providerName, identity);
      return { linked: true, returnTo: intent.returnTo };
    }

    // 4. Handle Login Intent
    let linkedAccount = await oauthAccountService.getLinkedAccount(providerName, identity.providerAccountId);
    let user;

    if (linkedAccount) {
      user = linkedAccount.user;
    } else {
      // Check if there is an email conflict (User exists but not linked)
      if (identity.email) {
        const existingUserByEmail = await prisma.user.findFirst({
          where: { email: identity.email }
        });
        if (existingUserByEmail) {
          // We don't auto-link for security reasons. Tell them to login manually and link.
          throw new Error('OAUTH_EMAIL_CONFLICT');
        }
      }

      // Create new user
      user = await oauthAccountService.createNewUserFromIdentity(providerName, identity);
    }

    // 5. Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // 6. Create DanceVerse Session
    const session = await authService.createSession(user.id, userAgent, ipAddress);

    return { session, returnTo: intent.returnTo };
  }
};

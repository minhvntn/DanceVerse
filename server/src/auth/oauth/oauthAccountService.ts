import prisma from '../../database/prisma';
import { OAuthProviderIdentity } from './types';

export const oauthAccountService = {
  async getLinkedAccount(provider: string, providerAccountId: string) {
    return prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId
        }
      },
      include: {
        user: true
      }
    });
  },

  async linkAccountToUser(userId: string, provider: string, identity: OAuthProviderIdentity) {
    // Check if the provider account is already linked to someone else
    const existing = await this.getLinkedAccount(provider, identity.providerAccountId);
    if (existing) {
      if (existing.userId !== userId) {
        throw new Error('OAUTH_ACCOUNT_CONFLICT');
      }
      return existing;
    }

    // Check if the user already linked THIS provider
    const existingProviderForUser = await prisma.oAuthAccount.findUnique({
      where: {
        userId_provider: {
          userId,
          provider
        }
      }
    });

    if (existingProviderForUser) {
      throw new Error('OAUTH_ACCOUNT_ALREADY_LINKED');
    }

    return prisma.oAuthAccount.create({
      data: {
        userId,
        provider,
        providerAccountId: identity.providerAccountId,
        email: identity.email,
        displayName: identity.displayName,
        avatarUrl: identity.avatarUrl
      }
    });
  },

  async createNewUserFromIdentity(provider: string, identity: OAuthProviderIdentity) {
    const displayName = identity.displayName || `User_${identity.providerAccountId.slice(0, 5)}`;
    let username = await this.generateUniqueUsername(displayName, provider);
    
    const user = await prisma.user.create({
      data: {
        username,
        displayName,
        email: identity.email,
        emailVerifiedAt: identity.emailVerified ? new Date() : null,
        avatarType: 'Boy', // Default
        profileImageUrl: identity.avatarUrl,
        onboardingCompleted: false,
        preferences: {
          create: {}
        },
        oauthAccounts: {
          create: {
            provider,
            providerAccountId: identity.providerAccountId,
            email: identity.email,
            displayName: identity.displayName,
            avatarUrl: identity.avatarUrl
          }
        }
      }
    });

    return user;
  },

  async generateUniqueUsername(baseName: string, provider: string): Promise<string> {
    let normalized = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized.length < 3) normalized = `${provider}user`;
    
    let username = normalized;
    let attempt = 1;

    while (true) {
      const exists = await prisma.user.findUnique({ where: { username } });
      if (!exists) return username;
      username = `${normalized}${Math.floor(Math.random() * 10000)}`;
      attempt++;
      if (attempt > 10) {
        return `${normalized}${Date.now()}`;
      }
    }
  }
};

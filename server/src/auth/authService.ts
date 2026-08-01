import prisma from '../database/prisma';
import { RegisterInput, LoginInput } from './authSchemas';
import { passwordService } from './passwordService';
import { tokenService } from './tokenService';

const REFRESH_EXPIRES_DAYS = 30;

export const authService = {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { username: data.username }]
      }
    });

    if (existingUser) {
      throw new Error('Email or username already exists');
    }

    const passwordHash = await passwordService.hash(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        displayName: data.displayName,
        passwordHash,
        avatarType: 'Boy', // Default avatar
        preferences: {
          create: {} // Default preferences
        }
      }
    });

    return user;
  },

  async login(data: LoginInput, userAgent?: string, ipAddress?: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.emailOrUsername }, { username: data.emailOrUsername }]
      }
    });

    if (!user || !user.passwordHash || !(await passwordService.verify(data.password, user.passwordHash))) {
      throw new Error('Invalid email, username, or password.');
    }

    if (!user.isActive) {
      throw new Error('Account is disabled.');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    return this.createSession(user.id, userAgent, ipAddress);
  },

  async createSession(userId: string, userAgent?: string, ipAddress?: string) {
    const refreshToken = tokenService.generateRefreshToken();
    const tokenHash = tokenService.hashRefreshToken(refreshToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

    const session = await prisma.refreshSession.create({
      data: {
        userId,
        tokenHash,
        userAgent,
        ipAddress,
        expiresAt
      }
    });

    const accessToken = tokenService.generateAccessToken({
      userId,
      sessionId: session.id
    });

    return { user: { id: userId }, accessToken, refreshToken };
  },

  async refresh(refreshToken: string, userAgent?: string, ipAddress?: string) {
    const tokenHash = tokenService.hashRefreshToken(refreshToken);
    
    const session = await prisma.refreshSession.findFirst({
      where: { tokenHash, revokedAt: null, expiresAt: { gt: new Date() } }
    });

    if (!session) {
      throw new Error('Invalid or expired refresh token');
    }

    // Revoke old session (Rotation)
    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() }
    });

    return this.createSession(session.userId, userAgent, ipAddress);
  },

  async logout(refreshToken: string) {
    if (!refreshToken) return;
    const tokenHash = tokenService.hashRefreshToken(refreshToken);
    await prisma.refreshSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  },

  async logoutAll(userId: string) {
    await prisma.refreshSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });
  }
};

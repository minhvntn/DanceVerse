import { PrismaClient } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../../../shared/events';

const prisma = new PrismaClient();

// Online Presence tracking (userId -> roomId or 'lobby')
const onlinePresence = new Map<string, string>();
const userSockets = new Map<string, Set<string>>(); // userId -> set of socketIds

export class FriendService {
  static io: Server;

  static initialize(io: Server) {
    this.io = io;
  }

  static trackUserConnection(userId: string, socketId: string) {
    if (userId === 'guest') return;
    
    let sockets = userSockets.get(userId) || new Set();
    sockets.add(socketId);
    userSockets.set(userId, sockets);
    
    if (!onlinePresence.has(userId)) {
      onlinePresence.set(userId, 'lobby');
      this.broadcastPresenceUpdate(userId, 'lobby');
    }
  }

  static trackUserDisconnection(userId: string, socketId: string) {
    if (userId === 'guest') return;

    let sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        userSockets.delete(userId);
        onlinePresence.delete(userId);
        this.broadcastPresenceUpdate(userId, 'offline');
      }
    }
  }

  static updateUserRoom(userId: string, roomId: string | null) {
    if (userId === 'guest') return;
    if (!userSockets.has(userId)) return;

    const newStatus = roomId || 'lobby';
    onlinePresence.set(userId, newStatus);
    this.broadcastPresenceUpdate(userId, newStatus);
  }

  static async broadcastPresenceUpdate(userId: string, status: string) {
    if (!this.io) return;
    
    try {
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [{ userAId: userId }, { userBId: userId }],
          status: 'accepted'
        }
      });

      const friendIds = friendships.map(f => f.userAId === userId ? f.userBId : f.userAId);
      
      friendIds.forEach(friendId => {
        const sockets = userSockets.get(friendId);
        if (sockets) {
          sockets.forEach(socketId => {
            this.io.to(socketId).emit(SOCKET_EVENTS.FRIEND_STATUS, {
              friendId: userId,
              status
            });
          });
        }
      });
    } catch (e) {
      console.error(e);
    }
  }

  static async sendFriendRequest(fromId: string, toId: string) {
    if (fromId === toId) throw new Error("Cannot add yourself");

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userAId: fromId, userBId: toId },
          { userAId: toId, userBId: fromId }
        ]
      }
    });

    if (existing) {
      if (existing.status === 'pending') throw new Error("Request already pending");
      if (existing.status === 'accepted') throw new Error("Already friends");
      throw new Error("Cannot send request");
    }

    return await prisma.friendship.create({
      data: {
        userAId: fromId,
        userBId: toId,
        status: 'pending'
      }
    });
  }

  static async acceptFriendRequest(requestId: string, currentUserId: string) {
    const friendship = await prisma.friendship.findUnique({ where: { id: requestId } });
    if (!friendship || friendship.userBId !== currentUserId) {
      throw new Error("Invalid request");
    }

    return await prisma.friendship.update({
      where: { id: requestId },
      data: { status: 'accepted' }
    });
  }

  static async declineFriendRequest(requestId: string, currentUserId: string) {
    const friendship = await prisma.friendship.findUnique({ where: { id: requestId } });
    if (!friendship || friendship.userBId !== currentUserId) {
      throw new Error("Invalid request");
    }

    return await prisma.friendship.delete({
      where: { id: requestId }
    });
  }
}

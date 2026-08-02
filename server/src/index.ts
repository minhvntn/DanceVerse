import express from 'express';
import http from 'http';
import path from 'path';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { tokenService } from './auth/tokenService';
import prisma from './database/prisma';

import authRouter from './auth/authRoutes';
import userRouter from './users/userRoutes';
import eventRouter from './events/event.routes';
import notificationRouter from './notifications/notification.routes';
import { djRouter } from './dj/dj.routes';

import { SOCKET_EVENTS } from '../../shared/events';
import { Player } from '../../shared/types';
import { oauthRoutes } from './auth/oauth/oauthRoutes';
import { RoomManager } from './rooms/room.manager';
import { MusicService } from './rooms/music.service';
import { registerRoomHandlers } from './socket/room.handler';
import { registerPlayerHandlers } from './socket/player.handler';
import { registerChatHandlers } from './socket/chat.handler';
import { registerHostHandlers } from './socket/host.handler';
import { registerSongRequestHandlers } from './songRequests/songRequest.handler';
import { registerSocialHandlers } from './socket/social.handler';
import { registerPairHandlers, startPairRoundSync } from './socket/pair.handler';
import { AutoDjService } from './autoDj/autoDj.service';
import { FriendService } from './friends/friend.service';
import { PartyManager } from './rooms/party.manager';
import { SchedulerService } from './events/scheduler.service';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173';

import { logger } from './utils/logger';

const app = express();
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Redis is optional for the single-instance free deployment.
if (process.env.REDIS_DISABLED !== 'true') {
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
  const pubClient = new Redis(redisPort, redisHost, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      if (times > 3) {
        logger.warn('Redis', 'Could not connect to Redis. Running without multi-server sync.');
        return null;
      }
      return Math.min(times * 100, 2000);
    }
  });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect().catch(() => {}), subClient.connect().catch(() => {})]).then(() => {
    if (pubClient.status === 'ready') {
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Redis', 'Socket.IO Redis Adapter initialized.');
    }
  });
}

// Initialize Managers & Services
RoomManager.initialize();
AutoDjService.initialize(io);
SchedulerService.initialize(io);
startPairRoundSync(io);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/auth/oauth', oauthRoutes);
app.use('/api/users', userRouter);
app.use('/api/events', eventRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/dj', djRouter);

app.get('/api/rooms', (req, res) => {
  res.json(RoomManager.getRoomList());
});

app.get('/api/rooms/:roomId', (req, res) => {
  const summary = RoomManager.getRoomSummary(req.params.roomId);
  if (!summary) {
    res.status(404).json({ error: 'Room not found or has ended' });
    return;
  }
  res.json(summary);
});

// Socket connection management
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const payload = tokenService.verifyAccessToken(token);
      (socket as any).userId = payload.userId;
      (socket as any).sessionId = payload.sessionId;
    } catch (e) {
      // Invalid token, treat as guest
    }
  }
  next();
});

io.on('connection', (socket: Socket) => {
  const userId = (socket as any).userId || 'guest';
  logger.info('Socket', `Client connected: ${socket.id} (User: ${userId})`);

  if (userId !== 'guest') {
    socket.join(userId); // Join personal room for direct messages
    FriendService.trackUserConnection(userId, socket.id);
  }

  // Session state tracking player bound to this socket
  const playerSession: { current: Player | null } = { current: null };

  // Register domain handlers
  registerRoomHandlers(io, socket, playerSession);
  registerPlayerHandlers(io, socket, playerSession);
  registerChatHandlers(io, socket, playerSession);
  registerHostHandlers(io, socket);
  registerSongRequestHandlers(io, socket);
  registerSocialHandlers(io, socket, playerSession);
  registerPairHandlers(io, socket, playerSession);

  socket.on(SOCKET_EVENTS.PING, (payload: { clientTime: number }) => {
    socket.emit(SOCKET_EVENTS.PONG, { clientTime: payload?.clientTime, serverTime: Date.now() });
  });

  socket.on('disconnect', () => {
    logger.info('Socket', `Client disconnected: ${socket.id}`);
    if (userId !== 'guest') {
      FriendService.trackUserDisconnection(userId, socket.id);
    }
    const party = PartyManager.getPartyForPlayer(socket.id); // Wait, player id is used in PartyManager. Player id is socket id or userId?
    // In our system, player.id is socket.id right now. So PartyManager tracks socket.id.
    PartyManager.leaveParty(socket.id);
  });
});

FriendService.initialize(io);
PartyManager.initialize(io);

// Periodic server tick for Music Sync & NPC updates (~every 10 seconds)
setInterval(() => {
  const rooms = RoomManager.getRoomList();
  rooms.forEach((room) => {
    const instance = RoomManager.getRoomInstance(room.id);
    if (!instance) return;

    // Broadcast music sync timestamp — use MusicService as source of truth
    const currentMusicState = MusicService.getMusicState(room.id) || instance.musicState;
    io.to(room.id).emit(SOCKET_EVENTS.MUSIC_SYNC, {
      musicState: currentMusicState,
      currentTime: MusicService.getCurrentPlaybackTime(currentMusicState)
    });

    // Randomize NPC dance animations - only if real players are present
    if (instance.players.size > 0) {
      const updatedNpcs = RoomManager.updateNpcAnimations(room.id);
      updatedNpcs.forEach((npc) => {
        io.to(room.id).emit(SOCKET_EVENTS.PLAYER_ANIMATION, {
          id: npc.id,
          animation: npc.animation
        });
      });
    }
  });
}, 10000);

// Map to track the last time a stage cue was automated for a room
const lastCueTimes = new Map<string, number>();

// Energy decay tick (~every 1 second)
setInterval(() => {
  const rooms = RoomManager.getRoomList();
  const now = Date.now();

  rooms.forEach((room) => {
    const instance = RoomManager.getRoomInstance(room.id);
    if (!instance || instance.players.size === 0) return; // Skip empty rooms

    const previousEnergy = instance.energy || 0;
    
    if (instance.energy && instance.energy > 0) {
      // Decay by 1 per second
      instance.energy = Math.max(0, instance.energy - 1);
    }
    
    if (instance.energy !== previousEnergy || (instance.energy && instance.energy > 0)) {
      io.to(room.id).emit('CONCERT_ENERGY', { energy: instance.energy || 0 });
    }

    if (instance.energy && instance.energy > 0) {

      // Stage Automation
      const lastCueTime = lastCueTimes.get(room.id) || 0;
      if (now - lastCueTime > 15000) { // 15 seconds cooldown for automated effects
        let cueEffect = null;
        if (instance.energy >= 80) cueEffect = 'rainbow';
        else if (instance.energy >= 60) cueEffect = 'crowd-wave';
        else if (instance.energy >= 40) cueEffect = 'pulse';

        if (cueEffect) {
          lastCueTimes.set(room.id, now);
          const cuePayload = {
            id: `auto-${now}`,
            name: `Auto ${cueEffect}`,
            type: 'lightstick-effect',
            color: '#FFFFFF',
            effect: cueEffect,
            startsAt: now + 500
          };
          io.to(room.id).emit(SOCKET_EVENTS.SERVER_STAGE_CUE, cuePayload);
        }
      }
    }
  });
}, 1000);

if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.resolve(__dirname, '../../../../client/dist');
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/socket.io/')) {
      next();
      return;
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

server.listen(PORT, () => {
  logger.info('Server', `DanceVerse Live Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Server', 'SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server', 'HTTP server closed.');
    prisma.$disconnect();
    process.exit(0);
  });
});

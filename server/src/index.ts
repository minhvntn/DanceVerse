import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { tokenService } from './auth/tokenService';

import authRouter from './auth/authRoutes';
import userRouter from './users/userRoutes';

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
import { AutoDjService } from './autoDj/autoDj.service';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

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

// Setup Redis Adapter for multi-server scaling
const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const pubClient = new Redis(redisPort, redisHost, {
  maxRetriesPerRequest: null,
  retryStrategy: (times) => {
    if (times > 3) {
      console.warn('[Redis] Could not connect to Redis. Running without multi-server sync.');
      return null;
    }
    return Math.min(times * 100, 2000);
  }
});
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect().catch(() => {}), subClient.connect().catch(() => {})]).then(() => {
  if (pubClient.status === 'ready') {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('[Redis] Socket.IO Redis Adapter initialized.');
  }
});

// Initialize Managers & Services
RoomManager.initialize();
AutoDjService.initialize(io);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/auth/oauth', oauthRoutes);
app.use('/api/users', userRouter);

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
  console.log(`[Socket] Client connected: ${socket.id} (User: ${userId})`);

  // Session state tracking player bound to this socket
  const playerSession: { current: Player | null } = { current: null };

  // Register domain handlers
  registerRoomHandlers(io, socket, playerSession);
  registerPlayerHandlers(io, socket, playerSession);
  registerChatHandlers(io, socket, playerSession);
  registerHostHandlers(io, socket);
  registerSongRequestHandlers(io, socket);

  socket.on(SOCKET_EVENTS.PING, (payload: { clientTime: number }) => {
    socket.emit(SOCKET_EVENTS.PONG, { clientTime: payload?.clientTime, serverTime: Date.now() });
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

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

    // Randomize NPC dance animations
    const updatedNpcs = RoomManager.updateNpcAnimations(room.id);
    updatedNpcs.forEach((npc) => {
      io.to(room.id).emit(SOCKET_EVENTS.PLAYER_ANIMATION, {
        id: npc.id,
        animation: npc.animation
      });
    });
  });
}, 10000);

server.listen(PORT, () => {
  console.log(`[Server] DanceVerse Live Server running on http://localhost:${PORT}`);
});

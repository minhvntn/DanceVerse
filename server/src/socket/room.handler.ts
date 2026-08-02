import { Socket, Server } from 'socket.io';
import { SOCKET_EVENTS } from '../../../shared/events';
import { Player, JoinRoomPayload, SocketErrorCode } from '../../../shared/types';
import { RoomManager } from '../rooms/room.manager';
import { ValidationService } from '../game/validation.service';
import { getCellId, getAdjacentCellIds } from '../game/grid.util';
import { MusicService } from '../rooms/music.service';
import { AutoDjService } from '../autoDj/autoDj.service';
import prisma from '../database/prisma';
import { logger } from '../utils/logger';

function emitSocketError(socket: Socket, code: SocketErrorCode, message: string): void {
  socket.emit(SOCKET_EVENTS.SOCKET_ERROR, { code, message });
  socket.emit(SOCKET_EVENTS.ERROR, { message });
}

let roomListBroadcastTimeout: NodeJS.Timeout | null = null;
export function broadcastRoomListDebounced(io: Server) {
  if (roomListBroadcastTimeout) return;
  roomListBroadcastTimeout = setTimeout(() => {
    io.emit(SOCKET_EVENTS.ROOM_LIST, RoomManager.getRoomList());
    roomListBroadcastTimeout = null;
  }, 2000);
}

const disconnectGraceTimers = new Map<string, NodeJS.Timeout>();

export function registerRoomHandlers(io: Server, socket: Socket, playerSession: { current: Player | null }): void {
  socket.on(SOCKET_EVENTS.ROOM_LIST, () => {
    socket.emit(SOCKET_EVENTS.ROOM_LIST, RoomManager.getRoomList());
  });

  socket.on(SOCKET_EVENTS.ROOM_GET, (payload: { roomId: string }) => {
    const summary = RoomManager.getRoomSummary(payload?.roomId);
    if (!summary) {
      emitSocketError(socket, 'ROOM_NOT_FOUND', 'Room not found or has ended.');
      return;
    }
    socket.emit(SOCKET_EVENTS.ROOM_GET, summary);
  });

  socket.on(SOCKET_EVENTS.ROOM_JOIN, (payload: JoinRoomPayload) => {
    const cleanNick = ValidationService.sanitizeNickname(payload.nickname);
    if (!cleanNick) {
      emitSocketError(socket, 'INVALID_PAYLOAD', 'Invalid nickname. Must be 2-16 characters without HTML.');
      return;
    }

    // Leave current room if already in one
    if (playerSession.current) {
      const oldRoomId = playerSession.current.roomId;
      RoomManager.removePlayerFromRoom(socket.id, oldRoomId);
      socket.leave(oldRoomId);
      io.to(oldRoomId).emit(SOCKET_EVENTS.PLAYER_LEFT, { id: socket.id });
    }

    const userId = (socket as any).userId;
    const sessionId = (socket as any).sessionId;

    let resumedPlayer: Player | null = null;

    // Check for existing player to resume (Reconnect Logic)
    if ((userId && userId !== 'guest') || sessionId) {
      const existingRoom = RoomManager.getRoomInstance(payload.roomId);
      if (existingRoom) {
        for (const [existingSocketId, p] of existingRoom.players.entries()) {
          // In our implementation, we haven't stored userId/sessionId directly on the Player object yet.
          // Let's assume we match by nickname and avatar (basic fallback) or if we added sessionId to Player.
          // For now, if the socket is disconnected and in grace period, we can match by nickname + avatar.
          if (p.nickname === cleanNick && !p.isNpc) {
            // Found a potential match
            const timer = disconnectGraceTimers.get(existingSocketId);
            if (timer) {
              clearTimeout(timer);
              disconnectGraceTimers.delete(existingSocketId);
              resumedPlayer = { ...p, id: socket.id }; // Take over with new socket ID
              // Remove old socket id entry
              existingRoom.players.delete(existingSocketId);
              break;
            } else {
              // Active connection exists
              const s = io.sockets.sockets.get(existingSocketId);
              if (s) {
                RoomManager.removePlayerFromRoom(existingSocketId, payload.roomId);
                s.leave(payload.roomId);
                io.to(payload.roomId).emit(SOCKET_EVENTS.PLAYER_LEFT, { id: existingSocketId });
                s.emit(SOCKET_EVENTS.ERROR, { message: 'Connected from another session.' });
              }
            }
          }
        }
      }
    }

    const newPlayer: Player = resumedPlayer || {
      id: socket.id,
      nickname: cleanNick,
      avatarType: payload.avatarType || 'Boy',
      avatarConfig: payload.avatarConfig,
      roomId: payload.roomId,
      position: { x: (Math.random() - 0.5) * 10, y: 0, z: Math.random() * 5 + 5 },
      rotation: 0,
      animation: 'Idle',
      score: 0,
      equippedLightstick: payload.equippedLightstick ?? true,
      lightstickColor: payload.lightstickColor || '#00F0FF'
    };

    if (resumedPlayer) {
      // Just update the player in the room map
      const existingRoom = RoomManager.getRoomInstance(payload.roomId);
      existingRoom?.players.set(socket.id, newPlayer);
    } else {
      const result = RoomManager.addPlayerToRoom(newPlayer, payload.password, payload.hostToken, userId);
      if (!result.success || !result.state) {
        let code: SocketErrorCode = 'INTERNAL_ERROR';
        if (result.error === 'Room not found') code = 'ROOM_NOT_FOUND';
        else if (result.error === 'Room has ended') code = 'ROOM_ENDED';
        else if (result.error === 'Room is full') code = 'ROOM_FULL';
        else if (result.error === 'Wrong password') code = 'INVALID_PASSWORD';
        emitSocketError(socket, code, result.error || 'Failed to join room');
        return;
      }
    }

    playerSession.current = newPlayer;
    socket.join(payload.roomId);

    // Join spatial grid cells
    const initialCell = getCellId(newPlayer.position.x, newPlayer.position.z);
    (socket as any).currentCell = initialCell;
    const cellsToJoin = getAdjacentCellIds(initialCell);
    cellsToJoin.forEach(c => socket.join(`${payload.roomId}:cell:${c}`));

    const instance = RoomManager.getRoomInstance(payload.roomId);
    if (instance) {
      const isHost = (userId && instance.ownerUserId === userId) || 
                     (instance.room.hostId === socket.id);
                     
      const roomStatePayload = {
        room: instance.room,
        players: Array.from(instance.players.values()),
        musicState: instance.musicState,
        currentTrack: instance.playlist[instance.currentTrackIndex] || null,
        playlist: instance.playlist,
        leaderboard: Array.from(instance.leaderboard.values()).sort((a, b) => b.score - a.score),
        role: isHost ? 'host' : 'guest',
        hostToken: isHost ? payload.hostToken : undefined,
        energy: instance.energy,
        myPlayerId: socket.id
      };
      
      // Send full room state to the newly joined player
      socket.emit(SOCKET_EVENTS.ROOM_STATE, roomStatePayload);

      // Save room history for authenticated users asynchronously
      if (userId && userId !== 'guest') {
        prisma.roomHistory.create({
          data: {
            userId,
            roomId: payload.roomId,
            roomName: instance.room.name,
            role: isHost ? 'host' : 'guest',
            joinedAt: new Date()
          }
        }).catch((err: any) => logger.error('RoomHistory', 'Error saving history:', err));
      }
    }

    // Notify existing players in the room
    if (resumedPlayer) {
      io.to(payload.roomId).emit(SOCKET_EVENTS.PLAYER_JOIN, newPlayer);
      io.to(payload.roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        senderId: 'system',
        nickname: 'System',
        message: `⚡ ${cleanNick} reconnected!`,
        timestamp: Date.now(),
        isSystem: true,
        type: 'system'
      });
    } else {
      // Notify others in room
      socket.to(payload.roomId).emit(SOCKET_EVENTS.PLAYER_JOIN, newPlayer);
      io.to(payload.roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        senderId: 'system',
        nickname: 'System',
        message: `👋 ${cleanNick} joined the concert!`,
        timestamp: Date.now(),
        isSystem: true,
        type: 'system'
      });
    }

    // Broadcast updated room list to all clients (lobby counts)
    broadcastRoomListDebounced(io);
  });

  socket.on('CLIENT_MUSIC_ENDED', (payload: { roomId: string }) => {
    if (!payload?.roomId) return;
    const state = MusicService.getMusicState(payload.roomId);
    if (!state) return;

    // Debounce to prevent multiple clients from skipping tracks simultaneously
    // If the track started less than 10 seconds ago, ignore the ended event
    if (state.startedAt && Date.now() - state.startedAt < 10000) {
      return;
    }

    // Call AutoDjService to check for highest voted track first
    const autoDjAdvanced = AutoDjService.handlePlaylistEnded(payload.roomId);
    
    if (!autoDjAdvanced) {
      // If AutoDJ didn't play anything, just play the next track in playlist
      const nextState = MusicService.next(payload.roomId);
      io.to(payload.roomId).emit(SOCKET_EVENTS.MUSIC_STATE, nextState);
    }
  });

  socket.on(SOCKET_EVENTS.ROOM_LEAVE, () => {
    if (playerSession.current) {
      const roomId = playerSession.current.roomId;
      const nickname = playerSession.current.nickname;
      const roomSummary = RoomManager.getRoomSummary(roomId);

      RoomManager.removePlayerFromRoom(socket.id, roomId);
      socket.leave(roomId);
      io.to(roomId).emit(SOCKET_EVENTS.PLAYER_LEFT, { id: socket.id });

      io.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        senderId: 'system',
        nickname: 'System',
        message: `👋 ${nickname} left the concert.`,
        timestamp: Date.now(),
        isSystem: true,
        type: 'system'
      });

      if (roomSummary?.hostId === socket.id) {
        RoomManager.handleHostDisconnect(roomId, (endedRoomId) => {
          io.to(endedRoomId).emit(SOCKET_EVENTS.ROOM_ENDED, { roomId: endedRoomId });
          broadcastRoomListDebounced(io);
        });
      }

      playerSession.current = null;
      broadcastRoomListDebounced(io);
    }
    ValidationService.clearSocket(socket.id); // Clean up on leave
  });

  socket.on('disconnect', () => {
    if (playerSession.current) {
      const roomId = playerSession.current.roomId;
      const nickname = playerSession.current.nickname;
      const playerId = playerSession.current.id;
      const roomSummary = RoomManager.getRoomSummary(roomId);

      // Grace period for reconnect
      const timer = setTimeout(() => {
        RoomManager.removePlayerFromRoom(playerId, roomId);
        io.to(roomId).emit(SOCKET_EVENTS.PLAYER_LEFT, { id: playerId });

        io.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
          id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          senderId: 'system',
          nickname: 'System',
          message: `👋 ${nickname} left the concert.`,
          timestamp: Date.now(),
          isSystem: true,
          type: 'system'
        });

        if (roomSummary?.hostId === playerId) {
          RoomManager.handleHostDisconnect(roomId, (endedRoomId) => {
            io.to(endedRoomId).emit(SOCKET_EVENTS.ROOM_ENDED, { roomId: endedRoomId });
            broadcastRoomListDebounced(io);
          });
        }
        
        disconnectGraceTimers.delete(playerId);
        broadcastRoomListDebounced(io);
      }, 15000); // 15 seconds

      disconnectGraceTimers.set(playerId, timer);

      io.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        senderId: 'system',
        nickname: 'System',
        message: `⚠️ ${nickname} disconnected. Waiting to reconnect...`,
        timestamp: Date.now(),
        isSystem: true,
        type: 'system'
      });

      playerSession.current = null;
    }
    ValidationService.clearSocket(socket.id);
  });
}


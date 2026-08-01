import { Socket, Server } from 'socket.io';
import { SOCKET_EVENTS } from '../../../shared/events';
import { Player, DanceAnimationType, Vector3D } from '../../../shared/types';
import { RoomManager } from '../rooms/room.manager';
import { ValidationService } from '../game/validation.service';
import { getCellId, getAdjacentCellIds } from '../game/grid.util';

import { RateLimiter } from '../utils/RateLimiter';

const emoteRateLimiter = new RateLimiter(3, 0.5); // Max 3 burst, 1 every 2s

export function registerPlayerHandlers(io: Server, socket: Socket, playerSession: { current: Player | null }): void {
  // Throttled movement broadcast (server-side tracking last move time)
  let lastMoveBroadcast = 0;
  const MOVE_INTERVAL = 1000 / 15; // ~15 Hz

  socket.on(SOCKET_EVENTS.PLAYER_MOVE, (payload: { position: Vector3D; rotation: number; animation?: DanceAnimationType }) => {
    if (!playerSession.current) return;

    const now = Date.now();
    if (now - lastMoveBroadcast < MOVE_INTERVAL) {
      return; // Throttling to 15 Hz
    }
    lastMoveBroadcast = now;

    const validPosition = ValidationService.validatePosition(payload.position);
    const rotation = typeof payload.rotation === 'number' ? payload.rotation : playerSession.current.rotation;
    const animation = payload.animation || playerSession.current.animation;

    playerSession.current.position = validPosition;
    playerSession.current.rotation = rotation;
    playerSession.current.animation = animation;

    // Update in RoomManager
    const instance = RoomManager.getRoomInstance(playerSession.current.roomId);
    if (instance) {
      instance.players.set(socket.id, playerSession.current);
    }

    // Spatial Grid Interest Management
    const newCell = getCellId(validPosition.x, validPosition.z);
    const oldCell = (socket as any).currentCell;

    if (oldCell !== newCell) {
      // Transition cells
      const oldCells = oldCell ? getAdjacentCellIds(oldCell) : [];
      const newCells = getAdjacentCellIds(newCell);

      const toLeave = oldCells.filter(c => !newCells.includes(c));
      const toJoin = newCells.filter(c => !oldCells.includes(c));

      const baseRoom = playerSession.current.roomId;
      toLeave.forEach(c => socket.leave(`${baseRoom}:cell:${c}`));
      toJoin.forEach(c => socket.join(`${baseRoom}:cell:${c}`));

      (socket as any).currentCell = newCell;
    }

    // Emit ONLY to the player's current cell room
    const cellRoom = `${playerSession.current.roomId}:cell:${newCell}`;
    socket.to(cellRoom).emit(SOCKET_EVENTS.PLAYER_MOVE, {
      id: socket.id,
      position: validPosition,
      rotation,
      animation
    });
  });

  socket.on(SOCKET_EVENTS.PLAYER_ANIMATION, (payload: { animation: DanceAnimationType }) => {
    if (!playerSession.current || !payload.animation) return;

    playerSession.current.animation = payload.animation;
    const instance = RoomManager.getRoomInstance(playerSession.current.roomId);
    if (instance) {
      instance.players.set(socket.id, playerSession.current);
    }

    socket.to(playerSession.current.roomId).emit(SOCKET_EVENTS.PLAYER_ANIMATION, {
      id: socket.id,
      animation: payload.animation
    });
  });

  socket.on(SOCKET_EVENTS.PLAYER_EMOTE, (payload: { emote: string }) => {
    if (!playerSession.current || !payload.emote) return;

    if (!emoteRateLimiter.tryConsume(socket.id)) {
      return; // Silently drop spam emotes
    }

    io.to(playerSession.current.roomId).emit(SOCKET_EVENTS.PLAYER_EMOTE, {
      id: socket.id,
      emote: payload.emote
    });
  });

  socket.on(SOCKET_EVENTS.PLAYER_SCORE, (payload: { scoreAdd: number }) => {
    if (!playerSession.current || typeof payload.scoreAdd !== 'number') return;

    const updatedLeaderboard = RoomManager.updatePlayerScore(
      playerSession.current.roomId,
      socket.id,
      playerSession.current.nickname,
      payload.scoreAdd
    );

    io.to(playerSession.current.roomId).emit(SOCKET_EVENTS.ROOM_LEADERBOARD, updatedLeaderboard);
  });
}

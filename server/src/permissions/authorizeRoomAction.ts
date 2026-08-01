import { Socket } from 'socket.io';
import { RoomPermission, SocketErrorCode, UserRole } from '../../../shared/types';
import { RoomManager } from '../rooms/room.manager';
import { hasRoomPermission } from './roomPermissions';
import { SOCKET_EVENTS } from '../../../shared/events';

interface AuthResult {
  authorized: boolean;
  role?: UserRole;
  playerId?: string;
}

/**
 * Validates if the socket has the required permission in the given room.
 * It checks if the provided hostToken matches the room's host, OR
 * if the socket belongs to a player with a role that has the permission.
 */
export function authorizeRoomAction(
  socket: Socket,
  roomId: string | undefined,
  permission: RoomPermission,
  hostToken?: string
): AuthResult {
  if (!roomId) {
    socket.emit(SOCKET_EVENTS.ERROR, { message: 'Room ID is missing.', code: 'INVALID_PAYLOAD' as SocketErrorCode });
    return { authorized: false };
  }

  const room = RoomManager.getRoomSummary(roomId);
  if (!room) {
    socket.emit(SOCKET_EVENTS.ERROR, { message: 'Room not found or ended.', code: 'ROOM_NOT_FOUND' as SocketErrorCode });
    return { authorized: false };
  }

  // 1. Check if acting as Host via hostToken
  if (hostToken && RoomManager.verifyHostToken(roomId, hostToken)) {
    if (hasRoomPermission('host', permission)) {
      return { authorized: true, role: 'host' };
    }
  }

  // 2. Check if acting via Player Role (e.g., Co-host or Guest)
  const player = RoomManager.getPlayer(roomId, socket.id);
  if (!player) {
    // If they aren't even in the room and don't have a valid hostToken, deny.
    socket.emit(SOCKET_EVENTS.ERROR, { message: 'You are not in this room.', code: 'UNAUTHORIZED' as SocketErrorCode });
    return { authorized: false };
  }

  const role: UserRole = player.role || 'guest';
  if (hasRoomPermission(role, permission)) {
    return { authorized: true, role, playerId: player.id };
  }

  // Denied
  socket.emit(SOCKET_EVENTS.ERROR, {
    message: `You do not have permission (${permission}) to perform this action.`,
    code: 'UNAUTHORIZED' as SocketErrorCode
  });
  return { authorized: false };
}

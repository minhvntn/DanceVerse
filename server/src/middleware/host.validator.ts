import { Socket } from 'socket.io';
import { RoomManager } from '../rooms/room.manager';
import { SOCKET_EVENTS } from '../../../shared/events';
import { SocketErrorCode } from '../../../shared/types';

/**
 * Validates that the sender of a Socket.IO command is the genuine Host of the room
 * by securely checking their hostToken against the stored sha256 hash.
 */
export function validateHostCommand(
  socket: Socket,
  roomId: string,
  hostToken?: string
): { authorized: boolean; error?: { code: SocketErrorCode; message: string } } {
  if (!roomId || !hostToken) {
    const error = { code: 'UNAUTHORIZED' as SocketErrorCode, message: 'Missing room ID or host token.' };
    socket.emit(SOCKET_EVENTS.SOCKET_ERROR, error);
    socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
    return { authorized: false, error };
  }

  const roomSummary = RoomManager.getRoomSummary(roomId);
  if (!roomSummary) {
    const error = { code: 'ROOM_NOT_FOUND' as SocketErrorCode, message: 'Room not found or has ended.' };
    socket.emit(SOCKET_EVENTS.SOCKET_ERROR, error);
    socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
    return { authorized: false, error };
  }

  const isValidToken = RoomManager.verifyHostToken(roomId, hostToken);
  if (!isValidToken) {
    const error = {
      code: 'UNAUTHORIZED' as SocketErrorCode,
      message: 'Unauthorized: Invalid host token for this room.'
    };
    socket.emit(SOCKET_EVENTS.SOCKET_ERROR, error);
    socket.emit(SOCKET_EVENTS.ERROR, { message: error.message });
    return { authorized: false, error };
  }

  return { authorized: true };
}

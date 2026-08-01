import { Socket, Server } from 'socket.io';
import { SOCKET_EVENTS } from '../../../shared/events';
import { Player, ChatMessage } from '../../../shared/types';
import { ValidationService } from '../game/validation.service';
import { RoomManager } from '../rooms/room.manager';

import { RateLimiter } from '../utils/RateLimiter';

const chatRateLimiter = new RateLimiter(5, 1); // Max 5 messages burst, 1 msg per second

export function registerChatHandlers(io: Server, socket: Socket, playerSession: { current: Player | null }): void {
  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (payload: { message: string }) => {
    if (!playerSession.current || !payload.message) return;

    if (!chatRateLimiter.tryConsume(socket.id)) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Chat rate limit exceeded. Please wait.' });
      return;
    }

    const room = RoomManager.getRoomInstance(playerSession.current.roomId)?.room;
    if (room && room.allowChat === false) {
      socket.emit(SOCKET_EVENTS.SOCKET_ERROR, {
        code: 'CHAT_DISABLED',
        message: 'Chat is currently disabled in this concert room.'
      });
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Chat is currently disabled in this concert room.' });
      return;
    }

    if (!ValidationService.canSendChat(socket.id)) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'You are sending messages too quickly.' });
      return;
    }

    const cleanMessage = ValidationService.sanitizeChat(payload.message);
    if (!cleanMessage) return;

    const chatMsg: ChatMessage = {
      id: `chat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: socket.id,
      nickname: playerSession.current.nickname,
      avatarType: playerSession.current.avatarType,
      message: cleanMessage,
      timestamp: Date.now()
    };

    io.to(playerSession.current.roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, chatMsg);
  });
}

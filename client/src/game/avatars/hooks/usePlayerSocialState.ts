import { useState, useEffect } from 'react';
import { socketService } from '../../../services/socket.service';
import { SOCKET_EVENTS, ChatMessage, ReactionPayload } from '../../../types';

export const usePlayerSocialState = (playerId: string) => {
  const [chatMessage, setChatMessage] = useState<string | null>(null);
  const [reactionEvent, setReactionEvent] = useState<{ reaction: string; timestamp: number } | null>(null);

  useEffect(() => {
    const handleChat = (msg: ChatMessage) => {
      if (msg.senderId === playerId) {
        setChatMessage(msg.message || '');
      }
    };

    const handleReaction = (payload: ReactionPayload) => {
      if (payload.playerId === playerId) {
        setReactionEvent({
          reaction: payload.reaction,
          timestamp: Date.now()
        });
      }
    };

    socketService.on(SOCKET_EVENTS.CHAT_MESSAGE, handleChat);
    socketService.on(SOCKET_EVENTS.REACTION_SHOW, handleReaction);

    return () => {
      socketService.off(SOCKET_EVENTS.CHAT_MESSAGE, handleChat);
      socketService.off(SOCKET_EVENTS.REACTION_SHOW, handleReaction);
    };
  }, [playerId]);

  const clearChat = () => setChatMessage(null);

  return { chatMessage, reactionEvent, clearChat };
};

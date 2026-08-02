import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../../../shared/events';
import { RoomManager } from '../rooms/room.manager';
import { Player } from '../../../shared/types';

// Rate limit memory stores
const chatRateLimits = new Map<string, number>();
const reactionRateLimits = new Map<string, number[]>(); // array of timestamps

// Crowd moment tracking
const reactionAccumulator = new Map<string, number[]>(); // roomId -> array of reaction timestamps

export const registerSocialHandlers = (
  io: Server,
  socket: Socket,
  playerSession: { current: Player | null }
) => {
  
  socket.on(SOCKET_EVENTS.REACTION_SEND, (payload: { reaction: string }) => {
    const player = playerSession.current;
    if (!player) return;
    
    // Rate limiting: 3 reactions per 5s
    const now = Date.now();
    let timestamps = reactionRateLimits.get(player.id) || [];
    timestamps = timestamps.filter(t => now - t < 5000);
    
    if (timestamps.length >= 3) return; // rate limited
    
    timestamps.push(now);
    reactionRateLimits.set(player.id, timestamps);

    // Validate reaction
    const validReactions = ['❤️', '🔥', '👏', '😍', '🎉'];
    if (!validReactions.includes(payload.reaction)) return;

    // Add Energy (+0.1 per reaction)
    RoomManager.addEnergy(player.roomId, 0.1);

    // Broadcast reaction
    io.to(player.roomId).emit(SOCKET_EVENTS.REACTION_SHOW, {
      playerId: player.id,
      reaction: payload.reaction
    });

    // Crowd Moment Logic
    let roomReactions = reactionAccumulator.get(player.roomId) || [];
    roomReactions = roomReactions.filter(t => now - t < 5000); // keep last 5 seconds
    roomReactions.push(now);
    reactionAccumulator.set(player.roomId, roomReactions);

    if (roomReactions.length >= 20) {
      // Trigger crowd moment
      let cueEffect = 'pulse';
      if (payload.reaction === '🔥') cueEffect = 'pulse'; // CROWD IS ON FIRE
      else if (payload.reaction === '❤️') cueEffect = 'rainbow'; // LOVE WAVE
      else if (payload.reaction === '👏') cueEffect = 'crowd-wave';

      io.to(player.roomId).emit(SOCKET_EVENTS.SERVER_STAGE_CUE, {
        id: `crowd-moment-${now}`,
        name: `Crowd Moment ${payload.reaction}`,
        type: 'lightstick-effect',
        effect: cueEffect,
        color: '#FFFFFF',
        startsAt: now + 500
      });
      // Clear accumulator to avoid spam
      reactionAccumulator.set(player.roomId, []);
    }
  });

  socket.on(SOCKET_EVENTS.SOCIAL_WAVE, (payload: { targetPlayerId: string }) => {
    const player = playerSession.current;
    if (!player) return;

    const targetPlayer = RoomManager.getPlayer(player.roomId, payload.targetPlayerId);
    if (!targetPlayer) return;

    // Add Energy (+0.2 per wave)
    RoomManager.addEnergy(player.roomId, 0.2);

    // Wave animation event
    io.to(player.roomId).emit(SOCKET_EVENTS.PLAYER_ANIMATION, {
      id: player.id,
      animation: 'wave'
    });
  });

  socket.on(SOCKET_EVENTS.PARTY_INVITE, (payload: { targetPlayerId: string }) => {
    const player = playerSession.current;
    if (!player) return;
    
    // In our system, player.id = socket.id. Target should receive invite.
    io.to(payload.targetPlayerId).emit(SOCKET_EVENTS.PARTY_INVITE, {
      fromPlayerId: player.id,
      fromPlayerName: player.nickname,
      partyId: player.id // Simple implementation: leader ID is party ID if uncreated
    });
  });

  socket.on(SOCKET_EVENTS.PARTY_JOIN, (payload: { partyId: string }) => {
    const player = playerSession.current;
    if (!player) return;

    // Use PartyManager
    import('../rooms/party.manager').then(m => {
      let party = m.PartyManager.getPartyForPlayer(payload.partyId);
      if (!party) {
        // Create party if target wasn't in one
        party = m.PartyManager.createParty(payload.partyId);
      }
      m.PartyManager.joinParty(party.id, player.id);
    });
  });

  socket.on(SOCKET_EVENTS.PARTY_LEAVE, () => {
    const player = playerSession.current;
    if (!player) return;
    import('../rooms/party.manager').then(m => {
      m.PartyManager.leaveParty(player.id);
    });
  });

  socket.on(SOCKET_EVENTS.GROUP_DANCE_START, (payload: { animation: string }) => {
    const player = playerSession.current;
    if (!player) return;
    import('../rooms/party.manager').then(m => {
      m.PartyManager.triggerGroupDance(player.id, payload.animation);
      // Add Energy (+1 per group dance start)
      RoomManager.addEnergy(player.roomId, 1);
    });
  });

  socket.on(SOCKET_EVENTS.FRIEND_REQUEST, async (payload: { targetUserId: string }) => {
    const userId = (socket as any).userId;
    if (!userId || userId === 'guest') {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'You must be logged in to add friends.' });
      return;
    }
    
    // payload.targetUserId is actually the socket/player ID from the frontend
    const targetSocketId = payload.targetUserId;
    const targetSocket = io.sockets.sockets.get(targetSocketId);
    
    if (!targetSocket) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Player not found.' });
      return;
    }
    
    const targetDbUserId = (targetSocket as any).userId;
    if (!targetDbUserId || targetDbUserId === 'guest') {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Cannot add a guest player as a friend.' });
      return;
    }

    try {
      const { FriendService } = await import('../friends/friend.service');
      const req = await FriendService.sendFriendRequest(userId, targetDbUserId);
      io.to(targetSocketId).emit(SOCKET_EVENTS.ROOM_NOTIFICATION, {
        id: `fr-${Date.now()}`,
        message: `You received a friend request!`,
        type: 'info'
      });
      // Emit friend request event explicitly
      io.to(targetSocketId).emit(SOCKET_EVENTS.FRIEND_REQUEST, {
        requestId: req.id,
        fromUserId: userId
      });
    } catch (e: any) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: e.message });
    }
  });

  socket.on(SOCKET_EVENTS.FRIEND_ACCEPT, async (payload: { requestId: string }) => {
    const userId = (socket as any).userId;
    if (!userId || userId === 'guest') return;
    try {
      const { FriendService } = await import('../friends/friend.service');
      await FriendService.acceptFriendRequest(payload.requestId, userId);
      socket.emit(SOCKET_EVENTS.ROOM_NOTIFICATION, {
        id: `fr-acc-${Date.now()}`,
        message: `Friend request accepted!`,
        type: 'success'
      });
    } catch (e: any) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: e.message });
    }
  });
};

import { Socket, Server } from 'socket.io';
import { SOCKET_EVENTS } from '../../../shared/events';
import { Player, DancePair } from '../../../shared/types';
import { RoomManager } from '../rooms/room.manager';
import { ValidationService } from '../game/validation.service';

// Store pending invites: inviterId -> { targetId, timestamp }
const pendingInvites = new Map<string, { targetId: string; timestamp: number }>();

export function registerPairHandlers(io: Server, socket: Socket, playerSession: { current: Player | null }): void {
  socket.on(SOCKET_EVENTS.PAIR_INVITE, (payload: { targetId: string }) => {
    if (!playerSession.current) return;
    const { id: inviterId, roomId } = playerSession.current;
    
    // Validations
    const instance = RoomManager.getRoomInstance(roomId);
    if (!instance) return;
    
    const target = instance.players.get(payload.targetId);
    if (!target || target.isNpc) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Cannot invite this player.' });
      return;
    }
    
    if (playerSession.current.pairId || target.pairId) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'One of you is already in a pair.' });
      return;
    }
    
    // Rate limit / Spam protection
    const existingInvite = pendingInvites.get(inviterId);
    if (existingInvite && Date.now() - existingInvite.timestamp < 15000) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Please wait before sending another invite.' });
      return;
    }
    
    pendingInvites.set(inviterId, { targetId: payload.targetId, timestamp: Date.now() });
    
    io.to(payload.targetId).emit(SOCKET_EVENTS.PAIR_INVITE, {
      inviterId,
      inviterName: playerSession.current.nickname,
    });
  });

  socket.on(SOCKET_EVENTS.PAIR_INVITE_RESPONSE, (payload: { inviterId: string; accept: boolean }) => {
    if (!playerSession.current) return;
    const targetId = playerSession.current.id;
    const { inviterId, accept } = payload;
    
    const invite = pendingInvites.get(inviterId);
    if (!invite || invite.targetId !== targetId) return; // Invalid or expired
    
    pendingInvites.delete(inviterId);
    
    const instance = RoomManager.getRoomInstance(playerSession.current.roomId);
    if (!instance) return;
    
    const inviter = instance.players.get(inviterId);
    if (!inviter) return;
    
    if (!accept) {
      io.to(inviterId).emit(SOCKET_EVENTS.ERROR, { message: `${playerSession.current.nickname} declined your dance invite.` });
      return;
    }
    
    if (inviter.pairId || playerSession.current.pairId) {
       io.to(inviterId).emit(SOCKET_EVENTS.ERROR, { message: 'Someone is already in a pair.' });
       return;
    }
    
    // Create pair
    const pairId = `pair-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const pair: DancePair = {
      id: pairId,
      player1Id: inviterId,
      player2Id: targetId,
      createdAt: Date.now(),
      pairScore: 0,
      pairCombo: 0,
      feverMeter: 0
    };
    
    if (!instance.pairs) instance.pairs = new Map();
    instance.pairs.set(pairId, pair);
    
    inviter.pairId = pairId;
    playerSession.current.pairId = pairId;
    
    // Broadcast update
    io.to(inviterId).emit(SOCKET_EVENTS.PAIR_UPDATE, pair);
    io.to(targetId).emit(SOCKET_EVENTS.PAIR_UPDATE, pair);
  });

  socket.on(SOCKET_EVENTS.PAIR_LEAVE, () => {
    if (!playerSession.current || !playerSession.current.pairId) return;
    const pairId = playerSession.current.pairId;
    const instance = RoomManager.getRoomInstance(playerSession.current.roomId);
    if (!instance || !instance.pairs) return;
    
    const pair = instance.pairs.get(pairId);
    if (!pair) return;
    
    const p1 = instance.players.get(pair.player1Id);
    const p2 = instance.players.get(pair.player2Id);
    
    if (p1) p1.pairId = undefined;
    if (p2) p2.pairId = undefined;
    
    instance.pairs.delete(pairId);
    
    io.to(pair.player1Id).emit(SOCKET_EVENTS.PAIR_UPDATE, null);
    io.to(pair.player2Id).emit(SOCKET_EVENTS.PAIR_UPDATE, null);
  });
}

// Global Round Sync Loop for all pairs
let globalPairRoundTimer: NodeJS.Timeout | null = null;
export function startPairRoundSync(io: Server) {
  if (globalPairRoundTimer) return;
  globalPairRoundTimer = setInterval(() => {
    const now = Date.now();
    const roundId = `round-${now}`;
    // E.g. startsAt now + 500ms (buffer), hitAt = startsAt + 2500ms
    const startsAt = now + 500;
    const hitAt = startsAt + 2500;
    
    const rooms = RoomManager.getRoomList();
    rooms.forEach(roomInfo => {
      const instance = RoomManager.getRoomInstance(roomInfo.id);
      if (instance && instance.pairs && instance.pairs.size > 0) {
        instance.pairs.forEach(pair => {
          io.to(pair.player1Id).emit(SOCKET_EVENTS.PAIR_ROUND_START, { roundId, startsAt, hitAt });
          io.to(pair.player2Id).emit(SOCKET_EVENTS.PAIR_ROUND_START, { roundId, startsAt, hitAt });
        });
      }
    });
  }, 3500); // 3.5 seconds round loop
}

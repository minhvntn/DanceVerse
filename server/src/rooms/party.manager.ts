import { Server } from 'socket.io';
import { SOCKET_EVENTS } from '../../../shared/events';
import { Party } from '../../../shared/types';
import crypto from 'crypto';

const parties = new Map<string, Party>();
const playerParties = new Map<string, string>(); // playerId -> partyId

export class PartyManager {
  static io: Server;

  static initialize(io: Server) {
    this.io = io;
  }

  static createParty(leaderId: string): Party {
    const partyId = `party-${crypto.randomBytes(4).toString('hex')}`;
    const party: Party = {
      id: partyId,
      leaderId,
      members: [leaderId]
    };
    parties.set(partyId, party);
    playerParties.set(leaderId, partyId);
    return party;
  }

  static getPartyForPlayer(playerId: string): Party | undefined {
    const partyId = playerParties.get(playerId);
    return partyId ? parties.get(partyId) : undefined;
  }

  static joinParty(partyId: string, playerId: string): boolean {
    const party = parties.get(partyId);
    if (!party) return false;
    
    // Max party size 6
    if (party.members.length >= 6) return false;
    if (party.members.includes(playerId)) return true;

    // Leave current party if any
    this.leaveParty(playerId);

    party.members.push(playerId);
    playerParties.set(playerId, partyId);
    this.broadcastPartyUpdate(partyId);
    return true;
  }

  static leaveParty(playerId: string): void {
    const partyId = playerParties.get(playerId);
    if (!partyId) return;

    const party = parties.get(partyId);
    if (!party) return;

    party.members = party.members.filter(id => id !== playerId);
    playerParties.delete(playerId);

    if (party.members.length === 0) {
      parties.delete(partyId);
    } else if (party.leaderId === playerId) {
      // Reassign leader
      party.leaderId = party.members[0];
      this.broadcastPartyUpdate(partyId);
    } else {
      this.broadcastPartyUpdate(partyId);
    }

    // Tell the player they left
    if (this.io) {
      this.io.to(playerId).emit(SOCKET_EVENTS.PARTY_UPDATE, null);
    }
  }

  static setPartyColor(playerId: string, color: string): boolean {
    const party = this.getPartyForPlayer(playerId);
    if (!party || party.leaderId !== playerId) return false;
    
    party.lightstickColor = color;
    this.broadcastPartyUpdate(party.id);
    return true;
  }

  static broadcastPartyUpdate(partyId: string) {
    if (!this.io) return;
    const party = parties.get(partyId);
    if (!party) return;

    party.members.forEach(memberId => {
      // Assuming members join a socket room with their memberId (socket.join(userId) in connection)
      // Otherwise we can emit directly to their socket ID if we map userId -> socketId
      // For now we'll rely on the handler that has socket access to emit to rooms
      this.io.to(memberId).emit(SOCKET_EVENTS.PARTY_UPDATE, party);
    });
  }

  static triggerGroupDance(playerId: string, animation: string) {
    const party = this.getPartyForPlayer(playerId);
    if (!party || party.leaderId !== playerId) return;

    if (!this.io) return;
    const now = Date.now();
    
    party.members.forEach(memberId => {
      this.io.to(memberId).emit(SOCKET_EVENTS.GROUP_DANCE_START, {
        animation,
        startsAt: now + 1000 // 1 second delay to sync across clients
      });
    });
  }
}

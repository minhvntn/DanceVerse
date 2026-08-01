import { Player, UserRole } from '../../../shared/types';
import { RoomManager } from '../rooms/room.manager';

export class RoleService {
  /**
   * Promotes a player to co-host
   */
  public static assignCohost(roomId: string, targetPlayerId: string): { success: boolean; error?: string; player?: Player } {
    const player = RoomManager.getPlayer(roomId, targetPlayerId);
    if (!player) {
      return { success: false, error: 'Player not found in room.' };
    }

    if (player.role === 'host') {
      return { success: false, error: 'Cannot change role of the Host.' };
    }

    if (player.role === 'co-host') {
      return { success: true, player }; // Already co-host
    }

    player.role = 'co-host';
    RoomManager.updatePlayer(roomId, player);
    return { success: true, player };
  }

  /**
   * Demotes a co-host back to guest
   */
  public static removeCohost(roomId: string, targetPlayerId: string): { success: boolean; error?: string; player?: Player } {
    const player = RoomManager.getPlayer(roomId, targetPlayerId);
    if (!player) {
      return { success: false, error: 'Player not found in room.' };
    }

    if (player.role === 'host') {
      return { success: false, error: 'Cannot change role of the Host.' };
    }

    if (player.role !== 'co-host') {
      return { success: true, player }; // Already not a co-host
    }

    player.role = 'guest';
    RoomManager.updatePlayer(roomId, player);
    return { success: true, player };
  }
}

import crypto from 'crypto';
import { Room, Player, LeaderboardEntry, RoomStatePayload, CreateRoomPayload, PlaylistItem } from '../../../shared/types';
import { RoomInstance } from '../types';
import { MusicService } from './music.service';
import { NpcController } from '../game/npc.controller';

export class RoomManager {
  private static instances = new Map<string, RoomInstance>();
  private static readonly MAX_PLAYERS = parseInt(process.env.MAX_PLAYERS_PER_ROOM || '50', 10);

  public static initialize(): void {
    const initialRooms: Array<{ id: string; name: string; thumbnail: string }> = [
      {
        id: 'room-neon',
        name: 'Neon City Concert',
        thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'room-beach',
        name: 'Beach Festival',
        thumbnail: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'room-space',
        name: 'Space Party',
        thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80'
      }
    ];

    initialRooms.forEach((config) => {
      const playlist = MusicService.getPlaylist(config.id);
      const { musicState } = MusicService.getInitialMusicState(playlist, config.id);
      const npcs = NpcController.generateNpcsForRoom(config.id, 3);
      const playerMap = new Map<string, Player>();
      const leaderboardMap = new Map<string, LeaderboardEntry>();

      npcs.forEach((npc) => {
        playerMap.set(npc.id, npc);
        leaderboardMap.set(npc.id, { nickname: npc.nickname, score: npc.score || 0 });
      });

      this.instances.set(config.id, {
        room: {
          id: config.id,
          name: config.name,
          thumbnail: config.thumbnail,
          currentPlayers: 0,
          maxPlayers: this.MAX_PLAYERS,
          isFull: false,
          visibility: 'public',
          hasPassword: false,
          allowChat: true,
          allowGuestEmotes: true,
          createdAt: Date.now(),
          status: 'waiting'
        },
        players: playerMap,
        playlist,
        currentTrackIndex: 0,
        musicState,
        leaderboard: leaderboardMap
      });
    });
  }

  public static createRoom(payload: CreateRoomPayload & { hostId: string, ownerUserId?: string }): {
    roomId: string;
    hostToken: string;
    room: Room;
  } {
    const slug = payload.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 20) || 'room';
    const randomSuffix = crypto.randomBytes(3).toString('hex');
    const roomId = `${slug}-${randomSuffix}`;
    const hostToken = crypto.randomBytes(32).toString('hex');
    const hostTokenHash = crypto.createHash('sha256').update(hostToken).digest('hex');
    const passwordHash = payload.password && payload.password.trim().length > 0
      ? crypto.createHash('sha256').update(payload.password).digest('hex')
      : undefined;

    const room: Room = {
      id: roomId,
      name: payload.name.trim(),
      thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
      currentPlayers: 0,
      maxPlayers: Math.max(2, Math.min(50, payload.maxPlayers || this.MAX_PLAYERS)),
      isFull: false,
      hostId: payload.hostId,
      visibility: payload.visibility || 'public',
      hasPassword: !!passwordHash,
      allowChat: payload.allowChat !== false,
      allowGuestEmotes: payload.allowGuestEmotes !== false,
      createdAt: Date.now(),
      status: 'waiting'
    };

    const playlist: PlaylistItem[] = [];
    const { musicState } = MusicService.getInitialMusicState(playlist, roomId);

    this.instances.set(roomId, {
      room,
      players: new Map(),
      playlist,
      currentTrackIndex: 0,
      musicState,
      leaderboard: new Map(),
      hostId: payload.hostId,
      hostTokenHash,
      passwordHash,
      ownerUserId: payload.ownerUserId
    });

    return { roomId, hostToken, room };
  }

  public static verifyHostToken(roomId: string, hostToken?: string): boolean {
    if (!hostToken) return false;
    const instance = this.instances.get(roomId);
    if (!instance || !instance.hostTokenHash) return false;
    const computedHash = crypto.createHash('sha256').update(hostToken).digest('hex');
    return computedHash === instance.hostTokenHash;
  }

  public static verifyRoomPassword(roomId: string, password?: string): boolean {
    const instance = this.instances.get(roomId);
    if (!instance) return false;
    if (!instance.passwordHash) return true; // Room has no password
    if (!password) return false;
    const computedHash = crypto.createHash('sha256').update(password).digest('hex');
    return computedHash === instance.passwordHash;
  }

  public static reclaimHost(roomId: string, hostToken: string, newSocketId: string): boolean {
    const instance = this.instances.get(roomId);
    if (!instance) return false;
    if (!this.verifyHostToken(roomId, hostToken)) return false;

    if (instance.disconnectTimer) {
      clearTimeout(instance.disconnectTimer);
      instance.disconnectTimer = undefined;
    }
    instance.hostId = newSocketId;
    instance.room.hostId = newSocketId;
    return true;
  }

  public static handleHostDisconnect(roomId: string, onRoomEnded: (roomId: string) => void): void {
    const instance = this.instances.get(roomId);
    if (!instance || !instance.hostId) return;

    if (instance.disconnectTimer) {
      clearTimeout(instance.disconnectTimer);
    }

    instance.disconnectTimer = setTimeout(() => {
      this.endRoom(roomId);
      onRoomEnded(roomId);
    }, 60_000); // 60 seconds grace period
  }

  public static endRoom(roomId: string): boolean {
    const instance = this.instances.get(roomId);
    if (!instance) return false;
    if (instance.disconnectTimer) {
      clearTimeout(instance.disconnectTimer);
      instance.disconnectTimer = undefined;
    }
    instance.room.status = 'ended';
    MusicService.clearPlaylist(roomId);
    return true;
  }

  public static getRoomList(): Room[] {
    const rooms: Room[] = [];
    this.instances.forEach((instance) => {
      if (instance.room.status !== 'ended' && instance.room.visibility !== 'private') {
        rooms.push({ ...instance.room });
      }
    });
    return rooms;
  }

  public static getRoomSummary(roomId: string): Room | undefined {
    const instance = this.instances.get(roomId);
    if (!instance || instance.room.status === 'ended') return undefined;
    return { ...instance.room };
  }

  public static getRoomInstance(roomId: string): RoomInstance | undefined {
    const instance = this.instances.get(roomId);
    if (!instance || instance.room.status === 'ended') return undefined;
    return instance;
  }

  public static addPlayerToRoom(
    player: Player,
    password?: string,
    hostToken?: string,
    userId?: string
  ): { success: boolean; state?: RoomStatePayload; error?: string } {
    const instance = this.instances.get(player.roomId);
    if (!instance) {
      return { success: false, error: 'Room not found' };
    }
    if (instance.room.status === 'ended') {
      return { success: false, error: 'Room has ended' };
    }

    const isTokenHost = this.verifyHostToken(player.roomId, hostToken);
    const isUserHost = userId && instance.ownerUserId === userId;
    const isHost = isTokenHost || isUserHost;

    if (!isHost) {
      if (!this.verifyRoomPassword(player.roomId, password)) {
        return { success: false, error: 'Wrong password' };
      }
      if (instance.room.currentPlayers >= instance.room.maxPlayers) {
        return { success: false, error: 'Room is full' };
      }
    } else {
      // Host rejoining or entering newly created room
      if (instance.disconnectTimer) {
        clearTimeout(instance.disconnectTimer);
        instance.disconnectTimer = undefined;
      }
      instance.hostId = player.id;
      instance.room.hostId = player.id;
    }

    instance.players.set(player.id, player);
    instance.room.currentPlayers += 1;
    instance.room.isFull = instance.room.currentPlayers >= instance.room.maxPlayers;
    instance.leaderboard.set(player.id, { nickname: player.nickname, score: player.score || 0 });

    const currentTrack = instance.playlist[instance.currentTrackIndex] || null;
    const playersList = Array.from(instance.players.values());
    const leaderboardList = Array.from(instance.leaderboard.values()).sort((a, b) => b.score - a.score);

    return {
      success: true,
      state: {
        room: instance.room,
        players: playersList,
        musicState: MusicService.getMusicState(player.roomId) || instance.musicState,
        currentTrack: MusicService.getPlaylist(player.roomId)[instance.currentTrackIndex] || null,
        playlist: MusicService.getPlaylist(player.roomId),
        leaderboard: leaderboardList,
        role: isHost ? 'host' : 'guest',
        hostToken: isHost ? hostToken : undefined
      }
    };
  }

  public static removePlayerFromRoom(playerId: string, roomId: string): boolean {
    const instance = this.instances.get(roomId);
    if (!instance) return false;

    if (instance.players.has(playerId)) {
      instance.players.delete(playerId);
      instance.leaderboard.delete(playerId);
      instance.room.currentPlayers = Math.max(0, instance.room.currentPlayers - 1);
      instance.room.isFull = instance.room.currentPlayers >= instance.room.maxPlayers;
      return true;
    }
    return false;
  }

  public static getPlayer(roomId: string, playerId: string): Player | undefined {
    const instance = this.instances.get(roomId);
    if (!instance) return undefined;
    return instance.players.get(playerId);
  }

  public static updatePlayer(roomId: string, player: Player): boolean {
    const instance = this.instances.get(roomId);
    if (!instance || !instance.players.has(player.id)) return false;
    instance.players.set(player.id, player);
    return true;
  }

  public static updatePlayerScore(roomId: string, playerId: string, nickname: string, scoreAdd: number): LeaderboardEntry[] {
    const instance = this.instances.get(roomId);
    if (!instance) return [];

    const existing = instance.leaderboard.get(playerId) || { nickname, score: 0 };
    existing.score += scoreAdd;
    instance.leaderboard.set(playerId, existing);

    const player = instance.players.get(playerId);
    if (player) {
      player.score = existing.score;
    }

    return Array.from(instance.leaderboard.values()).sort((a, b) => b.score - a.score);
  }

  public static updateNpcAnimations(roomId: string): Player[] {
    const instance = this.instances.get(roomId);
    if (!instance) return [];

    const updatedNpcs: Player[] = [];
    instance.players.forEach((player) => {
      if (player.isNpc && Math.random() < 0.3) {
        const changed = NpcController.randomizeNpcAnimation(player);
        instance.players.set(player.id, changed);
        updatedNpcs.push(changed);
      }
    });
    return updatedNpcs;
  }
}

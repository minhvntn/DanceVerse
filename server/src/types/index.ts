import { Player, Room, Track, PlaylistItem, MusicState, LeaderboardEntry } from '../../../shared/types';

export interface RoomInstance {
  room: Room;
  players: Map<string, Player>;
  playlist: PlaylistItem[];
  currentTrackIndex: number;
  musicState: MusicState;
  leaderboard: Map<string, LeaderboardEntry>;
  hostId?: string;
  hostTokenHash?: string;
  passwordHash?: string;
  ownerUserId?: string;
  disconnectTimer?: NodeJS.Timeout;
}

export interface ClientRateLimit {
  lastChatTime: number;
  lastEmoteTime: number;
  lastMoveTime: number;
  chatCount: number;
}

export type AvatarType =
  | 'Boy'
  | 'Girl'
  | 'Robot'
  | 'Panda'
  | 'Alien'
  | 'Cat'
  | 'Bunny'
  | 'Dinosaur';

export interface AvatarConfig {
  type: AvatarType;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
}

export type DanceAnimationType =
  | 'Idle'
  | 'Walk'
  | 'Run'
  | 'Jump'
  | 'Wave'
  | 'HipHop'
  | 'Shuffle'
  | 'Moonwalk'
  | 'Breakdance'
  | 'Clap'
  | 'Spin'
  | 'Cheer'
  | 'RandomDance';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Player {
  id: string;
  nickname: string;
  avatarType: AvatarType;
  roomId: string;
  position: Vector3D;
  rotation: number;
  animation: DanceAnimationType;
  emote?: string;
  score?: number;
  combo?: number;
  isNpc?: boolean;
  isHost?: boolean;
  role?: UserRole;
}

export type UserRole = 'host' | 'co-host' | 'guest';
export type RoomVisibility = 'public' | 'private';
export type RoomStatus = 'waiting' | 'live' | 'ended';

export interface AutoDjSettings {
  enabled: boolean;
  autoApproveVoteThreshold: number;
  playHighestVotedWhenPlaylistEnds: boolean;
}

export interface RoomRequestSettings {
  allowSongRequests: boolean;
  allowGuestVoting: boolean;
  maxPendingRequestsPerUser: number;
  requestCooldownSeconds: number;
  autoDj: AutoDjSettings;
}

export interface Room {
  id: string;
  name: string;
  thumbnail: string;
  currentPlayers: number;
  maxPlayers: number;
  isFull: boolean;
  hostId?: string;
  visibility?: RoomVisibility;
  hasPassword?: boolean;
  allowChat?: boolean;
  allowGuestEmotes?: boolean;
  requestSettings?: RoomRequestSettings;
  createdAt?: number;
  status?: RoomStatus;
}

export type ConcertRoom = Room;

export interface PlaylistItem {
  id: string;
  source: 'youtube' | 'mp3';
  sourceId: string;
  originalUrl: string;
  title: string;
  thumbnailUrl?: string;
  duration?: number;
  addedBy: string;
  addedAt: number;
  artist?: string;
  url?: string;
}

export type Track = PlaylistItem;

export interface MusicState {
  currentItemId: string | null;
  currentTrackId?: string | null;
  currentVideoId?: string | null;
  trackId?: string;
  status: 'idle' | 'playing' | 'paused';
  isPlaying?: boolean;
  startedAt: number | null;
  pausedAt: number | null;
  pausedPosition: number;
  volume: number;
  revision: number;
}

export interface ChatMessage {
  id: string;
  roomId?: string;
  senderId: string;
  nickname: string;
  avatarType?: AvatarType;
  message?: string;
  text?: string;
  timestamp?: number;
  sentAt?: number;
  type?: 'user' | 'system' | 'normal';
  isSystem?: boolean;
}

export interface LeaderboardEntry {
  nickname: string;
  score: number;
}

export type PerformanceMode = 'Low' | 'Medium' | 'High' | 'Auto';

export interface MusicSyncPayload {
  musicState: MusicState;
  currentTime: number;
}

export interface RoomStatePayload {
  room: Room;
  players: Player[];
  musicState: MusicState;
  currentTrack: Track | null;
  playlist?: PlaylistItem[];
  leaderboard: LeaderboardEntry[];
  myPlayerId?: string;
  role?: UserRole;
  hostToken?: string;
}

// Host and Room Payloads
export interface HostCommandPayload {
  roomId: string;
  hostToken: string;
}

export interface CreateRoomPayload {
  name: string;
  nickname: string;
  avatarType: AvatarType;
  maxPlayers: number;
  password?: string;
  visibility: RoomVisibility;
  allowChat: boolean;
  allowGuestEmotes: boolean;
}

export interface JoinRoomPayload {
  roomId: string;
  nickname: string;
  avatarType: AvatarType;
  password?: string;
  hostToken?: string;
}

export interface HostRoomUpdatePayload {
  roomId: string;
  hostToken: string;
  name?: string;
  visibility?: RoomVisibility;
  allowChat?: boolean;
  allowGuestEmotes?: boolean;
  maxPlayers?: number;
  password?: string;
}

export interface HostPlayMusicPayload {
  roomId: string;
  hostToken: string;
  itemId?: string;
}

export interface KickPlayerPayload {
  roomId: string;
  targetPlayerId: string;
  hostToken: string;
  reason?: string;
}

export interface PlaylistItemAddPayload {
  roomId: string;
  hostToken: string;
  url: string;
  title?: string;
}

export interface PlaylistItemRemovePayload {
  roomId: string;
  hostToken: string;
  itemId: string;
}

export interface PlaylistReorderPayload {
  roomId: string;
  hostToken: string;
  newOrder: string[]; // array of item IDs
}

export interface MusicSeekPayload {
  roomId: string;
  hostToken: string;
  position: number;
}

export interface MusicVolumePayload {
  roomId: string;
  hostToken: string;
  volume: number;
}

export type SocketErrorCode =
  | 'UNAUTHORIZED'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_ENDED'
  | 'INVALID_PASSWORD'
  | 'INVALID_YOUTUBE_URL'
  | 'VIDEO_NOT_PLAYABLE'
  | 'CHAT_DISABLED'
  | 'RATE_LIMITED'
  | 'INVALID_PAYLOAD'
  | 'PLAYER_NOT_FOUND'
  | 'INTERNAL_ERROR';

export interface SocketErrorResponse {
  code: SocketErrorCode;
  message: string;
  requestId?: string;
}

// ----------------------------------------
// Phase 11: Roles, Permissions, & Notifications
// ----------------------------------------

export type RoomPermission =
  | 'room.manage'
  | 'room.end'
  | 'player.kick'
  | 'host-music-seek'
  | 'host-music-sync'
  | 'host-trigger-cue'
  | 'server-stage-cue'
  | 'role.manage'
  | 'playlist.manage'
  | 'music.control'
  | 'request.review'
  | 'chat.moderate';

export interface RoomNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  createdAt: number;
  duration?: number;
}

export interface CohostAssignPayload {
  roomId: string;
  hostToken?: string; // Required if acting as Host
  targetPlayerId: string;
}

export interface CohostRemovePayload {
  roomId: string;
  hostToken?: string; // Required if acting as Host
  targetPlayerId: string;
}

// ----------------------------------------
// Phase 11: Song Requests & Auto-DJ
// ----------------------------------------

export type SongRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'played';

export type SongRejectionReason =
  | 'duplicate'
  | 'not_suitable'
  | 'unavailable'
  | 'embedding_disabled'
  | 'too_long'
  | 'other';

export interface SongRequest {
  id: string;
  roomId: string;
  source: 'youtube';
  sourceId: string;
  originalUrl: string;
  title: string;
  thumbnailUrl?: string;
  duration?: number;
  requestedByPlayerId: string;
  requestedByNickname: string;
  requestMessage?: string;
  requestedAt: number;
  status: SongRequestStatus;
  reviewedByPlayerId?: string;
  reviewedAt?: number;
  rejectionReason?: SongRejectionReason | string;
  votes: string[]; // array of playerIds/sessionIds
  voteCount: number;
}

export interface SongRequestCreatePayload {
  roomId: string;
  url: string;
  message?: string;
}

export interface SongRequestVotePayload {
  roomId: string;
  requestId: string;
}

export interface SongRequestReviewPayload {
  roomId: string;
  hostToken?: string; // Provided if acting as Host, omitted if Co-host
  requestId: string;
  reason?: SongRejectionReason | string;
}

export interface SongRequestPlayNowPayload {
  roomId: string;
  hostToken?: string; // Provided if acting as Host, omitted if Co-host
  requestId: string;
}

export type StageCueType = 
  | 'camera' 
  | 'lighting' 
  | 'laser' 
  | 'confetti' 
  | 'fireworks' 
  | 'screen' 
  | 'dj-animation';

export interface StageCue {
  id: string;
  timeSeconds: number;
  type: StageCueType;
  payload: Record<string, any>;
}

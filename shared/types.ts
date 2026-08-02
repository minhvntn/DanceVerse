export type AvatarType =
  | 'Boy'
  | 'Girl'
  | 'Robot'
  | 'Panda'
  | 'Alien'
  | 'Cat'
  | 'Bunny'
  | 'Dinosaur'
  | 'CelestialQueen';

export interface AvatarConfig {
  type: AvatarType;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
}

export interface AvatarCustomization {
  bodyColor: string;
  hairStyle: string;
  hairColor: string;
  faceStyle: string;
  outfitTop: string;
  outfitBottom: string;
  outfitColor: string;
  shoes: string;
  shoesColor: string;
  lightstickStyle: string;
  lightstickColor: string;
}

export type DanceAnimationType =
  | 'Idle'
  | 'Walk'
  | 'Run'
  | 'Jump'
  | 'Wave'
  | 'WaveLightstick'
  | 'HipHop'
  | 'Shuffle'
  | 'Moonwalk'
  | 'Breakdance'
  | 'Clap'
  | 'Spin'
  | 'Cheer'
  | 'RandomDance'
  | 'dance-idle'
  | 'dance-basic-01'
  | 'dance-basic-02'
  | 'dance-basic-03'
  | 'dance-medium-01'
  | 'dance-medium-02'
  | 'dance-medium-03'
  | 'dance-advanced-01'
  | 'dance-advanced-02'
  | 'dance-perfect-01'
  | 'dance-perfect-02'
  | 'dance-fever-01'
  | 'dance-fever-02'
  | 'dance-signature-01'
  | 'group-dance-01'
  | string;

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export type TeamColor = 'cyan' | 'pink';

export interface Player {
  id: string;
  nickname: string;
  avatarType: AvatarType;
  roomId: string;
  position: Vector3D;
  rotation: number;
  animation: DanceAnimationType;
  emote?: string;
  emoteStartedAt?: number;
  score?: number;
  combo?: number;
  seq?: number;
  isNpc?: boolean;
  isHost?: boolean;
  role?: UserRole;
  equippedLightstick?: boolean;
  lightstickColor?: string;
  avatarConfig?: AvatarCustomization;
  team?: TeamColor;
  pairId?: string;
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
  hostId: string;
  ownerUserId: string;
  currentPlayers: number;
  maxPlayers: number;
  isFull: boolean;
  visibility: RoomVisibility;
  password?: string;
  createdAt: number;
  allowChat: boolean;
  allowGuestEmotes: boolean;
  rhythmMode?: 'none' | 'audition' | 'freestyle';
  battleState?: 'idle' | 'active' | 'finished';
  battleScores?: { cyan: number; pink: number };
  requestSettings?: RoomRequestSettings;
  status?: RoomStatus;
  thumbnail?: string;
  coverImage?: string;
}

export type ConcertRoom = Room;

export interface SectionMarker {
  id: string;
  type: 'intro' | 'verse' | 'chorus' | 'break' | 'build' | 'drop' | 'outro' | 'custom';
  name?: string;
  startBeat: number;
  endBeat?: number;
  preset?: string;
}

export type ShowAutomationTriggerMode = 'time' | 'beat' | 'bar';

export interface ShowAutomationRule {
  id: string;
  trigger: 
    | { type: 'beat'; every: number }
    | { type: 'bar'; every: number };
  action: string;
  preset?: string;
  enabled: boolean;
}

export interface TrackMusicMetadata {
  bpm: number;
  beatOffsetSeconds: number;
  beatsPerBar: number;
  sections?: SectionMarker[];
  rules?: ShowAutomationRule[];
}

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
  metadata?: TrackMusicMetadata;
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
  target?: string;
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
  energy?: number;
}

// Host and Room Payloads
export interface HostCommandPayload {
  roomId: string;
  hostToken: string;
  revision?: number;
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
  avatarType?: AvatarType;
  avatarConfig?: AvatarCustomization;
  password?: string;
  hostToken?: string;
  equippedLightstick?: boolean;
  lightstickColor?: string;
}

export interface HostRoomUpdatePayload {
  roomId: string;
  hostToken: string;
  name?: string;
  visibility?: 'public' | 'private' | 'unlisted';
  allowChat?: boolean;
  allowGuestEmotes?: boolean;
  maxPlayers?: number;
  password?: string;
  rhythmMode?: 'none' | 'audition' | 'freestyle';
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

export interface HostTrackMetadataUpdatePayload {
  roomId: string;
  hostToken: string;
  trackId: string;
  metadata: TrackMusicMetadata;
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

export interface RhythmHitPayload {
  rating: 'perfect' | 'great' | 'good' | 'miss';
  scoreAdd: number;
  energyAdd: number;
  combo: number;
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
  | 'dj-animation'
  | 'lightstick'
  | 'floor'
  | 'moving-light';

export interface LightstickEffectCuePayload {
  effect: 'color' | 'pulse' | 'wave' | 'rainbow' | 'crowd-wave';
  color?: string;
  durationMs?: number;
  startsAt?: number;
}

export interface FloorEffectCuePayload {
  effect: 'pulse' | 'burst' | 'chase' | 'uplight-on' | 'uplight-off' | 'uplight-fan' | 'all-white';
  pattern?: 'grid' | 'diagonal' | 'rings' | 'center-burst';
  color?: string;
  durationMs?: number;
}

export type MovingLightPattern = 
  | 'IDLE' 
  | 'SWEEP_LEFT_RIGHT' 
  | 'SWEEP_CENTER_OUT' 
  | 'CROSS' 
  | 'FAN' 
  | 'AUDIENCE_SCAN' 
  | 'DJ_FOCUS' 
  | 'DROP_BURST';

export interface MovingLightCuePayload {
  preset: MovingLightPattern;
  color?: string;
  durationMs?: number;
  intensity?: number;
  speed?: number;
}

export interface StageCue {
  id: string;
  timeSeconds: number;
  type: StageCueType;
  payload: Record<string, any> | LightstickEffectCuePayload | FloorEffectCuePayload | MovingLightCuePayload;
}

// Social Payloads
export interface ReactionPayload {
  playerId: string;
  reaction: string; // '❤️' | '🔥' | '👏' | '😍' | '🎉'
}

export interface Party {
  id: string;
  leaderId: string;
  members: string[]; // array of playerIds
  lightstickColor?: string;
}

export interface PartyInvitePayload {
  fromPlayerId: string;
  fromPlayerName: string;
  partyId: string;
}

export interface GroupDancePayload {
  animation: string;
  startsAt: number;
}

export type PairJudgement = 'ULTRA' | 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';

export interface DancePair {
  id: string;
  player1Id: string;
  player2Id: string;
  createdAt: number;
  pairScore: number;
  pairCombo: number;
  feverMeter: number;
}

export interface PairRoundResult {
  pairId: string;
  roundId: string;
  judgement: PairJudgement;
  differenceMs: number;
  pairScoreBonus: number;
  pairCombo: number;
}

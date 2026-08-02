import { create } from 'zustand';
import {
  Room,
  Player,
  Track,
  MusicState,
  LeaderboardEntry,
  ChatMessage,
  RoomStatePayload,
  DanceAnimationType,
  Vector3D,
  PlaylistItem,
  UserRole,
  SongRequest,
  StageCue
} from '../types';

export type CameraMode = 'player' | 'concert' | 'cinematic';

interface RoomState {
  roomList: Room[];
  currentRoom: Room | null;
  targetRoomId: string | null;
  players: Record<string, Player>;
  currentTrack: Track | null;
  playlist: PlaylistItem[];
  musicState: MusicState | null;
  leaderboard: LeaderboardEntry[];
  chatMessages: ChatMessage[];
  teamMessages: ChatMessage[];
  songRequests: SongRequest[];
  role: UserRole;
  hostToken?: string;
  cameraMode: CameraMode;
  activeStageCue: StageCue | null;
  energy: number;
  rhythmMode: 'none' | 'audition' | 'freestyle';

  setCameraMode: (mode: CameraMode) => void;
  setActiveStageCue: (cue: StageCue | null) => void;
  setEnergy: (energy: number) => void;
  setRhythmMode: (mode: 'none' | 'audition' | 'freestyle') => void;
  setRoomList: (rooms: Room[]) => void;
  setTargetRoomId: (id: string | null) => void;
  setPlaylist: (playlist: PlaylistItem[]) => void;
  setSongRequests: (requests: SongRequest[]) => void;
  updateSongRequest: (request: SongRequest) => void;
  setRoomState: (payload: RoomStatePayload) => void;
  addPlayer: (player: Player) => void;
  removePlayer: (playerId: string) => void;
  updatePlayerMove: (id: string, position: Vector3D, rotation: number, animation?: DanceAnimationType) => void;
  updatePlayerAnimation: (id: string, animation: DanceAnimationType) => void;
  updatePlayerEmote: (id: string, emote: string, startedAt?: number) => void;
  updatePlayerLightstick: (id: string, equippedLightstick: boolean, lightstickColor: string) => void;
  updatePlayer: (id: string, partial: Partial<Player>) => void;
  addChatMessage: (msg: ChatMessage) => void;
  addTeamMessage: (msg: ChatMessage) => void;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  updateLeaderboard: (entries: LeaderboardEntry[]) => void;
  setMusicSync: (musicState: MusicState, currentTime?: number) => void;
  resetRoom: () => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  roomList: [],
  currentRoom: null,
  targetRoomId: null,
  players: {},
  currentTrack: null,
  playlist: [],
  musicState: null,
  leaderboard: [],
  chatMessages: [],
  teamMessages: [],
  songRequests: [],
  role: 'guest',
  hostToken: undefined,
  cameraMode: 'player',
  activeStageCue: null,
  energy: 0,
  rhythmMode: 'none',

  setCameraMode: (mode) => set({ cameraMode: mode }),
  setActiveStageCue: (cue) => set({ activeStageCue: cue }),
  setEnergy: (energy) => set({ energy }),
  setRhythmMode: (mode) => set({ rhythmMode: mode }),
  setRoomList: (roomList) => set({ roomList }),
  setTargetRoomId: (targetRoomId) => set({ targetRoomId }),
  setPlaylist: (playlist) => set({ playlist }),
  setSongRequests: (requests) => set({ songRequests: requests }),
  updateSongRequest: (request) => set((state) => {
    const exists = state.songRequests.some(r => r.id === request.id);
    if (exists) {
      return { songRequests: state.songRequests.map(r => r.id === request.id ? request : r) };
    }
    return { songRequests: [...state.songRequests, request] };
  }),

  setRoomState: (payload) => set((state) => ({
    currentRoom: payload.room,
    players: payload.players.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}),
    currentTrack: payload.currentTrack,
    playlist: payload.playlist || [],
    musicState: payload.musicState,
    leaderboard: payload.leaderboard || state.leaderboard,
    role: payload.role || state.role,
    hostToken: payload.hostToken || state.hostToken,
    energy: payload.energy ?? state.energy,
    rhythmMode: payload.room?.rhythmMode ?? state.rhythmMode,
  })),

  addPlayer: (player) =>
    set((state) => ({
      players: { ...state.players, [player.id]: player }
    })),

  removePlayer: (playerId) =>
    set((state) => {
      const updated = { ...state.players };
      delete updated[playerId];
      return { players: updated };
    }),

  updatePlayerMove: (id, position, rotation, animation) =>
    set((state) => {
      const p = state.players[id];
      if (!p) return state;
      return {
        players: {
          ...state.players,
          [id]: {
            ...p,
            position,
            rotation,
            animation: animation || p.animation
          }
        }
      };
    }),

  updatePlayerAnimation: (id, animation) =>
    set((state) => {
      const p = state.players[id];
      if (!p) return state;
      return {
        players: {
          ...state.players,
          [id]: { ...p, animation }
        }
      };
    }),

  updatePlayerEmote: (id, emote, startedAt) =>
    set((state) => {
      const p = state.players[id];
      if (!p) return state;
      return {
        players: {
          ...state.players,
          [id]: { ...p, emote, emoteStartedAt: startedAt }
        }
      };
    }),

  updatePlayerLightstick: (id, equippedLightstick, lightstickColor) =>
    set((state) => {
      const p = state.players[id];
      if (!p) return state;
      return {
        players: {
          ...state.players,
          [id]: { ...p, equippedLightstick, lightstickColor }
        }
      };
    }),

  updatePlayer: (id, partial) =>
    set((state) => {
      const p = state.players[id];
      if (!p) return state;
      return {
        players: {
          ...state.players,
          [id]: { ...p, ...partial }
        }
      };
    }),

  addChatMessage: (msg) =>
    set((state) => ({
      chatMessages: [...state.chatMessages.slice(-50), msg]
    })),
  addTeamMessage: (msg) =>
    set((state) => ({
      teamMessages: [...state.teamMessages.slice(-50), msg]
    })),

  setLeaderboard: (leaderboard) => set({ leaderboard }),
  updateLeaderboard: (leaderboard) => set({ leaderboard }),

  setMusicSync: (musicState) =>
    set((state) => {
      // Only update if incoming revision is >= current, preventing stale overwrites
      const currentRev = state.musicState?.revision ?? 0;
      const incomingRev = musicState?.revision ?? 0;
      if (incomingRev < currentRev) {
        return state; // Ignore stale state
      }
      return { musicState };
    }),

  resetRoom: () =>
    set({
      currentRoom: null,
      players: {},
      currentTrack: null,
      playlist: [],
      musicState: null,
      leaderboard: [],
      chatMessages: [],
      teamMessages: [],
      songRequests: [],
      role: 'guest',
      hostToken: undefined,
      cameraMode: 'player',
      activeStageCue: null
    })
}));

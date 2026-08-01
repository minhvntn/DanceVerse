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
  songRequests: SongRequest[];
  role: UserRole;
  hostToken?: string;
  cameraMode: CameraMode;
  activeStageCue: StageCue | null;

  setCameraMode: (mode: CameraMode) => void;
  setActiveStageCue: (cue: StageCue | null) => void;
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
  updatePlayerEmote: (id: string, emote: string) => void;
  updatePlayer: (id: string, partial: Partial<Player>) => void;
  addChatMessage: (msg: ChatMessage) => void;
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
  songRequests: [],
  role: 'guest',
  hostToken: undefined,
  cameraMode: 'player',
  activeStageCue: null,

  setCameraMode: (mode) => set({ cameraMode: mode }),
  setActiveStageCue: (cue) => set({ activeStageCue: cue }),
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

  setRoomState: (payload) => {
    const playersMap: Record<string, Player> = {};
    payload.players.forEach((p) => {
      playersMap[p.id] = p;
    });
    set({
      currentRoom: payload.room,
      players: playersMap,
      currentTrack: payload.currentTrack,
      playlist: payload.playlist || [],
      musicState: payload.musicState,
      leaderboard: payload.leaderboard,
      role: payload.role || 'guest',
      hostToken: payload.hostToken
    });
  },

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

  updatePlayerEmote: (id, emote) =>
    set((state) => {
      const p = state.players[id];
      if (!p) return state;
      return {
        players: {
          ...state.players,
          [id]: { ...p, emote }
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
      songRequests: [],
      role: 'guest',
      hostToken: undefined,
      cameraMode: 'player',
      activeStageCue: null
    })
}));

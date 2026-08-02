import { create } from 'zustand';
import { AvatarType, AvatarCustomization, DancePair } from '../types';

interface PlayerState {
  nickname: string;
  avatarType: AvatarType;
  avatarConfig?: AvatarCustomization;
  myPlayerId: string;
  equippedLightstick: boolean;
  lightstickColor: string;
  setNickname: (nickname: string) => void;
  setAvatarType: (type: AvatarType) => void;
  setAvatarConfig: (config: AvatarCustomization) => void;
  setMyPlayerId: (id: string) => void;
  pairId?: string;
  currentPair: DancePair | null;
  setPairInfo: (pairId?: string, currentPair?: DancePair | null) => void;
  setEquippedLightstick: (equipped: boolean) => void;
  setLightstickColor: (color: string) => void;
  combo: number;
  score: number;
  rhythmFeedback: { rating: string; timestamp: number } | null;
  isFeverActive: boolean;
  setIsFeverActive: (active: boolean) => void;
  
  // Session stats
  maxCombo: number;
  perfectMaxHits: number;
  perfectHits: number;
  greatHits: number;
  goodHits: number;
  missHits: number;

  setCombo: (combo: number) => void;
  setScore: (score: number) => void;
  setRhythmFeedback: (rating: string) => void;
  incrementStat: (rating: string) => void;
  resetRhythmStats: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  nickname: '',
  avatarType: 'Boy',
  avatarConfig: undefined,
  myPlayerId: '',
  pairId: undefined,
  currentPair: null,
  equippedLightstick: true,
  lightstickColor: '#00F0FF',
  combo: 0,
  score: 0,
  rhythmFeedback: null,
  isFeverActive: false,
  
  maxCombo: 0,
  perfectMaxHits: 0,
  perfectHits: 0,
  greatHits: 0,
  goodHits: 0,
  missHits: 0,

  setNickname: (nickname) => set({ nickname }),
  setAvatarType: (avatarType) => set({ avatarType }),
  setAvatarConfig: (avatarConfig) => set({ avatarConfig }),
  setMyPlayerId: (myPlayerId) => set({ myPlayerId }),
  setPairInfo: (pairId, currentPair) => set({ pairId, currentPair: currentPair ?? null }),
  setEquippedLightstick: (equippedLightstick) => set({ equippedLightstick }),
  setLightstickColor: (lightstickColor) => set({ lightstickColor }),
  setCombo: (combo) => set((state) => ({ 
    combo, 
    maxCombo: Math.max(state.maxCombo, combo) 
  })),
  setScore: (score) => set({ score }),
  setRhythmFeedback: (rating) => set({ rhythmFeedback: { rating, timestamp: Date.now() } }),
  setIsFeverActive: (isFeverActive) => set({ isFeverActive }),
  
  incrementStat: (rating) => set((state) => {
    switch(rating) {
      case 'perfectmax': return { perfectMaxHits: state.perfectMaxHits + 1 };
      case 'perfect': return { perfectHits: state.perfectHits + 1 };
      case 'great': return { greatHits: state.greatHits + 1 };
      case 'good': return { goodHits: state.goodHits + 1 };
      case 'miss': return { missHits: state.missHits + 1 };
      default: return {};
    }
  }),

  resetRhythmStats: () => set({
    combo: 0,
    score: 0,
    maxCombo: 0,
    perfectMaxHits: 0,
    perfectHits: 0,
    greatHits: 0,
    goodHits: 0,
    missHits: 0,
    rhythmFeedback: null,
    isFeverActive: false
  })
}));

import { create } from 'zustand';
import { AvatarType } from '../types';

interface PlayerState {
  nickname: string;
  avatarType: AvatarType;
  myPlayerId: string;
  setNickname: (nickname: string) => void;
  setAvatarType: (type: AvatarType) => void;
  setMyPlayerId: (id: string) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  nickname: '',
  avatarType: 'Boy',
  myPlayerId: '',
  setNickname: (nickname) => set({ nickname }),
  setAvatarType: (avatarType) => set({ avatarType }),
  setMyPlayerId: (myPlayerId) => set({ myPlayerId })
}));

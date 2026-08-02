import { create } from 'zustand';
import { Party } from '../types';

interface SocialStore {
  selectedPlayerId: string | null;
  setSelectedPlayerId: (id: string | null) => void;
  
  onlineFriends: { id: string; nickname: string; status: string }[];
  setOnlineFriends: (friends: { id: string; nickname: string; status: string }[]) => void;
  updateFriendStatus: (friendId: string, status: string) => void;
  
  currentParty: Party | null;
  setCurrentParty: (party: Party | null) => void;
  
  partyMessages: any[];
  addPartyMessage: (msg: any) => void;

  showSocialPanel: boolean;
  setShowSocialPanel: (show: boolean) => void;
}

export const useSocialStore = create<SocialStore>((set) => ({
  selectedPlayerId: null,
  setSelectedPlayerId: (id) => set({ selectedPlayerId: id }),
  
  onlineFriends: [],
  setOnlineFriends: (friends) => set({ onlineFriends: friends }),
  updateFriendStatus: (friendId, status) => set((state) => ({
    onlineFriends: state.onlineFriends.map(f => f.id === friendId ? { ...f, status } : f)
  })),
  
  currentParty: null,
  setCurrentParty: (party) => set({ currentParty: party }),
  
  partyMessages: [],
  addPartyMessage: (msg) => set((state) => ({
    partyMessages: [...state.partyMessages.slice(-49), msg]
  })),

  showSocialPanel: false,
  setShowSocialPanel: (show) => set({ showSocialPanel: show }),
}));

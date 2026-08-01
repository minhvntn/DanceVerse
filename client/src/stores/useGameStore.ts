import { create } from 'zustand';
import { PageStep, ConnectionStatus, PerformanceMode } from '../types';

interface GameState {
  pageStep: PageStep;
  connectionStatus: ConnectionStatus;
  performanceMode: PerformanceMode;
  showEffects: boolean;
  showMusic: boolean;
  showChat: boolean;
  showNames: boolean;
  isMinigameActive: boolean;

  setPageStep: (step: PageStep) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setPerformanceMode: (mode: PerformanceMode) => void;
  toggleEffects: () => void;
  toggleMusic: () => void;
  toggleChat: () => void;
  toggleNames: () => void;
  setMinigameActive: (active: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  pageStep: 'landing',
  connectionStatus: 'Connecting',
  performanceMode: 'Auto',
  showEffects: true,
  showMusic: true,
  showChat: true,
  showNames: true,
  isMinigameActive: false,

  setPageStep: (pageStep) => set({ pageStep }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  setPerformanceMode: (performanceMode) => set({ performanceMode }),
  toggleEffects: () => set((state) => ({ showEffects: !state.showEffects })),
  toggleMusic: () => set((state) => ({ showMusic: !state.showMusic })),
  toggleChat: () => set((state) => ({ showChat: !state.showChat })),
  toggleNames: () => set((state) => ({ showNames: !state.showNames })),
  setMinigameActive: (isMinigameActive) => set({ isMinigameActive })
}));

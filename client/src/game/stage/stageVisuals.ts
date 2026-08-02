import { PerformanceMode, StageCueType } from '../../types';

export type StageQuality = 'low' | 'medium' | 'high';

export interface ConcertVisualState {
  quality: StageQuality;
  isPlaying: boolean;
  isBeatDrop: boolean;
  energy: number;
  trackRevision: number;
  videoId: string | null;
  cueId: string | null;
  cueType: StageCueType | null;
}

export interface StageDensity {
  crowd: number;
  lasers: number;
  fog: number;
  confetti: number;
  dust: number;
  movingLights: number;
}

export const STAGE_COLORS = ['#00F0FF', '#FF007F', '#9D5CFF', '#2563EB'] as const;

export const resolveStageQuality = (performanceMode: PerformanceMode): StageQuality => {
  if (performanceMode === 'Low') return 'low';
  if (performanceMode === 'Medium') return 'medium';
  if (performanceMode === 'High') return 'high';

  if (typeof window === 'undefined') return 'high';
  const mobileLike = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 900;
  return mobileLike ? 'medium' : 'high';
};

export const getStageDensity = (quality: StageQuality, energy: number = 0): StageDensity => {
  // Base values based on quality
  let crowd = 36, lasers = 10, fog = 18, confetti = 72, dust = 56, movingLights = 8;
  
  if (quality === 'low') {
    crowd = 20; lasers = 4; fog = 0; confetti = 0; dust = 18; movingLights = 4;
  } else if (quality === 'medium') {
    crowd = 28; lasers = 6; fog = 10; confetti = 42; dust = 34; movingLights = 6;
  }
  
  // Scale effects based on energy (0-100)
  // Lasers: Max lasers only at high energy
  const laserMultiplier = energy > 80 ? 1.5 : (energy > 40 ? 1.0 : 0.5);
  // Fog: Needs energy to trigger
  const fogMultiplier = energy > 20 ? 1.0 : 0.2;
  // Confetti: Only at very high energy (or beat drops)
  const confettiMultiplier = energy > 80 ? 1.5 : 0;
  // Moving Lights: scale up
  const lightsMultiplier = energy > 60 ? 1.2 : 0.8;

  return {
    crowd,
    lasers: Math.floor(lasers * laserMultiplier),
    fog: Math.floor(fog * fogMultiplier),
    confetti: Math.floor(confetti * confettiMultiplier),
    dust,
    movingLights: Math.floor(movingLights * lightsMultiplier)
  };
};

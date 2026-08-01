import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DanceAnimationType } from '../types';
import { socketService } from '../services/socket.service';
import { useRoomStore } from '../stores/useRoomStore';
import {
  getStageChoreographyStep
} from '../game/avatars/stageChoreography';
import type {
  StageChoreographySection,
  StageChoreographyStep
} from '../game/avatars/stageChoreography';

export interface StageChoreographyState {
  animation: DanceAnimationType;
  section: StageChoreographySection;
  stepId: string;
  isActive: boolean;
  animationClock: () => number;
}

interface PlaybackClockState {
  status: 'idle' | 'playing' | 'paused';
  startedAt: number | null;
  pausedPosition: number;
}

const clampPlaybackSeconds = (seconds: number): number => (
  Number.isFinite(seconds) ? Math.max(0, seconds) : 0
);

export const useStageChoreography = (): StageChoreographyState => {
  const status = useRoomStore((state) => state.musicState?.status ?? 'idle');
  const startedAt = useRoomStore((state) => state.musicState?.startedAt ?? null);
  const pausedPosition = useRoomStore((state) => state.musicState?.pausedPosition ?? 0);
  const revision = useRoomStore((state) => state.musicState?.revision ?? 0);
  const videoId = useRoomStore((state) => state.musicState?.currentVideoId ?? null);

  const playbackRef = useRef<PlaybackClockState>({ status, startedAt, pausedPosition });
  playbackRef.current = { status, startedAt, pausedPosition };

  const animationClock = useCallback((): number => {
    const playback = playbackRef.current;

    if (playback.status === 'playing' && playback.startedAt !== null) {
      return clampPlaybackSeconds((socketService.getServerTime() - playback.startedAt) / 1000);
    }

    if (playback.status === 'paused') {
      return clampPlaybackSeconds(playback.pausedPosition);
    }

    return 0;
  }, []);

  const [activeStep, setActiveStep] = useState<StageChoreographyStep>(() => (
    getStageChoreographyStep(0)
  ));

  const isActive = status === 'playing' && startedAt !== null;

  useEffect(() => {
    const updateStep = () => {
      const nextStep = getStageChoreographyStep(animationClock());
      setActiveStep((currentStep) => currentStep.id === nextStep.id ? currentStep : nextStep);
    };

    updateStep();
    if (!isActive) return undefined;

    const intervalId = window.setInterval(updateStep, 200);
    return () => window.clearInterval(intervalId);
  }, [animationClock, isActive, pausedPosition, revision, startedAt, status, videoId]);

  return useMemo(() => ({
    animation: isActive ? activeStep.animation : 'Idle',
    section: activeStep.section,
    stepId: activeStep.id,
    isActive,
    animationClock
  }), [activeStep, animationClock, isActive]);
};

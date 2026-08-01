import React, { useMemo } from 'react';
import { PerformanceMode } from '../../types';
import { AudienceArea } from './components/AudienceArea';
import { ConcertVisualState, resolveStageQuality } from './stageVisuals';

interface DanceFloorProps {
  isPlaying: boolean;
  performanceMode: PerformanceMode;
}

export const DanceFloor: React.FC<DanceFloorProps> = ({ isPlaying, performanceMode }) => {
  const visualState = useMemo<ConcertVisualState>(() => ({
    quality: resolveStageQuality(performanceMode),
    isPlaying,
    isBeatDrop: false,
    energy: isPlaying ? 0.72 : 0.16,
    trackRevision: 0,
    videoId: null,
    cueId: null,
    cueType: null
  }), [isPlaying, performanceMode]);

  return <AudienceArea visualState={visualState} />;
};

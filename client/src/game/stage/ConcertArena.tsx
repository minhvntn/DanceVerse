import React from 'react';
import { PerformanceMode } from '../../types';
import { ConcertStage } from './ConcertStage';

interface ConcertArenaProps {
  showEffects: boolean;
  performanceMode: PerformanceMode;
  isBeatDrop?: boolean;
}

export const ConcertArena: React.FC<ConcertArenaProps> = ({
  showEffects,
  performanceMode,
  isBeatDrop = false
}) => (
  <ConcertStage
    showEffects={showEffects}
    performanceMode={performanceMode}
    isBeatDrop={isBeatDrop}
  />
);

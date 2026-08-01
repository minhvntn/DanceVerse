import React from 'react';
import { useRoomStore } from '../../stores/useRoomStore';
import { PerformanceMode } from '../../types';

import { StagePlatform } from './components/StagePlatform';
import { SpeakerTower } from './components/SpeakerTower';
import { StageTruss } from './components/StageTruss';
import { LedScreen } from './components/LedScreen';
import { LaserSystem } from './components/LaserSystem';
import { FogEffects } from './components/FogEffects';
import { DJBooth } from './DJBooth';
import { DanceFloor } from './DanceFloor';
import { NeonPortal } from './NeonPortal';

interface ConcertArenaProps {
  showEffects: boolean;
  performanceMode: PerformanceMode;
  isBeatDrop?: boolean;
}

export const ConcertArena: React.FC<ConcertArenaProps> = ({
  showEffects,
  performanceMode,
  isBeatDrop = false
}) => {
  const musicState = useRoomStore((state) => state.musicState);
  const isPlaying = musicState?.status === 'playing';

  return (
    <group>
      {/* 1. Dance Floor & Audience Area */}
      <DanceFloor isPlaying={isPlaying} performanceMode={performanceMode} />

      {/* 2. Main Stage Platform */}
      <StagePlatform />

      {/* 3. DJ Booth */}
      <DJBooth />

      {/* 4. Giant LED Screen & Frames */}
      <LedScreen />

      {/* 5. Speaker Towers (Left & Right) */}
      <SpeakerTower position={[-16, 0.4, -15]} rotation={[0, 0.2, 0]} />
      <SpeakerTower position={[16, 0.4, -15]} rotation={[0, -0.2, 0]} />

      {/* 6. Overhead Truss System */}
      <StageTruss />

      {/* 7. Dynamic Stage Effects (Only if enabled) */}
      {showEffects && (
        <>
          <LaserSystem performanceMode={performanceMode} isPlaying={isPlaying} />
          <FogEffects performanceMode={performanceMode} isPlaying={isPlaying} />
          
          {/* Legacy Neon Portal */}
          {performanceMode !== 'Low' && (
            <NeonPortal
              isPlaying={isPlaying}
              isBeatDrop={isBeatDrop}
              performanceMode={performanceMode}
            />
          )}
        </>
      )}
    </group>
  );
};

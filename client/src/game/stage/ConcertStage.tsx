import React, { useMemo } from 'react';
import { PerformanceMode } from '../../types';
import { useRoomStore } from '../../stores/useRoomStore';
import { StagePlatform } from './components/StagePlatform';
import { AudienceArea } from './components/AudienceArea';
import { SpeakerTower } from './components/SpeakerTower';
import { StageTruss } from './components/StageTruss';
import { LedScreen } from './components/LedScreen';
import { LightingRig } from './components/LightingRig';
import { LaserSystem } from './components/LaserSystem';
import { FogSystem } from './components/FogSystem';
import { CO2System } from './components/CO2System';
import { ConfettiSystem } from './components/ConfettiSystem';
import { NpcCrowd } from './components/NpcCrowd';
import { SkyEffects } from './components/SkyEffects';
import { DjBooth } from './components/DjBooth';
import { StageFloorLighting } from './components/floor/StageFloorLighting';
import { ConcertVisualState, resolveStageQuality } from './stageVisuals';

interface ConcertStageProps {
  showEffects: boolean;
  performanceMode: PerformanceMode;
  isBeatDrop?: boolean;
  energy: number;
}

export const ConcertStage: React.FC<ConcertStageProps> = ({
  showEffects,
  performanceMode,
  isBeatDrop = false,
  energy
}) => {
  const musicStatus = useRoomStore((state) => state.musicState?.status);
  const trackRevision = useRoomStore((state) => state.musicState?.revision ?? 0);
  const videoId = useRoomStore((state) => state.musicState?.currentVideoId ?? null);
  const cueId = useRoomStore((state) => state.activeStageCue?.id ?? null);
  const cueType = useRoomStore((state) => state.activeStageCue?.type ?? null);

  const visualState = useMemo<ConcertVisualState>(() => {
    const isPlaying = musicStatus === 'playing';
    
    // Convert 0-100 energy to 0.16-1.0 range for visual intensity
    let visualEnergy = 0.16;
    if (isPlaying) {
      // Base energy is 0.4, plus up to 0.6 from the energy meter
      visualEnergy = 0.4 + (energy / 100) * 0.6;
    }
    if (isBeatDrop) {
      visualEnergy = 1.0;
    }

    return {
      quality: resolveStageQuality(performanceMode),
      isPlaying,
      isBeatDrop,
      energy: visualEnergy,
      trackRevision,
      videoId,
      cueId,
      cueType
    };
  }, [musicStatus, performanceMode, isBeatDrop, energy, trackRevision, videoId, cueId, cueType]);

  return (
    <group>
      <SkyEffects visualState={visualState} enabled={showEffects} />
      <AudienceArea visualState={visualState} />
      <NpcCrowd visualState={visualState} />
      <StagePlatform visualState={visualState} />
      <LedScreen visualState={visualState} />
      <StageTruss visualState={visualState} />
      <SpeakerTower visualState={visualState} position={[-18.5, 0.6, -15.7]} rotation={[0, 0.1, 0]} accent="#FF007F" scale={0.86} />
      <SpeakerTower visualState={visualState} position={[18.5, 0.6, -15.7]} rotation={[0, -0.1, 0]} accent="#00F0FF" scale={0.86} />
      <DjBooth visualState={visualState} />
      <StageFloorLighting visualState={visualState} />

      {showEffects && (
        <>
          <LightingRig visualState={visualState} />
          <LaserSystem visualState={visualState} />
          <FogSystem visualState={visualState} />
          <CO2System visualState={visualState} />
          <ConfettiSystem visualState={visualState} />
        </>
      )}
    </group>
  );
};

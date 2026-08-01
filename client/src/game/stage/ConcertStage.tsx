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
import { ConcertVisualState, resolveStageQuality } from './stageVisuals';

interface ConcertStageProps {
  showEffects: boolean;
  performanceMode: PerformanceMode;
  isBeatDrop?: boolean;
}

export const ConcertStage: React.FC<ConcertStageProps> = ({
  showEffects,
  performanceMode,
  isBeatDrop = false
}) => {
  const musicStatus = useRoomStore((state) => state.musicState?.status);
  const trackRevision = useRoomStore((state) => state.musicState?.revision ?? 0);
  const videoId = useRoomStore((state) => state.musicState?.currentVideoId ?? null);
  const cueId = useRoomStore((state) => state.activeStageCue?.id ?? null);
  const cueType = useRoomStore((state) => state.activeStageCue?.type ?? null);

  const visualState = useMemo<ConcertVisualState>(() => {
    const isPlaying = musicStatus === 'playing';
    return {
      quality: resolveStageQuality(performanceMode),
      isPlaying,
      isBeatDrop,
      energy: !isPlaying ? 0.16 : isBeatDrop ? 1 : 0.72,
      trackRevision,
      videoId,
      cueId,
      cueType
    };
  }, [musicStatus, performanceMode, isBeatDrop, trackRevision, videoId, cueId, cueType]);

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

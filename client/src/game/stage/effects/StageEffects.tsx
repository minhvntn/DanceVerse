import React, { useMemo, useState, useEffect } from 'react';
import { useRoomStore } from '../../../stores/useRoomStore';
import { PerformanceMode } from '../../../types';
import { MovingLights } from './MovingLights';
import { StageLasers } from './StageLasers';
import { StageSmoke } from './StageSmoke';
import { CO2Cannon } from './CO2Cannon';

interface StageEffectsProps {
  performanceMode: PerformanceMode;
  isBeatDrop: boolean;
}

export const StageEffects: React.FC<StageEffectsProps> = ({ performanceMode, isBeatDrop }) => {
  const players = useRoomStore((state) => state.players);
  const musicState = useRoomStore((state) => state.musicState);

  // Audience Energy Calculation (0 to 1)
  const energy = useMemo(() => {
    if (!musicState || musicState.status !== 'playing') return 0.2; // Base energy when paused/idle
    
    const playerList = Object.values(players);
    const totalPlayers = playerList.length;
    if (totalPlayers === 0) return 0.3; // Default playing energy

    // Count dancing players
    const dancingPlayers = playerList.filter(p => {
      return p.animation !== 'Idle' && p.animation !== 'Walk' && p.animation !== 'Run' && p.animation !== 'Jump' && p.animation !== 'Wave';
    }).length;

    const danceRatio = dancingPlayers / totalPlayers;
    
    // Calculate raw energy: combination of dance ratio and total crowd size bonus
    const rawEnergy = 0.3 + (danceRatio * 0.5) + (Math.min(totalPlayers, 100) / 100 * 0.2);
    
    // Boost on beat drops
    return Math.min(1.0, isBeatDrop ? rawEnergy + 0.3 : rawEnergy);
  }, [players, musicState?.status, isBeatDrop]);

  // Determine which effects to show based on performance mode
  const showSmoke = performanceMode !== 'Low';
  const showCO2 = performanceMode !== 'Low';

  // State to trigger CO2
  const [triggerCO2, setTriggerCO2] = useState(false);
  const [prevVideoId, setPrevVideoId] = useState<string | null>(null);

  // Trigger CO2 on new song
  useEffect(() => {
    if (musicState?.currentVideoId && musicState.currentVideoId !== prevVideoId) {
      setPrevVideoId(musicState.currentVideoId);
      if (musicState.status === 'playing') {
        setTriggerCO2(true);
        const timer = setTimeout(() => setTriggerCO2(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [musicState?.currentVideoId, musicState?.status, prevVideoId]);

  useEffect(() => {
    if (!isBeatDrop || performanceMode === 'Low') return;
    setTriggerCO2(true);
    const timer = setTimeout(() => setTriggerCO2(false), 1800);
    return () => clearTimeout(timer);
  }, [isBeatDrop, performanceMode]);

  return (
    <group>
      {/* Moving Head Lights */}
      <MovingLights energy={energy} isPlaying={musicState?.status === 'playing'} />

      {/* Stage Lasers */}
      <StageLasers energy={energy} isPlaying={musicState?.status === 'playing'} />

      {/* Volumetric Smoke / Fog */}
      {showSmoke && <StageSmoke energy={energy} />}

      {/* CO2 Cannons */}
      {showCO2 && (
        <>
          <CO2Cannon position={[-15, 0, -18]} trigger={triggerCO2} />
          <CO2Cannon position={[15, 0, -18]} trigger={triggerCO2} />
        </>
      )}
    </group>
  );
};

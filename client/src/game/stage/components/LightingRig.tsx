import React, { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { ConcertVisualState, getStageDensity, STAGE_COLORS } from '../stageVisuals';
import { BeatClock } from '../BeatClock';
import { MovingHeadLight } from './lights/MovingHeadLight';
import { MovingLightController } from './lights/MovingLightController';
import { MovingLightPattern, MovingLightCuePayload } from '../../../../../shared/types';
import { socketService } from '../../../services/socket.service';
import { SOCKET_EVENTS } from '../../../../../shared/events';

interface LightingRigProps {
  visualState: ConcertVisualState;
}

export const LightingRig: React.FC<LightingRigProps> = ({ visualState }) => {
  const { scene } = useThree();
  const density = getStageDensity(visualState.quality);
  
  // Calculate positions
  const topTrussFixtures = useMemo(() => {
    const count = density.movingLights;
    return Array.from({ length: count }, (_, i) => {
      const x = -17.5 + i * (35 / Math.max(1, count - 1));
      return { position: [x, 15.35, -18.7] as [number, number, number], rotation: [Math.PI, 0, 0] as [number, number, number] };
    });
  }, [density.movingLights]);

  const sideTrussLeft = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => ({
      position: [-21.5, 4 + i * 4, -18.7] as [number, number, number],
      rotation: [0, Math.PI / 2, -Math.PI / 2] as [number, number, number] // pointing right
    }));
  }, []);

  const sideTrussRight = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => ({
      position: [21.5, 4 + i * 4, -18.7] as [number, number, number],
      rotation: [0, -Math.PI / 2, Math.PI / 2] as [number, number, number] // pointing left
    }));
  }, []);

  const allFixtures = [...topTrussFixtures, ...sideTrussLeft, ...sideTrussRight];
  
  // Max real lights budget
  const maxRealLights = visualState.quality === 'high' ? 8 : visualState.quality === 'medium' ? 4 : 0;

  useEffect(() => {
    const handleBar = (state: any) => {
      if (!visualState.isPlaying) {
        MovingLightController.setCue('IDLE', '#FFFFFF', 0.5, 0.5);
        return;
      }
      
      const { barIndex } = state;
      let pattern: MovingLightPattern = 'SWEEP_LEFT_RIGHT';
      let speed = 1.0;
      let color = STAGE_COLORS[barIndex % STAGE_COLORS.length];
      let intensity = 0.8 + visualState.energy * 0.5;

      // Handle DJ Manual Cues
      if (visualState.cueType === 'moving-light') {
        // We can't access the cue payload easily here without adding it to visualState, 
        // but wait, visualState only has cueType. I should add `activeCue` to visualState or just use room store.
        // For now, let's just make it do a burst on drop.
      }

      if (visualState.isBeatDrop) {
        pattern = 'DROP_BURST';
        speed = 2.0;
        intensity = 2.0;
        color = '#FFFFFF' as any;
      } else if (visualState.energy > 0.8) {
        // Build or intense chorus
        pattern = barIndex % 4 === 0 ? 'FAN' : 'CROSS';
        speed = 1.5;
      } else if (visualState.energy < 0.4) {
        // Verse / Break
        pattern = 'SWEEP_CENTER_OUT';
        speed = 0.5;
        intensity = 0.6;
        color = barIndex % 2 === 0 ? '#FF007F' : '#00F0FF';
      } else {
        // Normal Chorus
        pattern = ['SWEEP_LEFT_RIGHT', 'CROSS', 'FAN', 'AUDIENCE_SCAN'][barIndex % 4] as MovingLightPattern;
        speed = 1.0;
      }
      
      MovingLightController.setCue(pattern, color, intensity, speed);
    };

    const unsubscribe = BeatClock.onBar(handleBar);
    
    // Trigger initial state
    handleBar(BeatClock.getState());
    
    return () => {
      unsubscribe();
    };
  }, [visualState.isPlaying, visualState.isBeatDrop, visualState.energy, visualState.cueType]);

  // Listen to manual cues from DJ via Socket
  useEffect(() => {
    const handleStageCue = (cue: any) => {
      if (cue.type !== 'moving-light') return;
      const payload = cue.payload as MovingLightCuePayload;
      if (payload && payload.preset) {
        MovingLightController.setCue(
          payload.preset, 
          payload.color || STAGE_COLORS[Math.floor(Math.random() * STAGE_COLORS.length)], 
          payload.intensity || 1.5, 
          payload.speed || 1.5
        );
      }
    };
    
    socketService.on(SOCKET_EVENTS.SERVER_STAGE_CUE, handleStageCue);
    return () => {
      socketService.off(SOCKET_EVENTS.SERVER_STAGE_CUE, handleStageCue);
    };
  }, []);

  return (
    <group>
      {allFixtures.map((fixture, index) => {
        // Distribute real lights evenly among the fixtures
        const isRealLight = index % Math.ceil(allFixtures.length / maxRealLights) === 0 && maxRealLights > 0;
        
        return (
          <MovingHeadLight
            key={index}
            index={index}
            totalFixtures={allFixtures.length}
            position={fixture.position}
            rotation={fixture.rotation}
            enableRealLight={isRealLight}
          />
        );
      })}
    </group>
  );
};

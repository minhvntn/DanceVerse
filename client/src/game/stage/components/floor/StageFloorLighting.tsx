import React, { useState, useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { socketService } from '../../../../services/socket.service';
import { FloorEffectCuePayload } from '../../../../../../shared/types';
import { SOCKET_EVENTS } from '../../../../../../shared/events';
import { ConcertVisualState, STAGE_COLORS } from '../../stageVisuals';
import { BeatClock, BeatState } from '../../BeatClock';
import { StageLedPattern, LedPatternType } from './StageLedPattern';
import { StageUplightRig } from './StageUplightRig';
import { FloorLightChase } from './FloorLightChase';
import { FloorLightBurst } from './FloorLightBurst';

interface StageFloorLightingProps {
  visualState: ConcertVisualState;
}

export const StageFloorLighting: React.FC<StageFloorLightingProps> = ({ visualState }) => {
  const [pattern, setPattern] = useState<LedPatternType>('grid');
  const [color, setColor] = useState<string>(STAGE_COLORS[0]);
  const [isFanEnabled, setIsFanEnabled] = useState(false);
  const [isUplightOn, setIsUplightOn] = useState(true);
  
  // Transient effects
  const burstRef = useRef(0); // 0 to 1
  const chaseRef = useRef(0); // 0 to 1

  useEffect(() => {
    const handleStageCue = (cue: any) => {
      if (cue.type !== 'floor') return;
      const payload = cue.payload as FloorEffectCuePayload;

      if (payload.pattern) setPattern(payload.pattern);
      if (payload.color) setColor(payload.color);

      switch (payload.effect) {
        case 'burst':
          burstRef.current = 1.0;
          setPattern('center-burst');
          break;
        case 'pulse':
          // Handled by beat clock naturally, but can force a beat
          burstRef.current = 0.5;
          break;
        case 'chase':
          chaseRef.current = 1.0;
          break;
        case 'uplight-on':
          setIsUplightOn(true);
          setIsFanEnabled(false);
          break;
        case 'uplight-off':
          setIsUplightOn(false);
          break;
        case 'uplight-fan':
          setIsUplightOn(true);
          setIsFanEnabled(true);
          break;
        case 'all-white':
          setColor('#FFFFFF');
          burstRef.current = 1.0;
          break;
      }
    };

    socketService.on(SOCKET_EVENTS.SERVER_STAGE_CUE, handleStageCue);
    return () => {
      socketService.off(SOCKET_EVENTS.SERVER_STAGE_CUE, handleStageCue);
    };
  }, []);

  // Update patterns based on Bar changes
  useEffect(() => {
    const handleBar = (state: BeatState) => {
      if (!visualState.isPlaying) return;
      
      // Auto change pattern every 4 bars if in a hype section, or during drops
      if (visualState.isBeatDrop) {
        setPattern('center-burst');
        setIsFanEnabled(true);
        setIsUplightOn(true);
      } else {
        const patterns: LedPatternType[] = ['grid', 'diagonal', 'rings'];
        setPattern(patterns[state.barIndex % patterns.length]);
        setIsFanEnabled(state.barIndex % 4 === 0); // Fan every 4 bars
      }
    };

    const unsubscribe = BeatClock.onBar(handleBar);

    const handleLocalPulse = () => {
      // Local perfect max pulse! Doesn't trigger full burst, just 0.5 intensity
      burstRef.current = 0.5;
    };
    window.addEventListener('trigger-floor-pulse', handleLocalPulse);

    return () => {
      unsubscribe();
      window.removeEventListener('trigger-floor-pulse', handleLocalPulse);
    };
  }, [visualState.isPlaying, visualState.isBeatDrop]);

  useFrame((_, delta) => {
    // Decay transient effects
    if (burstRef.current > 0) {
      burstRef.current = Math.max(0, burstRef.current - delta * 2.0); // 500ms decay
    }
    if (chaseRef.current > 0) {
      chaseRef.current = Math.max(0, chaseRef.current - delta * 1.5); // ~660ms decay
    }
  });

  return (
    <group>
      <StageLedPattern 
        visualState={visualState} 
        pattern={pattern} 
        color={color} 
      />
      {isUplightOn && (
        <StageUplightRig 
          visualState={visualState} 
          color={color} 
          isFanEnabled={isFanEnabled} 
        />
      )}
      
      <FloorLightBurst color={color} progress={burstRef.current} />
      
      {/* Chase Effect */}
      <FloorLightChase color={color} progress={chaseRef.current} />
    </group>
  );
};

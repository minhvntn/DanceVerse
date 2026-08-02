import React from 'react';
import { ConcertVisualState } from '../../stageVisuals';
import { StageUplight } from './StageUplight';

interface StageUplightRigProps {
  visualState: ConcertVisualState;
  color: string;
  isFanEnabled?: boolean;
}

export const StageUplightRig: React.FC<StageUplightRigProps> = ({ visualState, color, isFanEnabled = false }) => {
  // Determine real lights budget
  // High = 6, Medium = 2, Low = 0
  const maxRealLights = visualState.quality === 'high' ? 6 : visualState.quality === 'medium' ? 2 : 0;

  const positions: Array<{ pos: [number, number, number], fan: number, real: boolean }> = [
    // Center stage front
    { pos: [-9, 0.45, 9.2], fan: -0.3, real: maxRealLights > 4 },
    { pos: [-4.5, 0.45, 9.2], fan: -0.15, real: maxRealLights > 0 },
    { pos: [0, 0.45, 9.2], fan: 0, real: maxRealLights > 2 },
    { pos: [4.5, 0.45, 9.2], fan: 0.15, real: maxRealLights > 0 },
    { pos: [9, 0.45, 9.2], fan: 0.3, real: maxRealLights > 4 },

    // Middle platform edges
    { pos: [-12, 1.35, 3.8], fan: -0.4, real: false },
    { pos: [-6, 1.35, 3.8], fan: -0.2, real: maxRealLights > 2 },
    { pos: [6, 1.35, 3.8], fan: 0.2, real: maxRealLights > 2 },
    { pos: [12, 1.35, 3.8], fan: 0.4, real: false },

    // DJ platform edges
    { pos: [-10, 2.25, -0.6], fan: -0.5, real: false },
    { pos: [-5, 2.25, -0.6], fan: -0.25, real: maxRealLights > 4 },
    { pos: [5, 2.25, -0.6], fan: 0.25, real: maxRealLights > 4 },
    { pos: [10, 2.25, -0.6], fan: 0.5, real: false },
  ];

  return (
    <group position={[0, 0, -18]}>
      {positions.map((fixture, idx) => (
        <StageUplight
          key={idx}
          position={fixture.pos}
          color={color}
          visualState={visualState}
          fanAngle={fixture.fan}
          isFanEnabled={isFanEnabled}
          useRealLight={fixture.real}
        />
      ))}
    </group>
  );
};

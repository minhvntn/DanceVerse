import React, { useMemo } from 'react';
import { AvatarType, PerformanceMode } from '../../types';
import { AvatarPrimitive } from '../avatars/AvatarPrimitive';
import { getAutoDanceAnimation } from '../avatars/danceUtils';

interface AmbientCrowdProps {
  performanceMode: PerformanceMode;
  isPlaying: boolean;
}

const AVATAR_TYPES: AvatarType[] = [
  'Boy',
  'Girl',
  'Robot',
  'Panda',
  'Alien',
  'Cat',
  'Bunny',
  'Dinosaur'
];

const getCrowdCount = (performanceMode: PerformanceMode): number => {
  if (performanceMode === 'Low') return 8;
  if (performanceMode === 'Medium') return 16;
  return 30;
};

const seededUnit = (seed: number): number => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

export const AmbientCrowd: React.FC<AmbientCrowdProps> = ({ performanceMode, isPlaying }) => {
  const dancers = useMemo(() => {
    const count = getCrowdCount(performanceMode);
    const placements: Array<{
      id: string;
      avatarType: AvatarType;
      position: [number, number, number];
      rotation: number;
      scale: number;
      phase: number;
    }> = [];

    let index = 0;
    let row = 0;
    while (placements.length < count) {
      const columns = row % 2 === 0 ? 6 : 8;
      for (let column = 0; column < columns && placements.length < count; column += 1) {
        const side = column % 2 === 0 ? -1 : 1;
        const lane = Math.floor(column / 2);
        const x = side * (4.5 + lane * 4.6 + seededUnit(index + 3) * 1.2);
        const baseZ = 7.5 + row * 5.2;
        const z = baseZ + Math.abs(x) * 0.075 + seededUnit(index + 17) * 1.4;

        placements.push({
          id: `ambient-${index}`,
          avatarType: AVATAR_TYPES[index % AVATAR_TYPES.length],
          position: [x, 0, z],
          rotation: Math.PI + (seededUnit(index + 29) - 0.5) * 0.16,
          scale: 0.66 + seededUnit(index + 41) * 0.2,
          phase: seededUnit(index + 53) * Math.PI * 2
        });
        index += 1;
      }
      row += 1;
    }

    return placements;
  }, [performanceMode]);

  return (
    <group>
      {dancers.map((dancer) => (
        <group
          key={dancer.id}
          position={dancer.position}
          rotation={[0, dancer.rotation, 0]}
        >
          <AvatarPrimitive
            avatarType={dancer.avatarType}
            animation={isPlaying ? getAutoDanceAnimation(dancer.id) : 'Idle'}
            scale={dancer.scale}
            phase={dancer.phase}
            simplified
            showName={false}
          />
        </group>
      ))}
    </group>
  );
};

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { AvatarPrimitive } from '../../avatars/AvatarPrimitive';
import { AvatarType, DanceAnimationType } from '../../../types';
import { ConcertVisualState, getStageDensity, STAGE_COLORS } from '../stageVisuals';
import { useRoomStore } from '../../../stores/useRoomStore';

interface NpcCrowdProps {
  visualState: ConcertVisualState;
}

interface CrowdMember {
  position: [number, number, number];
  rotation: number;
  avatarType: AvatarType;
  animation: DanceAnimationType;
  phase: number;
  scale: number;
  glowStick: boolean;
}

const AVATARS: AvatarType[] = ['Boy', 'Girl', 'Robot', 'Panda', 'Alien', 'Cat', 'Bunny', 'Dinosaur'];
const DANCES: DanceAnimationType[] = ['HipHop', 'Shuffle', 'Clap', 'Wave', 'Cheer', 'RandomDance', 'Spin'];

const buildCrowd = (count: number): CrowdMember[] => {
  const members: CrowdMember[] = [];
  const rows = [
    { z: -4.4, columns: [-24, -20, -16, -12, -7.5, 7.5, 12, 16, 20, 24] },
    { z: -0.8, columns: [-22.5, -18.5, -14.5, -10.5, -6.8, 6.8, 10.5, 14.5, 18.5, 22.5] },
    { z: 3.3, columns: [-21, -16, -11.5, -7.2, 7.2, 11.5, 16, 21] },
    { z: 8.2, columns: [-18, -12.5, -7.2, 7.2, 12.5, 18] },
    { z: 13.8, columns: [-14.5, -8, 8, 14.5] }
  ];

  rows.forEach((row, rowIndex) => {
    row.columns.forEach((x, columnIndex) => {
      if (members.length >= count) return;
      const seed = rowIndex * 11 + columnIndex;
      const offsetX = Math.sin(seed * 4.71) * 0.48;
      const offsetZ = Math.cos(seed * 2.93) * 0.32;
      members.push({
        position: [x + offsetX, 0, row.z + offsetZ],
        rotation: Math.PI + Math.sin(seed * 1.27) * 0.18,
        avatarType: AVATARS[seed % AVATARS.length],
        animation: DANCES[(seed * 3 + rowIndex) % DANCES.length],
        phase: seed * 0.41,
        scale: 0.84 + (seed % 4) * 0.035 - rowIndex * 0.012,
        glowStick: seed % 3 !== 1
      });
    });
  });
  return members;
};

export const NpcCrowd: React.FC<NpcCrowdProps> = ({ visualState }) => {
  const players = useRoomStore((state) => state.players);
  const realPlayerCount = Object.values(players).filter(p => !p.isNpc).length;
  
  const count = useMemo(() => {
    if (realPlayerCount >= 100) return 0;
    if (realPlayerCount >= 50) return 10;
    if (realPlayerCount >= 20) return 20;
    return getStageDensity(visualState.quality).crowd; // Usually ~30 based on quality
  }, [realPlayerCount, visualState.quality]);

  const members = useMemo(() => buildCrowd(count), [count]);
  const simplified = visualState.quality !== 'high';
  
  // Apply stage cue overrides for concert sync
  const activeCue = useRoomStore((state) => state.activeStageCue);
  
  const cueColor = visualState.cueType === 'lightstick' ? (activeCue?.payload as any)?.color : null;
  const cueEffect = visualState.cueType === 'lightstick' ? (activeCue?.payload as any)?.effect : null;

  return (
    <group>
      {members.map((member, index) => {
        // If it's a wave or crowd-wave, use WaveLightstick
        const isWaveEffect = cueEffect === 'wave' || cueEffect === 'crowd-wave';
        const finalAnimation = isWaveEffect && member.glowStick 
          ? 'WaveLightstick' 
          : (visualState.isPlaying ? member.animation : 'Idle');
        
        // Calculate crowd wave delay based on X position (normalized to -20..20 range)
        let timeOffset = 0;
        if (cueEffect === 'crowd-wave') {
          // X goes from roughly -20 to +20, so offset by position.x / 10
          timeOffset = (member.position[0] + 20) * 0.15;
        } else if (cueEffect === 'pulse' || cueEffect === 'color') {
          // Small random delay so they don't look perfectly robotic
          timeOffset = Math.random() * 0.2;
        }

        let glowColor = STAGE_COLORS[index % STAGE_COLORS.length];
        
        // Rainbow effect
        if (cueEffect === 'rainbow') {
          glowColor = STAGE_COLORS[index % STAGE_COLORS.length]; // they keep their individual colors
        }
        
        const finalColor = (cueColor && cueEffect !== 'rainbow') && member.glowStick ? cueColor : glowColor;

        return (
          <group key={`${member.position[0]}-${member.position[2]}`} position={member.position} rotation={[0, member.rotation, 0]}>
            <AvatarPrimitive
              avatarType={member.avatarType}
              animation={finalAnimation}
              audienceMotion={!visualState.isPlaying && !isWaveEffect}
              showName={false}
              simplified={simplified}
              phase={member.phase}
              scale={member.scale}
              equippedLightstick={member.glowStick && visualState.quality !== 'low'}
              lightstickColor={finalColor}
              animationTimeOffset={timeOffset}
            />
          </group>
        );
      })}
    </group>
  );
};

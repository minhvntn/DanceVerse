import React, { useMemo } from 'react';
import * as THREE from 'three';
import { AvatarPrimitive } from '../../avatars/AvatarPrimitive';
import { AvatarType, DanceAnimationType } from '../../../types';
import { ConcertVisualState, getStageDensity, STAGE_COLORS } from '../stageVisuals';

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
  const count = getStageDensity(visualState.quality).crowd;
  const members = useMemo(() => buildCrowd(count), [count]);
  const simplified = visualState.quality !== 'high';

  return (
    <group>
      {members.map((member, index) => {
        const animation = visualState.isPlaying ? member.animation : 'Idle';
        const glowColor = STAGE_COLORS[index % STAGE_COLORS.length];
        return (
          <group key={`${member.position[0]}-${member.position[2]}`} position={member.position} rotation={[0, member.rotation, 0]}>
            <AvatarPrimitive
              avatarType={member.avatarType}
              animation={animation}
              audienceMotion={!visualState.isPlaying}
              showName={false}
              simplified={simplified}
              phase={member.phase}
              scale={member.scale}
            />
            {member.glowStick && visualState.quality !== 'low' && (
              <group position={[index % 2 === 0 ? -0.52 : 0.52, 1.25, 0.08]} rotation={[0, 0, index % 2 === 0 ? -0.34 : 0.34]}>
                <mesh>
                  <cylinderGeometry args={[0.035, 0.035, 0.78, 7]} />
                  <meshBasicMaterial color={glowColor} transparent opacity={0.92} toneMapped={false} />
                </mesh>
                <mesh scale={1.8}>
                  <cylinderGeometry args={[0.045, 0.045, 0.82, 7]} />
                  <meshBasicMaterial color={glowColor} transparent opacity={0.09} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
};

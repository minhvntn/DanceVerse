import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConcertVisualState, STAGE_COLORS } from '../stageVisuals';
import { BeatClock } from '../BeatClock';
import {
  AUDIENCE_PODIUM_CENTER_Z,
  AUDIENCE_PODIUM_STEPS,
  AUDIENCE_RUNWAY
} from '../audienceElevation';

interface AudienceAreaProps {
  visualState: ConcertVisualState;
}

export const AudienceArea: React.FC<AudienceAreaProps> = ({ visualState }) => {
  const gridRef = useRef<THREE.Group>(null);
  const floorRef = useRef<THREE.MeshStandardMaterial>(null);
  const grid = useMemo(() => ({
    rows: Array.from({ length: visualState.quality === 'low' ? 9 : 13 }, (_, index) => -7 + index * 3.2),
    columns: Array.from({ length: visualState.quality === 'low' ? 9 : 15 }, (_, index) => -28 + index * 4)
  }), [visualState.quality]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const { beatPhase, isPaused } = BeatClock.getState();
    const pulse = isPaused ? 0.12 : 0.42 + Math.max(0, 1 - beatPhase * 3) * 0.3;
    if (floorRef.current) floorRef.current.emissiveIntensity = pulse;
    gridRef.current?.children.forEach((child, index) => {
      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.opacity = 0.18 + visualState.energy * 0.24 + Math.sin(time * 2.1 + index * 0.33) * 0.08;
    });
  });

  return (
    <group>
      <mesh position={[0, -0.12, 8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[78, 72]} />
        <meshStandardMaterial color="#01030A" roughness={0.32} metalness={0.68} />
      </mesh>
      <mesh position={[0, -0.055, 8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[59, 47]} />
        <meshStandardMaterial ref={floorRef} color="#070A1A" emissive="#071E34" emissiveIntensity={0.15} roughness={0.16} metalness={0.84} transparent opacity={0.96} />
      </mesh>

      <group ref={gridRef}>
        {grid.rows.map((z, index) => (
          <mesh key={`row-${z}`} position={[0, 0.015, z]}>
            <boxGeometry args={[58, 0.025, 0.055]} />
            <meshBasicMaterial color={STAGE_COLORS[index % STAGE_COLORS.length]} transparent opacity={0.28} toneMapped={false} />
          </mesh>
        ))}
        {grid.columns.map((x, index) => (
          <mesh key={`column-${x}`} position={[x, 0.018, 12.2]}>
            <boxGeometry args={[0.055, 0.025, 41.5]} />
            <meshBasicMaterial color={STAGE_COLORS[(index + 1) % STAGE_COLORS.length]} transparent opacity={0.23} toneMapped={false} />
          </mesh>
        ))}
      </group>

      <group position={[0, 0.65, -8.1]}>
        {Array.from({ length: 15 }, (_, index) => -24.5 + index * 3.5).map((x, index) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.09, 0.13, 1.25, 8]} />
              <meshStandardMaterial color="#1B2236" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.46, 0]}>
              <sphereGeometry args={[0.13, 10, 10]} />
              <meshBasicMaterial color={STAGE_COLORS[index % STAGE_COLORS.length]} toneMapped={false} />
            </mesh>
          </group>
        ))}
        {[0.15, 0.7].flatMap((y, index) => [-1, 1].map((side) => (
          <mesh key={`${y}-${side}`} position={[side * 15, y, 0]}>
            <boxGeometry args={[20, 0.09, 0.09]} />
            <meshBasicMaterial color={index === 0 ? '#FF007F' : '#00F0FF'} transparent opacity={0.75} toneMapped={false} />
          </mesh>
        )))}
      </group>

      <mesh
        position={[
          AUDIENCE_RUNWAY.centerX,
          AUDIENCE_RUNWAY.topElevation / 2,
          AUDIENCE_RUNWAY.centerZ
        ]}
        receiveShadow
      >
        <boxGeometry args={[
          AUDIENCE_RUNWAY.width,
          AUDIENCE_RUNWAY.topElevation,
          AUDIENCE_RUNWAY.depth
        ]} />
        <meshStandardMaterial color="#070A14" emissive="#140D33" emissiveIntensity={visualState.energy * 0.6} metalness={0.86} roughness={0.18} />
      </mesh>
      {[-1, 1].map((side, index) => (
        <mesh
          key={side}
          position={[
            side * (AUDIENCE_RUNWAY.width / 2 - 0.18),
            AUDIENCE_RUNWAY.topElevation + 0.02,
            AUDIENCE_RUNWAY.centerZ
          ]}
        >
          <boxGeometry args={[0.1, 0.08, AUDIENCE_RUNWAY.depth]} />
          <meshBasicMaterial color={index === 0 ? '#00F0FF' : '#FF007F'} toneMapped={false} />
        </mesh>
      ))}

      <group position={[0, 0, AUDIENCE_PODIUM_CENTER_Z]}>
        {AUDIENCE_PODIUM_STEPS.map((step, index) => (
          <React.Fragment key={step.id}>
            <mesh
              position={[0, step.topElevation / 2, 0]}
              castShadow
              receiveShadow
            >
              <cylinderGeometry args={[step.radius, step.radius, step.topElevation, 64]} />
              <meshStandardMaterial
                color={step.color}
                emissive={index === 2 ? '#170C38' : '#07152C'}
                emissiveIntensity={0.18 + visualState.energy * (0.2 + index * 0.1)}
                metalness={0.88}
                roughness={0.16 + index * 0.02}
              />
            </mesh>
            <mesh
              position={[0, step.topElevation + 0.008, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[step.radius - 0.11, step.radius, 64]} />
              <meshBasicMaterial
                color={visualState.isBeatDrop && index === 2 ? '#FFFFFF' : step.rimColor}
                transparent
                opacity={0.48 + visualState.energy * 0.38}
                toneMapped={false}
              />
            </mesh>
          </React.Fragment>
        ))}

        {Array.from({ length: 8 }, (_, index) => {
          const angle = (index / 8) * Math.PI * 2;
          const mainStep = AUDIENCE_PODIUM_STEPS[2];
          return (
            <mesh
              key={index}
              position={[
                Math.cos(angle) * (mainStep.radius - 0.22),
                mainStep.topElevation + 0.12,
                Math.sin(angle) * (mainStep.radius - 0.22)
              ]}
            >
              <sphereGeometry args={[0.11, 10, 10]} />
              <meshBasicMaterial color={STAGE_COLORS[index % STAGE_COLORS.length]} toneMapped={false} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};

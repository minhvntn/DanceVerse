import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PerformanceMode } from '../../types';

interface DanceFloorProps {
  isPlaying: boolean;
  performanceMode: PerformanceMode;
}

const FLOOR_COLORS = ['#00F0FF', '#8B5CF6', '#FF007F'];

export const DanceFloor: React.FC<DanceFloorProps> = ({ isPlaying, performanceMode }) => {
  const floorMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const accentGroupRef = useRef<THREE.Group>(null);

  const grid = useMemo(() => {
    const density = performanceMode === 'Low' ? 6 : 10;
    const horizontal = Array.from({ length: density }, (_, index) => -12 + index * (34 / (density - 1)));
    const vertical = Array.from({ length: density + 3 }, (_, index) => -24 + index * (48 / (density + 2)));
    return { horizontal, vertical };
  }, [performanceMode]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const pulse = isPlaying ? 0.45 + Math.sin(time * 4) * 0.18 : 0.12;

    if (floorMaterialRef.current) {
      floorMaterialRef.current.emissiveIntensity = pulse;
    }
    if (accentGroupRef.current) {
      accentGroupRef.current.children.forEach((child, index) => {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = isPlaying
          ? 0.48 + Math.sin(time * 3.5 + index * 0.7) * 0.22
          : 0.2;
      });
    }
  });

  return (
    <group>
      <mesh position={[0, -0.08, 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 74]} />
        <meshStandardMaterial color="#020617" roughness={0.88} metalness={0.25} />
      </mesh>

      <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[49, 38]} />
        <meshStandardMaterial
          ref={floorMaterialRef}
          color="#070B1D"
          emissive="#111B4D"
          emissiveIntensity={0.15}
          roughness={0.25}
          metalness={0.75}
        />
      </mesh>

      <group ref={accentGroupRef}>
        {grid.horizontal.map((z, index) => (
          <mesh key={`h-${z}`} position={[0, 0.025, z]}>
            <boxGeometry args={[48, 0.025, 0.045]} />
            <meshBasicMaterial
              color={FLOOR_COLORS[index % FLOOR_COLORS.length]}
              transparent
              opacity={0.35}
              toneMapped={false}
            />
          </mesh>
        ))}
        {grid.vertical.map((x, index) => (
          <mesh key={`v-${x}`} position={[x, 0.028, 2]}>
            <boxGeometry args={[0.045, 0.025, 34]} />
            <meshBasicMaterial
              color={FLOOR_COLORS[index % FLOOR_COLORS.length]}
              transparent
              opacity={0.3}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* Perspective runway lines guide the eye toward the main screen. */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 6.5, 0.055, -0.5]} rotation={[0, side * -0.16, 0]}>
          <boxGeometry args={[0.14, 0.045, 35]} />
          <meshBasicMaterial color={side < 0 ? '#00F0FF' : '#FF007F'} toneMapped={false} />
        </mesh>
      ))}

      <mesh position={[0, 0.06, -12.85]}>
        <boxGeometry args={[36, 0.08, 0.16]} />
        <meshBasicMaterial color="#FF007F" toneMapped={false} />
      </mesh>
    </group>
  );
};

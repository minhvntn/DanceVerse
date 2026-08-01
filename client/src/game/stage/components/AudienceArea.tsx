import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConcertVisualState, STAGE_COLORS } from '../stageVisuals';

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
    const pulse = visualState.isPlaying ? 0.42 + Math.sin(time * 3.2) * 0.18 : 0.12;
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

      <mesh position={[0, 0.08, 0.45]} receiveShadow>
        <boxGeometry args={[7.8, 0.16, 17]} />
        <meshStandardMaterial color="#070A14" emissive="#140D33" emissiveIntensity={visualState.energy * 0.6} metalness={0.86} roughness={0.18} />
      </mesh>
      {[-3.72, 3.72].map((x, index) => (
        <mesh key={x} position={[x, 0.18, 0.45]}>
          <boxGeometry args={[0.1, 0.08, 17]} />
          <meshBasicMaterial color={index === 0 ? '#00F0FF' : '#FF007F'} toneMapped={false} />
        </mesh>
      ))}

      <group position={[0, 0.16, 9.55]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[5.25, 5.65, 0.28, 12]} />
          <meshStandardMaterial color="#080A18" emissive="#170C38" emissiveIntensity={0.34 + visualState.energy * 0.55} metalness={0.88} roughness={0.16} />
        </mesh>
        <mesh position={[0, 0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[4.5, 5.05, 48]} />
          <meshBasicMaterial color={visualState.isBeatDrop ? '#FFFFFF' : '#9D5CFF'} transparent opacity={0.42 + visualState.energy * 0.4} toneMapped={false} />
        </mesh>
        {Array.from({ length: 8 }, (_, index) => {
          const angle = (index / 8) * Math.PI * 2;
          return (
            <mesh key={index} position={[Math.cos(angle) * 4.8, 0.38, Math.sin(angle) * 4.8]}>
              <sphereGeometry args={[0.11, 10, 10]} />
              <meshBasicMaterial color={STAGE_COLORS[index % STAGE_COLORS.length]} toneMapped={false} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};

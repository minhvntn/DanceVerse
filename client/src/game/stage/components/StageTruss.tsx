import React, { useMemo, useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConcertVisualState, STAGE_COLORS } from '../stageVisuals';

interface StageTrussProps {
  visualState: ConcertVisualState;
}

const TrussBar: React.FC<{
  position: [number, number, number];
  size: [number, number, number];
  rotation?: [number, number, number];
}> = ({ position, size, rotation = [0, 0, 0] }) => (
  <mesh position={position} rotation={rotation} castShadow>
    <boxGeometry args={size} />
    <meshStandardMaterial color="#394355" emissive="#080D18" emissiveIntensity={0.48} metalness={0.88} roughness={0.3} />
  </mesh>
);

export const StageTruss: React.FC<StageTrussProps> = ({ visualState }) => {
  const logoGlowRef = useRef<THREE.MeshBasicMaterial>(null);
  const braceX = useMemo(() => Array.from({ length: 10 }, (_, index) => -20 + index * 4.45), []);
  const braceY = useMemo(() => Array.from({ length: 6 }, (_, index) => 2 + index * 2.65), []);

  useFrame(({ clock }) => {
    if (!logoGlowRef.current) return;
    const time = clock.getElapsedTime();
    logoGlowRef.current.opacity = 0.32 + visualState.energy * 0.45 + Math.sin(time * 2.2) * 0.08;
  });

  return (
    <group>
      <group position={[0, 16.2, -18.7]}>
        <TrussBar position={[0, 0.65, -5.2]} size={[44.5, 0.34, 0.34]} />
        <TrussBar position={[0, -0.65, -5.2]} size={[44.5, 0.34, 0.34]} />
        <TrussBar position={[0, 0.65, 5.2]} size={[44.5, 0.34, 0.34]} />
        <TrussBar position={[0, -0.65, 5.2]} size={[44.5, 0.34, 0.34]} />
        {braceX.map((x, index) => (
          <React.Fragment key={x}>
            <TrussBar position={[x, 0, -5.2]} size={[0.18, 1.65, 0.18]} rotation={[0, 0, index % 2 === 0 ? 0.72 : -0.72]} />
            <TrussBar position={[x, 0, 5.2]} size={[0.18, 1.65, 0.18]} rotation={[0, 0, index % 2 === 0 ? -0.72 : 0.72]} />
            <TrussBar position={[x, 0, 0]} size={[0.18, 0.18, 10.7]} rotation={[0, index % 2 === 0 ? 0.08 : -0.08, 0]} />
          </React.Fragment>
        ))}
        <mesh position={[0, -0.98, 5.2]}>
          <boxGeometry args={[43.8, 0.075, 0.075]} />
          <meshBasicMaterial color="#00F0FF" transparent opacity={0.42 + visualState.energy * 0.34} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.98, -5.2]}>
          <boxGeometry args={[43.8, 0.075, 0.075]} />
          <meshBasicMaterial color="#FF007F" transparent opacity={0.36 + visualState.energy * 0.32} toneMapped={false} />
        </mesh>
      </group>

      {[-1, 1].map((side) => (
        <group key={side} position={[side * 22.2, 0, -18.7]}>
          <TrussBar position={[-0.55, 8.2, -5.2]} size={[0.32, 16.4, 0.32]} />
          <TrussBar position={[0.55, 8.2, -5.2]} size={[0.32, 16.4, 0.32]} />
          <TrussBar position={[-0.55, 8.2, 5.2]} size={[0.32, 16.4, 0.32]} />
          <TrussBar position={[0.55, 8.2, 5.2]} size={[0.32, 16.4, 0.32]} />
          {braceY.map((y, index) => (
            <React.Fragment key={y}>
              <TrussBar position={[0, y, -5.2]} size={[0.18, 1.55, 0.18]} rotation={[0, 0, index % 2 === 0 ? 0.72 : -0.72]} />
              <TrussBar position={[0, y, 5.2]} size={[0.18, 1.55, 0.18]} rotation={[0, 0, index % 2 === 0 ? -0.72 : 0.72]} />
              <TrussBar position={[0, y, 0]} size={[0.18, 0.18, 10.5]} />
            </React.Fragment>
          ))}
          <mesh position={[0, 16.55, 0]}>
            <sphereGeometry args={[0.35, 12, 12]} />
            <meshBasicMaterial color={side < 0 ? '#FF007F' : '#00F0FF'} toneMapped={false} />
          </mesh>
        </group>
      ))}

      <group position={[0, 19.4, -12.65]}>
        <mesh position={[0, 0, -0.1]} castShadow>
          <boxGeometry args={[15.4, 3.35, 0.65]} />
          <meshStandardMaterial color="#060812" metalness={0.85} roughness={0.18} />
        </mesh>
        <mesh position={[0, 0, 0.26]}>
          <planeGeometry args={[14.7, 2.75]} />
          <meshBasicMaterial ref={logoGlowRef} color="#24104C" transparent opacity={0.6} toneMapped={false} />
        </mesh>
        <Text position={[0, 0.42, 0.35]} fontSize={1.15} color="#FFFFFF" anchorX="center" anchorY="middle" outlineWidth={0.045} outlineColor="#FF007F">
          DANCEVERSE
        </Text>
        <Text position={[0, -0.72, 0.35]} fontSize={0.42} color="#76F7FF" anchorX="center" anchorY="middle" letterSpacing={0.42}>
          LIVE
        </Text>
        {[-6.85, 6.85].map((x, index) => (
          <mesh key={x} position={[x, 0, 0.38]}>
            <boxGeometry args={[0.18, 2.75, 0.12]} />
            <meshBasicMaterial color={STAGE_COLORS[index]} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

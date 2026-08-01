import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConcertVisualState } from '../stageVisuals';

interface StagePlatformProps {
  visualState: ConcertVisualState;
}

const EdgeStrip: React.FC<{
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  materialRef?: React.Ref<THREE.MeshBasicMaterial>;
}> = ({ position, size, color, materialRef }) => (
  <mesh position={position}>
    <boxGeometry args={size} />
    <meshBasicMaterial ref={materialRef} color={color} toneMapped={false} />
  </mesh>
);

export const StagePlatform: React.FC<StagePlatformProps> = ({ visualState }) => {
  const cyanRef = useRef<THREE.MeshBasicMaterial>(null);
  const pinkRef = useRef<THREE.MeshBasicMaterial>(null);
  const purpleRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const pulse = visualState.isPlaying
      ? 0.72 + Math.sin(time * (visualState.isBeatDrop ? 9 : 3.8)) * 0.28
      : 0.38 + Math.sin(time * 0.7) * 0.08;
    [cyanRef.current, pinkRef.current, purpleRef.current].forEach((material, index) => {
      if (!material) return;
      material.opacity = THREE.MathUtils.clamp(pulse - index * 0.06, 0.25, 1);
      material.transparent = true;
    });
  });

  return (
    <group position={[0, 0, -18]}>
      <mesh castShadow receiveShadow position={[0, 0.45, 3]}>
        <boxGeometry args={[44, 0.9, 13]} />
        <meshStandardMaterial color="#070A12" roughness={0.18} metalness={0.82} />
      </mesh>
      <mesh receiveShadow position={[0, 0.92, 3]}>
        <boxGeometry args={[43.2, 0.08, 12.2]} />
        <meshStandardMaterial color="#11182D" emissive="#071A2B" emissiveIntensity={visualState.energy * 0.45} roughness={0.12} metalness={0.9} />
      </mesh>
      <EdgeStrip materialRef={cyanRef} position={[0, 0.86, 9.52]} size={[44.2, 0.16, 0.16]} color="#00F0FF" />

      <mesh castShadow receiveShadow position={[0, 1.35, -1]}>
        <boxGeometry args={[37, 0.9, 10]} />
        <meshStandardMaterial color="#090B16" roughness={0.16} metalness={0.86} />
      </mesh>
      <mesh receiveShadow position={[0, 1.82, -1]}>
        <boxGeometry args={[36.3, 0.08, 9.3]} />
        <meshStandardMaterial color="#141026" emissive="#260B31" emissiveIntensity={visualState.energy * 0.36} roughness={0.14} metalness={0.82} />
      </mesh>
      <EdgeStrip materialRef={pinkRef} position={[0, 1.78, 4.02]} size={[37.2, 0.15, 0.16]} color="#FF007F" />

      <mesh castShadow receiveShadow position={[0, 2.25, -4.4]}>
        <boxGeometry args={[24, 0.9, 7.2]} />
        <meshStandardMaterial color="#080A14" roughness={0.15} metalness={0.9} />
      </mesh>
      <mesh receiveShadow position={[0, 2.72, -4.4]}>
        <boxGeometry args={[23.4, 0.08, 6.6]} />
        <meshStandardMaterial color="#13102B" emissive="#25135C" emissiveIntensity={visualState.energy * 0.5} roughness={0.12} metalness={0.88} />
      </mesh>
      <EdgeStrip materialRef={purpleRef} position={[0, 2.68, -0.78]} size={[24.2, 0.15, 0.16]} color="#9D5CFF" />

      {[-5.2, -3.9, -2.6, -1.3, 0, 1.3, 2.6, 3.9, 5.2].map((x, index) => (
        <mesh key={x} position={[x, 2.79, -4.35]}>
          <boxGeometry args={[0.5, 0.035, 5.8]} />
          <meshBasicMaterial color={index % 2 === 0 ? '#00F0FF' : '#FF007F'} transparent opacity={0.12 + visualState.energy * 0.14} toneMapped={false} />
        </mesh>
      ))}

      <group position={[0, 0.4, 9.75]}>
        {[0, 1, 2].map((step) => (
          <mesh key={step} position={[0, step * 0.27, -step * 0.52]} castShadow receiveShadow>
            <boxGeometry args={[10 - step * 0.8, 0.27, 1.15]} />
            <meshStandardMaterial color="#0C1020" emissive={step % 2 === 0 ? '#001E28' : '#250019'} emissiveIntensity={visualState.energy * 0.7} metalness={0.8} roughness={0.2} />
          </mesh>
        ))}
      </group>

      {[-1, 1].map((side) => (
        <group key={side} position={[side * 19.4, 1.4, 1.5]}>
          <mesh castShadow>
            <boxGeometry args={[4.6, 2.8, 8.5]} />
            <meshStandardMaterial color="#070912" roughness={0.25} metalness={0.8} />
          </mesh>
          <mesh position={[-side * 2.31, 0, 0]}>
            <boxGeometry args={[0.08, 2.35, 7.9]} />
            <meshBasicMaterial color={side < 0 ? '#FF007F' : '#00F0FF'} transparent opacity={0.72} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

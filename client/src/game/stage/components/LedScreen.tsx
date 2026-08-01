import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConcertVideoScreen } from '../../../components/stage/ConcertVideoScreen';
import { ConcertVisualState, STAGE_COLORS } from '../stageVisuals';

interface LedScreenProps {
  visualState: ConcertVisualState;
}

export const LedScreen: React.FC<LedScreenProps> = ({ visualState }) => {
  const sweepRef = useRef<THREE.Mesh>(null);
  const trimRefs = useRef<THREE.MeshBasicMaterial[]>([]);
  const sideBarsRef = useRef<THREE.Group>(null);
  const scanlines = useMemo(() => Array.from({ length: visualState.quality === 'low' ? 14 : 26 }, (_, index) => -5.05 + index * (10.1 / (visualState.quality === 'low' ? 13 : 25))), [visualState.quality]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (sweepRef.current) {
      sweepRef.current.position.x = -17 + ((time * (visualState.isPlaying ? 7.2 : 2.2)) % 34);
      const material = sweepRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = visualState.isPlaying ? 0.13 : 0.05;
    }
    trimRefs.current.forEach((material, index) => {
      if (!material) return;
      material.opacity = 0.58 + visualState.energy * 0.34 + Math.sin(time * 3.2 + index) * 0.08;
    });
    sideBarsRef.current?.children.forEach((bar, index) => {
      const wave = visualState.isPlaying ? Math.abs(Math.sin(time * 6 + index * 0.75)) : 0.12;
      bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, 0.16 + wave * 1.45, 0.16);
    });
  });

  return (
    <group position={[0, 9, -22.7]}>
      <mesh position={[0, 0, -0.92]}>
        <planeGeometry args={[36.2, 14.6]} />
        <meshBasicMaterial color="#6D28D9" transparent opacity={0.08 + visualState.energy * 0.08} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.86]}>
        <planeGeometry args={[34.6, 13.65]} />
        <meshBasicMaterial color="#00F0FF" transparent opacity={0.045 + visualState.energy * 0.065} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh castShadow position={[0, 0, -0.42]}>
        <boxGeometry args={[32.8, 12.9, 1.1]} />
        <meshStandardMaterial color="#0B1020" emissive="#080B1C" emissiveIntensity={0.52} metalness={0.86} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0, 0.17]}>
        <boxGeometry args={[31.55, 11.7, 0.35]} />
        <meshStandardMaterial color="#151C34" emissive="#08243B" emissiveIntensity={0.42 + visualState.energy * 0.34} metalness={0.8} roughness={0.18} />
      </mesh>

      <mesh position={[0, 0, 0.39]}>
        <planeGeometry args={[29.8, 10.7]} />
        <ConcertVideoScreen />
      </mesh>

      <group position={[0, 0, 0.44]}>
        {scanlines.map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <planeGeometry args={[29.65, 0.025]} />
            <meshBasicMaterial color="#B7F8FF" transparent opacity={0.055} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
        <mesh ref={sweepRef} position={[-15, 0, 0.01]} rotation={[0, 0, -0.28]}>
          <planeGeometry args={[2.8, 12.6]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.1} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>

      {[
        { position: [0, 5.48, 0.5] as [number, number, number], size: [30.15, 0.075, 0.08] as [number, number, number], color: '#00F0FF' },
        { position: [0, -5.48, 0.5] as [number, number, number], size: [30.15, 0.075, 0.08] as [number, number, number], color: '#FF007F' },
        { position: [-15.08, 0, 0.5] as [number, number, number], size: [0.075, 10.95, 0.08] as [number, number, number], color: '#9D5CFF' },
        { position: [15.08, 0, 0.5] as [number, number, number], size: [0.075, 10.95, 0.08] as [number, number, number], color: '#2563EB' }
      ].map((trim) => (
        <mesh key={`inner-${trim.color}`} position={trim.position}>
          <boxGeometry args={trim.size} />
          <meshBasicMaterial color={trim.color} transparent opacity={0.62 + visualState.energy * 0.28} toneMapped={false} />
        </mesh>
      ))}

      {[
        { position: [0, 6.18, 0.38] as [number, number, number], size: [32.9, 0.22, 0.34] as [number, number, number], color: '#00F0FF' },
        { position: [0, -6.18, 0.38] as [number, number, number], size: [32.9, 0.22, 0.34] as [number, number, number], color: '#FF007F' },
        { position: [-16.34, 0, 0.38] as [number, number, number], size: [0.22, 12.15, 0.34] as [number, number, number], color: '#9D5CFF' },
        { position: [16.34, 0, 0.38] as [number, number, number], size: [0.22, 12.15, 0.34] as [number, number, number], color: '#2563EB' }
      ].map((trim, index) => (
        <mesh key={trim.color} position={trim.position}>
          <boxGeometry args={trim.size} />
          <meshBasicMaterial ref={(material) => { if (material) trimRefs.current[index] = material; }} color={trim.color} transparent opacity={0.8} toneMapped={false} />
        </mesh>
      ))}

      {[-1, 1].map((side) => (
        <group key={side} position={[side * 18.15, -0.2, 0.15]} rotation={[0, side * -0.12, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.5, 11.8, 0.75]} />
            <meshStandardMaterial color="#070A14" metalness={0.82} roughness={0.22} />
          </mesh>
          <group ref={side > 0 ? sideBarsRef : undefined} position={[-0.82, -3.9, 0.42]}>
            {Array.from({ length: 7 }, (_, index) => (
              <mesh key={index} position={[index * 0.27, 0, 0]}>
                <boxGeometry args={[0.13, 1.5, 0.05]} />
                <meshBasicMaterial color={STAGE_COLORS[index % STAGE_COLORS.length]} transparent opacity={0.78} toneMapped={false} />
              </mesh>
            ))}
          </group>
          {Array.from({ length: 5 }, (_, index) => (
            <mesh key={index} position={[0, 3.7 - index * 1.45, 0.42]} rotation={[0, 0, side * 0.42]}>
              <boxGeometry args={[1.65, 0.08, 0.05]} />
              <meshBasicMaterial color={STAGE_COLORS[(index + (side > 0 ? 0 : 2)) % STAGE_COLORS.length]} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}

      {[-1, 1].flatMap((xSide) => [-1, 1].map((ySide) => (
        <group key={`${xSide}-${ySide}`} position={[xSide * 16.15, ySide * 5.98, 0.7]}>
          <mesh>
            <boxGeometry args={[0.8, 0.8, 0.25]} />
            <meshStandardMaterial color="#111827" metalness={0.9} roughness={0.15} />
          </mesh>
          <pointLight color={xSide * ySide > 0 ? '#00F0FF' : '#FF007F'} intensity={visualState.quality === 'high' ? 0.9 * visualState.energy : 0} distance={6} />
        </group>
      )))}
    </group>
  );
};

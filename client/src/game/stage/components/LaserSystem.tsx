import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConcertVisualState, getStageDensity, STAGE_COLORS } from '../stageVisuals';

interface LaserSystemProps {
  visualState: ConcertVisualState;
}

export const LaserSystem: React.FC<LaserSystemProps> = ({ visualState }) => {
  const beamRefs = useRef<THREE.Group[]>([]);
  const tunnelRef = useRef<THREE.Group>(null);
  const count = getStageDensity(visualState.quality).lasers;
  const emitters = useMemo(() => Array.from({ length: count }, (_, index) => ({
    x: -17 + index * (34 / Math.max(1, count - 1)),
    phase: index * 0.73,
    color: STAGE_COLORS[index % STAGE_COLORS.length]
  })), [count]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const pattern = Math.floor(time / 4.8) % 5;
    const cueBoost = visualState.cueType === 'laser';
    const speed = visualState.isPlaying ? (visualState.isBeatDrop || cueBoost ? 3.8 : 1.7) : 0.22;

    beamRefs.current.forEach((beam, index) => {
      if (!beam) return;
      const phase = emitters[index]?.phase ?? 0;
      if (pattern === 0) {
        beam.rotation.z = Math.sin(time * speed + phase) * 0.9;
        beam.rotation.x = 0.2 + Math.cos(time * speed * 0.6 + phase) * 0.12;
      } else if (pattern === 1) {
        beam.rotation.z = (index % 2 === 0 ? -0.72 : 0.72) + Math.sin(time * speed + phase) * 0.22;
        beam.rotation.x = 0.34 + Math.sin(time * 0.7 + phase) * 0.16;
      } else if (pattern === 2) {
        beam.rotation.z = (index - (count - 1) / 2) * 0.12;
        beam.rotation.x = -0.42 + Math.sin(time * speed + phase) * 0.12;
      } else if (pattern === 3) {
        beam.rotation.z = (index - (count - 1) / 2) * 0.145 + Math.sin(time * 0.5) * 0.16;
        beam.rotation.x = 0.22;
      } else {
        beam.rotation.z = Math.sin(time * speed + phase) * 0.46;
        beam.rotation.x = Math.cos(time * speed + phase) * 0.42;
      }
      const activeSlice = pattern === 3 || index % 2 === pattern % 2;
      beam.visible = visualState.isBeatDrop || (visualState.isPlaying ? activeSlice : index % 3 === 0);
    });

    if (tunnelRef.current) {
      tunnelRef.current.visible = visualState.isPlaying && pattern === 4 && visualState.quality !== 'low';
      tunnelRef.current.rotation.z = time * 0.42;
      tunnelRef.current.children.forEach((ring, index) => {
        const scale = 0.72 + ((time * 0.35 + index * 0.22) % 1.1);
        ring.scale.setScalar(scale);
        const material = (ring as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = Math.max(0, 0.32 - Math.abs(scale - 1) * 0.22);
      });
    }
  });

  return (
    <group>
      <group position={[0, 13.8, -13.2]}>
        {emitters.map((emitter, index) => (
          <group key={`${emitter.x}-${emitter.color}`} position={[emitter.x, 0, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.24, 0.36, 0.65, 10]} />
              <meshStandardMaterial color="#06070C" metalness={0.86} roughness={0.22} />
            </mesh>
            <group ref={(group) => { if (group) beamRefs.current[index] = group; }}>
              <mesh position={[0, -16, 0]}>
                <cylinderGeometry args={[0.025, 0.14, 32, 7]} />
                <meshBasicMaterial color={emitter.color} transparent opacity={visualState.isPlaying ? 0.46 : 0.09} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
              </mesh>
              <mesh position={[0, -16, 0]}>
                <cylinderGeometry args={[0.09, 0.25, 32, 12]} />
                <meshBasicMaterial color={emitter.color} transparent opacity={visualState.isPlaying ? 0.075 : 0.018} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
              </mesh>
              <mesh position={[0, -0.38, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.2, 12]} />
                <meshBasicMaterial color={emitter.color} toneMapped={false} />
              </mesh>
            </group>
          </group>
        ))}
      </group>

      <group ref={tunnelRef} position={[0, 6.5, 7]} rotation={[Math.PI / 2, 0, 0]}>
        {Array.from({ length: 7 }, (_, index) => (
          <mesh key={index} position={[0, 0, -index * 2.1]}>
            <torusGeometry args={[4.8 + index * 0.7, 0.055, 6, 64]} />
            <meshBasicMaterial color={STAGE_COLORS[index % STAGE_COLORS.length]} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

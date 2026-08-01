import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ConcertVisualState, getStageDensity } from '../stageVisuals';

interface FogEffectsProps {
  visualState: ConcertVisualState;
}

export const FogEffects: React.FC<FogEffectsProps> = ({ visualState }) => {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const count = getStageDensity(visualState.quality).fog;
  const particles = useMemo(() => Array.from({ length: count }, (_, index) => ({
    x: Math.sin(index * 12.73) * 17,
    y: 0.35 + ((index * 0.61) % 2.2),
    z: -20 + ((index * 3.17) % 15),
    phase: index * 0.57,
    speed: 0.09 + (index % 5) * 0.018,
    scale: 2.1 + (index % 4) * 0.58
  })), [count]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    groupRef.current?.children.forEach((child, index) => {
      const particle = particles[index];
      if (!particle) return;
      child.position.x = particle.x + Math.sin(time * particle.speed * 4 + particle.phase) * 2.4;
      child.position.y = particle.y + Math.sin(time * 0.18 + particle.phase) * 0.35;
      child.quaternion.copy(camera.quaternion);
      const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      material.opacity = (visualState.isPlaying ? 0.07 : 0.025) + Math.sin(time * 0.3 + particle.phase) * 0.012;
    });
  });

  if (count === 0) return null;

  return (
    <group ref={groupRef}>
      {particles.map((particle, index) => (
        <mesh key={index} position={[particle.x, particle.y, particle.z]} scale={[particle.scale * 2.4, particle.scale, 1]}>
          <circleGeometry args={[1, 20]} />
          <meshBasicMaterial color={index % 2 === 0 ? '#A5E9FF' : '#C4A5FF'} transparent opacity={0.06} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

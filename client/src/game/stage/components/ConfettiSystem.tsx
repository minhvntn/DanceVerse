import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConcertVisualState, getStageDensity, STAGE_COLORS } from '../stageVisuals';

interface ConfettiSystemProps {
  visualState: ConcertVisualState;
}

interface ConfettiParticle {
  start: THREE.Vector3;
  initialVelocity: THREE.Vector3;
  velocity: THREE.Vector3;
  spin: THREE.Vector3;
  life: number;
  maxLife: number;
  color: string;
}

export const ConfettiSystem: React.FC<ConfettiSystemProps> = ({ visualState }) => {
  const groupRef = useRef<THREE.Group>(null);
  const resetRef = useRef(false);
  const previousVideoRef = useRef<string | null>(null);
  const count = getStageDensity(visualState.quality).confetti;
  const particles = useMemo<ConfettiParticle[]>(() => Array.from({ length: count }, (_, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const initialVelocity = new THREE.Vector3(-side * (1.1 + (index % 4) * 0.25), 3.2 + (index % 7) * 0.32, 1.2 + (index % 5) * 0.22);
    return {
      start: new THREE.Vector3(side * (6 + (index % 7)), 7 + (index % 6) * 0.55, -14 + (index % 5) * 0.5),
      initialVelocity,
      velocity: initialVelocity.clone(),
      spin: new THREE.Vector3(1.2 + (index % 3), 1.6 + (index % 5) * 0.4, 0.8 + (index % 4) * 0.3),
      life: 0,
      maxLife: 3.4 + (index % 8) * 0.18,
      color: STAGE_COLORS[index % STAGE_COLORS.length]
    };
  }), [count]);

  useEffect(() => {
    const trackChanged = Boolean(visualState.videoId && visualState.videoId !== previousVideoRef.current);
    previousVideoRef.current = visualState.videoId;
    const celebration = visualState.cueType === 'confetti' || visualState.cueType === 'fireworks' || visualState.isBeatDrop;
    if ((trackChanged && visualState.isPlaying) || celebration) resetRef.current = true;
  }, [visualState.videoId, visualState.isPlaying, visualState.isBeatDrop, visualState.cueId, visualState.cueType]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;
    if (resetRef.current) {
      particles.forEach((particle, index) => {
        particle.life = particle.maxLife - (index % 9) * 0.06;
        particle.velocity.copy(particle.initialVelocity);
        const mesh = group.children[index];
        mesh.position.copy(particle.start);
        mesh.scale.setScalar(1);
      });
      resetRef.current = false;
    }

    particles.forEach((particle, index) => {
      const mesh = group.children[index] as THREE.Mesh | undefined;
      if (!mesh) return;
      if (particle.life <= 0) {
        mesh.visible = false;
        return;
      }
      mesh.visible = true;
      particle.life -= delta;
      particle.velocity.y -= delta * 2.8;
      mesh.position.addScaledVector(particle.velocity, delta);
      mesh.rotation.x += particle.spin.x * delta;
      mesh.rotation.y += particle.spin.y * delta;
      mesh.rotation.z += particle.spin.z * delta;
      const fade = THREE.MathUtils.clamp(particle.life / 0.9, 0, 1);
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.opacity = fade * 0.9;
    });
  });

  if (count === 0) return null;

  return (
    <group ref={groupRef}>
      {particles.map((particle, index) => (
        <mesh key={index} visible={false}>
          <planeGeometry args={[0.18, 0.34]} />
          <meshBasicMaterial color={particle.color} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
};

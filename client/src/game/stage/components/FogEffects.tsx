import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PerformanceMode } from '../../../types';

interface FogEffectsProps {
  performanceMode: PerformanceMode;
  isPlaying: boolean;
}

export const FogEffects: React.FC<FogEffectsProps> = ({ performanceMode, isPlaying }) => {
  const fogGroupRef = useRef<THREE.Group>(null);

  const numParticles = useMemo(() => {
    if (performanceMode === 'Low') return 0;
    if (performanceMode === 'Medium') return 10;
    return 20;
  }, [performanceMode]);

  const particles = useMemo(() => {
    return Array.from({ length: numParticles }).map(() => ({
      x: (Math.random() - 0.5) * 16,
      y: Math.random() * 4,
      z: (Math.random() - 0.5) * 4 - 14,
      speed: Math.random() * 0.5 + 0.2,
      scale: Math.random() * 2 + 1,
      opacity: Math.random() * 0.3 + 0.1
    }));
  }, [numParticles]);

  const material = useMemo(() => new THREE.MeshBasicMaterial({ 
    color: '#E0E0FF', 
    transparent: true, 
    opacity: 0.2, 
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }), []);

  useFrame((state) => {
    if (!fogGroupRef.current) return;
    const time = state.clock.getElapsedTime();

    fogGroupRef.current.children.forEach((mesh, index) => {
      const p = particles[index];
      if (p) {
        // Drift upwards
        mesh.position.y += p.speed * 0.05;
        if (mesh.position.y > 6) mesh.position.y = 0;
        
        // Gentle sway
        mesh.position.x += Math.sin(time + index) * 0.02;

        // Pulse opacity
        const mat = (mesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
        mat.opacity = (isPlaying ? p.opacity : p.opacity * 0.3) * (1 - mesh.position.y / 6);
      }
    });
  });

  if (numParticles === 0) return null;

  return (
    <group ref={fogGroupRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]} scale={[p.scale, p.scale, p.scale]}>
          <circleGeometry args={[1, 16]} />
          <primitive object={material} attach="material" />
        </mesh>
      ))}
    </group>
  );
};

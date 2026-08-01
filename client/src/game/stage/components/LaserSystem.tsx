import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PerformanceMode } from '../../../types';

interface LaserSystemProps {
  performanceMode: PerformanceMode;
  isPlaying: boolean;
}

export const LaserSystem: React.FC<LaserSystemProps> = ({ performanceMode, isPlaying }) => {
  const laserGroupRef = useRef<THREE.Group>(null);

  const numLasers = useMemo(() => {
    if (performanceMode === 'Low') return 0;
    if (performanceMode === 'Medium') return 4;
    return 8;
  }, [performanceMode]);

  const materials = useMemo(() => {
    return {
      cyan: new THREE.MeshBasicMaterial({ color: '#00F0FF', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }),
      pink: new THREE.MeshBasicMaterial({ color: '#FF007F', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })
    };
  }, []);

  useFrame((state) => {
    if (!isPlaying || !laserGroupRef.current) return;
    const time = state.clock.getElapsedTime();
    
    laserGroupRef.current.children.forEach((laser, index) => {
      // Simple sweep animation
      const offset = index * Math.PI / 4;
      laser.rotation.z = Math.sin(time * 2 + offset) * 0.8;
      laser.rotation.x = Math.PI / 2 + Math.cos(time + offset) * 0.2;
    });
  });

  if (numLasers === 0) return null;

  return (
    <group ref={laserGroupRef} position={[0, 15, -16]}>
      {Array.from({ length: numLasers }).map((_, i) => (
        <group key={`laser-${i}`} position={[(i - numLasers/2) * 3, 0, 0]}>
          <mesh position={[0, 20, 0]}>
            <cylinderGeometry args={[0.05, 0.2, 40, 8]} />
            <primitive object={i % 2 === 0 ? materials.cyan : materials.pink} attach="material" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

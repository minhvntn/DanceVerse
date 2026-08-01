import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PerformanceMode } from '../../types';

interface DanceFloorProps {
  isPlaying: boolean;
  performanceMode: PerformanceMode;
}

export const DanceFloor: React.FC<DanceFloorProps> = ({ isPlaying, performanceMode }) => {
  const floorMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const ringsGroupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const pulse = isPlaying ? 0.4 + Math.sin(time * 2) * 0.2 : 0.1;

    if (floorMaterialRef.current) {
      floorMaterialRef.current.emissiveIntensity = pulse;
    }
    
    if (ringsGroupRef.current) {
      ringsGroupRef.current.children.forEach((child, index) => {
        const material = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        material.opacity = isPlaying
          ? 0.3 + Math.sin(time * 3 + index) * 0.2
          : 0.15;
      });
    }
  });

  return (
    <group>
      {/* Huge Dark Reflective Base */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#020308" roughness={0.15} metalness={0.9} />
      </mesh>

      {/* Central Stage Glow Base */}
      <mesh position={[0, -0.04, -8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 40]} />
        <meshStandardMaterial
          ref={floorMaterialRef}
          color="#0a0a1a"
          emissive="#00F0FF"
          emissiveIntensity={0.1}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Neon Rings (Audience Area) */}
      <group ref={ringsGroupRef} position={[0, 0.02, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        {[10, 14, 18, 22].map((radius, i) => (
          <mesh key={radius}>
            <ringGeometry args={[radius, radius + 0.15, 64]} />
            <meshBasicMaterial 
              color={i % 2 === 0 ? '#00F0FF' : '#FF007F'} 
              transparent 
              opacity={0.3} 
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

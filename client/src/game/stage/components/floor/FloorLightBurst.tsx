import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface FloorLightBurstProps {
  color: string;
  progress: number; // 0 to 1
}

export const FloorLightBurst: React.FC<FloorLightBurstProps> = ({ color, progress }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame(() => {
    if (!groupRef.current) return;
    // Opacity based on progress
    groupRef.current.children.forEach(child => {
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = progress * 0.8;
        // Scale the beam up slightly during the burst
        child.scale.set(1 + (1 - progress) * 0.5, 1, 1 + (1 - progress) * 0.5);
      }
    });
  });

  if (progress <= 0) return null;

  // 6 beams radiating outwards
  const beams = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const x = Math.cos(angle) * 4;
    const z = Math.sin(angle) * 4;
    
    beams.push(
      <mesh key={i} position={[x, 10, z]}>
        <cylinderGeometry args={[2, 0.5, 20, 16, 1, true]} />
        <meshBasicMaterial 
          color={color}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    );
  }

  return (
    <group ref={groupRef} position={[0, 0, 3]}>
      {/* Central big flash */}
      <mesh position={[0, 10, 0]}>
        <cylinderGeometry args={[4, 1, 20, 32, 1, true]} />
        <meshBasicMaterial 
          color="#ffffff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      {beams}
    </group>
  );
};

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface FloorLightChaseProps {
  color: string;
  progress: number; // 0 to 1, decreases to 0
}

export const FloorLightChase: React.FC<FloorLightChaseProps> = ({ color, progress }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (!meshRef.current) return;
    
    // Progress goes from 1 to 0 (decay)
    // Let's make it travel from x = -20 to x = 20
    const xPos = -20 + ((1 - progress) * 40);
    meshRef.current.position.x = xPos;
    
    // Opacity based on progress
    (meshRef.current.material as THREE.MeshBasicMaterial).opacity = Math.sin(progress * Math.PI) * 0.8;
  });

  if (progress <= 0) return null;

  return (
    <mesh ref={meshRef} position={[0, 1.37, 3]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2, 13]} />
      <meshBasicMaterial 
        color={color}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
};

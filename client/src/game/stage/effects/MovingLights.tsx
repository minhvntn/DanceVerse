import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MovingLightsProps {
  energy: number;
  isPlaying: boolean;
}

export const MovingLights: React.FC<MovingLightsProps> = ({ energy, isPlaying }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Use useMemo to generate targets only once
  const targets = useMemo(() => {
    return Array.from({ length: 4 }).map(() => {
      const target = new THREE.Object3D();
      target.position.set(0, 0, 0); // initial
      return target;
    });
  }, []);

  useFrame(({ clock, scene }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    
    // Dynamic speed based on energy (faster when energy is high)
    const speed = isPlaying ? 1 + energy * 3 : 0.5;
    
    groupRef.current.children.forEach((light, i) => {
      if (light instanceof THREE.SpotLight) {
        // Adjust intensity based on energy
        light.intensity = isPlaying ? 2 + energy * 4 : 0.5;

        // Animate target position for sweeping effect
        const target = targets[i];
        if (target.parent !== scene) {
          scene.add(target);
          light.target = target;
        }

        // Complex sweeping math
        const xOffset = Math.sin(time * speed + i * Math.PI / 2) * 15;
        const zOffset = Math.cos(time * speed * 0.7 + i) * 8 + 5; // sweep front and back
        
        target.position.set(xOffset, 0, zOffset);
        
        // Color shifts at high energy
        if (energy > 0.6) {
          const hue = (time * 0.2 + i * 0.25) % 1;
          light.color.setHSL(hue, 1.0, 0.5);
        } else {
          // Default colors
          light.color.setHex(i % 2 === 0 ? 0x00ffff : 0xff00ff);
        }
      }
    });
  });

  return (
    <group ref={groupRef} position={[0, 18, -14]}>
      {/* 4 Moving Head Lights rigged on top */}
      <spotLight position={[-15, 0, 0]} angle={0.4} penumbra={0.5} distance={50} castShadow />
      <spotLight position={[-5, 0, 0]} angle={0.4} penumbra={0.5} distance={50} castShadow />
      <spotLight position={[5, 0, 0]} angle={0.4} penumbra={0.5} distance={50} castShadow />
      <spotLight position={[15, 0, 0]} angle={0.4} penumbra={0.5} distance={50} castShadow />
      
      {/* Light Rig Mesh (just visual boxes where lights are attached) */}
      <mesh position={[-15, 0.5, 0]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[-5, 0.5, 0]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[5, 0.5, 0]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#111" /></mesh>
      <mesh position={[15, 0.5, 0]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#111" /></mesh>
    </group>
  );
};

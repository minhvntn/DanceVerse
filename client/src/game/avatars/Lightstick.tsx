import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { BeatClock } from '../stage/BeatClock';

interface LightstickProps {
  color?: string;
  isWaving?: boolean;
  scale?: number;
  simplified?: boolean;
}

// Preload the model
useGLTF.preload('/models/exo_lightstick.glb');

export const Lightstick: React.FC<LightstickProps> = ({ color = '#8ffcff', isWaving = false, scale = 0.5, simplified = false }) => {
  const { scene } = useGLTF('/models/exo_lightstick.glb');

  // Clone scene manually and update emissive colors so they are independent for each user
  const { clonedScene, glowMaterial } = useMemo(() => {
    const clone = scene.clone();
    
    // Create a new glowing material for this specific lightstick instance
    const glowMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#ffffff',
      emissiveIntensity: 6,
      toneMapped: false
    });

    // Apply it to all the logo, LED, and inner beam parts
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const name = mesh.name;
        if (
          name.includes('Logo') || 
          name.includes('X_Beam') || 
          name.includes('LED') || 
          name.includes('Triangle') || 
          name.includes('Center_Hub') ||
          name.includes('Groove')
        ) {
          mesh.material = glowMat;
        }
      }
    });
    
    return { clonedScene: clone, glowMaterial: glowMat };
  }, [scene]);

  // Update color when it changes
  // Update color when it changes
  useEffect(() => {
    if (color !== 'rainbow') {
      const emissiveColor = new THREE.Color(color);
      glowMaterial.color = emissiveColor;
      glowMaterial.emissive = emissiveColor;
    }
  }, [glowMaterial, color]);

  useFrame((state) => {
    if (color === 'rainbow') {
      const time = state.clock.getElapsedTime();
      const hue = (time * 1.5) % 1;
      const rainbowColor = new THREE.Color().setHSL(hue, 1, 0.5);
      glowMaterial.color = rainbowColor;
      glowMaterial.emissive = rainbowColor;
      glowMaterial.emissiveIntensity = 8 + Math.sin(time * 10) * 2;
    } else {
      glowMaterial.emissiveIntensity = 6;
    }
    const { beatPhase, isPaused } = BeatClock.getState();
    const baseIntensity = 4;
    if (isPaused) {
      glowMaterial.emissiveIntensity = baseIntensity;
    } else {
      // Quick decay pulse on every beat
      const pulse = Math.max(0, 1 - beatPhase * 3);
      glowMaterial.emissiveIntensity = baseIntensity + pulse * 6;
    }
  });

  if (simplified) {
    return (
      <group 
        scale={scale * 0.8} 
        rotation={[isWaving ? 0 : -Math.PI / 2, Math.PI, 0]}
      >
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 6]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={4} />
        </mesh>
      </group>
    );
  }

  return (
    <group 
      scale={scale * 0.8} 
      rotation={[
        isWaving ? 0 : -Math.PI / 2, 
        Math.PI, 
        0
      ]} 
    >
      <primitive object={clonedScene} position={[0, -0.6, 0]} />
    </group>
  );
};

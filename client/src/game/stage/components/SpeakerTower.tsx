import React, { useMemo } from 'react';
import * as THREE from 'three';

interface SpeakerTowerProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

export const SpeakerTower: React.FC<SpeakerTowerProps> = ({ position, rotation = [0, 0, 0] }) => {
  // Shared materials for performance
  const materials = useMemo(() => {
    return {
      body: new THREE.MeshStandardMaterial({ color: '#0F0F13', roughness: 0.6, metalness: 0.3 }),
      pinkGlow: new THREE.MeshBasicMaterial({ color: '#FF007F' }),
      cyanGlow: new THREE.MeshBasicMaterial({ color: '#00F0FF' }),
      darkSpeaker: new THREE.MeshStandardMaterial({ color: '#050505', roughness: 0.8 }),
      trim: new THREE.MeshBasicMaterial({ color: '#9D00FF' })
    };
  }, []);

  return (
    <group position={position} rotation={rotation}>
      {/* Main Box */}
      <mesh castShadow receiveShadow position={[0, 6, 0]}>
        <boxGeometry args={[4.5, 12, 4.5]} />
        <primitive object={materials.body} attach="material" />
      </mesh>

      {/* Decorative Trim Lines */}
      <mesh position={[0, 11.9, 2.26]}>
        <boxGeometry args={[4.5, 0.1, 0.1]} />
        <primitive object={materials.trim} attach="material" />
      </mesh>
      <mesh position={[0, 0.1, 2.26]}>
        <boxGeometry args={[4.5, 0.1, 0.1]} />
        <primitive object={materials.trim} attach="material" />
      </mesh>

      {/* Top Speaker Cone (Pink Glow) */}
      <group position={[0, 8.5, 2.26]}>
        <mesh>
          <circleGeometry args={[1.5, 32]} />
          <primitive object={materials.darkSpeaker} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <ringGeometry args={[1.2, 1.4, 32]} />
          <primitive object={materials.pinkGlow} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <circleGeometry args={[0.3, 16]} />
          <primitive object={materials.pinkGlow} attach="material" />
        </mesh>
      </group>

      {/* Bottom Speaker Cone (Cyan Glow) */}
      <group position={[0, 3.5, 2.26]}>
        <mesh>
          <circleGeometry args={[1.5, 32]} />
          <primitive object={materials.darkSpeaker} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <ringGeometry args={[1.2, 1.4, 32]} />
          <primitive object={materials.cyanGlow} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <circleGeometry args={[0.3, 16]} />
          <primitive object={materials.cyanGlow} attach="material" />
        </mesh>
      </group>
    </group>
  );
};

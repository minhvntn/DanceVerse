import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useRoomStore } from '../../../stores/useRoomStore';
import { ConcertVideoScreen } from '../../../components/stage/ConcertVideoScreen';

export const LedScreen: React.FC = () => {
  const musicState = useRoomStore((state) => state.musicState);
  const isPlaying = musicState?.status === 'playing';

  const materials = useMemo(() => {
    return {
      darkFrame: new THREE.MeshStandardMaterial({ color: '#0F172A', roughness: 0.8 }),
      pinkGlow: new THREE.MeshBasicMaterial({ color: '#d946ef', wireframe: true, transparent: true, opacity: isPlaying ? 0.8 : 0.2 }),
      cyanGlow: new THREE.MeshBasicMaterial({ color: '#00ffff', wireframe: true, transparent: true, opacity: isPlaying ? 0.8 : 0.2 }),
      neonCyanTrim: new THREE.MeshBasicMaterial({ color: '#00F0FF' })
    };
  }, [isPlaying]);

  return (
    <group position={[0, 8.5, -22.5]}>
      {/* Main Screen Frame */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[30, 12, 0.8]} />
        <primitive object={materials.darkFrame} attach="material" />
      </mesh>
      
      {/* Main Video Overlay */}
      <mesh position={[0, 0, 0.45]}>
        <planeGeometry args={[28.5, 10.8]} />
        <ConcertVideoScreen />
      </mesh>

      {/* Screen Frame Neon Glow Trim */}
      <mesh position={[0, 6.1, 0.4]}>
        <boxGeometry args={[30, 0.2, 0.4]} />
        <primitive object={materials.neonCyanTrim} attach="material" />
      </mesh>
      <mesh position={[0, -6.1, 0.4]}>
        <boxGeometry args={[30, 0.2, 0.4]} />
        <primitive object={materials.neonCyanTrim} attach="material" />
      </mesh>

      {/* Side Screen - Left */}
      <group position={[-18, -1, 2]} rotation={[0, 0.3, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[6, 14, 0.8]} />
          <primitive object={materials.darkFrame} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.45]}>
          <planeGeometry args={[5.5, 13.5]} />
          <primitive object={materials.pinkGlow} attach="material" />
        </mesh>
      </group>

      {/* Side Screen - Right */}
      <group position={[18, -1, 2]} rotation={[0, -0.3, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[6, 14, 0.8]} />
          <primitive object={materials.darkFrame} attach="material" />
        </mesh>
        <mesh position={[0, 0, 0.45]}>
          <planeGeometry args={[5.5, 13.5]} />
          <primitive object={materials.cyanGlow} attach="material" />
        </mesh>
      </group>
    </group>
  );
};

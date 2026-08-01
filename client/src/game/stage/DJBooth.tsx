import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useRoomStore } from '../../stores/useRoomStore';
import { AvatarPrimitive } from '../avatars/AvatarPrimitive';
import { Player } from '../../types';

export const DJBooth: React.FC = () => {
  const players = useRoomStore((state) => state.players);
  const currentRoom = useRoomStore((state) => state.currentRoom);
  
  const hostPlayerId = currentRoom?.hostId;
  const hostPlayer = hostPlayerId ? players[hostPlayerId] : undefined;

  const djAvatar = hostPlayer?.avatarType || 'Boy';
  const djName = hostPlayer?.nickname || 'DJ DANCEVERSE';

  const mockDjPlayer: Player = {
    id: 'dj-avatar',
    nickname: djName,
    avatarType: djAvatar,
    roomId: currentRoom?.id || '',
    position: { x: 0, y: 1.8, z: -10 },
    rotation: Math.PI,
    animation: 'Cheer',
    isHost: true
  };

  const djRef = useRef<THREE.Group>(null);

  const materials = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({ color: '#0A0A10', roughness: 0.2, metalness: 0.8 }),
    trimPink: new THREE.MeshBasicMaterial({ color: '#FF007F' }),
    trimCyan: new THREE.MeshBasicMaterial({ color: '#00F0FF' }),
    deskTop: new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.5 }),
    screen: new THREE.MeshBasicMaterial({ color: '#050505' })
  }), []);

  useFrame(({ clock }) => {
    if (djRef.current) {
      const time = clock.getElapsedTime();
      djRef.current.position.y = 1.8 + Math.sin(time * 4) * 0.05;
    }
  });

  return (
    <group position={[0, 2.0, -9]}>
      {/* The DJ Avatar */}
      <group ref={djRef}>
        <AvatarPrimitive avatarType={mockDjPlayer.avatarType} animation={mockDjPlayer.animation} />
      </group>

      {/* The DJ Table / Mixer */}
      <group position={[0, 0, -1.5]}>
        {/* Main Angled Desk Body */}
        {/* We use a cylinder with 6 radial segments to create a hexagonal/angled look */}
        <mesh position={[0, 0.7, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
          <cylinderGeometry args={[1.5, 2.2, 1.4, 6]} />
          <primitive object={materials.body} attach="material" />
        </mesh>
        
        {/* Top trim */}
        <mesh position={[0, 1.4, 0]} rotation={[0, Math.PI / 2, 0]}>
           <cylinderGeometry args={[1.52, 1.52, 0.05, 6]} />
           <primitive object={materials.trimCyan} attach="material" />
        </mesh>

        {/* Bottom trim */}
        <mesh position={[0, 0.02, 0]} rotation={[0, Math.PI / 2, 0]}>
           <cylinderGeometry args={[2.22, 2.22, 0.05, 6]} />
           <primitive object={materials.trimPink} attach="material" />
        </mesh>
        
        {/* Desk Top / Mixer surface */}
        <mesh position={[0, 1.42, 0]}>
          <boxGeometry args={[3, 0.05, 1.2]} />
          <primitive object={materials.deskTop} attach="material" />
        </mesh>

        {/* Mixer Equipment (CDJs) */}
        <mesh position={[-0.8, 1.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>
        <mesh position={[0.8, 1.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>
        <mesh position={[0, 1.45, 0]}>
          <boxGeometry args={[0.6, 0.08, 0.8]} />
          <meshStandardMaterial color="#020617" />
        </mesh>

        {/* Front LED Logo Panel */}
        <mesh position={[0, 0.7, 1.2]}>
          <planeGeometry args={[1.8, 1.0]} />
          <primitive object={materials.screen} attach="material" />
        </mesh>
        
        <Text 
          position={[0, 0.7, 1.21]} 
          fontSize={0.4} 
          color="#00F0FF" 
          anchorX="center" 
          anchorY="middle"
        >
          D
        </Text>
        <Text 
          position={[0, 0.35, 1.21]} 
          fontSize={0.15} 
          color="#FFFFFF" 
          anchorX="center" 
          anchorY="middle"
        >
          DANCEVERSE
        </Text>
      </group>
    </group>
  );
};

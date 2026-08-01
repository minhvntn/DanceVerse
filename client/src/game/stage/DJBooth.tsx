import React, { useRef } from 'react';
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

  // Use a fallback avatar for DJ if host isn't in the room or is just moving around
  const djAvatar = hostPlayer?.avatarType || 'Boy';
  const djName = hostPlayer?.nickname || 'DJ DANCEVERSE';

  // DJ avatar mock player object to pass to AvatarModel
  const mockDjPlayer: Player = {
    id: 'dj-avatar',
    nickname: djName,
    avatarType: djAvatar,
    roomId: currentRoom?.id || '',
    position: { x: 0, y: 1.5, z: -14 },
    rotation: Math.PI,
    animation: 'Cheer', // We use Cheer/Wave to simulate mixing
    isHost: true
  };

  const djRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (djRef.current) {
      // Simulate DJ bobbing to the music
      const time = clock.getElapsedTime();
      djRef.current.position.y = 1.5 + Math.sin(time * 4) * 0.05;
    }
  });

  return (
    <group position={[0, 1.5, -14]}>
      {/* The DJ Avatar */}
      <group ref={djRef}>
        <AvatarPrimitive avatarType={mockDjPlayer.avatarType} animation={mockDjPlayer.animation} />
      </group>

      {/* The DJ Table / Mixer */}
      <group position={[0, 0, -0.8]}>
        {/* Main Desk */}
        <mesh position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[3.5, 1.4, 1.2]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.8} />
        </mesh>
        
        {/* Desk Top / Mixer surface */}
        <mesh position={[0, 1.42, 0]} rotation={[-0.1, 0, 0]}>
          <boxGeometry args={[3.3, 0.05, 1.0]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>

        {/* CDJs (Decks) */}
        <mesh position={[-0.8, 1.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>
        <mesh position={[0.8, 1.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
          <meshStandardMaterial color="#334155" metalness={0.9} />
        </mesh>

        {/* Mixer Center */}
        <mesh position={[0, 1.45, 0]}>
          <boxGeometry args={[0.6, 0.08, 0.8]} />
          <meshStandardMaterial color="#020617" />
        </mesh>

        {/* Front LED Logo Panel */}
        <mesh position={[0, 0.7, 0.61]}>
          <planeGeometry args={[3.2, 1.0]} />
          <meshBasicMaterial color="#000000" />
        </mesh>
        <Text 
          position={[0, 0.7, 0.62]} 
          fontSize={0.35} 
          color="#22d3ee" 
          anchorX="center" 
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          DANCEVERSE
        </Text>
        
        {/* Neon Strip at the bottom of the DJ desk */}
        <mesh position={[0, 0.05, 0.62]}>
          <boxGeometry args={[3.4, 0.05, 0.05]} />
          <meshBasicMaterial color="#e879f9" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
    </group>
  );
};

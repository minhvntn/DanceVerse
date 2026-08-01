import React, { useMemo, useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useRoomStore } from '../../stores/useRoomStore';
import { AvatarPrimitive } from '../avatars/AvatarPrimitive';
import { DanceAnimationType } from '../../types';
import { ConcertVisualState, STAGE_COLORS } from './stageVisuals';

interface DJBoothProps {
  visualState: ConcertVisualState;
}

export const DJBooth: React.FC<DJBoothProps> = ({ visualState }) => {
  const hostPlayer = useRoomStore((state) => {
    const hostId = state.currentRoom?.hostId;
    return hostId ? state.players[hostId] : undefined;
  });
  const hostAvatar = hostPlayer?.avatarType || 'Boy';
  const hostAnimation: DanceAnimationType = visualState.isPlaying
    ? (visualState.isBeatDrop ? 'Cheer' : 'HipHop')
    : 'Idle';

  const djRef = useRef<THREE.Group>(null);
  const platterRefs = useRef<THREE.Mesh[]>([]);
  const equalizerRef = useRef<THREE.Group>(null);
  const materials = useMemo(() => ({
    body: new THREE.MeshStandardMaterial({ color: '#070912', roughness: 0.18, metalness: 0.88 }),
    deck: new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.28, metalness: 0.82 }),
    screen: new THREE.MeshBasicMaterial({ color: '#03050B' })
  }), []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (djRef.current) djRef.current.position.y = visualState.isPlaying ? Math.abs(Math.sin(time * 3.6)) * 0.07 : 0;
    platterRefs.current.forEach((platter, index) => {
      if (platter && visualState.isPlaying) platter.rotation.z = time * (index === 0 ? 2.8 : -2.4);
    });
    equalizerRef.current?.children.forEach((bar, index) => {
      const level = visualState.isPlaying ? 0.22 + Math.abs(Math.sin(time * 7 + index * 0.72)) * (0.42 + visualState.energy * 0.55) : 0.16;
      bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, level, 0.24);
      bar.position.y = -0.32 + bar.scale.y * 0.33;
    });
  });

  return (
    <group position={[0, 3.05, -20.35]}>
      <mesh position={[0, -0.18, 0.4]} receiveShadow>
        <cylinderGeometry args={[4.7, 5.15, 0.35, 8]} />
        <meshStandardMaterial color="#080A15" emissive="#170A35" emissiveIntensity={0.45 + visualState.energy * 0.55} metalness={0.88} roughness={0.16} />
      </mesh>
      <mesh position={[0, -0.02, 0.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.35, 4.72, 48]} />
        <meshBasicMaterial color={visualState.isBeatDrop ? '#FFFFFF' : '#9D5CFF'} transparent opacity={0.68 + visualState.energy * 0.25} toneMapped={false} />
      </mesh>

      <group ref={djRef} position={[0, 0.2, -1.5]}>
        <AvatarPrimitive avatarType={hostAvatar} animation={hostAnimation} showName={false} phase={0.65} scale={1.18} />
      </group>

      <group position={[0, 0, 0.55]} scale={[1.25, 1.12, 1.15]}>
        <mesh castShadow position={[0, 1.05, 0]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[2.15, 3.25, 2.1, 6]} />
          <primitive object={materials.body} attach="material" />
        </mesh>
        <mesh position={[0, 2.12, 0]}>
          <boxGeometry args={[5.2, 0.16, 2.15]} />
          <primitive object={materials.deck} attach="material" />
        </mesh>

        {[-1.55, 1.55].map((x, index) => (
          <group key={x} position={[x, 2.24, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.72, 0.72, 0.08, 32]} />
              <meshStandardMaterial color="#05070D" metalness={0.9} roughness={0.2} />
            </mesh>
            <mesh ref={(mesh) => { if (mesh) platterRefs.current[index] = mesh; }} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.055, 0]}>
              <ringGeometry args={[0.28, 0.62, 32]} />
              <meshBasicMaterial color={index === 0 ? '#00F0FF' : '#FF007F'} toneMapped={false} />
            </mesh>
            <mesh position={[0.5, 0.13, 0.15]} rotation={[0, 0.35, 0]}>
              <boxGeometry args={[0.06, 0.06, 0.62]} />
              <meshStandardMaterial color="#CBD5E1" metalness={0.8} roughness={0.25} />
            </mesh>
          </group>
        ))}

        <group position={[0, 2.24, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 0.14, 1.55]} />
            <meshStandardMaterial color="#02040A" metalness={0.72} roughness={0.32} />
          </mesh>
          {[-0.36, -0.12, 0.12, 0.36].map((x, index) => (
            <React.Fragment key={x}>
              <mesh position={[x, 0.12, -0.38]}>
                <cylinderGeometry args={[0.07, 0.07, 0.12, 12]} />
                <meshBasicMaterial color={STAGE_COLORS[index]} toneMapped={false} />
              </mesh>
              <mesh position={[x, 0.12, 0.3 + index * 0.08]}>
                <boxGeometry args={[0.055, 0.07, 0.52]} />
                <meshStandardMaterial color="#E2E8F0" metalness={0.8} roughness={0.2} />
              </mesh>
            </React.Fragment>
          ))}
        </group>

        <group position={[0, 2.5, -0.55]} rotation={[-0.15, 0, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.55, 0.08, 0.95]} />
            <meshStandardMaterial color="#111827" metalness={0.82} roughness={0.22} />
          </mesh>
          <mesh position={[0, 0.47, -0.38]} rotation={[-0.35, 0, 0]}>
            <boxGeometry args={[1.55, 0.9, 0.08]} />
            <meshStandardMaterial color="#090D17" metalness={0.75} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.47, -0.33]} rotation={[-0.35, 0, 0]}>
            <planeGeometry args={[1.28, 0.65]} />
            <meshBasicMaterial color="#071E38" toneMapped={false} />
          </mesh>
          <Text position={[0, 0.48, -0.275]} rotation={[-0.35, 0, 0]} fontSize={0.22} color="#76F7FF" anchorX="center" anchorY="middle">
            DV LIVE
          </Text>
        </group>

        <mesh position={[0, 1.02, 1.67]}>
          <planeGeometry args={[4.8, 1.62]} />
          <primitive object={materials.screen} attach="material" />
        </mesh>
        <Text position={[0, 1.3, 1.7]} fontSize={0.46} color="#FFFFFF" anchorX="center" anchorY="middle" outlineWidth={0.025} outlineColor="#FF007F">
          DANCEVERSE
        </Text>
        <Text position={[0, 0.79, 1.7]} fontSize={0.18} color="#00F0FF" anchorX="center" anchorY="middle" letterSpacing={0.32}>
          LIVE MIX
        </Text>
        <group ref={equalizerRef} position={[-1.82, 0.32, 1.71]}>
          {Array.from({ length: 14 }, (_, index) => (
            <mesh key={index} position={[index * 0.28, 0, 0]}>
              <planeGeometry args={[0.14, 0.66]} />
              <meshBasicMaterial color={STAGE_COLORS[index % STAGE_COLORS.length]} transparent opacity={0.85} toneMapped={false} />
            </mesh>
          ))}
        </group>
        <mesh position={[0, 0.08, 1.7]}>
          <boxGeometry args={[5.7, 0.11, 0.11]} />
          <meshBasicMaterial color="#FF007F" toneMapped={false} />
        </mesh>
        <mesh position={[0, 2.17, 1.1]}>
          <boxGeometry args={[5.25, 0.08, 0.1]} />
          <meshBasicMaterial color="#00F0FF" toneMapped={false} />
        </mesh>
      </group>

      <pointLight position={[0, 3.6, 2.2]} color="#00F0FF" intensity={visualState.quality === 'low' ? 0.45 : 1.1 + visualState.energy} distance={11} decay={1.8} />
      <pointLight position={[0, 1.4, 2.7]} color="#FF007F" intensity={visualState.quality === 'high' ? 0.8 + visualState.energy * 0.6 : 0.28} distance={8} decay={1.8} />
    </group>
  );
};

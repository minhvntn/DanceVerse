import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Player } from '../../types';
import { AvatarPrimitive } from '../avatars/AvatarPrimitive';

interface RemotePlayerProps {
  player: Player;
  showNames: boolean;
  localPosRef: React.MutableRefObject<THREE.Vector3 | {x: number, y: number, z: number}>;
}

export const RemotePlayer: React.FC<RemotePlayerProps> = ({ player, showNames, localPosRef }) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(player.position.x, player.position.y, player.position.z));
  const targetRotY = useRef(player.rotation);
  const [activeEmote, setActiveEmote] = useState<string | null>(player.emote || null);
  const [isDistant, setIsDistant] = useState(false);

  useEffect(() => {
    targetPos.current.set(player.position.x, player.position.y, player.position.z);
    targetRotY.current = player.rotation;
  }, [player.position.x, player.position.y, player.position.z, player.rotation]);

  useEffect(() => {
    if (player.emote) {
      setActiveEmote(player.emote);
      const timer = setTimeout(() => {
        setActiveEmote(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [player.emote]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth interpolation (lerp) toward latest server position
    groupRef.current.position.lerp(targetPos.current, 0.18);

    // Smooth shortest-path rotation lerp
    const currentY = groupRef.current.rotation.y;
    let diff = targetRotY.current - currentY;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    groupRef.current.rotation.y += diff * 0.18;

    // Distance check for crowd rendering (30 units)
    if (localPosRef.current) {
      const dx = groupRef.current.position.x - localPosRef.current.x;
      const dz = groupRef.current.position.z - localPosRef.current.z;
      const distSq = dx * dx + dz * dz;
      const currentlyDistant = distSq > 900;
      if (currentlyDistant !== isDistant) {
        setIsDistant(currentlyDistant);
      }
    }
  });

  return (
    <group ref={groupRef} position={[player.position.x, player.position.y, player.position.z]}>
      {isDistant ? (
        <mesh position={[0, 1, 0]}>
          <capsuleGeometry args={[0.3, 1, 4, 8]} />
          <meshStandardMaterial color="#444444" opacity={0.5} transparent />
        </mesh>
      ) : (
        <>
          <AvatarPrimitive avatarType={player.avatarType} animation={player.animation || 'Idle'} scale={1} />

          {/* Floating Emote Bubble */}
          {activeEmote && (
            <Html position={[0, 2.7, 0]} center distanceFactor={12}>
              <div className="px-3 py-1.5 rounded-2xl bg-slate-900/95 border-2 border-neon-pink shadow-xl shadow-neon-pink/30 text-3xl animate-bounce whitespace-nowrap">
                {activeEmote}
              </div>
            </Html>
          )}

          {/* Name Badge */}
          {showNames && (
            <Html position={[0, 2.2, 0]} center distanceFactor={14}>
              <div
                className={`px-2.5 py-0.5 rounded-full bg-slate-950/85 border text-xs font-bold shadow-md whitespace-nowrap pointer-events-none ${
                  player.isNpc ? 'border-purple-500/40 text-purple-300' : 'border-white/20 text-white'
                }`}
              >
                {player.nickname} {player.isNpc ? '🤖' : '💃'}
              </div>
            </Html>
          )}
        </>
      )}
    </group>
  );
};

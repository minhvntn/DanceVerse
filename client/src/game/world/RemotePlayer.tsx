import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Player } from '../../types';
import { AvatarPrimitive } from '../avatars/AvatarPrimitive';
import { useRoomStore } from '../../stores/useRoomStore';
import type { StageChoreographyState } from '../../hooks/useStageChoreography';
import { getAudiencePlayerElevation } from '../stage/audienceElevation';
import { PlayerNameplate } from '../avatars/components/PlayerNameplate';
import { ChatBubble } from '../avatars/components/ChatBubble';
import { ReactionSystem } from '../avatars/components/ReactionSystem';
import { usePlayerSocialState } from '../avatars/hooks/usePlayerSocialState';
import { useSocialStore } from '../../stores/useSocialStore';

interface RemotePlayerProps {
  player: Player;
  showNames: boolean;
  localPosRef: React.MutableRefObject<THREE.Vector3 | {x: number, y: number, z: number}>;
  stageChoreography: StageChoreographyState;
}

const getRemoteVisualY = (player: Player): number => (
  player.isNpc
    ? player.position.y
    : player.position.y + getAudiencePlayerElevation(player.position.x, player.position.z)
);

export const RemotePlayer: React.FC<RemotePlayerProps> = ({
  player,
  showNames,
  localPosRef,
  stageChoreography
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3(
    player.position.x,
    getRemoteVisualY(player),
    player.position.z
  ));
  const targetRotY = useRef(player.rotation);
  
  // Interpolation Buffer
  const posBuffer = useRef<{pos: THREE.Vector3, time: number}[]>([]);
  
  const [activeEmote, setActiveEmote] = useState<string | null>(player.emote || null);
  const [lodLevel, setLodLevel] = useState<'near' | 'medium' | 'far' | 'very_far'>('near');
  const frameCountRef = useRef(Math.floor(Math.random() * 30)); // Offset checks
  const activeCue = useRoomStore((state) => state.activeStageCue);
  const isMusicPlaying = useRoomStore((state) => state.musicState?.status === 'playing');
  
  const cueColor = activeCue?.type === 'lightstick' ? (activeCue.payload as any)?.color : null;
  const cueEffect = activeCue?.type === 'lightstick' ? (activeCue.payload as any)?.effect : null;

  const playerAnimation = player.animation || 'Idle';
  const isWaveEffect = cueEffect === 'wave' || cueEffect === 'crowd-wave';
  
  let visibleAnimation = player.isNpc ? stageChoreography.animation : playerAnimation;
  if ((isWaveEffect || activeEmote === 'wave-lightstick') && player.equippedLightstick) {
    visibleAnimation = 'WaveLightstick';
  }

  const audienceMotion = !player.isNpc && isMusicPlaying && visibleAnimation === 'Idle' && !isWaveEffect;
  let finalLightstickColor = (cueColor && player.equippedLightstick && cueEffect !== 'rainbow') ? cueColor : player.lightstickColor;
  if (activeEmote === 'fever') {
    finalLightstickColor = 'rainbow';
  }
  
  const showTextEmote = activeEmote && activeEmote !== 'wave-lightstick';

  useEffect(() => {
    const { position, rotation } = player;
    targetPos.current.set(position.x, getRemoteVisualY(player), position.z);
    targetRotY.current = rotation;
    
    // Add to buffer
    const now = performance.now();
    posBuffer.current.push({ pos: targetPos.current.clone(), time: now });
    // Keep only last 4 updates
    if (posBuffer.current.length > 4) {
      posBuffer.current.shift();
    }
  }, [player.position.x, player.position.y, player.position.z, player.rotation, player.isNpc]);

  const { chatMessage, reactionEvent, clearChat } = usePlayerSocialState(player.id);

  useEffect(() => {
    if (player.emote) {
      setActiveEmote(player.emote);
      const timer = setTimeout(() => {
        setActiveEmote(null);
      }, 60000); // 1 minute
      return () => clearTimeout(timer);
    }
  }, [player.emote, player.emoteStartedAt]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Time-based interpolation (delay by ~100ms)
    const renderTime = performance.now() - 100;
    const buffer = posBuffer.current;
    
    if (buffer.length >= 2) {
      // Find the two points to interpolate between
      let p0 = buffer[0];
      let p1 = buffer[1];
      
      for (let i = 1; i < buffer.length; i++) {
        if (buffer[i].time > renderTime) {
          p0 = buffer[i - 1];
          p1 = buffer[i];
          break;
        }
      }
      
      if (p0 && p1 && p1.time > p0.time) {
        const t = Math.max(0, Math.min(1, (renderTime - p0.time) / (p1.time - p0.time)));
        groupRef.current.position.lerpVectors(p0.pos, p1.pos, t);
      } else {
        // Fallback to simple lerp if buffer is starved
        groupRef.current.position.lerp(targetPos.current, 0.18);
      }
    } else {
      // Smooth interpolation (lerp) fallback
      groupRef.current.position.lerp(targetPos.current, 0.18);
    }

    // Smooth shortest-path rotation lerp
    const currentY = groupRef.current.rotation.y;
    let diff = targetRotY.current - currentY;
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;
    groupRef.current.rotation.y += diff * 0.18;

    // LOD check every 30 frames
    frameCountRef.current++;
    if (frameCountRef.current % 30 === 0) {
      if (player.isNpc) {
        if (lodLevel !== 'near') setLodLevel('near');
      } else if (localPosRef.current) {
        const dx = groupRef.current.position.x - localPosRef.current.x;
        const dz = groupRef.current.position.z - localPosRef.current.z;
        const distSq = dx * dx + dz * dz;
        
        let newLod: 'near' | 'medium' | 'far' | 'very_far' = 'near';
        if (distSq >= 2500) newLod = 'very_far';
        else if (distSq >= 900) newLod = 'far';
        else if (distSq >= 225) newLod = 'medium';
        
        if (newLod !== lodLevel) setLodLevel(newLod);
      }
    }
  });

  if (lodLevel === 'very_far') return null; // Cull completely

  return (
    <group
      ref={groupRef}
      position={[player.position.x, getRemoteVisualY(player), player.position.z]}
      onClick={(e) => {
        if (!player.isNpc) {
          e.stopPropagation();
          useSocialStore.getState().setSelectedPlayerId(player.id);
        }
      }}
    >
      {lodLevel === 'far' ? (
        <mesh position={[0, 1, 0]}>
          <capsuleGeometry args={[0.3, 1, 4, 8]} />
          <meshStandardMaterial color="#444444" opacity={0.5} transparent />
        </mesh>
      ) : (
        <>
          <AvatarPrimitive
            avatarType={player.avatarType}
            animation={visibleAnimation}
            nickname={player.nickname}
            showName={false}
            scale={1}
            simplified={lodLevel === 'medium'}
            phase={player.isNpc ? 0 : (player.id.length % 7) * 0.45}
            audienceMotion={audienceMotion}
            stageDancer={player.isNpc}
            animationClock={player.isNpc ? stageChoreography.animationClock : undefined}
            equippedLightstick={player.equippedLightstick}
            lightstickColor={finalLightstickColor}
            animationTimeOffset={cueEffect === 'crowd-wave' ? (player.position.x + 20) * 0.15 : 0}
            team={player.team}
          />

          {/* Floating Emote Bubble */}
          {showTextEmote && (
            <Html position={[0, 2.7, 0]} center distanceFactor={12}>
              <div className="px-3 py-1.5 rounded-2xl bg-slate-900/95 border-2 border-neon-pink shadow-xl shadow-neon-pink/30 text-3xl animate-bounce whitespace-nowrap">
                {activeEmote}
              </div>
            </Html>
          )}

          {showNames && lodLevel === 'near' && (
            <PlayerNameplate 
              name={player.nickname} 
              isHost={player.isHost || false} 
              rhythmMode={true}
              combo={player.combo || 0}
              team={player.team}
            />
          )}
          {chatMessage && (
            <ChatBubble 
              message={chatMessage} 
              onComplete={clearChat} 
            />
          )}
          <ReactionSystem reactionEvent={reactionEvent} />
        </>
      )}
    </group>
  );
};

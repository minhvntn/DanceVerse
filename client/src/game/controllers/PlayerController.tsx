import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarType, DanceAnimationType, Vector3D, SOCKET_EVENTS } from '../../types';
import { AvatarPrimitive } from '../avatars/AvatarPrimitive';
import { socketService } from '../../services/socket.service';
import { useRoomStore } from '../../stores/useRoomStore';

interface PlayerControllerProps {
  myPlayerId: string;
  nickname: string;
  avatarType: AvatarType;
  initialPosition?: Vector3D;
  showNames: boolean;
  onPositionChange?: (pos: Vector3D) => void;
  playerPosRef?: React.MutableRefObject<Vector3D>;
  activeEmote?: string;
}

const SHORTCUT_ANIMATIONS: Record<string, DanceAnimationType> = {
  '1': 'Wave',
  '2': 'HipHop',
  '3': 'Shuffle',
  '4': 'Moonwalk',
  '5': 'Breakdance',
  '6': 'Jump',
  '7': 'Clap',
  '8': 'Spin',
  '9': 'Cheer',
  '0': 'RandomDance'
};

export const PlayerController: React.FC<PlayerControllerProps> = ({
  myPlayerId,
  nickname,
  avatarType,
  initialPosition = { x: 0, y: 0, z: 8 },
  showNames,
  onPositionChange,
  playerPosRef,
  activeEmote
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const positionRef = useRef<Vector3D>(initialPosition);
  const rotationRef = useRef<number>(0);
  const [currentAnim, setCurrentAnim] = useState<DanceAnimationType>('Idle');
  const currentAnimRef = useRef<DanceAnimationType>('Idle');
  const [emoteBubble, setEmoteBubble] = useState<string | null>(null);
  const isMusicPlaying = useRoomStore((state) => state.musicState?.status === 'playing');

  // Key state tracking
  const keysRef = useRef<Record<string, boolean>>({});
  const lastEmitTimeRef = useRef<number>(0);
  const manualOverrideUntilRef = useRef<number>(0);

  const applyAnimation = useCallback((animation: DanceAnimationType) => {
    if (currentAnimRef.current === animation) return;
    currentAnimRef.current = animation;
    setCurrentAnim(animation);
    socketService.emit(SOCKET_EVENTS.PLAYER_ANIMATION, { animation });
  }, []);

  useEffect(() => {
    if (activeEmote) {
      setEmoteBubble(activeEmote);
      const timer = setTimeout(() => {
        setEmoteBubble(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeEmote]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in chat input
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      keysRef.current[e.key.toLowerCase()] = true;
      manualOverrideUntilRef.current = Date.now() + 1500;

      // Handle dance shortcuts 1-0
      const shortcutAnim = SHORTCUT_ANIMATIONS[e.key];
      if (shortcutAnim) {
        applyAnimation(shortcutAnim);
      } else if (e.code === 'Space') {
        applyAnimation('Jump');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
      // If releasing movement keys and not dancing, return to Idle
      if (!keysRef.current['w'] && !keysRef.current['a'] && !keysRef.current['s'] && !keysRef.current['d'] && !keysRef.current['arrowup'] && !keysRef.current['arrowdown'] && !keysRef.current['arrowleft'] && !keysRef.current['arrowright']) {
        if (currentAnimRef.current === 'Walk' || currentAnimRef.current === 'Run') {
          applyAnimation('Idle');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [applyAnimation]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    let moveZ = 0;
    let moveX = 0;

    if (keysRef.current['w'] || keysRef.current['arrowup']) moveZ -= 1;
    if (keysRef.current['s'] || keysRef.current['arrowdown']) moveZ += 1;
    if (keysRef.current['a'] || keysRef.current['arrowleft']) moveX -= 1;
    if (keysRef.current['d'] || keysRef.current['arrowright']) moveX += 1;

    const isRunning = !!keysRef.current['shift'];
    const isMoving = moveZ !== 0 || moveX !== 0;

    if (isMoving) {
      manualOverrideUntilRef.current = Date.now() + 1500;
      const targetAnim: DanceAnimationType = isRunning ? 'Run' : 'Walk';
      applyAnimation(targetAnim);

      const speed = (isRunning ? 11 : 6.5) * delta;

      // Normalize diagonal movement
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
      const nx = moveX / length;
      const nz = moveZ / length;

      let newX = positionRef.current.x + nx * speed;
      let newZ = positionRef.current.z + nz * speed;

      // Keep real users in the audience area, below the front edge of the stage.
      newX = Math.max(-36, Math.min(36, newX));
      newZ = Math.max(-11.8, Math.min(34, newZ));

      positionRef.current.x = newX;
      positionRef.current.y = 0;
      positionRef.current.z = newZ;
      if (playerPosRef && playerPosRef.current) {
        playerPosRef.current.x = newX;
        playerPosRef.current.y = 0;
        playerPosRef.current.z = newZ;
      }

      // Calculate facing angle
      const targetRotation = Math.atan2(nx, nz);
      rotationRef.current = targetRotation;

      groupRef.current.position.set(newX, 0, newZ);
      groupRef.current.rotation.y = targetRotation;

      // Throttle socket move emit to 15 Hz (~66ms)
      const now = Date.now();
      if (now - lastEmitTimeRef.current > 66) {
        lastEmitTimeRef.current = now;
        socketService.emit(SOCKET_EVENTS.PLAYER_MOVE, {
          position: positionRef.current,
          rotation: rotationRef.current,
          animation: targetAnim
        });
      }
    } else {
      // Sync position with ref
      groupRef.current.position.set(positionRef.current.x, positionRef.current.y, positionRef.current.z);

      if (Date.now() >= manualOverrideUntilRef.current) {
        applyAnimation('Idle');
      }
    }
  });

  return (
    <group ref={groupRef} position={[initialPosition.x, initialPosition.y, initialPosition.z]}>
      <AvatarPrimitive
        avatarType={avatarType}
        animation={currentAnim}
        audienceMotion={isMusicPlaying && currentAnim === 'Idle'}
        scale={1}
      />

      {/* Emote Bubble */}
      {emoteBubble && (
        <Html position={[0, 2.7, 0]} center distanceFactor={12}>
          <div className="px-3 py-1.5 rounded-2xl bg-slate-900/95 border-2 border-neon-pink shadow-xl shadow-neon-pink/30 text-3xl animate-bounce whitespace-nowrap">
            {emoteBubble}
          </div>
        </Html>
      )}

      {/* Name Tag */}
      {showNames && (
        <Html position={[0, 2.2, 0]} center distanceFactor={14}>
          <div className="px-2.5 py-0.5 rounded-full bg-slate-950/85 border border-white/20 text-xs font-bold text-neon-blue shadow-md whitespace-nowrap pointer-events-none">
            {nickname} <span className="text-neon-pink">★</span>
          </div>
        </Html>
      )}
    </group>
  );
};

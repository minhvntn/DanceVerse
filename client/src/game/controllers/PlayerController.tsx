import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { AvatarType, DanceAnimationType, Vector3D, SOCKET_EVENTS } from '../../types';
import { AvatarPrimitive } from '../avatars/AvatarPrimitive';
import { socketService } from '../../services/socket.service';
import { useRoomStore } from '../../stores/useRoomStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { getCameraRelativeMovement } from './cameraRelativeMovement';
import { getAudiencePlayerElevation } from '../stage/audienceElevation';
import { PlayerNameplate } from '../avatars/components/PlayerNameplate';
import { ChatBubble } from '../avatars/components/ChatBubble';
import { ReactionSystem } from '../avatars/components/ReactionSystem';
import { usePlayerSocialState } from '../avatars/hooks/usePlayerSocialState';

interface PlayerControllerProps {
  myPlayerId: string;
  nickname: string;
  avatarType: AvatarType;
  initialPosition?: Vector3D;
  showNames: boolean;
  onPositionChange?: (pos: Vector3D) => void;
  playerPosRef?: React.MutableRefObject<Vector3D>;
  activeEmote?: string;
  activeEmoteStartedAt?: number;
  team?: 'cyan' | 'pink';
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
  activeEmote,
  activeEmoteStartedAt,
  team
}) => {
  const initialVisualY = getAudiencePlayerElevation(initialPosition.x, initialPosition.z);
  const groupRef = useRef<THREE.Group>(null);
  const positionRef = useRef<Vector3D>(initialPosition);
  const rotationRef = useRef<number>(0);
  const [currentAnim, setCurrentAnim] = useState<DanceAnimationType>('Idle');
  const currentAnimRef = useRef<DanceAnimationType>('Idle');
  const [emoteBubble, setEmoteBubble] = useState<string | null>(null);
  const isMusicPlaying = useRoomStore((state) => state.musicState?.status === 'playing');
  const cameraMode = useRoomStore((state) => state.cameraMode);
  
  const { equippedLightstick, lightstickColor, rhythmFeedback, isFeverActive } = usePlayerStore();
  
  const { chatMessage, reactionEvent, clearChat } = usePlayerSocialState(myPlayerId);
  
  const cameraForwardRef = useRef(new THREE.Vector3());

  // Key state tracking
  const keysRef = useRef<Record<string, boolean>>({});
  const lastEmitTimeRef = useRef<number>(0);
  const manualOverrideUntilRef = useRef<number>(0);
  const visualYRef = useRef(getAudiencePlayerElevation(initialPosition.x, initialPosition.z));
  const moveSeqRef = useRef<number>(0);

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
      }, 60000); // 1 minute
      return () => clearTimeout(timer);
    }
  }, [activeEmote, activeEmoteStartedAt]);

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

    const handleAnimationEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      applyAnimation(customEvent.detail);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('trigger-animation', handleAnimationEvent);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('trigger-animation', handleAnimationEvent);
    };
  }, [applyAnimation]);

  useEffect(() => {
    socketService.emit(SOCKET_EVENTS.PLAYER_LIGHTSTICK_UPDATE, {
      equippedLightstick,
      lightstickColor
    });
  }, [equippedLightstick, lightstickColor]);

  const recentMovesRef = useRef<string[]>([]);

  // Dance Move Library
  const DANCE_LIBRARY = {
    basic: ['dance-basic-01', 'dance-basic-02', 'dance-basic-03'],
    medium: ['dance-medium-01', 'dance-medium-02', 'dance-medium-03'],
    advanced: ['dance-advanced-01', 'dance-advanced-02'],
    perfect: ['dance-perfect-01', 'dance-perfect-02'],
    signature: ['dance-signature-01'],
    fever: ['dance-fever-01', 'dance-fever-02']
  };

  const getNextMove = (pool: string[]) => {
    let available = pool.filter(m => !recentMovesRef.current.includes(m));
    if (available.length === 0) available = pool;
    const chosen = available[Math.floor(Math.random() * available.length)];
    recentMovesRef.current.push(chosen);
    if (recentMovesRef.current.length > 2) recentMovesRef.current.shift();
    return chosen;
  };

  // Rhythm Feedback Dance Animations
  useEffect(() => {
    if (!rhythmFeedback) return;
    const { rating } = rhythmFeedback;
    const { combo, isFeverActive } = usePlayerStore.getState();
    
    // Default fallback to old moves if procedural isn't fully ready, but we will return the new IDs
    let anim: DanceAnimationType = 'dance-idle';
    
    if (rating === 'miss') {
      anim = 'dance-idle';
    } else if (isFeverActive) {
      anim = getNextMove(DANCE_LIBRARY.fever);
    } else if (rating === 'perfectmax') {
      anim = getNextMove(DANCE_LIBRARY.signature);
    } else {
      let pools: string[][] = [];
      
      // Determine pools based on judgement and combo
      if (rating === 'perfect') {
        if (combo >= 50) pools = [DANCE_LIBRARY.advanced, DANCE_LIBRARY.perfect];
        else pools = [DANCE_LIBRARY.medium, DANCE_LIBRARY.advanced];
      } else if (rating === 'great') {
        if (combo >= 25) pools = [DANCE_LIBRARY.medium];
        else pools = [DANCE_LIBRARY.basic, DANCE_LIBRARY.medium];
      } else { // good
        pools = [DANCE_LIBRARY.basic];
      }

      // Flatten pools
      let combinedPool = pools.flat();
      anim = getNextMove(combinedPool);
    }
    
    applyAnimation(anim);
  }, [rhythmFeedback, applyAnimation]);

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

      let nx: number;
      let nz: number;

      if (cameraMode === 'player') {
        state.camera.getWorldDirection(cameraForwardRef.current);
        const movement = getCameraRelativeMovement(
          moveX,
          -moveZ,
          cameraForwardRef.current.x,
          cameraForwardRef.current.z
        );
        nx = movement.x;
        nz = movement.z;
      } else {
        // Keep the existing world-relative controls in concert/cinematic modes.
        const length = Math.hypot(moveX, moveZ);
        nx = moveX / length;
        nz = moveZ / length;
      }

      let newX = positionRef.current.x + nx * speed;
      let newZ = positionRef.current.z + nz * speed;

      // Keep real users in the audience area, below the front edge of the stage.
      newX = Math.max(-36, Math.min(36, newX));
      // Stage starts around z = -9, so restrict forward movement to -8.5
      newZ = Math.max(-8.5, Math.min(34, newZ));

      positionRef.current.x = newX;
      positionRef.current.y = 0;
      positionRef.current.z = newZ;
      if (playerPosRef && playerPosRef.current) {
        playerPosRef.current.x = newX;
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
        moveSeqRef.current++;
        socketService.emit(SOCKET_EVENTS.PLAYER_MOVE, {
          position: { x: positionRef.current.x, z: positionRef.current.z },
          rotation: rotationRef.current,
          animation: targetAnim,
          seq: moveSeqRef.current
        });
      }
    } else {
      // Sync position with ref
      groupRef.current.position.set(positionRef.current.x, positionRef.current.y, positionRef.current.z);

      if (Date.now() >= manualOverrideUntilRef.current) {
        applyAnimation('Idle');
      }
    }

    const targetVisualY = getAudiencePlayerElevation(positionRef.current.x, positionRef.current.z);
    visualYRef.current = THREE.MathUtils.damp(visualYRef.current, targetVisualY, 11, delta);
    groupRef.current.position.y = visualYRef.current;

    if (playerPosRef && playerPosRef.current) {
      playerPosRef.current.x = positionRef.current.x;
      playerPosRef.current.y = visualYRef.current;
      playerPosRef.current.z = positionRef.current.z;
    }
  });

  const activeCue = useRoomStore((state) => state.activeStageCue);
  
  const cueColor = activeCue?.type === 'lightstick' ? (activeCue.payload as any)?.color : null;
  const cueEffect = activeCue?.type === 'lightstick' ? (activeCue.payload as any)?.effect : null;
  
  const isWaveEffect = cueEffect === 'wave' || cueEffect === 'crowd-wave';

  let visibleAnimation = currentAnim;
  
  // If active stage cue is wave, or if the user emitted a wave-lightstick emote
  if ((isWaveEffect || emoteBubble === 'wave-lightstick') && equippedLightstick) {
    visibleAnimation = 'WaveLightstick';
  }
  const finalLightstickColor = (cueColor && equippedLightstick && cueEffect !== 'rainbow') ? cueColor : lightstickColor;

  // Don't show text bubble for animation emotes
  const showTextEmote = emoteBubble && emoteBubble !== 'wave-lightstick';

  return (
    <group ref={groupRef} position={[initialPosition.x, initialVisualY, initialPosition.z]}>
      <AvatarPrimitive
        avatarType={avatarType}
        animation={visibleAnimation}
        audienceMotion={isMusicPlaying && visibleAnimation === 'Idle' && !isWaveEffect}
        scale={1}
        equippedLightstick={equippedLightstick}
        lightstickColor={isFeverActive ? 'rainbow' : finalLightstickColor}
        animationTimeOffset={cueEffect === 'crowd-wave' ? (positionRef.current.x + 20) * 0.15 : 0}
        team={team}
      />

      {showNames && (
        <PlayerNameplate 
          name={nickname} 
          isHost={useRoomStore.getState().role === 'host'} 
          rhythmMode={true}
          combo={usePlayerStore.getState().combo}
          team={team}
        />
      )}
      {chatMessage && (
        <ChatBubble 
          message={chatMessage} 
          onComplete={clearChat} 
        />
      )}
      <ReactionSystem reactionEvent={reactionEvent} />

      {/* Emote Bubble */}
      {showTextEmote && (
        <Html position={[0, 2.7, 0]} center distanceFactor={12}>
          <div className="px-3 py-1.5 rounded-2xl bg-slate-900/95 border-2 border-neon-cyan shadow-xl shadow-neon-cyan/30 text-3xl animate-bounce whitespace-nowrap">
            {emoteBubble}
          </div>
        </Html>
      )}
    </group>
  );
};

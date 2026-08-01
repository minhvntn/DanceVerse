import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AvatarType, DanceAnimationType } from '../../types';

interface AvatarPrimitiveProps {
  avatarType: AvatarType;
  animation?: DanceAnimationType;
  isPreview?: boolean;
  scale?: number;
  nickname?: string;
  showName?: boolean;
  emote?: string;
  phase?: number;
  simplified?: boolean;
  audienceMotion?: boolean;
}

export const AVATAR_CONFIGS: Record<AvatarType, {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
}> = {
  Boy: {
    name: 'Cyber Boy',
    primaryColor: '#00F0FF',
    secondaryColor: '#1E3A8A',
    description: 'Street dancer with neon cyber kicks.'
  },
  Girl: {
    name: 'Pop Girl',
    primaryColor: '#FF007F',
    secondaryColor: '#831843',
    description: 'Pop diva ready to light up the stage.'
  },
  Robot: {
    name: 'B-Bot 3000',
    primaryColor: '#94A3B8',
    secondaryColor: '#0284C7',
    description: 'Synthesizer droid programmed to shuffle.'
  },
  Panda: {
    name: 'DJ Panda',
    primaryColor: '#FFFFFF',
    secondaryColor: '#1E293B',
    description: 'Chubby bass-dropping bamboo lover.'
  },
  Alien: {
    name: 'Zorlax',
    primaryColor: '#39FF14',
    secondaryColor: '#047857',
    description: 'Galactic groover from Nebula X.'
  },
  Cat: {
    name: 'Neko Chan',
    primaryColor: '#FB923C',
    secondaryColor: '#FDE047',
    description: 'Agile breakdancing kitty with sass.'
  },
  Bunny: {
    name: 'Hop Hop',
    primaryColor: '#E879F9',
    secondaryColor: '#FFFFFF',
    description: 'High-energy jumper who never misses a beat.'
  },
  Dinosaur: {
    name: 'Rexy',
    primaryColor: '#22C55E',
    secondaryColor: '#EAB308',
    description: 'Prehistoric party beast with stomping moves.'
  }
};

export const AvatarPrimitive: React.FC<AvatarPrimitiveProps> = ({
  avatarType,
  animation = 'Idle',
  isPreview = false,
  scale = 1,
  nickname,
  showName = true,
  emote,
  phase = 0,
  simplified = false,
  audienceMotion = false
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const config = AVATAR_CONFIGS[avatarType] || AVATAR_CONFIGS.Boy;

  useFrame((state) => {
    const time = state.clock.getElapsedTime() + phase;

    if (isPreview && groupRef.current) {
      groupRef.current.rotation.y = time * 0.8;
    }

    // Procedural math animations
    if (
      groupRef.current &&
      torsoRef.current &&
      leftArmRef.current &&
      rightArmRef.current &&
      leftLegRef.current &&
      rightLegRef.current &&
      headRef.current
    ) {
      const group = groupRef.current;
      const torso = torsoRef.current;
      const head = headRef.current;
      const leftArm = leftArmRef.current;
      const rightArm = rightArmRef.current;
      const leftLeg = leftLegRef.current;
      const rightLeg = rightLegRef.current;

      group.position.set(0, 0, 0);
      group.rotation.x = 0;
      group.rotation.z = 0;
      if (!isPreview) group.rotation.y = 0;

      torso.position.y = 0.68;
      torso.rotation.set(0, 0, 0);
      torso.scale.set(1, 1, 1);
      head.position.set(0, 1.42, 0);
      head.rotation.set(0, 0, 0);
      leftArm.rotation.set(0, 0, 0.12);
      rightArm.rotation.set(0, 0, -0.12);
      leftLeg.rotation.set(0, 0, 0);
      rightLeg.rotation.set(0, 0, 0);

      if (animation === 'Idle') {
        if (audienceMotion) {
          const sway = Math.sin(time * 2.1);
          const bounce = Math.abs(Math.sin(time * 2.1));
          const leftLift = 0.5 + Math.sin(time * 1.35) * 0.5;
          const rightLift = 1 - leftLift;

          group.position.y = bounce * 0.07;
          torso.rotation.z = sway * 0.075;
          head.rotation.z = -sway * 0.06;
          head.position.y += bounce * 0.025;
          leftArm.rotation.x = sway * 0.18;
          rightArm.rotation.x = -sway * 0.18;
          leftArm.rotation.z = 0.12 - leftLift * 0.72;
          rightArm.rotation.z = -0.12 + rightLift * 0.72;
          leftLeg.rotation.z = -sway * 0.035;
          rightLeg.rotation.z = sway * 0.035;
        } else {
          const breathe = Math.sin(time * 2.6);
          leftArm.rotation.x = breathe * 0.12;
          rightArm.rotation.x = -breathe * 0.12;
          head.position.y += breathe * 0.035;
          torso.scale.y = 1 + breathe * 0.025;
        }
      } else if (animation === 'Walk' || animation === 'Run') {
        const speed = animation === 'Run' ? 12 : 7;
        const stride = Math.sin(time * speed);
        leftArm.rotation.x = stride * 0.75;
        rightArm.rotation.x = -stride * 0.75;
        leftLeg.rotation.x = -stride * 0.65;
        rightLeg.rotation.x = stride * 0.65;
        group.position.y = Math.abs(Math.cos(time * speed)) * 0.06;
        torso.rotation.z = stride * 0.06;
      } else if (animation === 'Jump') {
        if (!isPreview) group.position.y = Math.abs(Math.sin(time * 6)) * 1.25;
        leftArm.rotation.z = -2.45;
        rightArm.rotation.z = 2.45;
        leftLeg.rotation.x = 0.35;
        rightLeg.rotation.x = 0.35;
      } else if (animation === 'Wave') {
        rightArm.rotation.z = 2.45 + Math.sin(time * 8) * 0.3;
        leftArm.rotation.z = 0.2;
        head.rotation.z = Math.sin(time * 3) * 0.08;
      } else if (animation === 'HipHop') {
        const beat = Math.sin(time * 6.2);
        head.rotation.z = beat * 0.18;
        torso.rotation.y = beat * 0.18;
        torso.rotation.z = beat * 0.1;
        leftArm.rotation.x = beat * 1.0;
        leftArm.rotation.z = 0.55;
        rightArm.rotation.x = Math.cos(time * 6.2) * 1.0;
        rightArm.rotation.z = -0.55;
        leftLeg.rotation.z = -beat * 0.18;
        rightLeg.rotation.z = beat * 0.18;
        if (!isPreview) group.position.y = Math.abs(beat) * 0.28;
      } else if (animation === 'Shuffle') {
        const step = Math.sin(time * 8);
        group.position.x = step * 0.16;
        group.position.y = Math.abs(Math.cos(time * 8)) * 0.13;
        torso.rotation.z = -step * 0.14;
        head.rotation.y = step * 0.16;
        leftArm.rotation.x = -step * 0.65;
        rightArm.rotation.x = step * 0.65;
        leftLeg.rotation.z = step * 0.34;
        rightLeg.rotation.z = -step * 0.34;
      } else if (animation === 'Cheer') {
        const bounce = Math.abs(Math.sin(time * 5.2));
        group.position.y = bounce * 0.34;
        leftArm.rotation.z = -2.45 + Math.sin(time * 5.2) * 0.14;
        rightArm.rotation.z = 2.45 - Math.sin(time * 5.2) * 0.14;
        leftLeg.rotation.z = -0.16;
        rightLeg.rotation.z = 0.16;
        head.rotation.x = -0.1;
      } else if (animation === 'RandomDance') {
        const beat = Math.sin(time * 7.2);
        const sway = Math.sin(time * 3.6);
        group.position.y = Math.abs(beat) * 0.22;
        group.rotation.y = !isPreview ? sway * 0.3 : group.rotation.y;
        torso.rotation.z = sway * 0.22;
        head.rotation.z = -sway * 0.2;
        leftArm.rotation.set(beat * 0.7, 0, 0.9 + sway * 0.45);
        rightArm.rotation.set(-beat * 0.7, 0, -0.9 + sway * 0.45);
        leftLeg.rotation.x = -beat * 0.45;
        rightLeg.rotation.x = beat * 0.45;
      } else if (animation === 'Spin') {
        if (!isPreview) group.rotation.y = time * 8;
        leftArm.rotation.z = 1.2;
        rightArm.rotation.z = -1.2;
      } else if (animation === 'Breakdance') {
        if (!isPreview) {
          group.rotation.z = Math.sin(time * 4) * 0.55;
          group.rotation.y = time * 6;
          group.position.y = 0.18;
        }
        leftArm.rotation.z = 1.15;
        rightArm.rotation.z = -1.15;
      } else if (animation === 'Clap') {
        const clap = Math.abs(Math.sin(time * 10));
        leftArm.rotation.z = 0.35 + clap * 0.5;
        rightArm.rotation.z = -0.35 - clap * 0.5;
        leftArm.rotation.x = -0.45;
        rightArm.rotation.x = -0.45;
        head.position.y += clap * 0.05;
      } else if (animation === 'Moonwalk') {
        const glide = Math.sin(time * 5.5);
        group.position.x = glide * 0.2;
        torso.rotation.z = -glide * 0.12;
        leftArm.rotation.x = glide * 0.7;
        rightArm.rotation.x = -glide * 0.7;
        leftLeg.rotation.x = -Math.max(0, glide) * 0.6;
        rightLeg.rotation.x = Math.min(0, glide) * 0.6;
      } else {
        const pulse = Math.sin(time * 7);
        leftArm.rotation.x = pulse * 0.7;
        rightArm.rotation.x = -pulse * 0.7;
        leftLeg.rotation.x = -pulse * 0.5;
        rightLeg.rotation.x = pulse * 0.5;
        if (!isPreview) group.position.y = Math.abs(pulse) * 0.25;
      }
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* Head Group - Large cute chibi head */}
      <group ref={headRef} position={[0, 1.42, 0]}>
        <mesh castShadow receiveShadow>
          {avatarType === 'Robot' ? (
            <boxGeometry args={[0.9, 0.85, 0.85]} />
          ) : (
            <sphereGeometry args={[0.48, 24, 24]} />
          )}
          <meshStandardMaterial color={config.primaryColor} roughness={0.3} metalness={avatarType === 'Robot' ? 0.6 : 0.1} />
        </mesh>

        {/* Cute Eyes */}
        <mesh position={[-0.15, 0.05, 0.44]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color="#0F172A" />
        </mesh>
        <mesh position={[0.15, 0.05, 0.44]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshBasicMaterial color="#0F172A" />
        </mesh>
        {!simplified && (
          <>
            {/* Eye highlights and smile */}
            <mesh position={[-0.13, 0.07, 0.49]}>
              <sphereGeometry args={[0.018, 8, 8]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[0.17, 0.07, 0.49]}>
              <sphereGeometry args={[0.018, 8, 8]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[0, -0.14, 0.475]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.075, 0.018, 6, 14, Math.PI]} />
              <meshBasicMaterial color="#7F1D1D" />
            </mesh>
          </>
        )}

        {/* Cute Animal Ears / Accessories */}
        {!simplified && avatarType === 'Cat' && (
          <>
            <mesh position={[-0.25, 0.45, 0]} rotation={[0, 0, 0.3]}>
              <coneGeometry args={[0.16, 0.3, 16]} />
              <meshStandardMaterial color={config.secondaryColor} />
            </mesh>
            <mesh position={[0.25, 0.45, 0]} rotation={[0, 0, -0.3]}>
              <coneGeometry args={[0.16, 0.3, 16]} />
              <meshStandardMaterial color={config.secondaryColor} />
            </mesh>
          </>
        )}
        {!simplified && avatarType === 'Bunny' && (
          <>
            <mesh position={[-0.2, 0.6, -0.05]}>
              <cylinderGeometry args={[0.08, 0.09, 0.6, 12]} />
              <meshStandardMaterial color={config.secondaryColor} />
            </mesh>
            <mesh position={[0.2, 0.6, -0.05]}>
              <cylinderGeometry args={[0.08, 0.09, 0.6, 12]} />
              <meshStandardMaterial color={config.secondaryColor} />
            </mesh>
          </>
        )}
        {!simplified && avatarType === 'Panda' && (
          <>
            <mesh position={[-0.35, 0.35, 0]}>
              <sphereGeometry args={[0.16, 16, 16]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
            <mesh position={[0.35, 0.35, 0]}>
              <sphereGeometry args={[0.16, 16, 16]} />
              <meshStandardMaterial color="#000000" />
            </mesh>
          </>
        )}
        {!simplified && avatarType === 'Alien' && (
          <>
            <mesh position={[0, 0.6, 0]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshBasicMaterial color="#00F0FF" />
            </mesh>
            <mesh position={[0, 0.4, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.4]} />
              <meshStandardMaterial color="#047857" />
            </mesh>
          </>
        )}
        {!simplified && avatarType === 'Robot' && (
          <mesh position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#FF007F" />
          </mesh>
        )}
      </group>

      {/* Body / Torso */}
      <mesh ref={torsoRef} position={[0, 0.68, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.36, 0.65, 16]} />
        <meshStandardMaterial color={config.secondaryColor} roughness={0.4} />
      </mesh>

      {!simplified && (
        <mesh position={[0, 0.72, 0.325]}>
          <boxGeometry args={[0.28, 0.08, 0.035]} />
          <meshBasicMaterial color={config.primaryColor} toneMapped={false} />
        </mesh>
      )}

      {/* Arms - Cute chubby limbs */}
      <group ref={leftArmRef} position={[-0.43, 0.88, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.3, 4, 10]} />
          <meshStandardMaterial color={config.primaryColor} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.43, 0.88, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.09, 0.3, 4, 10]} />
          <meshStandardMaterial color={config.primaryColor} />
        </mesh>
      </group>

      {/* Legs - Short chibi legs */}
      <group ref={leftLegRef} position={[-0.18, 0.38, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.105, 0.27, 4, 10]} />
          <meshStandardMaterial color="#111827" roughness={0.45} />
        </mesh>
        <mesh position={[0, -0.4, 0.07]} castShadow>
          <boxGeometry args={[0.24, 0.13, 0.38]} />
          <meshStandardMaterial color="#030712" emissive={config.primaryColor} emissiveIntensity={0.32} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.18, 0.38, 0]}>
        <mesh position={[0, -0.18, 0]} castShadow>
          <capsuleGeometry args={[0.105, 0.27, 4, 10]} />
          <meshStandardMaterial color="#111827" roughness={0.45} />
        </mesh>
        <mesh position={[0, -0.4, 0.07]} castShadow>
          <boxGeometry args={[0.24, 0.13, 0.38]} />
          <meshStandardMaterial color="#030712" emissive={config.primaryColor} emissiveIntensity={0.32} />
        </mesh>
      </group>

      {/* Dinosaur Tail */}
      {avatarType === 'Dinosaur' && (
        <mesh position={[0, 0.5, -0.4]} rotation={[0.4, 0, 0]}>
          <coneGeometry args={[0.2, 0.6, 12]} />
          <meshStandardMaterial color={config.primaryColor} />
        </mesh>
      )}
    </group>
  );
};

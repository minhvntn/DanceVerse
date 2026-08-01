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
  emote
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  const config = AVATAR_CONFIGS[avatarType] || AVATAR_CONFIGS.Boy;

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    if (isPreview && groupRef.current) {
      groupRef.current.rotation.y = time * 0.8;
    }

    // Procedural math animations
    if (leftArmRef.current && rightArmRef.current && leftLegRef.current && rightLegRef.current && headRef.current) {
      if (animation === 'Idle') {
        leftArmRef.current.rotation.x = Math.sin(time * 3) * 0.15;
        rightArmRef.current.rotation.x = -Math.sin(time * 3) * 0.15;
        headRef.current.position.y = 1.35 + Math.sin(time * 3) * 0.05;
      } else if (animation === 'Walk' || animation === 'Run') {
        const speed = animation === 'Run' ? 12 : 7;
        leftArmRef.current.rotation.x = Math.sin(time * speed) * 0.6;
        rightArmRef.current.rotation.x = -Math.sin(time * speed) * 0.6;
        leftLegRef.current.rotation.x = -Math.sin(time * speed) * 0.6;
        rightLegRef.current.rotation.x = Math.sin(time * speed) * 0.6;
      } else if (animation === 'Jump') {
        if (groupRef.current && !isPreview) {
          groupRef.current.position.y = Math.abs(Math.sin(time * 6)) * 1.5;
        }
        leftArmRef.current.rotation.z = Math.PI - 0.5;
        rightArmRef.current.rotation.z = -(Math.PI - 0.5);
      } else if (animation === 'Wave') {
        rightArmRef.current.rotation.z = Math.PI - 0.3 + Math.sin(time * 8) * 0.3;
        leftArmRef.current.rotation.z = 0.2;
      } else if (animation === 'HipHop') {
        headRef.current.rotation.z = Math.sin(time * 6) * 0.2;
        leftArmRef.current.rotation.x = Math.sin(time * 6) * 0.8;
        rightArmRef.current.rotation.x = Math.cos(time * 6) * 0.8;
        if (groupRef.current && !isPreview) {
          groupRef.current.position.y = Math.abs(Math.sin(time * 6)) * 0.4;
        }
      } else if (animation === 'Spin') {
        if (groupRef.current && !isPreview) {
          groupRef.current.rotation.y = time * 8;
        }
        leftArmRef.current.rotation.z = 1.2;
        rightArmRef.current.rotation.z = -1.2;
      } else if (animation === 'Breakdance') {
        if (groupRef.current && !isPreview) {
          groupRef.current.rotation.z = Math.sin(time * 4) * 0.4;
          groupRef.current.rotation.y = time * 6;
          groupRef.current.position.y = 0.2;
        }
      } else if (animation === 'Clap') {
        leftArmRef.current.rotation.z = 0.6 + Math.sin(time * 10) * 0.2;
        rightArmRef.current.rotation.z = -0.6 - Math.sin(time * 10) * 0.2;
      } else {
        // Shuffle / Cheer / Moonwalk / RandomDance fallback
        const pulse = Math.sin(time * 7);
        leftArmRef.current.rotation.x = pulse * 0.7;
        rightArmRef.current.rotation.x = -pulse * 0.7;
        leftLegRef.current.rotation.x = -pulse * 0.5;
        rightLegRef.current.rotation.x = pulse * 0.5;
        if (groupRef.current && !isPreview) {
          groupRef.current.position.y = Math.abs(Math.sin(time * 7)) * 0.3;
        }
      }
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* Head Group - Large cute chibi head */}
      <group ref={headRef} position={[0, 1.35, 0]}>
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
        {/* Eye highlights */}
        <mesh position={[-0.13, 0.07, 0.49]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
        <mesh position={[0.17, 0.07, 0.49]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>

        {/* Cute Animal Ears / Accessories */}
        {avatarType === 'Cat' && (
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
        {avatarType === 'Bunny' && (
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
        {avatarType === 'Panda' && (
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
        {avatarType === 'Alien' && (
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
        {avatarType === 'Robot' && (
          <mesh position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshBasicMaterial color="#FF007F" />
          </mesh>
        )}
      </group>

      {/* Body / Torso */}
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.32, 0.36, 0.65, 16]} />
        <meshStandardMaterial color={config.secondaryColor} roughness={0.4} />
      </mesh>

      {/* Arms - Cute chubby limbs */}
      <mesh ref={leftArmRef} position={[-0.45, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.45, 12]} />
        <meshStandardMaterial color={config.primaryColor} />
      </mesh>
      <mesh ref={rightArmRef} position={[0.45, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.09, 0.45, 12]} />
        <meshStandardMaterial color={config.primaryColor} />
      </mesh>

      {/* Legs - Short chibi legs */}
      <mesh ref={leftLegRef} position={[-0.18, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.44, 12]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      <mesh ref={rightLegRef} position={[0.18, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.11, 0.44, 12]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>

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

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AvatarType, DanceAnimationType } from '../../types';
import { AvatarAccessories } from './AvatarAccessories';
import { AvatarFace } from './AvatarFace';
import { AvatarOutfit } from './AvatarOutfit';

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
  stageDancer?: boolean;
  animationClock?: () => number;
}

export const AVATAR_CONFIGS: Record<AvatarType, {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  description: string;
}> = {
  Boy: {
    name: 'Cyber Boy',
    primaryColor: '#00F0FF',
    secondaryColor: '#2552D9',
    accentColor: '#FFE45E',
    description: 'Street dancer with neon cyber kicks.'
  },
  Girl: {
    name: 'Pop Girl',
    primaryColor: '#FF2B9B',
    secondaryColor: '#7C3AED',
    accentColor: '#FFE45E',
    description: 'Pop diva ready to light up the stage.'
  },
  Robot: {
    name: 'B-Bot 3000',
    primaryColor: '#B8C7DA',
    secondaryColor: '#2563EB',
    accentColor: '#00F0FF',
    description: 'Synthesizer droid programmed to shuffle.'
  },
  Panda: {
    name: 'DJ Panda',
    primaryColor: '#FFFFFF',
    secondaryColor: '#1E293B',
    accentColor: '#FF5AA5',
    description: 'Chubby bass-dropping bamboo lover.'
  },
  Alien: {
    name: 'Zorlax',
    primaryColor: '#62FF38',
    secondaryColor: '#067A67',
    accentColor: '#00F0FF',
    description: 'Galactic groover from Nebula X.'
  },
  Cat: {
    name: 'Neko Chan',
    primaryColor: '#FF963D',
    secondaryColor: '#8B3F2F',
    accentColor: '#FFE45E',
    description: 'Agile breakdancing kitty with sass.'
  },
  Bunny: {
    name: 'Hop Hop',
    primaryColor: '#E879F9',
    secondaryColor: '#FFFFFF',
    accentColor: '#FF8CC6',
    description: 'High-energy jumper who never misses a beat.'
  },
  Dinosaur: {
    name: 'Rexy',
    primaryColor: '#24D26D',
    secondaryColor: '#087F5B',
    accentColor: '#FFD84D',
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
  audienceMotion = false,
  stageDancer = false,
  animationClock
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const visualRootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const eyeRef = useRef<THREE.Group>(null);
  const accessoryRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const config = AVATAR_CONFIGS[avatarType] || AVATAR_CONFIGS.Boy;

  useFrame((state) => {
    const time = (animationClock ? animationClock() : state.clock.getElapsedTime()) + phase;

    if (isPreview && groupRef.current) {
      groupRef.current.rotation.y = Math.sin(time * 0.45) * 0.2;
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
      head.position.set(0, 1.47, 0);
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

      if (stageDancer && animation !== 'Idle') {
        const stagePulse = Math.sin(time * 6.2);
        leftArm.rotation.x *= 1.12;
        leftArm.rotation.z *= 1.08;
        rightArm.rotation.x *= 1.12;
        rightArm.rotation.z *= 1.08;
        torso.rotation.z *= 1.1;
        torso.rotation.x += stagePulse * 0.045;
        head.rotation.y += stagePulse * 0.055;
        group.position.y += Math.abs(stagePulse) * 0.035;
      }

      const secondaryBounce = Math.sin(time * 3.4) * 0.5 + 0.5;
      head.position.y += secondaryBounce * 0.012;
      head.rotation.z += Math.sin(time * 1.8) * 0.018;

      if (visualRootRef.current) {
        const squash = Math.abs(Math.sin(time * (animation === 'Idle' ? 2.6 : 5.2)));
        visualRootRef.current.scale.set(
          1 + squash * 0.012,
          1 - squash * 0.018,
          1 + squash * 0.012
        );
      }

      if (accessoryRef.current) {
        accessoryRef.current.position.y = Math.sin(time * 3.1) * 0.012;
        accessoryRef.current.rotation.z = Math.sin(time * 2.2) * 0.016;
      }

      if (eyeRef.current) {
        const blinkCycle = (time + phase * 0.37) % 4.3;
        const blinkScale = blinkCycle > 4.08 ? Math.max(0.08, Math.abs(blinkCycle - 4.19) * 9) : 1;
        eyeRef.current.scale.y = blinkScale;
      }
    }
  });

  const limbColor = avatarType === 'Panda' ? '#111827' : config.primaryColor;
  const shoeColor = avatarType === 'Girl' || avatarType === 'Bunny' ? config.primaryColor : '#111827';

  return (
    <group ref={groupRef} scale={scale}>
      <group ref={visualRootRef}>
        <group ref={headRef} position={[0, 1.47, 0]}>
          <mesh
            castShadow
            receiveShadow
            scale={
              avatarType === 'Alien'
                ? [0.96, 1.08, 0.92]
                : avatarType === 'Dinosaur'
                  ? [1.04, 0.96, 1]
                  : [1, 1, 1]
            }
          >
            {avatarType === 'Robot' ? (
              <boxGeometry args={[0.98, 0.88, 0.84]} />
            ) : (
              <sphereGeometry args={[0.53, simplified ? 16 : 24, simplified ? 16 : 24]} />
            )}
            <meshStandardMaterial
              color={config.primaryColor}
              roughness={avatarType === 'Robot' ? 0.2 : 0.34}
              metalness={avatarType === 'Robot' ? 0.62 : 0.05}
            />
          </mesh>

          <AvatarFace
            avatarType={avatarType}
            primaryColor={config.primaryColor}
            secondaryColor={config.secondaryColor}
            accentColor={config.accentColor}
            simplified={simplified}
            eyeRef={eyeRef}
          />
          <AvatarAccessories
            avatarType={avatarType}
            primaryColor={config.primaryColor}
            secondaryColor={config.secondaryColor}
            accentColor={config.accentColor}
            simplified={simplified}
            accessoryRef={accessoryRef}
          />
        </group>

        <group ref={torsoRef} position={[0, 0.68, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.34, 0.39, 0.66, simplified ? 12 : 20]} />
            <meshStandardMaterial color={config.secondaryColor} roughness={0.38} />
          </mesh>
          <AvatarOutfit
            avatarType={avatarType}
            primaryColor={config.primaryColor}
            secondaryColor={config.secondaryColor}
            accentColor={config.accentColor}
            simplified={simplified}
          />
        </group>

        <group ref={leftArmRef} position={[-0.45, 0.9, 0]}>
          <mesh position={[0, -0.19, 0]} castShadow>
            <capsuleGeometry args={[0.105, 0.29, 4, simplified ? 8 : 12]} />
            <meshStandardMaterial color={limbColor} roughness={0.35} />
          </mesh>
          {!simplified && (
            <mesh position={[0, -0.39, 0]}>
              <sphereGeometry args={[0.115, 12, 12]} />
              <meshStandardMaterial color={config.accentColor} roughness={0.38} />
            </mesh>
          )}
        </group>
        <group ref={rightArmRef} position={[0.45, 0.9, 0]}>
          <mesh position={[0, -0.19, 0]} castShadow>
            <capsuleGeometry args={[0.105, 0.29, 4, simplified ? 8 : 12]} />
            <meshStandardMaterial color={limbColor} roughness={0.35} />
          </mesh>
          {!simplified && (
            <mesh position={[0, -0.39, 0]}>
              <sphereGeometry args={[0.115, 12, 12]} />
              <meshStandardMaterial color={config.accentColor} roughness={0.38} />
            </mesh>
          )}
        </group>

        <group ref={leftLegRef} position={[-0.19, 0.38, 0]}>
          <mesh position={[0, -0.17, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.25, 4, simplified ? 8 : 10]} />
            <meshStandardMaterial color="#172033" roughness={0.45} />
          </mesh>
          <mesh position={[0, -0.39, 0.1]} castShadow scale={[1.08, 1, 1.08]}>
            <boxGeometry args={[0.27, 0.16, 0.42]} />
            <meshStandardMaterial
              color={shoeColor}
              emissive={config.primaryColor}
              emissiveIntensity={simplified ? 0.14 : 0.36}
              roughness={0.28}
            />
          </mesh>
          {!simplified && (
            <mesh position={[0, -0.39, 0.318]}>
              <boxGeometry args={[0.21, 0.045, 0.018]} />
              <meshBasicMaterial color={config.accentColor} toneMapped={false} />
            </mesh>
          )}
        </group>
        <group ref={rightLegRef} position={[0.19, 0.38, 0]}>
          <mesh position={[0, -0.17, 0]} castShadow>
            <capsuleGeometry args={[0.11, 0.25, 4, simplified ? 8 : 10]} />
            <meshStandardMaterial color="#172033" roughness={0.45} />
          </mesh>
          <mesh position={[0, -0.39, 0.1]} castShadow scale={[1.08, 1, 1.08]}>
            <boxGeometry args={[0.27, 0.16, 0.42]} />
            <meshStandardMaterial
              color={shoeColor}
              emissive={config.primaryColor}
              emissiveIntensity={simplified ? 0.14 : 0.36}
              roughness={0.28}
            />
          </mesh>
          {!simplified && (
            <mesh position={[0, -0.39, 0.318]}>
              <boxGeometry args={[0.21, 0.045, 0.018]} />
              <meshBasicMaterial color={config.accentColor} toneMapped={false} />
            </mesh>
          )}
        </group>

        {avatarType === 'Cat' && (
          <mesh position={[0.31, 0.62, -0.35]} rotation={[0.2, 0.2, -0.55]}>
            <torusGeometry args={[0.27, 0.055, 8, 18, Math.PI * 1.25]} />
            <meshStandardMaterial color={config.primaryColor} roughness={0.4} />
          </mesh>
        )}

        {avatarType === 'Bunny' && (
          <mesh position={[0, 0.55, -0.38]}>
            <sphereGeometry args={[0.18, 14, 14]} />
            <meshStandardMaterial color={config.secondaryColor} roughness={0.55} />
          </mesh>
        )}

        {avatarType === 'Dinosaur' && (
          <mesh position={[0, 0.52, -0.52]} rotation={[0.58, 0, 0]} scale={[1, 1.35, 1]}>
            <coneGeometry args={[0.24, 0.76, 12]} />
            <meshStandardMaterial color={config.primaryColor} roughness={0.42} />
          </mesh>
        )}
      </group>
    </group>
  );
};

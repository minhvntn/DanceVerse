import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AvatarType, DanceAnimationType, AvatarCustomization } from '../../../../shared/types';
import { AvatarAccessories } from './AvatarAccessories';
import { AvatarFace } from './AvatarFace';
import { AvatarOutfit } from './AvatarOutfit';
import { Lightstick } from './Lightstick';
import { resolveColor, BODY_COLORS, SHOE_COLORS, OUTFIT_COLORS, LIGHTSTICK_COLORS } from './avatarCosmetics';
import { CelestialQueenAvatar } from './CelestialQueenAvatar';

interface AvatarPrimitiveProps {
  avatarType: AvatarType;
  avatarConfig?: AvatarCustomization;
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
  equippedLightstick?: boolean;
  lightstickColor?: string;
  animationTimeOffset?: number;
  team?: 'cyan' | 'pink';
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
    description: 'A prehistoric dancer with modern moves.'
  },
  CelestialQueen: {
    name: 'Celestial Queen',
    primaryColor: '#FFFFFF',
    secondaryColor: '#FFD700',
    accentColor: '#00F0FF',
    description: 'The majestic animated queen of the DanceVerse.'
  }
};

export const AvatarPrimitive: React.FC<AvatarPrimitiveProps> = ({
  avatarType,
  avatarConfig,
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
  animationClock,
  equippedLightstick = false,
  lightstickColor = '#8ffcff',
  animationTimeOffset = 0,
  team
}) => {
  const isCelestialQueen = avatarType === 'CelestialQueen' || avatarType === ('celestial_queen' as any);
  
  // Override lightstick color if team is assigned
  const effectiveLightstickColor = team === 'cyan' ? '#00ffff' : team === 'pink' ? '#ff1493' : lightstickColor;
  const groupRef = useRef<THREE.Group>(null);
  const visualRootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const eyeRef = useRef<THREE.Group>(null);
  const accessoryRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const rightHandAnchorRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);

  const config = React.useMemo(() => {
    const base = AVATAR_CONFIGS[avatarType] || AVATAR_CONFIGS.Boy;
    if (avatarConfig) {
      return {
        primaryColor: resolveColor(BODY_COLORS, avatarConfig.bodyColor, base.primaryColor),
        secondaryColor: resolveColor(OUTFIT_COLORS, avatarConfig.outfitColor, base.secondaryColor),
        accentColor: '#FFE45E', // Default accent
        shoeColor: resolveColor(SHOE_COLORS, avatarConfig.shoesColor, base.primaryColor),
      };
    }
    return { ...base, shoeColor: avatarType === 'Girl' || avatarType === 'Bunny' ? base.primaryColor : '#111827' };
  }, [avatarType, avatarConfig]);

  const limbColor = avatarConfig ? config.primaryColor : (avatarType === 'Panda' ? '#111827' : config.primaryColor);
  const shoeColor = config.shoeColor;

  useFrame((state, delta) => {
    const time = (animationClock ? animationClock() : state.clock.getElapsedTime()) + phase + animationTimeOffset;

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

      let tgY = 0, tgRotY = 0, tgRotZ = 0, tgRotX = 0;
      let ttRotX = 0, ttRotY = 0, ttRotZ = 0;
      let thRotX = 0, thRotY = 0, thRotZ = 0;
      let tlaRotX = 0, tlaRotZ = 0.12, tlaRotY = 0;
      let traRotX = 0, traRotZ = -0.12, traRotY = 0;
      let tllRotX = 0, tllRotZ = 0;
      let trlRotX = 0, trlRotZ = 0;
      let torsoScaleY = 1;

      if (isPreview) tgRotY = Math.sin(time * 0.45) * 0.2;

      // Base logic map
      const baseAnim = animation.split('-')[0]; // e.g. "dance"
      const animType = animation; // Full string

      if (animType === 'Idle' || animType === 'dance-idle') {
        if (audienceMotion) {
          const sway = Math.sin(time * 2.1);
          const bounce = Math.abs(Math.sin(time * 2.1));
          const leftLift = 0.5 + Math.sin(time * 1.35) * 0.5;
          const rightLift = 1 - leftLift;

          tgY = bounce * 0.07;
          ttRotZ = sway * 0.075;
          thRotZ = -sway * 0.06;
          tlaRotX = sway * 0.18;
          traRotX = -sway * 0.18;
          tlaRotZ = 0.12 - leftLift * 0.72;
          traRotZ = -0.12 + rightLift * 0.72;
          tllRotZ = -sway * 0.035;
          trlRotZ = sway * 0.035;
        } else {
          const breathe = Math.sin(time * (animType === 'dance-idle' ? 4 : 2.6));
          const bounce = Math.abs(breathe);
          tlaRotX = breathe * 0.12;
          traRotX = -breathe * 0.12;
          torsoScaleY = 1 + breathe * 0.025;
          if (animType === 'dance-idle') {
            tgY = bounce * 0.05;
            ttRotZ = Math.sin(time * 2) * 0.05;
          }
        }
      } else if (animType === 'Walk' || animType === 'Run') {
        const speed = animType === 'Run' ? 12 : 7;
        const stride = Math.sin(time * speed);
        tlaRotX = stride * 0.75;
        traRotX = -stride * 0.75;
        tllRotX = -stride * 0.65;
        trlRotX = stride * 0.65;
        tgY = Math.abs(Math.cos(time * speed)) * 0.06;
        ttRotZ = stride * 0.06;
      } else if (animType === 'Jump') {
        if (!isPreview) tgY = Math.abs(Math.sin(time * 6)) * 1.25;
        tlaRotZ = -2.45;
        traRotZ = 2.45;
        tllRotX = 0.35;
        trlRotX = 0.35;
      } else if (animType === 'Wave' || animType === 'WaveLightstick') {
        if (animType === 'WaveLightstick') {
          traRotZ = 2.8 + Math.sin(time * 3) * 0.4;
          traRotX = -0.2;
        } else {
          traRotZ = 2.45 + Math.sin(time * 8) * 0.3;
        }
        tlaRotZ = 0.2 + (animType === 'WaveLightstick' ? Math.sin(time * 2) * 0.1 : 0);
        thRotZ = Math.sin(time * 3) * 0.08;
        if (animType === 'WaveLightstick') tgY = Math.abs(Math.sin(time * 4)) * 0.05;
      } else if (animType === 'HipHop') {
        const beat = Math.sin(time * 6.2);
        thRotZ = beat * 0.18;
        ttRotY = beat * 0.18;
        ttRotZ = beat * 0.1;
        tlaRotX = beat * 1.0;
        tlaRotZ = 0.55;
        traRotX = Math.cos(time * 6.2) * 1.0;
        traRotZ = -0.55;
        tllRotZ = -beat * 0.18;
        trlRotZ = beat * 0.18;
        if (!isPreview) tgY = Math.abs(beat) * 0.28;
      } else if (animType === 'Shuffle') {
        const step = Math.sin(time * 8);
        if (!isPreview) group.position.x = step * 0.16;
        tgY = Math.abs(Math.cos(time * 8)) * 0.13;
        ttRotZ = -step * 0.14;
        thRotY = step * 0.16;
        tlaRotX = -step * 0.65;
        traRotX = step * 0.65;
        tllRotZ = step * 0.34;
        trlRotZ = -step * 0.34;
      } else if (animType === 'Breakdance') {
        if (!isPreview) {
          tgRotZ = Math.sin(time * 4) * 0.55;
          tgRotY = time * 6;
          tgY = 0.18;
        }
        tlaRotZ = 1.15;
        traRotZ = -1.15;
      } else if (animType.includes('dance-basic')) {
        const beat = Math.sin(time * 8);
        tgY = Math.abs(beat) * 0.1;
        ttRotZ = Math.cos(time * 4) * 0.15;
        tlaRotX = beat * 0.5;
        traRotX = -beat * 0.5;
      } else if (animType.includes('dance-medium')) {
        const beat = Math.sin(time * 10);
        tgY = Math.abs(beat) * 0.2;
        thRotZ = beat * 0.2;
        ttRotY = beat * 0.3;
        tlaRotX = beat * 0.8;
        tlaRotZ = 0.4;
        traRotX = -beat * 0.8;
        traRotZ = -0.4;
        tllRotZ = -beat * 0.2;
        trlRotZ = beat * 0.2;
      } else if (animType.includes('dance-advanced') || animType.includes('group-dance')) {
        const beat = Math.sin(time * 12);
        tgY = Math.abs(beat) * 0.3;
        if (!isPreview) tgRotY = Math.sin(time * 6) * 0.5;
        ttRotZ = beat * 0.3;
        tlaRotZ = 1.5 + beat * 0.5;
        traRotZ = -1.5 - beat * 0.5;
        tlaRotX = -0.5;
        traRotX = -0.5;
        tllRotX = -beat * 0.5;
        trlRotX = beat * 0.5;
      } else if (animType.includes('dance-signature') || animType.includes('dance-perfect')) {
        if (!isPreview) tgRotY = time * 10;
        tgY = Math.abs(Math.sin(time * 5)) * 0.4;
        tlaRotZ = 2.5;
        traRotZ = -2.5;
        tllRotZ = 0.2;
        trlRotZ = -0.2;
      } else if (animType.includes('dance-fever')) {
        const beat = Math.sin(time * 15);
        tgY = Math.abs(beat) * 0.5;
        thRotX = beat * 0.3;
        ttRotX = beat * 0.4;
        tlaRotX = -1.5 + beat * 0.5;
        traRotX = -1.5 + beat * 0.5;
      } else {
        const pulse = Math.sin(time * 7);
        tlaRotX = pulse * 0.7;
        traRotX = -pulse * 0.7;
        tllRotX = -pulse * 0.5;
        trlRotX = pulse * 0.5;
        if (!isPreview) tgY = Math.abs(pulse) * 0.25;
      }

      // Lightstick Override
      if (equippedLightstick && (animType === 'Idle' || animType === 'Walk' || animType === 'Run' || animType === 'dance-idle')) {
        const sway = Math.sin(time * 2.1);
        const rightLift = 0.5 - Math.sin(time * 1.35) * 0.5;
        traRotX = -0.5 + sway * 0.1;
        traRotZ = 0.2 + rightLift * 0.5;
      } else if (equippedLightstick) {
        // Safe hand position for fast moves
        traRotX = -0.8;
        traRotZ = -0.3;
      }

      // Apply Damping
      const dampSpd = 12;
      group.position.y = THREE.MathUtils.damp(group.position.y, tgY, dampSpd, delta);
      group.rotation.x = THREE.MathUtils.damp(group.rotation.x, tgRotX, dampSpd, delta);
      group.rotation.y = THREE.MathUtils.damp(group.rotation.y, tgRotY, dampSpd, delta);
      group.rotation.z = THREE.MathUtils.damp(group.rotation.z, tgRotZ, dampSpd, delta);
      
      torso.rotation.x = THREE.MathUtils.damp(torso.rotation.x, ttRotX, dampSpd, delta);
      torso.rotation.y = THREE.MathUtils.damp(torso.rotation.y, ttRotY, dampSpd, delta);
      torso.rotation.z = THREE.MathUtils.damp(torso.rotation.z, ttRotZ, dampSpd, delta);
      torso.scale.y = THREE.MathUtils.damp(torso.scale.y, torsoScaleY, dampSpd, delta);

      head.rotation.x = THREE.MathUtils.damp(head.rotation.x, thRotX, dampSpd, delta);
      head.rotation.y = THREE.MathUtils.damp(head.rotation.y, thRotY, dampSpd, delta);
      head.rotation.z = THREE.MathUtils.damp(head.rotation.z, thRotZ, dampSpd, delta);

      leftArm.rotation.x = THREE.MathUtils.damp(leftArm.rotation.x, tlaRotX, dampSpd, delta);
      leftArm.rotation.y = THREE.MathUtils.damp(leftArm.rotation.y, tlaRotY, dampSpd, delta);
      leftArm.rotation.z = THREE.MathUtils.damp(leftArm.rotation.z, tlaRotZ, dampSpd, delta);

      rightArm.rotation.x = THREE.MathUtils.damp(rightArm.rotation.x, traRotX, dampSpd, delta);
      rightArm.rotation.y = THREE.MathUtils.damp(rightArm.rotation.y, traRotY, dampSpd, delta);
      rightArm.rotation.z = THREE.MathUtils.damp(rightArm.rotation.z, traRotZ, dampSpd, delta);

      leftLeg.rotation.x = THREE.MathUtils.damp(leftLeg.rotation.x, tllRotX, dampSpd, delta);
      leftLeg.rotation.z = THREE.MathUtils.damp(leftLeg.rotation.z, tllRotZ, dampSpd, delta);
      
      rightLeg.rotation.x = THREE.MathUtils.damp(rightLeg.rotation.x, trlRotX, dampSpd, delta);
      rightLeg.rotation.z = THREE.MathUtils.damp(rightLeg.rotation.z, trlRotZ, dampSpd, delta);

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
      head.position.y = 1.47 + secondaryBounce * 0.012;
      
      // Also apply rotation offset directly to the target before damping, or just assign it after damping, but let's just make sure it doesn't accumulate 
      // Actually head.rotation.z is damped on line 354, so += is stable but it's cleaner to just not do it, 
      // or we can leave head.rotation.z alone if it wasn't the bug. The head.position.y was the bug.
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


  if (avatarType === 'CelestialQueen') {
    return (
      <group ref={groupRef} position={[0, scale * 0.1, 0]}>
        <CelestialQueenAvatar animation={animation} scale={scale} />
      </group>
    );
  }

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
            avatarConfig={avatarConfig}
            primaryColor={config.primaryColor}
            secondaryColor={config.secondaryColor}
            accentColor={config.accentColor}
            simplified={simplified}
            eyeRef={eyeRef}
          />
          <AvatarAccessories
            avatarType={avatarType}
            avatarConfig={avatarConfig}
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
            avatarConfig={avatarConfig}
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
          {/* Hand Anchor point */}
          <group ref={rightHandAnchorRef} position={[0, -0.39, 0]}>
            {equippedLightstick && (
              <group rotation={[Math.PI - 0.5, 0, 0]}>
                <Lightstick 
                  color={team ? effectiveLightstickColor : (avatarConfig ? resolveColor(LIGHTSTICK_COLORS, avatarConfig.lightstickColor, effectiveLightstickColor) : effectiveLightstickColor)} 
                  isWaving={animation === 'WaveLightstick'} 
                  simplified={simplified} 
                />
              </group>
            )}
          </group>
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
        
        {/* Team Floor Glow */}
        {team && !simplified && (
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.6, 32]} />
            <meshBasicMaterial 
              color={team === 'cyan' ? '#00ffff' : '#ff1493'} 
              transparent 
              opacity={0.8}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>
    </group>
  );
};

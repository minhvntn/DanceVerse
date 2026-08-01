import React from 'react';
import * as THREE from 'three';
import { AvatarType } from '../../types';

interface AvatarFaceProps {
  avatarType: AvatarType;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  simplified?: boolean;
  eyeRef: React.RefObject<THREE.Group | null>;
}

const EyeHighlight: React.FC<{ position: [number, number, number]; scale?: number }> = ({
  position,
  scale = 1
}) => (
  <mesh position={position} scale={scale}>
    <sphereGeometry args={[0.028, 10, 10]} />
    <meshBasicMaterial color="#FFFFFF" toneMapped={false} />
  </mesh>
);

export const AvatarFace: React.FC<AvatarFaceProps> = ({
  avatarType,
  primaryColor,
  secondaryColor,
  accentColor,
  simplified = false,
  eyeRef
}) => {
  const isRobot = avatarType === 'Robot';
  const isAlien = avatarType === 'Alien';
  const isPanda = avatarType === 'Panda';
  const eyeZ = isRobot ? 0.432 : avatarType === 'Dinosaur' ? 0.492 : 0.482;
  const eyeX = isAlien ? 0.185 : 0.17;
  const eyeScale: [number, number, number] = isAlien
    ? [1.1, 1.45, 0.65]
    : isRobot
      ? [1.25, 0.65, 0.45]
      : [1, 1.15, 0.72];

  return (
    <group>
      {isRobot && (
        <mesh position={[0, 0.035, 0.405]}>
          <boxGeometry args={[0.69, 0.36, 0.055]} />
          <meshStandardMaterial color="#0B1026" metalness={0.7} roughness={0.18} />
        </mesh>
      )}

      {isPanda && (
        <>
          <mesh position={[-0.18, 0.055, 0.438]} scale={[1.35, 1.65, 0.45]} rotation={[0, 0, -0.28]}>
            <sphereGeometry args={[0.135, 16, 16]} />
            <meshStandardMaterial color="#111827" roughness={0.5} />
          </mesh>
          <mesh position={[0.18, 0.055, 0.438]} scale={[1.35, 1.65, 0.45]} rotation={[0, 0, 0.28]}>
            <sphereGeometry args={[0.135, 16, 16]} />
            <meshStandardMaterial color="#111827" roughness={0.5} />
          </mesh>
        </>
      )}

      <group ref={eyeRef}>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * eyeX, 0.065, eyeZ]} scale={eyeScale}>
            {!isAlien && !isRobot && (
              <mesh>
                <sphereGeometry args={[0.108, 16, 16]} />
                <meshStandardMaterial color="#F8FAFC" roughness={0.18} />
              </mesh>
            )}
            <mesh position={[side * 0.006, -0.006, 0.052]}>
              <sphereGeometry args={[isAlien ? 0.105 : isRobot ? 0.082 : 0.072, 16, 16]} />
              <meshBasicMaterial color={isRobot ? accentColor : '#111827'} toneMapped={false} />
            </mesh>
            {!simplified && (
              <>
                <EyeHighlight position={[-0.018, 0.026, 0.112]} scale={isAlien ? 1.22 : 1} />
                <EyeHighlight position={[0.026, -0.022, 0.108]} scale={0.48} />
              </>
            )}
          </group>
        ))}
      </group>

      {!simplified && (
        <>
          {!isRobot && !isAlien && (
            <>
              <mesh position={[-0.17, 0.225, eyeZ + 0.004]} rotation={[0, 0, -0.13]}>
                <capsuleGeometry args={[0.018, 0.105, 3, 8]} />
                <meshBasicMaterial color={avatarType === 'Panda' ? '#111827' : secondaryColor} />
              </mesh>
              <mesh position={[0.17, 0.225, eyeZ + 0.004]} rotation={[0, 0, 0.13]}>
                <capsuleGeometry args={[0.018, 0.105, 3, 8]} />
                <meshBasicMaterial color={avatarType === 'Panda' ? '#111827' : secondaryColor} />
              </mesh>
            </>
          )}

          <mesh position={[-0.31, -0.085, eyeZ - 0.005]} scale={[1.5, 0.72, 0.3]}>
            <sphereGeometry args={[0.066, 12, 12]} />
            <meshBasicMaterial color="#FF87B7" transparent opacity={0.62} />
          </mesh>
          <mesh position={[0.31, -0.085, eyeZ - 0.005]} scale={[1.5, 0.72, 0.3]}>
            <sphereGeometry args={[0.066, 12, 12]} />
            <meshBasicMaterial color="#FF87B7" transparent opacity={0.62} />
          </mesh>
        </>
      )}

      {avatarType === 'Cat' && !simplified && (
        <>
          <mesh position={[0, -0.065, 0.508]} scale={[1.15, 0.72, 0.5]}>
            <sphereGeometry args={[0.058, 12, 12]} />
            <meshStandardMaterial color="#6B2737" />
          </mesh>
          {[-1, 1].flatMap((side) =>
            [-0.035, 0.035].map((offset) => (
              <mesh
                key={`${side}-${offset}`}
                position={[side * 0.26, -0.09 + offset, 0.493]}
                rotation={[0, 0, side * (0.08 + offset)]}
              >
                <boxGeometry args={[0.24, 0.012, 0.012]} />
                <meshBasicMaterial color="#4A2731" />
              </mesh>
            ))
          )}
        </>
      )}

      {avatarType === 'Dinosaur' && (
        <group position={[0, -0.105, 0.43]}>
          <mesh position={[0, 0, 0.12]} scale={[1.35, 0.72, 0.72]}>
            <sphereGeometry args={[0.205, 16, 16]} />
            <meshStandardMaterial color={accentColor} roughness={0.42} />
          </mesh>
          {!simplified && (
            <>
              <mesh position={[-0.075, 0.055, 0.275]}>
                <sphereGeometry args={[0.018, 8, 8]} />
                <meshBasicMaterial color="#153528" />
              </mesh>
              <mesh position={[0.075, 0.055, 0.275]}>
                <sphereGeometry args={[0.018, 8, 8]} />
                <meshBasicMaterial color="#153528" />
              </mesh>
              <mesh position={[0, -0.1, 0.276]} scale={[1.6, 0.6, 0.4]}>
                <sphereGeometry args={[0.055, 10, 10]} />
                <meshBasicMaterial color="#421C2B" />
              </mesh>
              <mesh position={[-0.065, -0.115, 0.29]} rotation={[0, 0, 0.15]}>
                <coneGeometry args={[0.026, 0.085, 8]} />
                <meshStandardMaterial color="#FFFFFF" />
              </mesh>
              <mesh position={[0.065, -0.115, 0.29]} rotation={[0, 0, -0.15]}>
                <coneGeometry args={[0.026, 0.085, 8]} />
                <meshStandardMaterial color="#FFFFFF" />
              </mesh>
            </>
          )}
        </group>
      )}

      {avatarType === 'Bunny' && !simplified && (
        <>
          <mesh position={[0, -0.055, 0.51]} scale={[1.1, 0.72, 0.5]}>
            <sphereGeometry args={[0.05, 10, 10]} />
            <meshStandardMaterial color="#FF82B2" />
          </mesh>
          <mesh position={[-0.035, -0.165, 0.515]}>
            <boxGeometry args={[0.06, 0.11, 0.035]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0.035, -0.165, 0.515]}>
            <boxGeometry args={[0.06, 0.11, 0.035]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
        </>
      )}

      {!simplified && avatarType !== 'Dinosaur' && avatarType !== 'Bunny' && avatarType !== 'Cat' && (
        <group position={[0, -0.145, isRobot ? 0.444 : 0.495]}>
          <mesh scale={[1.45, 0.72, 0.35]}>
            <sphereGeometry args={[0.072, 12, 12]} />
            <meshBasicMaterial color="#541C36" />
          </mesh>
          <mesh position={[0, -0.02, 0.022]} scale={[1.2, 0.52, 0.3]}>
            <sphereGeometry args={[0.052, 10, 10]} />
            <meshBasicMaterial color="#FF6B9D" />
          </mesh>
        </group>
      )}

      {!simplified && avatarType === 'Girl' && (
        <mesh position={[0.39, 0.02, 0.33]}>
          <sphereGeometry args={[0.04, 10, 10]} />
          <meshBasicMaterial color={accentColor} toneMapped={false} />
        </mesh>
      )}

      {!simplified && avatarType === 'Boy' && (
        <mesh position={[-0.4, 0.015, 0.31]}>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshBasicMaterial color={accentColor} toneMapped={false} />
        </mesh>
      )}

      {!simplified && avatarType === 'Panda' && (
        <mesh position={[0, -0.07, 0.492]} scale={[1.45, 0.82, 0.55]}>
          <sphereGeometry args={[0.095, 12, 12]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.45} />
        </mesh>
      )}

      {!simplified && avatarType === 'Alien' && (
        <mesh position={[0, -0.17, 0.49]} scale={[1.35, 0.5, 0.35]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshBasicMaterial color={primaryColor} />
        </mesh>
      )}
    </group>
  );
};


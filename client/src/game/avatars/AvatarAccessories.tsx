import React from 'react';
import * as THREE from 'three';
import { AvatarType, AvatarCustomization } from '../../../../shared/types';
import { resolveColor, HAIR_COLORS } from './avatarCosmetics';

interface AvatarAccessoriesProps {
  avatarType: AvatarType;
  avatarConfig?: AvatarCustomization;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  simplified?: boolean;
  accessoryRef: React.RefObject<THREE.Group>;
}

export const AvatarAccessories: React.FC<AvatarAccessoriesProps> = React.memo(({
  avatarType,
  avatarConfig,
  primaryColor,
  secondaryColor,
  accentColor,
  simplified = false,
  accessoryRef
}) => {
  const hairStyle = avatarConfig?.hairStyle || 'default';
  const resolvedHairColor = avatarConfig ? resolveColor(HAIR_COLORS, avatarConfig.hairColor, secondaryColor) : secondaryColor;

  let isBoy = avatarType === 'Boy';
  let isGirl = avatarType === 'Girl';
  let isRobot = avatarType === 'Robot';
  let isAlien = avatarType === 'Alien';
  let isPanda = avatarType === 'Panda';
  let isCat = avatarType === 'Cat';
  let isBunny = avatarType === 'Bunny';
  let isDinosaur = avatarType === 'Dinosaur';

  if (hairStyle !== 'default') {
    isBoy = isGirl = isRobot = isAlien = isPanda = isCat = isBunny = isDinosaur = false;
    if (hairStyle === 'spiky') isBoy = true;
    if (hairStyle === 'cute') isGirl = true;
    if (hairStyle === 'dj') { isBoy = true; isPanda = true; }
  }

  return (
    <group ref={accessoryRef}>
      {isBoy && (
        <>
          {hairStyle !== 'dj' && (
            <mesh position={[0, 0.37, -0.03]} scale={[1.02, 0.62, 0.96]}>
              <sphereGeometry args={[0.5, simplified ? 12 : 20, simplified ? 12 : 20]} />
              <meshStandardMaterial color={resolvedHairColor} roughness={0.36} />
            </mesh>
          )}
        {[-0.28, -0.08, 0.15, 0.34].map((x, index) => (
          <mesh key={x} position={[x, 0.5 - Math.abs(x) * 0.2, 0.2]} rotation={[0.15, 0, -0.55 + index * 0.22]}>
            <coneGeometry args={[0.105, 0.3 + index * 0.018, 8]} />
            <meshStandardMaterial color={index % 2 ? primaryColor : secondaryColor} roughness={0.3} />
          </mesh>
        ))}
        {!simplified && (
          <>
            <mesh position={[0, 0.36, 0.01]}>
              <torusGeometry args={[0.43, 0.035, 8, 24, Math.PI]} />
              <meshStandardMaterial color="#10182F" metalness={0.55} roughness={0.24} />
            </mesh>
            {[-1, 1].map((side) => (
              <group key={side} position={[side * 0.47, 0.17, 0]}>
                <mesh rotation={[0, Math.PI / 2, 0]}>
                  <cylinderGeometry args={[0.12, 0.12, 0.07, 16]} />
                  <meshStandardMaterial color="#111827" metalness={0.45} />
                </mesh>
                <mesh position={[side * 0.04, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                  <cylinderGeometry args={[0.072, 0.072, 0.012, 16]} />
                  <meshBasicMaterial color={accentColor} toneMapped={false} />
                </mesh>
              </group>
            ))}
          </>
        )}
      </>
    )}

    {isGirl && (
      <>
        <mesh position={[0, 0.15, -0.2]} scale={[1.04, 1.08, 0.78]}>
          <sphereGeometry args={[0.47, simplified ? 12 : 20, simplified ? 12 : 20]} />
          <meshStandardMaterial color={secondaryColor} roughness={0.34} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.39, 0.4, -0.04]}>
            <mesh>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial color={primaryColor} roughness={0.32} />
            </mesh>
            {!simplified && (
              <mesh position={[0, 0, 0.17]} rotation={[0.3, 0.1, side * 0.45]}>
                <octahedronGeometry args={[0.075]} />
                <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={0.32} />
              </mesh>
            )}
          </group>
        ))}
        <mesh position={[0, 0.42, 0.1]} scale={[1.03, 0.45, 0.86]}>
          <sphereGeometry args={[0.48, 18, 18]} />
          <meshStandardMaterial color={primaryColor} roughness={0.32} />
        </mesh>
      </>
    )}

    {isRobot && (
      <>
        <mesh position={[0, 0.57, 0]}>
          <cylinderGeometry args={[0.026, 0.026, 0.31, 8]} />
          <meshStandardMaterial color={secondaryColor} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.76, 0]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial color={accentColor} toneMapped={false} />
        </mesh>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.51, 0.06, 0]}>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <cylinderGeometry args={[0.15, 0.15, 0.1, 12]} />
              <meshStandardMaterial color={secondaryColor} metalness={0.72} roughness={0.2} />
            </mesh>
            {!simplified && (
              <mesh position={[side * 0.058, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
                <cylinderGeometry args={[0.075, 0.075, 0.014, 12]} />
                <meshBasicMaterial color={primaryColor} toneMapped={false} />
              </mesh>
            )}
          </group>
        ))}
      </>
    )}

    {isPanda && (
      <>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.37, 0.38, -0.02]}>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color="#111827" roughness={0.52} />
          </mesh>
        ))}
      </>
    )}

    {isAlien && (
      <>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.18, 0.43, 0]} rotation={[0, 0, -side * 0.22]}>
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.018, 0.028, 0.32, 8]} />
              <meshStandardMaterial color={secondaryColor} roughness={0.32} />
            </mesh>
            <mesh position={[0, 0.34, 0]}>
              <sphereGeometry args={[0.085, 12, 12]} />
              <meshBasicMaterial color={accentColor} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </>
    )}

    {isCat && (
      <>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.29, 0.43, -0.015]} rotation={[0, 0, -side * 0.18]}>
            <mesh>
              <coneGeometry args={[0.19, 0.36, 4]} />
              <meshStandardMaterial color={primaryColor} roughness={0.42} />
            </mesh>
            {!simplified && (
              <mesh position={[0, -0.015, 0.055]} scale={[0.62, 0.65, 0.42]}>
                <coneGeometry args={[0.15, 0.29, 4]} />
                <meshStandardMaterial color="#FF9FB8" roughness={0.45} />
              </mesh>
            )}
          </group>
        ))}
      </>
    )}

    {isBunny && (
      <>
        {[-1, 1].map((side) => (
          <group key={side} position={[side * 0.2, 0.65, -0.03]} rotation={[0, 0, side * 0.09]}>
            <mesh scale={[0.72, 1.45, 0.68]}>
              <capsuleGeometry args={[0.115, 0.43, 5, 12]} />
              <meshStandardMaterial color={secondaryColor} roughness={0.42} />
            </mesh>
            {!simplified && (
              <mesh position={[0, 0.02, 0.075]} scale={[0.42, 1.2, 0.24]}>
                <capsuleGeometry args={[0.09, 0.36, 4, 10]} />
                <meshStandardMaterial color="#FF8CC6" roughness={0.42} />
              </mesh>
            )}
          </group>
        ))}
      </>
    )}

    {isDinosaur && (
      <>
        {[-0.28, 0, 0.28].map((y, index) => (
          <mesh key={y} position={[0, 0.34 - index * 0.19, -0.42]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.11 - index * 0.012, 0.25, 6]} />
            <meshStandardMaterial color={accentColor} emissive={accentColor} emissiveIntensity={simplified ? 0.08 : 0.2} />
          </mesh>
        ))}
      </>
    )}
  </group>
  );
});

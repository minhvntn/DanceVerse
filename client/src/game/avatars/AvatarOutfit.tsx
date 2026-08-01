import React from 'react';
import { AvatarType } from '../../types';

interface AvatarOutfitProps {
  avatarType: AvatarType;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  simplified?: boolean;
}

const GlowMaterial: React.FC<{ color: string; intensity?: number }> = ({ color, intensity = 0.4 }) => (
  <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} toneMapped={false} />
);

export const AvatarOutfit: React.FC<AvatarOutfitProps> = ({
  avatarType,
  primaryColor,
  secondaryColor,
  accentColor,
  simplified = false
}) => (
  <group>
    {avatarType === 'Boy' && (
      <>
        <mesh position={[-0.16, 0.015, 0.3]} rotation={[0, 0, -0.035]}>
          <boxGeometry args={[0.18, 0.5, 0.035]} />
          <meshStandardMaterial color={primaryColor} roughness={0.34} />
        </mesh>
        <mesh position={[0.16, 0.015, 0.3]} rotation={[0, 0, 0.035]}>
          <boxGeometry args={[0.18, 0.5, 0.035]} />
          <meshStandardMaterial color={primaryColor} roughness={0.34} />
        </mesh>
        {!simplified && (
          <>
            <mesh position={[0, 0.02, 0.328]} rotation={[0, 0, -0.35]}>
              <boxGeometry args={[0.06, 0.25, 0.024]} />
              <GlowMaterial color={accentColor} intensity={0.7} />
            </mesh>
            <mesh position={[0.04, -0.04, 0.35]} rotation={[0, 0, 0.35]}>
              <boxGeometry args={[0.06, 0.18, 0.024]} />
              <GlowMaterial color={accentColor} intensity={0.7} />
            </mesh>
          </>
        )}
      </>
    )}

    {avatarType === 'Girl' && (
      <>
        <mesh position={[0, -0.31, 0]}>
          <cylinderGeometry args={[0.43, 0.3, 0.25, 20]} />
          <meshStandardMaterial color={primaryColor} roughness={0.36} />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <torusGeometry args={[0.315, 0.035, 8, 20]} />
          <GlowMaterial color={accentColor} intensity={0.55} />
        </mesh>
        {!simplified && (
          <mesh position={[0, 0.05, 0.332]} rotation={[0, 0, Math.PI / 4]}>
            <octahedronGeometry args={[0.085]} />
            <GlowMaterial color={accentColor} intensity={0.65} />
          </mesh>
        )}
      </>
    )}

    {avatarType === 'Robot' && (
      <>
        <mesh position={[0, 0.045, 0.32]}>
          <boxGeometry args={[0.36, 0.29, 0.055]} />
          <meshStandardMaterial color="#10182F" metalness={0.7} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.045, 0.352]}>
          <boxGeometry args={[0.25, 0.13, 0.018]} />
          <GlowMaterial color={primaryColor} intensity={0.85} />
        </mesh>
        {!simplified && [-0.075, 0, 0.075].map((x, index) => (
          <mesh key={x} position={[x, 0.045, 0.368]} scale={[1, 0.45 + index * 0.3, 1]}>
            <boxGeometry args={[0.032, 0.1, 0.014]} />
            <meshBasicMaterial color={index === 1 ? accentColor : secondaryColor} toneMapped={false} />
          </mesh>
        ))}
      </>
    )}

    {avatarType === 'Panda' && (
      <>
        <mesh position={[0, -0.025, 0.29]} scale={[1.45, 1.55, 0.45]}>
          <sphereGeometry args={[0.19, 16, 16]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.5} />
        </mesh>
        {!simplified && (
          <>
            <mesh position={[-0.18, 0.16, 0.318]} rotation={[0, 0, 0.55]}>
              <capsuleGeometry args={[0.027, 0.12, 3, 8]} />
              <meshStandardMaterial color={accentColor} />
            </mesh>
            <mesh position={[0.18, 0.16, 0.318]} rotation={[0, 0, -0.55]}>
              <capsuleGeometry args={[0.027, 0.12, 3, 8]} />
              <meshStandardMaterial color={accentColor} />
            </mesh>
          </>
        )}
      </>
    )}

    {avatarType === 'Alien' && (
      <>
        <mesh position={[0, 0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.055, 8, 20]} />
          <GlowMaterial color={accentColor} intensity={0.65} />
        </mesh>
        <mesh position={[0, 0.015, 0.326]}>
          <boxGeometry args={[0.28, 0.28, 0.035]} />
          <meshStandardMaterial color="#10283A" metalness={0.25} />
        </mesh>
        {!simplified && (
          <mesh position={[0, 0.015, 0.349]}>
            <circleGeometry args={[0.072, 16]} />
            <GlowMaterial color={primaryColor} intensity={0.75} />
          </mesh>
        )}
      </>
    )}

    {avatarType === 'Cat' && (
      <>
        <mesh position={[0, 0.08, 0.327]}>
          <boxGeometry args={[0.055, 0.42, 0.03]} />
          <GlowMaterial color={accentColor} intensity={0.45} />
        </mesh>
        {!simplified && (
          <>
            <mesh position={[-0.115, 0.19, 0.342]} rotation={[0, 0, 0.55]}>
              <capsuleGeometry args={[0.025, 0.12, 3, 8]} />
              <meshStandardMaterial color={accentColor} />
            </mesh>
            <mesh position={[0.115, 0.19, 0.342]} rotation={[0, 0, -0.55]}>
              <capsuleGeometry args={[0.025, 0.12, 3, 8]} />
              <meshStandardMaterial color={accentColor} />
            </mesh>
          </>
        )}
      </>
    )}

    {avatarType === 'Bunny' && (
      <>
        <mesh position={[-0.09, 0.12, 0.345]} rotation={[0, 0, -0.55]} scale={[1.2, 0.72, 0.55]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <GlowMaterial color={primaryColor} intensity={0.35} />
        </mesh>
        <mesh position={[0.09, 0.12, 0.345]} rotation={[0, 0, 0.55]} scale={[1.2, 0.72, 0.55]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <GlowMaterial color={primaryColor} intensity={0.35} />
        </mesh>
        {!simplified && (
          <mesh position={[0, 0.12, 0.37]}>
            <sphereGeometry args={[0.06, 10, 10]} />
            <meshStandardMaterial color={accentColor} />
          </mesh>
        )}
      </>
    )}

    {avatarType === 'Dinosaur' && (
      <>
        <mesh position={[0, -0.015, 0.29]} scale={[1.35, 1.62, 0.45]}>
          <sphereGeometry args={[0.18, 16, 16]} />
          <meshStandardMaterial color={accentColor} roughness={0.48} />
        </mesh>
        {!simplified && (
          <mesh position={[0, 0.11, 0.342]}>
            <boxGeometry args={[0.19, 0.055, 0.025]} />
            <GlowMaterial color={primaryColor} intensity={0.5} />
          </mesh>
        )}
      </>
    )}

    {!simplified && avatarType !== 'Robot' && (
      <mesh position={[0, -0.275, 0.315]}>
        <boxGeometry args={[0.34, 0.05, 0.035]} />
        <GlowMaterial color={primaryColor} intensity={0.4} />
      </mesh>
    )}
  </group>
);


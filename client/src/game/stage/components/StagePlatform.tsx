import React from 'react';
import { Box } from '@react-three/drei';

export const StagePlatform: React.FC = () => {
  return (
    <group position={[0, 0, -18]}>
      {/* Base Level (Lowest) */}
      <mesh castShadow receiveShadow position={[0, 0.4, 3]}>
        <boxGeometry args={[44, 0.8, 12]} />
        <meshStandardMaterial color="#0A0A10" roughness={0.1} metalness={0.9} />
      </mesh>
      {/* Base Level Neon Trim */}
      <mesh position={[0, 0.8, 8.95]}>
        <boxGeometry args={[44, 0.1, 0.1]} />
        <meshBasicMaterial color="#00F0FF" />
      </mesh>

      {/* Mid Level */}
      <mesh castShadow receiveShadow position={[0, 1.2, -1]}>
        <boxGeometry args={[36, 0.8, 10]} />
        <meshStandardMaterial color="#0A0A10" roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Mid Level Neon Trim */}
      <mesh position={[0, 1.6, 3.95]}>
        <boxGeometry args={[36, 0.1, 0.1]} />
        <meshBasicMaterial color="#FF007F" />
      </mesh>

      {/* Top Level (DJ Area) */}
      <mesh castShadow receiveShadow position={[0, 2.0, -4]}>
        <boxGeometry args={[20, 0.8, 8]} />
        <meshStandardMaterial color="#0A0A10" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Top Level Neon Trim */}
      <mesh position={[0, 2.4, -0.05]}>
        <boxGeometry args={[20, 0.1, 0.1]} />
        <meshBasicMaterial color="#9D00FF" />
      </mesh>

      {/* Steps to Mid Level */}
      <group position={[0, 0.4, 4]}>
        <mesh position={[0, 0.4, -0.5]}>
          <boxGeometry args={[12, 0.8, 1]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0, 0.8, -0.5]}>
           <boxGeometry args={[12, 0.05, 1]} />
           <meshBasicMaterial color="#FF007F" />
        </mesh>
      </group>
    </group>
  );
};

import React, { useMemo } from 'react';
import * as THREE from 'three';

export const StageTruss: React.FC = () => {
  const trussMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#222', metalness: 0.8, roughness: 0.3 }), []);

  return (
    <group position={[0, 16, -18]}>
      {/* Top horizontal beam */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[44, 0.4, 0.4]} />
        <primitive object={trussMaterial} attach="material" />
      </mesh>
      
      {/* Front horizontal beam */}
      <mesh position={[0, -0.4, 4]}>
        <boxGeometry args={[44, 0.4, 0.4]} />
        <primitive object={trussMaterial} attach="material" />
      </mesh>

      {/* Crossbeams for front to back */}
      {[...Array(12)].map((_, i) => (
        <mesh key={`cross-${i}`} position={[-22 + i * 4, -0.2, 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 4]} />
          <primitive object={trussMaterial} attach="material" />
        </mesh>
      ))}

      {/* Left Pillar */}
      <group position={[-21.8, -8, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.4, 16, 0.4]} />
          <primitive object={trussMaterial} attach="material" />
        </mesh>
        <mesh position={[0, 0, 4]}>
          <boxGeometry args={[0.4, 16, 0.4]} />
          <primitive object={trussMaterial} attach="material" />
        </mesh>
        {/* Support braces */}
        {[...Array(8)].map((_, i) => (
          <mesh key={`l-brace-${i}`} position={[0, -7 + i * 2, 2]} rotation={[Math.PI / 4, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 5.6]} />
            <primitive object={trussMaterial} attach="material" />
          </mesh>
        ))}
      </group>

      {/* Right Pillar */}
      <group position={[21.8, -8, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.4, 16, 0.4]} />
          <primitive object={trussMaterial} attach="material" />
        </mesh>
        <mesh position={[0, 0, 4]}>
          <boxGeometry args={[0.4, 16, 0.4]} />
          <primitive object={trussMaterial} attach="material" />
        </mesh>
        {/* Support braces */}
        {[...Array(8)].map((_, i) => (
          <mesh key={`r-brace-${i}`} position={[0, -7 + i * 2, 2]} rotation={[-Math.PI / 4, 0, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 5.6]} />
            <primitive object={trussMaterial} attach="material" />
          </mesh>
        ))}
      </group>
    </group>
  );
};

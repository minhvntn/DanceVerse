import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface StageLasersProps {
  energy: number;
  isPlaying: boolean;
}

export const StageLasers: React.FC<StageLasersProps> = ({ energy, isPlaying }) => {
  const leftGroupRef = useRef<THREE.Group>(null);
  const rightGroupRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    if (!leftGroupRef.current || !rightGroupRef.current) return;
    const time = clock.getElapsedTime();
    const speed = isPlaying ? 2 + energy * 4 : 0.5;

    // Laser sweep logic (rotation around Z axis primarily, but also some X)
    const sweepLeft = Math.sin(time * speed) * 1.5;
    const sweepRight = Math.sin(time * speed + Math.PI) * 1.5; // Opposite sweep
    
    // Additional chaotic tilt if energy is very high
    const tilt = energy > 0.7 ? Math.cos(time * speed * 2) * 0.5 : 0;

    leftGroupRef.current.rotation.z = sweepLeft;
    leftGroupRef.current.rotation.x = tilt + 0.5; // Base tilt forward
    
    rightGroupRef.current.rotation.z = sweepRight;
    rightGroupRef.current.rotation.x = tilt + 0.5;

    // Pulse opacity and colors
    const materialOpacity = isPlaying ? 0.4 + (energy * 0.4) : 0.1;
    
    // Update materials of children
    leftGroupRef.current.children.forEach((mesh, i) => {
      const mat = (mesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = materialOpacity;
      if (energy > 0.8) {
        mat.color.setHSL((time * 0.5 + i * 0.1) % 1, 1, 0.5);
      }
    });

    rightGroupRef.current.children.forEach((mesh, i) => {
      const mat = (mesh as THREE.Mesh).material as THREE.MeshBasicMaterial;
      mat.opacity = materialOpacity;
      if (energy > 0.8) {
        mat.color.setHSL((time * 0.5 + i * 0.1 + 0.5) % 1, 1, 0.5);
      }
    });
  });

  // Generate 5 lasers per side in a fan array
  const renderLaserArray = (color: string) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <mesh key={i} position={[0, -10, 0]} rotation={[0, 0, (i - 2) * 0.2]}>
        {/* Very long thin cylinder */}
        <cylinderGeometry args={[0.05, 0.5, 40, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    ));
  };

  return (
    <>
      <group position={[-14, 2, -18]}>
        <group ref={leftGroupRef}>
          {renderLaserArray('#00ffff')}
        </group>
      </group>

      <group position={[14, 2, -18]}>
        <group ref={rightGroupRef}>
          {renderLaserArray('#ff00ff')}
        </group>
      </group>
    </>
  );
};

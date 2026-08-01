import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConcertVisualState, getStageDensity, STAGE_COLORS } from '../stageVisuals';

interface SkyEffectsProps {
  visualState: ConcertVisualState;
  enabled: boolean;
}

export const SkyEffects: React.FC<SkyEffectsProps> = ({ visualState, enabled }) => {
  const ringsRef = useRef<THREE.Group>(null);
  const dustRef = useRef<THREE.Points>(null);
  const dustCount = getStageDensity(visualState.quality).dust;
  const dustPositions = useMemo(() => {
    const positions = new Float32Array(dustCount * 3);
    for (let index = 0; index < dustCount; index += 1) {
      positions[index * 3] = Math.sin(index * 12.17) * 38;
      positions[index * 3 + 1] = 3 + ((index * 7.31) % 24);
      positions[index * 3 + 2] = -32 + ((index * 5.73) % 66);
    }
    return positions;
  }, [dustCount]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (ringsRef.current) {
      ringsRef.current.rotation.z = Math.sin(time * 0.11) * 0.06;
      ringsRef.current.rotation.y = Math.sin(time * 0.08) * 0.08;
      ringsRef.current.children.forEach((ring, index) => {
        ring.rotation.z = time * (index % 2 === 0 ? 0.035 : -0.028) + index;
      });
    }
    if (dustRef.current) {
      dustRef.current.rotation.y = time * 0.012;
      const material = dustRef.current.material as THREE.PointsMaterial;
      material.opacity = enabled ? 0.28 + visualState.energy * 0.22 : 0.08;
    }
  });

  return (
    <group>
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[88, 24, 16]} />
        <meshBasicMaterial color="#02030D" side={THREE.BackSide} fog={false} />
      </mesh>
      <mesh position={[0, 12, -47]}>
        <planeGeometry args={[110, 42]} />
        <meshBasicMaterial color="#080B2C" transparent opacity={0.72} depthWrite={false} />
      </mesh>
      <mesh position={[0, 4.5, -45]}>
        <planeGeometry args={[100, 12]} />
        <meshBasicMaterial color="#170A38" transparent opacity={0.34 + visualState.energy * 0.15} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {enabled && (
        <>
          <group ref={ringsRef} position={[0, 17.5, -29]} scale={[1.15, 1, 1]}>
            {[13.5, 18.5, 24].map((radius, index) => (
              <mesh key={radius} rotation={[0, 0, index * 0.7]}>
                <torusGeometry args={[radius, visualState.quality === 'low' ? 0.08 : 0.13, 7, visualState.quality === 'high' ? 96 : 56]} />
                <meshBasicMaterial color={STAGE_COLORS[index % STAGE_COLORS.length]} transparent opacity={0.24 + visualState.energy * 0.28} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
              </mesh>
            ))}
          </group>

          <points ref={dustRef}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
            </bufferGeometry>
            <pointsMaterial color="#BFEFFF" size={visualState.quality === 'high' ? 0.16 : 0.12} transparent opacity={0.4} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </points>

          {[-1, 1].map((side) => (
            <group key={side} position={[side * 28, 15, -30]} rotation={[0, 0, side * -0.52]}>
              <mesh position={[0, -12, 0]}>
                <coneGeometry args={[7, 25, 20, 1, true]} />
                <meshBasicMaterial color={side < 0 ? '#FF007F' : '#00F0FF'} transparent opacity={visualState.quality === 'low' ? 0.018 : 0.035 + visualState.energy * 0.018} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </>
      )}
    </group>
  );
};

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ConcertVisualState } from '../../stageVisuals';

interface StageUplightProps {
  position: [number, number, number];
  color: string;
  visualState: ConcertVisualState;
  intensityMultiplier?: number;
  useRealLight?: boolean;
  fanAngle?: number; // tilt in radians
  isFanEnabled?: boolean;
}

export const StageUplight: React.FC<StageUplightProps> = ({
  position,
  color,
  visualState,
  intensityMultiplier = 1.0,
  useRealLight = false,
  fanAngle = 0,
  isFanEnabled = false
}) => {
  const beamRef = useRef<THREE.MeshBasicMaterial>(null);
  const emissiveRef = useRef<THREE.MeshStandardMaterial>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);

  // Group rotation for fan effect
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    // Determine target rotation based on fan mode
    if (groupRef.current) {
      const targetZ = isFanEnabled ? fanAngle : 0;
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetZ, 0.1);
    }

    const baseIntensity = visualState.isPlaying 
      ? 0.2 + (visualState.energy * 0.8)
      : 0.1;
      
    // Flash full on drops
    const intensity = visualState.isBeatDrop ? 1.0 : baseIntensity;
    const finalIntensity = intensity * intensityMultiplier;

    if (beamRef.current) {
      beamRef.current.opacity = finalIntensity * 0.4;
    }
    
    if (emissiveRef.current) {
      emissiveRef.current.emissiveIntensity = finalIntensity * 2.0;
    }

    if (spotLightRef.current) {
      spotLightRef.current.intensity = finalIntensity * 50;
    }
  });

  return (
    <group position={position} ref={groupRef}>
      {/* Base fixture */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.1, 16]} />
        <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
      </mesh>
      
      {/* Emissive lens */}
      <mesh position={[0, 0.11, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.02, 16]} />
        <meshStandardMaterial 
          ref={emissiveRef}
          color="#000" 
          emissive={color} 
          toneMapped={false}
        />
      </mesh>

      {/* Fake volumetric beam */}
      <mesh position={[0, 10, 0]}>
        {/* A tall cylinder tapering at the top */}
        <cylinderGeometry args={[1.5, 0.25, 20, 16, 1, true]} />
        <meshBasicMaterial 
          ref={beamRef}
          color={color}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Optional real spot light */}
      {useRealLight && (
        <spotLight
          ref={spotLightRef}
          position={[0, 0.2, 0]}
          angle={Math.PI / 6}
          penumbra={0.8}
          color={color}
          intensity={0}
          distance={30}
          castShadow={false}
        />
      )}
    </group>
  );
};

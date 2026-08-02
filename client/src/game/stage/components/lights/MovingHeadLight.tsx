import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MovingLightController } from './MovingLightController';

interface MovingHeadLightProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  index: number;
  totalFixtures: number;
  enableRealLight: boolean;
  baseColor?: string;
  defaultLensColor?: string;
}

export const MovingHeadLight: React.FC<MovingHeadLightProps> = ({
  position,
  rotation = [0, 0, 0],
  index,
  totalFixtures,
  enableRealLight,
  baseColor = '#07090F',
  defaultLensColor = '#FFFFFF'
}) => {
  const yokeRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const lensMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const beamMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const spotLightTargetRef = useRef<THREE.Object3D>(null);

  // Initial vectors for target positioning
  const vPos = new THREE.Vector3(...position);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const { pan, tilt } = MovingLightController.getFixtureAngles(index, totalFixtures, time, vPos);
    const { color, intensity } = MovingLightController.state;
    
    // Smooth damping
    if (yokeRef.current) {
      yokeRef.current.rotation.y = THREE.MathUtils.damp(yokeRef.current.rotation.y, pan, 8, 0.016);
    }
    
    if (headRef.current) {
      headRef.current.rotation.x = THREE.MathUtils.damp(headRef.current.rotation.x, tilt, 8, 0.016);
    }

    if (lensMatRef.current) {
      lensMatRef.current.color.set(color);
      // Base glow even when off
      lensMatRef.current.opacity = 0.2 + intensity * 0.8;
    }

    if (beamMatRef.current) {
      beamMatRef.current.color.set(color);
      beamMatRef.current.opacity = intensity * 0.15;
    }

    if (spotLightRef.current && spotLightTargetRef.current && headRef.current) {
      spotLightRef.current.color.set(color);
      spotLightRef.current.intensity = intensity * 3.0; // Boost real light
      
      // Update target based on head's world direction
      const headDir = new THREE.Vector3(0, 0, 1);
      headDir.applyEuler(headRef.current.rotation);
      
      if (yokeRef.current) {
         headDir.applyEuler(yokeRef.current.rotation);
      }
      
      // Also apply base rotation
      const baseEuler = new THREE.Euler(...rotation);
      headDir.applyEuler(baseEuler);

      spotLightTargetRef.current.position.copy(vPos).add(headDir.multiplyScalar(10));
      
      // Ensure spotlight knows its target
      if (spotLightRef.current.target !== spotLightTargetRef.current) {
        spotLightRef.current.target = spotLightTargetRef.current as any;
      }
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Base */}
      <mesh castShadow>
        <cylinderGeometry args={[0.35, 0.45, 0.3, 16]} />
        <meshStandardMaterial color={baseColor} metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* Yoke (Pan) */}
      <group ref={yokeRef} position={[0, -0.2, 0]}>
        {/* Yoke Arms */}
        <mesh position={[0.4, -0.4, 0]} castShadow>
          <boxGeometry args={[0.1, 0.8, 0.3]} />
          <meshStandardMaterial color={baseColor} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[-0.4, -0.4, 0]} castShadow>
          <boxGeometry args={[0.1, 0.8, 0.3]} />
          <meshStandardMaterial color={baseColor} metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0]} castShadow>
           <cylinderGeometry args={[0.25, 0.35, 0.2, 16]} />
           <meshStandardMaterial color={baseColor} metalness={0.8} roughness={0.3} />
        </mesh>

        {/* Head (Tilt) */}
        <group ref={headRef} position={[0, -0.4, 0]}>
          <mesh castShadow rotation={[Math.PI/2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.6, 16]} />
            <meshStandardMaterial color={baseColor} metalness={0.8} roughness={0.2} />
          </mesh>
          
          {/* Lens */}
          <mesh position={[0, 0, 0.31]}>
            <circleGeometry args={[0.26, 16]} />
            <meshBasicMaterial ref={lensMatRef} color={defaultLensColor} toneMapped={false} transparent opacity={1} />
          </mesh>

          {/* Fake Beam */}
          <mesh position={[0, 0, 8.3]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[2.5, 16, 24, 1, true]} />
            <meshBasicMaterial 
              ref={beamMatRef}
              color={defaultLensColor} 
              transparent 
              opacity={0.15} 
              blending={THREE.AdditiveBlending} 
              depthWrite={false} 
              side={THREE.DoubleSide} 
              toneMapped={false} 
            />
          </mesh>

          {/* Real Light */}
          {enableRealLight && (
            <group>
              <primitive object={new THREE.Object3D()} ref={spotLightTargetRef} />
              <spotLight
                ref={spotLightRef}
                position={[0, 0, 0.3]}
                angle={0.3}
                penumbra={0.7}
                distance={40}
                decay={1.5}
                castShadow
              />
            </group>
          )}
        </group>
      </group>
    </group>
  );
};

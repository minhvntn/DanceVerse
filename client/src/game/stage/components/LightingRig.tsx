import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { ConcertVisualState, getStageDensity, STAGE_COLORS } from '../stageVisuals';

interface LightingRigProps {
  visualState: ConcertVisualState;
}

export const LightingRig: React.FC<LightingRigProps> = ({ visualState }) => {
  const { scene } = useThree();
  const fixtureRefs = useRef<THREE.Group[]>([]);
  const lightRefs = useRef<THREE.SpotLight[]>([]);
  const density = getStageDensity(visualState.quality);
  const fixturePositions = useMemo(
    () => Array.from({ length: density.movingLights }, (_, index) => -17.5 + index * (35 / Math.max(1, density.movingLights - 1))),
    [density.movingLights]
  );
  const targets = useMemo(() => fixturePositions.map(() => new THREE.Object3D()), [fixturePositions]);

  useEffect(() => {
    targets.forEach((target, index) => {
      scene.add(target);
      if (lightRefs.current[index]) lightRefs.current[index].target = target;
    });
    return () => targets.forEach((target) => scene.remove(target));
  }, [scene, targets]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const cueBoost = visualState.cueType === 'lighting' || visualState.cueType === 'fireworks';
    const speed = visualState.isPlaying ? (visualState.isBeatDrop || cueBoost ? 3.8 : 1.65) : 0.28;
    targets.forEach((target, index) => {
      const phase = index * 0.78;
      target.position.set(
        Math.sin(time * speed + phase) * 18,
        0.4 + Math.sin(time * 0.55 + phase) * 0.35,
        2 + Math.cos(time * speed * 0.66 + phase) * 15
      );
    });
    fixtureRefs.current.forEach((fixture, index) => {
      if (!fixture) return;
      fixture.rotation.z = Math.sin(time * speed + index * 0.8) * 0.56;
      fixture.rotation.x = -0.25 + Math.cos(time * speed * 0.7 + index) * 0.18;
    });
    lightRefs.current.forEach((light, index) => {
      if (!light) return;
      light.intensity = visualState.isPlaying ? 2.2 + visualState.energy * 3.2 + (cueBoost ? 1.8 : 0) : 0.35;
      light.color.set(STAGE_COLORS[index % STAGE_COLORS.length]);
    });
  });

  return (
    <group>
      <group position={[0, 15.35, -13.2]}>
        {fixturePositions.map((x, index) => {
          const color = STAGE_COLORS[index % STAGE_COLORS.length];
          return (
            <group key={x} position={[x, 0, 0]}>
              <group ref={(group) => { if (group) fixtureRefs.current[index] = group; }}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.42, 0.52, 0.8, 12]} />
                  <meshStandardMaterial color="#07090F" metalness={0.88} roughness={0.2} />
                </mesh>
                <mesh position={[0, -0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.32, 16]} />
                  <meshBasicMaterial color={color} toneMapped={false} />
                </mesh>
                {visualState.quality !== 'low' && (index % 2 === 0 || visualState.isBeatDrop) && (
                  <mesh position={[0, -6.1, 0]}>
                    <coneGeometry args={[2.35, 11.6, visualState.quality === 'high' ? 32 : 24, 1, true]} />
                    <meshBasicMaterial color={color} transparent opacity={0.022 + visualState.energy * 0.026} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
                  </mesh>
                )}
              </group>
              {index < (visualState.quality === 'high' ? 6 : visualState.quality === 'medium' ? 4 : 2) && (
                <spotLight
                  ref={(light) => { if (light) lightRefs.current[index] = light; }}
                  color={color}
                  position={[0, -0.6, 0]}
                  angle={0.28}
                  penumbra={0.72}
                  distance={48}
                  decay={1.5}
                  intensity={1}
                />
              )}
            </group>
          );
        })}
      </group>

      <group position={[0, 12.6, -24.3]}>
        {[-16, -10, -4, 4, 10, 16].map((x, index) => (
          <group key={x} position={[x, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[1.2, 0.72, 0.7]} />
              <meshStandardMaterial color="#0A0D15" metalness={0.82} roughness={0.24} />
            </mesh>
            <mesh position={[0, 0, 0.37]}>
              <planeGeometry args={[0.82, 0.36]} />
              <meshBasicMaterial color={index % 2 === 0 ? '#A8FAFF' : '#FFB0DA'} transparent opacity={visualState.isBeatDrop ? 1 : 0.28 + visualState.energy * 0.22} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>

      {[-1, 1].map((side) => (
        <React.Fragment key={side}>
          <pointLight position={[side * 18, 7, -17]} color={side < 0 ? '#FF007F' : '#00F0FF'} intensity={visualState.quality === 'low' ? 0.7 : 1.6 + visualState.energy} distance={28} decay={1.7} />
          <pointLight position={[side * 9, 4, -22]} color={side < 0 ? '#7C3AED' : '#2563EB'} intensity={visualState.quality === 'high' ? 1.3 + visualState.energy : 0.5} distance={20} decay={1.8} />
        </React.Fragment>
      ))}

      {[-12, 0, 12].map((x, index) => (
        <group key={`front-wash-${x}`} position={[x, 4.8, -7.2]}>
          <pointLight color={index === 1 ? '#D8F8FF' : index === 0 ? '#FF8DCC' : '#7DEBFF'} intensity={visualState.quality === 'low' ? 0.65 : 1.35 + visualState.energy * 0.85} distance={21} decay={1.6} />
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.28, 0.4, 0.55, 12]} />
            <meshStandardMaterial color="#0A0C14" metalness={0.82} roughness={0.24} />
          </mesh>
          <mesh position={[0, 0, -0.29]}>
            <circleGeometry args={[0.23, 16]} />
            <meshBasicMaterial color={index === 1 ? '#FFFFFF' : index === 0 ? '#FF8DCC' : '#7DEBFF'} transparent opacity={0.82} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ConcertVisualState } from '../stageVisuals';

interface SpeakerTowerProps {
  visualState: ConcertVisualState;
  position: [number, number, number];
  rotation?: [number, number, number];
  accent?: string;
  scale?: number;
}

export const SpeakerTower: React.FC<SpeakerTowerProps> = ({
  visualState,
  position,
  rotation = [0, 0, 0],
  accent = '#00F0FF',
  scale = 1
}) => {
  const cabinetRef = useRef<THREE.Group>(null);
  const coneRefs = useRef<THREE.Mesh[]>([]);
  const ringRefs = useRef<THREE.MeshBasicMaterial[]>([]);
  const coneSlots = useMemo(() => [8.6, 5.25, 1.95], []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const bass = visualState.isPlaying ? Math.abs(Math.sin(time * (visualState.isBeatDrop ? 11 : 6.2))) : 0;
    if (cabinetRef.current) {
      cabinetRef.current.position.y = bass * 0.025;
      cabinetRef.current.rotation.z = Math.sin(time * 9) * bass * 0.0025;
    }
    coneRefs.current.forEach((cone, index) => {
      if (!cone) return;
      const kick = 1 + bass * (index === 2 ? 0.075 : 0.045);
      cone.scale.set(kick, kick, 1);
    });
    ringRefs.current.forEach((ring, index) => {
      if (!ring) return;
      ring.opacity = 0.45 + visualState.energy * 0.45 + Math.sin(time * 5.5 + index) * 0.08;
    });
  });

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group ref={cabinetRef}>
        <mesh castShadow receiveShadow position={[0, 6.25, 0]}>
          <boxGeometry args={[4.75, 12.5, 3.9]} />
          <meshStandardMaterial color="#06070B" roughness={0.38} metalness={0.62} />
        </mesh>
        <mesh position={[0, 6.25, 1.98]}>
          <boxGeometry args={[4.18, 11.88, 0.12]} />
          <meshStandardMaterial color="#0B0D12" roughness={0.72} metalness={0.35} />
        </mesh>

        {coneSlots.map((y, index) => {
          const radius = index === 2 ? 1.52 : index === 1 ? 1.28 : 0.82;
          return (
            <group key={y} position={[0, y, 2.08]}>
              <mesh>
                <circleGeometry args={[radius + 0.22, 32]} />
                <meshStandardMaterial color="#020205" metalness={0.7} roughness={0.42} />
              </mesh>
              <mesh ref={(mesh) => { if (mesh) coneRefs.current[index] = mesh; }} position={[0, 0, 0.035]}>
                <circleGeometry args={[radius, 32]} />
                <meshStandardMaterial color="#11131A" emissive="#05060A" emissiveIntensity={0.2} roughness={0.8} />
              </mesh>
              <mesh position={[0, 0, 0.07]}>
                <ringGeometry args={[radius * 0.78, radius * 0.94, 32]} />
                <meshBasicMaterial ref={(material) => { if (material) ringRefs.current[index] = material; }} color={index % 2 === 0 ? accent : '#9D5CFF'} transparent opacity={0.75} toneMapped={false} />
              </mesh>
              <mesh position={[0, 0, 0.085]}>
                <circleGeometry args={[radius * 0.24, 20]} />
                <meshStandardMaterial color="#03040A" metalness={0.9} roughness={0.24} />
              </mesh>
            </group>
          );
        })}

        <group position={[0, 10.85, 2.1]}>
          <mesh>
            <boxGeometry args={[2.15, 0.9, 0.18]} />
            <meshStandardMaterial color="#05060B" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0, 0.11]}>
            <circleGeometry args={[0.32, 20]} />
            <meshBasicMaterial color="#DDFEFF" transparent opacity={0.75} toneMapped={false} />
          </mesh>
        </group>

        {([[-2.28, 6.25], [2.28, 6.25]] as Array<[number, number]>).map(([x, y]) => (
          <mesh key={x} position={[x, y, 2.08]}>
            <boxGeometry args={[0.11, 12.1, 0.13]} />
            <meshBasicMaterial color={accent} transparent opacity={0.75} toneMapped={false} />
          </mesh>
        ))}
        {[0.25, 12.25].map((y) => (
          <mesh key={y} position={[0, y, 2.08]}>
            <boxGeometry args={[4.55, 0.11, 0.13]} />
            <meshBasicMaterial color={accent} transparent opacity={0.68} toneMapped={false} />
          </mesh>
        ))}

        <mesh position={[0, 12.9, 0]}>
          <boxGeometry args={[3.2, 0.4, 2.8]} />
          <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
};

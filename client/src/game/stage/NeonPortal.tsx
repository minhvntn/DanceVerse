import React, { useMemo, useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PerformanceMode } from '../../types';

interface NeonPortalProps {
  isPlaying: boolean;
  isBeatDrop: boolean;
  performanceMode: PerformanceMode;
}

const PORTAL_COLORS = ['#00F0FF', '#8B5CF6', '#FF007F'];

export const NeonPortal: React.FC<NeonPortalProps> = ({
  isPlaying,
  isBeatDrop,
  performanceMode
}) => {
  const ringsRef = useRef<THREE.Group>(null);
  const materialRefs = useRef<THREE.MeshStandardMaterial[]>([]);

  const trussLights = useMemo(() => {
    const count = performanceMode === 'Low' ? 7 : 11;
    return Array.from({ length: count }, (_, index) => ({
      x: -15 + (30 / (count - 1)) * index,
      color: PORTAL_COLORS[index % PORTAL_COLORS.length]
    }));
  }, [performanceMode]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const pulse = isPlaying ? 1.4 + Math.sin(time * 4.5) * 0.65 : 0.7 + Math.sin(time * 0.8) * 0.15;
    const boost = isBeatDrop ? 1.5 : 1;

    materialRefs.current.forEach((material, index) => {
      if (!material) return;
      material.emissiveIntensity = pulse * boost * (1 - index * 0.08);
    });

    if (ringsRef.current) {
      ringsRef.current.rotation.z = Math.sin(time * (isPlaying ? 0.28 : 0.08)) * 0.025;
    }
  });

  return (
    <group position={[0, 8.6, -23.35]}>
      <group ref={ringsRef} scale={[1.16, 1, 1]}>
        {[10.2, 13.2, 16.2].map((radius, index) => (
          <mesh key={radius} position={[0, 0, -index * 0.35]}>
            <torusGeometry args={[radius, index === 2 ? 0.34 : 0.24, 12, 96]} />
            <meshStandardMaterial
              ref={(material) => {
                if (material) materialRefs.current[index] = material;
              }}
              color="#10172F"
              emissive={PORTAL_COLORS[index]}
              emissiveIntensity={1}
              metalness={0.75}
              roughness={0.2}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      {/* Overhead truss */}
      <mesh position={[0, 8.2, 0.8]} castShadow>
        <boxGeometry args={[34, 0.42, 0.42]} />
        <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[0, 7.35, 0.8]} castShadow>
        <boxGeometry args={[32, 0.24, 0.24]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.18} />
      </mesh>

      {trussLights.map((light, index) => (
        <group key={light.x} position={[light.x, 7.55, 1]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.3, 0.5, 10]} />
            <meshStandardMaterial color="#060817" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.32, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.18, 12]} />
            <meshBasicMaterial color={light.color} toneMapped={false} />
          </mesh>
          {performanceMode !== 'Low' && index % 2 === 0 && (
            <pointLight color={light.color} intensity={isPlaying ? 1.8 : 0.45} distance={9} />
          )}
        </group>
      ))}

      {/* Side truss towers */}
      {[-18.8, 18.8].map((x) => (
        <group key={x} position={[x, 0, 0.5]}>
          <mesh>
            <boxGeometry args={[0.55, 16, 0.55]} />
            <meshStandardMaterial color="#1E293B" metalness={0.9} roughness={0.2} />
          </mesh>
          {[-6, -3, 0, 3, 6].map((y, index) => (
            <mesh key={y} position={[0, y, 0.35]} rotation={[0, 0, Math.PI / 4]}>
              <boxGeometry args={[0.18, 1.2, 0.18]} />
              <meshBasicMaterial color={PORTAL_COLORS[index % PORTAL_COLORS.length]} toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}

      <Html position={[0, 9.65, 1.3]} center transform distanceFactor={10} pointerEvents="none">
        <div className="select-none whitespace-nowrap rounded-2xl border border-cyan-300/60 bg-slate-950/90 px-7 py-2 text-center shadow-[0_0_32px_rgba(0,240,255,0.7)]">
          <div className="text-4xl font-black italic tracking-tight text-white drop-shadow-[0_0_12px_#ff007f]">
            DANCE <span className="text-pink-500">VERSE</span>
          </div>
          <div className="mt-1 text-sm font-black tracking-[0.55em] text-cyan-300">LIVE</div>
        </div>
      </Html>
    </group>
  );
};

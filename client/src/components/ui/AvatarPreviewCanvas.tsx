import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AvatarType } from '../../types';
import { AvatarPrimitive, AVATAR_CONFIGS } from '../../game/avatars/AvatarPrimitive';

interface AvatarPreviewCanvasProps {
  avatarType: AvatarType;
}

const PREVIEW_PARTICLES: Array<[number, number, number, number]> = [
  [-1.45, 1.9, -0.75, 0.026],
  [-1.2, 0.75, -0.35, 0.018],
  [-0.95, 2.45, -0.7, 0.022],
  [-0.62, 0.35, -0.5, 0.016],
  [0.7, 2.25, -0.65, 0.02],
  [1.03, 0.68, -0.4, 0.024],
  [1.35, 1.55, -0.7, 0.018],
  [0.45, 0.18, -0.35, 0.014]
];

export const AvatarPreviewCanvas: React.FC<AvatarPreviewCanvasProps> = ({ avatarType }) => {
  const config = AVATAR_CONFIGS[avatarType] || AVATAR_CONFIGS.Boy;

  return (
    <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden glass-panel border border-white/20 shadow-2xl">
      <Canvas
        camera={{ position: [0, 1.45, 3.35], fov: 43 }}
        shadows
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <ambientLight intensity={0.82} color="#DCE7FF" />
        <hemisphereLight color="#FFFFFF" groundColor="#30105B" intensity={0.72} />
        <pointLight position={[2.3, 2.8, 2.4]} intensity={2.1} color={config.primaryColor} />
        <pointLight position={[-2.1, 2.35, 1.8]} intensity={1.5} color="#00F0FF" />
        <pointLight position={[0, 1.7, -2]} intensity={2.4} color={config.accentColor} />
        <spotLight
          position={[0, 4.5, 2.5]}
          intensity={2.8}
          angle={0.6}
          penumbra={0.8}
          color="#FFFFFF"
          castShadow
        />

        <mesh position={[0, 1.2, -1.18]} scale={[2.35, 2.35, 1]}>
          <circleGeometry args={[1, 48]} />
          <meshBasicMaterial color={config.primaryColor} transparent opacity={0.075} depthWrite={false} />
        </mesh>
        <mesh position={[0, 1.25, -1.12]}>
          <ringGeometry args={[1.05, 1.1, 48]} />
          <meshBasicMaterial color={config.accentColor} transparent opacity={0.25} depthWrite={false} />
        </mesh>

        {PREVIEW_PARTICLES.map(([x, y, z, size], index) => (
          <mesh key={`${x}-${y}`} position={[x, y, z]}>
            <sphereGeometry args={[size, 8, 8]} />
            <meshBasicMaterial
              color={index % 2 === 0 ? config.primaryColor : config.accentColor}
              transparent
              opacity={0.72}
              toneMapped={false}
            />
          </mesh>
        ))}

        <group position={[0, -0.56, 0]}>
          <AvatarPrimitive avatarType={avatarType} isPreview scale={1.24} />

          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[1.18, 48]} />
            <meshStandardMaterial
              color="#10142D"
              emissive={config.primaryColor}
              emissiveIntensity={0.26}
              metalness={0.35}
              roughness={0.22}
            />
          </mesh>
          <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.88, 0.93, 48]} />
            <meshBasicMaterial color={config.accentColor} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.018, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.13, 1.22, 48]} />
            <meshBasicMaterial color={config.primaryColor} toneMapped={false} />
          </mesh>
        </group>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          target={[0, 0.95, 0]}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>

      <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
        <span className="px-3 py-1 rounded-full bg-slate-900/80 border border-white/10 text-xs font-semibold uppercase tracking-wider text-slate-300">
          Drag to rotate preview
        </span>
      </div>
    </div>
  );
};

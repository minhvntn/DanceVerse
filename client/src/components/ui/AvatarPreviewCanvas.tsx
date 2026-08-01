import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { AvatarType } from '../../types';
import { AvatarPrimitive, AVATAR_CONFIGS } from '../../game/avatars/AvatarPrimitive';

interface AvatarPreviewCanvasProps {
  avatarType: AvatarType;
}

export const AvatarPreviewCanvas: React.FC<AvatarPreviewCanvasProps> = ({ avatarType }) => {
  const config = AVATAR_CONFIGS[avatarType] || AVATAR_CONFIGS.Boy;

  return (
    <div className="relative w-full h-72 sm:h-80 rounded-2xl overflow-hidden glass-panel border border-white/20 shadow-2xl">
      <Canvas
        camera={{ position: [0, 1.5, 3.8], fov: 45 }}
        shadows
        className="w-full h-full"
      >
        <ambientLight intensity={0.6} />
        <pointLight position={[2, 3, 2]} intensity={1.5} color={config.primaryColor} />
        <pointLight position={[-2, 3, 2]} intensity={1} color="#00F0FF" />
        <spotLight
          position={[0, 4, 2]}
          intensity={2.5}
          angle={0.6}
          penumbra={0.8}
          color="#FFFFFF"
          castShadow
        />

        {/* Floating Rotating Avatar Preview */}
        <group position={[0, -0.6, 0]}>
          <AvatarPrimitive avatarType={avatarType} isPreview={true} scale={1.2} />

          {/* Neon Floor Pedestal */}
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <circleGeometry args={[1.2, 32]} />
            <meshStandardMaterial
              color="#0F172A"
              emissive={config.primaryColor}
              emissiveIntensity={0.3}
              roughness={0.2}
            />
          </mesh>
          <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.15, 1.25, 32]} />
            <meshBasicMaterial color={config.primaryColor} />
          </mesh>
        </group>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
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

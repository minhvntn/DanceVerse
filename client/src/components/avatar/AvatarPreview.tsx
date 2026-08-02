import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Grid, ContactShadows } from '@react-three/drei';
import { AvatarPrimitive } from '../../game/avatars/AvatarPrimitive';
import { AvatarCustomization, DanceAnimationType } from '../../../../shared/types';

interface AvatarPreviewProps {
  config: AvatarCustomization;
  animation: DanceAnimationType;
}

export const AvatarPreview: React.FC<AvatarPreviewProps> = ({ config, animation }) => {
  return (
    <div className="w-full h-full relative">
      <Canvas shadows camera={{ position: [0, 1.2, 4], fov: 45 }}>
        <color attach="background" args={['#0F172A']} />
        
        {/* Lights */}
        <ambientLight intensity={0.6} />
        <directionalLight
          castShadow
          position={[2, 5, 2]}
          intensity={1.5}
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-2, 2, -2]} intensity={0.5} color="#00F0FF" />
        <pointLight position={[2, 2, -2]} intensity={0.5} color="#FF2B9B" />

        {/* Environment for reflections */}
        <Environment preset="city" />

        {/* Stage / Floor */}
        <Grid
          renderOrder={-1}
          position={[0, 0, 0]}
          infiniteGrid
          fadeDistance={20}
          fadeStrength={5}
          cellColor="#334155"
          sectionColor="#475569"
        />
        <ContactShadows
          position={[0, 0.01, 0]}
          opacity={0.4}
          scale={5}
          blur={2}
          far={4}
        />

        {/* The Avatar */}
        <AvatarPrimitive
          avatarType="Boy" // Ignored mostly when config is present
          avatarConfig={config}
          animation={animation}
          equippedLightstick={true}
          lightstickColor={config.lightstickColor}
          showName={false}
          isPreview={true}
        />

        {/* Controls */}
        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={8}
          maxPolarAngle={Math.PI / 2 + 0.1}
          target={[0, 1, 0]}
        />
      </Canvas>
    </div>
  );
};

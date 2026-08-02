import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ConcertVisualState } from '../../stageVisuals';

export type LedPatternType = 'grid' | 'diagonal' | 'rings' | 'center-burst';

interface StageLedPatternProps {
  visualState: ConcertVisualState;
  pattern: LedPatternType;
  color: string;
}

export const StageLedPattern: React.FC<StageLedPatternProps> = ({ visualState, pattern, color }) => {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    if (!materialRef.current) return;

    const baseIntensity = visualState.isPlaying ? 0.3 + (visualState.energy * 0.5) : 0.15;
    const finalIntensity = visualState.isBeatDrop ? 1.0 : baseIntensity;

    materialRef.current.opacity = finalIntensity;
  });

  return (
    <group position={[0, 0, -18]}>
      {/* Front Floor */}
      <mesh position={[0, 0.46, 3]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[44, 13]} />
        <meshBasicMaterial
          ref={materialRef}
          color={color}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          map={createPatternTexture(pattern, color)}
        />
      </mesh>

      {/* Mid Floor */}
      <mesh position={[0, 1.36, -1]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[37, 10]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          map={createPatternTexture(pattern, color)}
        />
      </mesh>
    </group>
  );
};

// Simple canvas texture generator for different patterns
function createPatternTexture(pattern: LedPatternType, colorStr: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#ffffff'; // The color will be tinted by meshBasicMaterial.color
  ctx.lineWidth = 4;

  if (pattern === 'grid') {
    for (let i = 0; i < 512; i += 64) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
    }
  } else if (pattern === 'diagonal') {
    for (let i = -512; i < 1024; i += 64) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 512, 512); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i, 512); ctx.lineTo(i + 512, 0); ctx.stroke();
    }
  } else if (pattern === 'rings') {
    for (let r = 32; r < 512; r += 64) {
      ctx.beginPath(); ctx.arc(256, 0, r, 0, Math.PI * 2); ctx.stroke();
    }
  } else if (pattern === 'center-burst') {
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
      ctx.beginPath();
      ctx.moveTo(256, 256);
      ctx.lineTo(256 + Math.cos(angle) * 512, 256 + Math.sin(angle) * 512);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  if (pattern === 'grid' || pattern === 'diagonal') {
    texture.repeat.set(4, 2);
  } else {
    texture.repeat.set(1, 1);
  }
  return texture;
}

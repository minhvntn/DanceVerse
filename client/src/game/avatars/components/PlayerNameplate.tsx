import React, { useRef } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlayerNameplateProps {
  name: string;
  isHost: boolean;
  partyId?: string;
  combo?: number;
  rhythmMode?: boolean;
  team?: 'cyan' | 'pink';
}

export const PlayerNameplate: React.FC<PlayerNameplateProps> = ({ name, isHost, combo, rhythmMode, team }) => {
  const groupRef = useRef<THREE.Group>(null);
  const htmlRef = useRef<HTMLDivElement>(null);

  // Simple distance culling
  useFrame(({ camera }) => {
    if (!groupRef.current || !htmlRef.current) return;
    const distance = camera.position.distanceTo(groupRef.current.position);
    
    // Fade out past 20 units
    if (distance > 25) {
      htmlRef.current.style.opacity = '0';
      htmlRef.current.style.pointerEvents = 'none';
    } else {
      htmlRef.current.style.opacity = `${1 - (distance / 30)}`;
      htmlRef.current.style.pointerEvents = 'auto';
    }
  });

  return (
    <group ref={groupRef} position={[0, 2.2, 0]}>
      <Html
        ref={htmlRef}
        center
        sprite
        zIndexRange={[100, 0]}
        className="pointer-events-none select-none transition-opacity duration-200"
      >
        <div className="flex flex-col items-center justify-center min-w-max">
          {rhythmMode && combo && combo > 9 && (
            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full mb-1 border border-white/20 shadow-lg animate-pulse whitespace-nowrap">
              🔥 {combo} COMBO
            </div>
          )}
          <div className={`flex items-center gap-1 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border shadow-lg ${
            team === 'cyan' ? 'border-neon-cyan/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]' :
            team === 'pink' ? 'border-neon-pink/50 shadow-[0_0_10px_rgba(255,20,147,0.3)]' :
            'border-white/10'
          }`}>
            {isHost && <span className="text-yellow-400 text-xs">👑</span>}
            <span className={`text-sm font-bold whitespace-nowrap ${
              team === 'cyan' ? 'text-neon-cyan' :
              team === 'pink' ? 'text-neon-pink' :
              isHost ? 'text-yellow-400' : 'text-white'
            }`}>
              {name}
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
};

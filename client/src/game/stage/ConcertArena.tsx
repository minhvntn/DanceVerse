import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { PerformanceMode } from '../../types';
import { useRoomStore } from '../../stores/useRoomStore';
import { ConcertVideoScreen } from '../../components/stage/ConcertVideoScreen';
import { StageEffects } from './effects/StageEffects';
import { DJBooth } from './DJBooth';

interface ConcertArenaProps {
  showEffects: boolean;
  performanceMode: PerformanceMode;
  isBeatDrop?: boolean;
}

export const ConcertArena: React.FC<ConcertArenaProps> = ({
  showEffects,
  performanceMode,
  isBeatDrop = false
}) => {
  const { musicState, activeStageCue } = useRoomStore();
  const ledScreenRef = useRef<THREE.MeshBasicMaterial>(null);
  const confettiGroupRef = useRef<THREE.Group>(null);
  const fireworksRef = useRef<THREE.Group>(null);

  const [triggerConfetti, setTriggerConfetti] = React.useState(false);
  const [triggerFireworks, setTriggerFireworks] = React.useState(false);

  React.useEffect(() => {
    if (activeStageCue?.type === 'confetti') {
      setTriggerConfetti(true);
      const timer = setTimeout(() => setTriggerConfetti(false), 8000);
      return () => clearTimeout(timer);
    }
    if (activeStageCue?.type === 'fireworks') {
      setTriggerFireworks(true);
      const timer = setTimeout(() => setTriggerFireworks(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [activeStageCue]);

  // Determine particle density based on performance setting
  const confettiCount = useMemo(() => {
    if (performanceMode === 'Low') return 0;
    if (performanceMode === 'Medium') return 25;
    return 60; // High or Auto
  }, [performanceMode]);

  // Generate random confetti particle positions
  const confettiPositions = useMemo(() => {
    const arr: Array<{ position: [number, number, number]; color: string; speed: number }> = [];
    const colors = ['#FF007F', '#00F0FF', '#39FF14', '#FFE600', '#9D00FF'];
    for (let i = 0; i < confettiCount; i++) {
      arr.push({
        position: [
          (Math.random() - 0.5) * 30,
          Math.random() * 12 + 3,
          (Math.random() - 0.5) * 25
        ],
        color: colors[i % colors.length],
        speed: Math.random() * 0.8 + 0.4
      });
    }
    return arr;
  }, [confettiCount]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();

    // LED screen color pulse
    if (ledScreenRef.current) {
      const hue = (time * 0.08) % 1;
      ledScreenRef.current.color.setHSL(hue, 0.85, 0.55);
    }



    // Animate Confetti falling
    if (showEffects && triggerConfetti && confettiGroupRef.current) {
      confettiGroupRef.current.children.forEach((child, i) => {
        child.position.y -= confettiPositions[i]?.speed * 0.05 || 0.05;
        child.rotation.x += 0.05;
        child.rotation.y += 0.05;
        if (child.position.y < 0.2) {
          child.position.y = 14;
        }
      });
    }

    // Fireworks pulsing
    if (showEffects && triggerFireworks && fireworksRef.current) {
      const scalePulse = 1 + Math.sin(time * 4) * 0.2;
      fireworksRef.current.scale.set(scalePulse, scalePulse, scalePulse);
      fireworksRef.current.rotation.z = time * 0.5;
    }
  });

  return (
    <group>
      {/* --- FLOOR AND GROUND --- */}
      {/* Main Ground Arena Floor */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#0B0F19" roughness={0.8} />
      </mesh>

      {/* Dance Floor Grid / Stage Floor */}
      <mesh position={[0, 0.01, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[34, 30]} />
        <meshStandardMaterial color="#111827" roughness={0.3} metalness={0.4} />
      </mesh>
      {/* Glowing Neon Border around Dance Floor */}
      <mesh position={[0, 0.02, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[16.8, 17.3, 32]} />
        <meshBasicMaterial color="#00F0FF" />
      </mesh>

      {/* --- MAIN STAGE & DJ BOOTH --- */}
      {/* Stage Platform */}
      <mesh position={[0, 0.75, -18]} castShadow receiveShadow>
        <boxGeometry args={[36, 1.5, 10]} />
        <meshStandardMaterial color="#1E1B4B" roughness={0.2} metalness={0.6} />
      </mesh>

      {/* Stage Front Neon Trim */}
      <mesh position={[0, 1.5, -13.1]}>
        <boxGeometry args={[36, 0.15, 0.15]} />
        <meshBasicMaterial color="#FF007F" />
      </mesh>

      {/* DJ Booth */}
      <DJBooth />

      {/* --- GIANT MAIN LED SCREEN --- */}
      <mesh position={[0, 8.5, -22.5]}>
        <boxGeometry args={[30, 12, 0.8]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      {/* Animated Glowing Screen Face (Concert UI) */}
      <mesh position={[0, 8.5, -22.05]}>
        <planeGeometry args={[28.5, 10.8]} />
        <ConcertVideoScreen />
      </mesh>

      {/* --- SIDE LED SCREENS --- */}
      {/* Left Screen */}
      <mesh position={[-18, 7.5, -20.5]} rotation={[0, 0.3, 0]}>
        <boxGeometry args={[6, 14, 0.8]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      <mesh position={[-17.9, 7.5, -20.05]} rotation={[0, 0.3, 0]}>
        <planeGeometry args={[5.5, 13.5]} />
        {/* Basic Equalizer/Glow visualizer effect for side screens */}
        <meshBasicMaterial color="#d946ef" wireframe={isBeatDrop} transparent opacity={musicState?.status === 'playing' ? 0.8 : 0.2} />
      </mesh>

      {/* Right Screen */}
      <mesh position={[18, 7.5, -20.5]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[6, 14, 0.8]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      <mesh position={[17.9, 7.5, -20.05]} rotation={[0, -0.3, 0]}>
        <planeGeometry args={[5.5, 13.5]} />
        <meshBasicMaterial color="#00ffff" wireframe={isBeatDrop} transparent opacity={musicState?.status === 'playing' ? 0.8 : 0.2} />
      </mesh>

      {/* Invisible YouTube Player removed - ConcertVideoScreen handles audio now */}
      {/* Screen Frame Neon Glow */}
      <mesh position={[0, 14.2, -22]}>
        <boxGeometry args={[30, 0.3, 0.4]} />
        <meshBasicMaterial color="#00F0FF" />
      </mesh>

      {/* --- SPEAKER TOWERS --- */}
      {/* Left Tower */}
      <group position={[-15, 4.5, -16]}>
        <mesh castShadow>
          <boxGeometry args={[3.5, 9, 3.5]} />
          <meshStandardMaterial color="#18181B" roughness={0.5} />
        </mesh>
        <mesh position={[0, 2, 1.8]}>
          <circleGeometry args={[1.1, 16]} />
          <meshBasicMaterial color="#FF007F" />
        </mesh>
        <mesh position={[0, -1.5, 1.8]}>
          <circleGeometry args={[1.3, 16]} />
          <meshBasicMaterial color="#00F0FF" />
        </mesh>
      </group>

      {/* Right Tower */}
      <group position={[15, 4.5, -16]}>
        <mesh castShadow>
          <boxGeometry args={[3.5, 9, 3.5]} />
          <meshStandardMaterial color="#18181B" roughness={0.5} />
        </mesh>
        <mesh position={[0, 2, 1.8]}>
          <circleGeometry args={[1.1, 16]} />
          <meshBasicMaterial color="#FF007F" />
        </mesh>
        <mesh position={[0, -1.5, 1.8]}>
          <circleGeometry args={[1.3, 16]} />
          <meshBasicMaterial color="#00F0FF" />
        </mesh>
      </group>

      {/* --- STAGE LIGHTING & EFFECTS --- */}
      {showEffects && (
        <>
          {/* --- STAGE EFFECTS (Lights, Lasers, CO2, Smoke) --- */}
          {showEffects && (
            <StageEffects performanceMode={performanceMode} isBeatDrop={isBeatDrop} />
          )}

          {/* Confetti Particle System */}
          {triggerConfetti && confettiCount > 0 && (
            <group ref={confettiGroupRef}>
              {confettiPositions.map((item, idx) => (
                <mesh key={idx} position={item.position}>
                  <planeGeometry args={[0.25, 0.25]} />
                  <meshBasicMaterial color={item.color} side={THREE.DoubleSide} />
                </mesh>
              ))}
            </group>
          )}

          {/* Simple Fireworks Rings */}
          {triggerFireworks && (
            <group ref={fireworksRef} position={[0, 15, -20]}>
            <mesh position={[-8, 3, 0]}>
              <ringGeometry args={[2.5, 3, 16]} />
              <meshBasicMaterial color="#FF007F" transparent opacity={0.8} />
            </mesh>
            <mesh position={[8, 5, 0]}>
              <ringGeometry args={[3, 3.6, 16]} />
              <meshBasicMaterial color="#FFE600" transparent opacity={0.8} />
            </mesh>
            <mesh position={[0, 8, 0]}>
              <ringGeometry args={[3.5, 4.2, 16]} />
              <meshBasicMaterial color="#00F0FF" transparent opacity={0.8} />
            </mesh>
            </group>
          )}
        </>
      )}

      {/* --- AUDIENCE BOUNDARY ARCHES --- */}
      <mesh position={[0, 6, -26]}>
        <torusGeometry args={[28, 0.6, 16, 32, Math.PI]} />
        <meshBasicMaterial color="#9D00FF" />
      </mesh>
    </group>
  );
};

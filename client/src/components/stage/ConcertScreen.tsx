import React, { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { RenderTexture, Text, Image, OrthographicCamera, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useRoomStore } from '../../stores/useRoomStore';
import { socketService } from '../../services/socket.service';

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Shader for the LED Screen Background (Gradient + Noise + Scanlines + Vignette)
const ScreenBackgroundMaterial = shaderMaterial(
  { time: 0, color1: new THREE.Color('#020617'), color2: new THREE.Color('#2e1065') },
  // vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment shader
  `
    uniform float time;
    uniform vec3 color1;
    uniform vec3 color2;
    varying vec2 vUv;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      // Dynamic gradient
      float gradMix = vUv.x * 0.5 + vUv.y * 0.5 + sin(vUv.x * 3.0 + time * 0.2) * 0.1;
      vec3 color = mix(color1, color2, clamp(gradMix, 0.0, 1.0));
      
      // Moving Light Sweep (fake)
      float sweep = sin(vUv.x * 10.0 + vUv.y * 10.0 - time * 2.0);
      if(sweep > 0.95) {
        color += vec3(0.1, 0.3, 0.5) * (sweep - 0.95) * 20.0;
      }

      // Scanlines (horizontal bands)
      float scanline = sin(vUv.y * 400.0) * 0.03;
      color -= scanline;
      
      // Film noise
      float noise = (random(vUv * time) - 0.5) * 0.04;
      color += noise;

      // Vignette (darken corners)
      float dist = distance(vUv, vec2(0.5, 0.5));
      color *= smoothstep(0.8, 0.3, dist);

      gl_FragColor = vec4(color, 1.0);
    }
  `
);
extend({ ScreenBackgroundMaterial });

// Add intrinsic types for the custom shader material
declare global {
  namespace JSX {
    interface IntrinsicElements {
      screenBackgroundMaterial: any;
    }
  }
}

const Background = ({ isPlaying }: { isPlaying: boolean }) => {
  const materialRef = useRef<any>(null);
  
  useFrame(({ clock }) => {
    if (materialRef.current) {
      // Update time uniform
      materialRef.current.time = clock.getElapsedTime() * (isPlaying ? 1 : 0.2);
    }
  });

  return (
    <mesh position={[0, 0, -5]}>
      <planeGeometry args={[30, 15]} />
      <screenBackgroundMaterial ref={materialRef} transparent={false} />
    </mesh>
  );
};

// Smooth Equalizer
const Equalizer = ({ isPlaying, position, width }: { isPlaying: boolean; position: [number, number, number]; width: number }) => {
  const groupRef = useRef<THREE.Group>(null);
  const numBars = 40;
  const spacing = 0.1;
  const barWidth = (width - (numBars - 1) * spacing) / numBars;
  
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    
    groupRef.current.children.forEach((mesh, i) => {
      if (isPlaying) {
        // Complex wave for visualizer
        const wave1 = Math.sin(time * 8 + i * 0.5);
        const wave2 = Math.cos(time * 3 + i * 0.2);
        const scaleY = Math.max(0.1, Math.abs(wave1) * 1.5 + Math.abs(wave2) * 0.5);
        mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, scaleY, 0.2);
      } else {
        mesh.scale.y = THREE.MathUtils.lerp(mesh.scale.y, 0.1, 0.1);
      }
      mesh.position.y = mesh.scale.y / 2;
    });
  });

  return (
    <group position={position}>
      <group ref={groupRef}>
        {Array.from({ length: numBars }).map((_, i) => (
          <mesh key={i} position={[i * (barWidth + spacing), 0, 0]}>
            <planeGeometry args={[barWidth, 1]} />
            <meshBasicMaterial color={i % 3 === 0 ? "#22d3ee" : "#d946ef"} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export const ConcertScreenUI = () => {
  const { musicState, currentTrack, players, activeStageCue } = useRoomStore();
  
  const audienceCount = Object.keys(players).length;
  
  const progressRef = useRef<THREE.Group>(null);
  const timeTextRef = useRef<any>(null);
  const titleGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!musicState) return;
    
    // Slide animation for Title group
    if (titleGroupRef.current) {
      titleGroupRef.current.position.y = THREE.MathUtils.lerp(
        titleGroupRef.current.position.y,
        0,
        0.1
      );
    }

    if (musicState.status !== 'playing' || !musicState.startedAt) return;
    
    const serverTime = socketService.getServerTime();
    let expectedTime = (serverTime - musicState.startedAt) / 1000;
    if (expectedTime < 0) expectedTime = 0;
    const duration = currentTrack?.duration || 0;
    if (duration && expectedTime > duration) expectedTime = duration;

    // Progress Bar Width = 16 units
    if (progressRef.current && duration > 0) {
      const progress = expectedTime / duration;
      progressRef.current.scale.x = Math.max(0.001, progress); 
      progressRef.current.position.x = (16 * progress) / 2; // Anchor left locally
    }

    if (timeTextRef.current) {
      timeTextRef.current.text = `${formatTime(expectedTime)} / ${formatTime(duration)}`;
    }
  });

  if (!musicState || musicState.status === 'idle' || !musicState.currentVideoId) {
    return (
      <RenderTexture attach="map" anisotropy={16} width={2048} height={1024}>
        <OrthographicCamera makeDefault left={-14.25} right={14.25} top={5.4} bottom={-5.4} position={[0, 0, 10]} />
        <Background isPlaying={true} />
        
        {/* Logo / Emptystate */}
        <Text position={[0, 1.5, 0]} fontSize={2.5} color="#22d3ee" anchorX="center" anchorY="middle" letterSpacing={0.1}>
          DANCEVERSE LIVE
        </Text>
        <Text position={[0, -1.0, 0]} fontSize={1.0} color="#a855f7" anchorX="center" anchorY="middle" letterSpacing={0.2}>
          WAITING FOR HOST...
        </Text>
        {/* Audience Count */}
        <group position={[9, -3.2, 0]}>
          <Text position={[0, 0, 0]} fontSize={1.0} color="#a855f7" anchorX="center" anchorY="middle">
            {audienceCount}
          </Text>
          <Text position={[0, -0.8, 0]} fontSize={0.5} color="#cbd5e1" anchorX="center" anchorY="middle">
            DANCERS
          </Text>
        </group>
      </RenderTexture>
    );
  }

  const title = currentTrack?.title || 'Unknown Track';
  const artist = currentTrack?.artist || 'Unknown Artist';
  const duration = currentTrack?.duration || 0;
  
  // Use high-res thumbnail
  const thumbnailUrl = currentTrack?.thumbnailUrl || `https://img.youtube.com/vi/${musicState.currentVideoId}/maxresdefault.jpg`;
  const isPlaying = musicState.status === 'playing';

  // Layout Constants
  const RIGHT_COL_START = -2;
  const PROGRESS_WIDTH = 15;

  return (
    <RenderTexture attach="map" anisotropy={16} width={2048} height={1024}>
      <OrthographicCamera makeDefault left={-14.25} right={14.25} top={5.4} bottom={-5.4} position={[0, 0, 10]} />
      
      <Background isPlaying={isPlaying} />

      {/* Frame Border - Neon */}
      <mesh position={[0, 0, -1]}>
        <planeGeometry args={[28, 10.3]} />
        <meshBasicMaterial color="#0891b2" wireframe transparent opacity={0.15} />
      </mesh>

      {/* ================= LEFT COLUMN ================= */}
      <group position={[-8, 0, 0]}>
        {/* Glow behind thumbnail */}
        <mesh position={[0, 0, -0.2]}>
          <planeGeometry args={[9, 5.5]} />
          <meshBasicMaterial color="#d946ef" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
        </mesh>
        
        {/* Thumbnail Image (Rounded using radius prop if available in drei Image) */}
        <Image 
          url={thumbnailUrl} 
          scale={[8.5, 4.8]} 
          position={[0, 0.5, 0]} 
          transparent 
          // radius={0.2} // Note: radius might require specific drei versions, omitting to be safe, using basic scale
        />

        {/* Status indicator under thumbnail */}
        <group position={[-4, -2.8, 0]}>
          <mesh position={[0.4, 0, 0]}>
            <circleGeometry args={[0.2, 32]} />
            <meshBasicMaterial color={isPlaying ? "#22d3ee" : "#ef4444"} />
          </mesh>
          <Text position={[1.0, 0, 0]} fontSize={0.7} color="#ffffff" anchorX="left" anchorY="middle" letterSpacing={0.1}>
            {isPlaying ? '● LIVE' : 'PAUSED'}
          </Text>
        </group>
      </group>


      {/* ================= RIGHT COLUMN ================= */}
      <group ref={titleGroupRef} position={[RIGHT_COL_START, 0, 0]}>
        
        <>
          {/* NOW PLAYING Badge */}
            <Text position={[0, 4, 0]} fontSize={0.8} color="#22d3ee" anchorX="left" anchorY="middle" letterSpacing={0.2}>
              {isPlaying ? '🎵 NOW PLAYING' : '⏸ PAUSED'}
            </Text>

        {/* Title */}
        <Text 
          position={[0, 1.8, 0]} 
          fontSize={2.2} 
          color="#ffffff" 
          anchorX="left" 
          anchorY="middle" 
          maxWidth={15}
          lineHeight={1.1}
          outlineWidth={0.03}
          outlineColor="#000000"
        >
          {title}
        </Text>
        
        {/* Artist */}
        <Text 
          position={[0, -0.6, 0]} 
          fontSize={1.2} 
          color="#a855f7" 
          anchorX="left" 
          anchorY="middle"
        >
          {artist}
        </Text>

        {/* Progress Bar */}
        <group position={[0, -2.2, 0]}>
          <mesh position={[PROGRESS_WIDTH / 2, 0, 0]}>
            <planeGeometry args={[PROGRESS_WIDTH, 0.5]} />
            <meshBasicMaterial color="#1e293b" />
          </mesh>
          
          <group ref={progressRef} position={[0, 0, 0.01]}>
            {/* Progress Fill */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[PROGRESS_WIDTH, 0.5]} />
              <meshBasicMaterial color="#22d3ee" blending={THREE.AdditiveBlending} />
            </mesh>
            
            {/* Progress Glow */}
            <mesh position={[0, 0, -0.005]}>
              <planeGeometry args={[PROGRESS_WIDTH, 1.2]} />
              <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
            </mesh>
          </group>
        </group>

        {/* Time Counters & Audience */}
        <group position={[0, -3.2, 0]}>
          <Text 
            ref={timeTextRef}
            position={[0, 0, 0]} 
            fontSize={0.9} 
            color="#cbd5e1" 
            anchorX="left" 
            anchorY="middle"
          >
            {`${formatTime(musicState.pausedPosition || 0)} / ${formatTime(duration)}`}
          </Text>
          
          <Text 
            position={[PROGRESS_WIDTH, 0, 0]} 
            fontSize={0.9} 
            color="#e879f9" 
            anchorX="right" 
            anchorY="middle"
          >
            {`👥 ${audienceCount} Dancing`}
          </Text>
        </group>

        {/* Equalizer */}
        <Equalizer isPlaying={isPlaying} position={[0, -4.8, 0]} width={PROGRESS_WIDTH} />
        </>
      </group>

    </RenderTexture>
  );
};

export const ConcertScreenFallback = () => {
  return <meshBasicMaterial side={THREE.DoubleSide}><ConcertScreenUI /></meshBasicMaterial>;
};

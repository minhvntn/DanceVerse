import React, { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';

const SmokeMaterial = shaderMaterial(
  { time: 0, baseColor: new THREE.Color('#39FF14'), energy: 0.2 },
  // vertex
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment
  `
    uniform float time;
    uniform vec3 baseColor;
    uniform float energy;
    varying vec2 vUv;

    // Perlin-esque noise mock for cheap fog
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      // Flowing smoke coordinates
      vec2 st = vUv * 3.0;
      st.x += time * 0.1;
      st.y += time * 0.2;
      
      float n = noise(st) * noise(st * 2.0 + time * 0.1);
      
      // Fade edges
      float edgeX = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
      float edgeY = smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.6, vUv.y); // Fade out near top
      
      float alpha = n * edgeX * edgeY * (0.2 + energy * 0.3); // Opacity scales with energy
      
      gl_FragColor = vec4(baseColor, alpha);
    }
  `
);
extend({ SmokeMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      smokeMaterial: any;
    }
  }
}

interface StageSmokeProps {
  energy: number;
}

export const StageSmoke: React.FC<StageSmokeProps> = ({ energy }) => {
  const materialRef1 = useRef<any>(null);
  const materialRef2 = useRef<any>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (materialRef1.current) {
      materialRef1.current.time = t;
      materialRef1.current.energy = energy;
    }
    if (materialRef2.current) {
      materialRef2.current.time = t * 0.8 + 100;
      materialRef2.current.energy = energy;
    }
  });

  return (
    <group position={[0, 5, -15]}>
      {/* Front layer */}
      <mesh position={[0, 0, 2]}>
        <planeGeometry args={[40, 15]} />
        <smokeMaterial ref={materialRef1} baseColor={new THREE.Color('#8b5cf6')} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      
      {/* Back layer */}
      <mesh position={[0, 2, -2]}>
        <planeGeometry args={[40, 20]} />
        <smokeMaterial ref={materialRef2} baseColor={new THREE.Color('#06b6d4')} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

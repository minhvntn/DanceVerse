import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CO2CannonProps {
  position: [number, number, number];
  trigger: boolean;
}

export const CO2Cannon: React.FC<CO2CannonProps> = ({ position, trigger }) => {
  const particlesRef = useRef<THREE.InstancedMesh>(null);
  
  const particleCount = 150;
  
  // Custom data for each particle: velocity, life
  const particleData = useMemo(() => {
    const data = [];
    for (let i = 0; i < particleCount; i++) {
      data.push({
        position: new THREE.Vector3((Math.random() - 0.5) * 1.5, 0, (Math.random() - 0.5) * 1.5),
        velocity: new THREE.Vector3((Math.random() - 0.5) * 2, Math.random() * 15 + 10, (Math.random() - 0.5) * 2),
        life: 0,
        maxLife: Math.random() * 1.5 + 0.5,
        baseScale: Math.random() * 2 + 1,
        scale: 1
      });
    }
    return data;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;

    let allDead = true;

    for (let i = 0; i < particleCount; i++) {
      const data = particleData[i];

      if (trigger) {
        // Reset dead particles if trigger is active
        if (data.life <= 0) {
          data.life = data.maxLife;
          data.position.set((Math.random() - 0.5) * 1.5, 0, (Math.random() - 0.5) * 1.5);
          data.scale = data.baseScale;
        }
      }

      if (data.life > 0) {
        allDead = false;
        
        // Move particle
        data.position.addScaledVector(data.velocity, delta);
        
        // Expand
        data.scale += delta * 4;
        
        // Decay
        data.life -= delta;

        dummy.position.copy(data.position);
        dummy.scale.set(data.scale, data.scale, data.scale);
        dummy.updateMatrix();
        
        particlesRef.current.setMatrixAt(i, dummy.matrix);
      } else {
        // Hide dead particle
        dummy.position.set(0, -1000, 0);
        dummy.updateMatrix();
        particlesRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    if (!allDead || trigger) {
      particlesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group position={position}>
      {/* Visual cannon nozzle */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 1, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      
      {/* CO2 Particles */}
      <instancedMesh ref={particlesRef} args={[undefined, undefined, particleCount]} position={[0, 1, 0]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>
    </group>
  );
};

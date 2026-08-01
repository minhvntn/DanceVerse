import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { Vector3D } from '../../types';
import { useRoomStore } from '../../stores/useRoomStore';

interface CameraControllerProps {
  targetPosition?: Vector3D;
  targetPosRef?: React.MutableRefObject<Vector3D>;
  isBeatDrop?: boolean;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  targetPosition = { x: 0, y: 0, z: 8 },
  targetPosRef,
  isBeatDrop = false
}) => {
  const { camera } = useThree();
  const cameraMode = useRoomStore((state) => state.cameraMode);
  const activeStageCue = useRoomStore((state) => state.activeStageCue);
  
  const controlsRef = useRef<any>(null);
  
  // Player tracking refs
  const currentTarget = useRef(new THREE.Vector3(targetPosition.x, targetPosition.y + 1.2, targetPosition.z));
  const cameraOffset = useRef(new THREE.Vector3(0, 5.8, 13.5));
  const tempTargetVec = useRef(new THREE.Vector3());
  
  // Lerp targets for non-player modes
  const desiredPos = useRef(new THREE.Vector3());
  const desiredLookAt = useRef(new THREE.Vector3());
  
  // Auto-Cinematic state
  const [cinematicIndex, setCinematicIndex] = useState(0);

  // Cinematic angles
  const cinematicAngles = [
    { pos: [0, 9.5, 30], lookAt: [0, 5.4, -18] }, // Festival-wide establishing shot
    { pos: [0, 6.2, -6], lookAt: [0, 5.1, -20.5] }, // DJ close-up
    { pos: [-24, 9, 2], lookAt: [0, 5.8, -19] }, // Side Left
    { pos: [24, 9, 2], lookAt: [0, 5.8, -19] }, // Side Right
    { pos: [0, 27, 3], lookAt: [0, 1.8, -13] }, // Festival top down
    { pos: [-17, 4.5, 21], lookAt: [5, 4.6, -18] }, // Audience sweep
  ];

  // Auto-switch cinematic angles every 12 seconds
  useEffect(() => {
    if (cameraMode !== 'cinematic') return;
    const interval = setInterval(() => {
      setCinematicIndex((prev) => (prev + 1) % cinematicAngles.length);
    }, 12000);
    return () => clearInterval(interval);
  }, [cameraMode, cinematicAngles.length]);

  // Handle stage cues
  useEffect(() => {
    if (activeStageCue?.type === 'camera' && cameraMode === 'cinematic') {
      const angleName = activeStageCue.payload?.angle;
      switch (angleName) {
        case 'wide': setCinematicIndex(0); break;
        case 'dj': setCinematicIndex(1); break;
        case 'side-left': setCinematicIndex(2); break;
        case 'side-right': setCinematicIndex(3); break;
        case 'audience': setCinematicIndex(5); break;
      }
    }
  }, [activeStageCue, cameraMode]);

  useFrame((_, delta) => {
    // 1. Determine targets based on mode
    if (cameraMode === 'player') {
      const pos = targetPosRef?.current || targetPosition;
      tempTargetVec.current.set(pos.x, pos.y + 1.2, pos.z);
      currentTarget.current.lerp(tempTargetVec.current, 0.15);
      
      desiredPos.current.copy(currentTarget.current).add(cameraOffset.current);
      desiredLookAt.current.copy(currentTarget.current);
      
      if (controlsRef.current) {
        controlsRef.current.target.copy(currentTarget.current);
        controlsRef.current.update();
        return; // OrbitControls handles the actual camera position
      }
    } 
    else if (cameraMode === 'concert') {
      desiredPos.current.set(0, 9.5, 30);
      desiredLookAt.current.set(0, 5.4, -18);
    } 
    else if (cameraMode === 'cinematic') {
      const angle = cinematicAngles[cinematicIndex];
      desiredPos.current.set(angle.pos[0], angle.pos[1], angle.pos[2]);
      desiredLookAt.current.set(angle.lookAt[0], angle.lookAt[1], angle.lookAt[2]);
    }

    // Camera Shake on beat drop
    if (isBeatDrop && (cameraMode === 'concert' || cameraMode === 'cinematic')) {
      desiredPos.current.x += (Math.random() - 0.5) * 0.1;
      desiredPos.current.y += (Math.random() - 0.5) * 0.1;
    }

    // Prevent clipping below floor
    desiredPos.current.y = Math.max(0.6, desiredPos.current.y);

    // Smooth Lerp
    // Use a slightly slower lerp for cinematic transitions to feel more like a drone
    const lerpSpeed = cameraMode === 'cinematic' ? 1.0 * delta : 3.0 * delta;
    
    camera.position.lerp(desiredPos.current, lerpSpeed);
    
    // We can't simply lerp `lookAt` easily using `camera.lookAt` because it snaps.
    // Instead we slerp the quaternion.
    const currentQuat = camera.quaternion.clone();
    camera.lookAt(desiredLookAt.current);
    const targetQuat = camera.quaternion.clone();
    camera.quaternion.copy(currentQuat).slerp(targetQuat, lerpSpeed * 1.5);
  });

  return (
    <>
      {cameraMode === 'player' && (
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={4}
          maxDistance={28}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.05}
        />
      )}
    </>
  );
};

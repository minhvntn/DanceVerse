import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { Vector3D } from '../../types';

interface ThirdPersonCameraProps {
  targetPosition?: Vector3D;
  targetPosRef?: React.MutableRefObject<Vector3D>;
  isBeatDrop?: boolean;
}

export const ThirdPersonCamera: React.FC<ThirdPersonCameraProps> = ({
  targetPosition = { x: 0, y: 0, z: 8 },
  targetPosRef,
  isBeatDrop = false
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const currentTarget = useRef(new THREE.Vector3(targetPosition.x, targetPosition.y + 1.2, targetPosition.z));
  const cameraOffset = useRef(new THREE.Vector3(0, 4.2, 8.5));
  const tempTargetVec = useRef(new THREE.Vector3());
  const tempDesiredPos = useRef(new THREE.Vector3());

  useFrame(() => {
    // Read current target from ref or fallback prop without triggering React state updates
    const pos = targetPosRef?.current || targetPosition;
    tempTargetVec.current.set(pos.x, pos.y + 1.2, pos.z);
    currentTarget.current.lerp(tempTargetVec.current, 0.15);

    if (controlsRef.current) {
      controlsRef.current.target.copy(currentTarget.current);
      controlsRef.current.update();
    } else {
      // Manual camera lerp if OrbitControls is unattached
      tempDesiredPos.current.copy(currentTarget.current).add(cameraOffset.current);
      if (isBeatDrop) {
        tempDesiredPos.current.x += (Math.random() - 0.5) * 0.25;
        tempDesiredPos.current.y += (Math.random() - 0.5) * 0.25;
      }
      // Never clip below the stage floor
      tempDesiredPos.current.y = Math.max(0.6, tempDesiredPos.current.y);
      camera.position.lerp(tempDesiredPos.current, 0.12);
      camera.lookAt(currentTarget.current);
    }

    // Ensure camera stays above ground
    if (camera.position.y < 0.6) {
      camera.position.y = 0.6;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableZoom={true}
      minDistance={4}
      maxDistance={22}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.05}
    />
  );
};

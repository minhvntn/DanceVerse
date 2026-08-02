import React, { useEffect, useRef } from 'react';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';
import { DanceAnimationType } from '../../../../shared/types';
import { useFrame } from '@react-three/fiber';

interface CelestialQueenAvatarProps {
  animation?: DanceAnimationType;
  scale?: number;
}

export const CelestialQueenAvatar: React.FC<CelestialQueenAvatarProps> = ({ 
  animation = 'Idle', 
  scale = 1 
}) => {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF('/models/celestial_queen_lightstick_animated.glb');
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    // Log animations in console so we know what they are named
    // console.log("Celestial Queen animations:", Object.keys(actions));
    
    // Map DanceAnimationType to GLB animation names (if they don't match, we might need a mapping)
    // For now we try to play the exact name or fallback to the first animation or Idle
    let actionName = animation;
    if (!actions[actionName]) {
      // Find a matching one or fallback to something else
      const available = Object.keys(actions);
      if (available.length > 0) {
        actionName = available.includes('Idle') ? 'Idle' : available[0];
      }
    }

    const action = actions[actionName];
    if (action) {
      action.reset().fadeIn(0.2).play();
      return () => {
        action.fadeOut(0.2);
      };
    }
  }, [animation, actions]);
  
  // Clone the scene so multiple avatars don't share the exact same material instances if we want to modify them later
  // For now just using the loaded scene directly is fine for one player, but primitive clone is better for multiple
  const clonedScene = React.useMemo(() => scene.clone(), [scene]);

  return (
    <group ref={group} scale={scale} dispose={null}>
      <primitive object={clonedScene} />
    </group>
  );
};

useGLTF.preload('/models/celestial_queen_lightstick_animated.glb');

import React, { useRef, useEffect, useState } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ChatBubbleProps {
  message: string;
  onComplete: () => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onComplete }) => {
  const groupRef = useRef<THREE.Group>(null);
  const htmlRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);

  // Simple distance culling
  useFrame(({ camera }) => {
    if (!groupRef.current || !htmlRef.current) return;
    const distance = camera.position.distanceTo(groupRef.current.position);
    
    if (distance > 20) {
      htmlRef.current.style.opacity = '0';
    } else if (visible) {
      htmlRef.current.style.opacity = '1';
    }
  });

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300); // wait for fade out animation
    }, 4000); // show for 4 seconds
    return () => clearTimeout(timer);
  }, [message, onComplete]);

  if (!message) return null;

  return (
    <group ref={groupRef} position={[0, 2.6, 0]}>
      <Html
        ref={htmlRef}
        center
        sprite
        zIndexRange={[100, 0]}
        className={`pointer-events-none select-none transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      >
        <div className="bg-white text-slate-900 px-3 py-1.5 rounded-2xl rounded-bl-none shadow-lg max-w-[200px] border border-slate-200">
          <p className="text-sm font-medium leading-tight text-center break-words line-clamp-2">
            {message}
          </p>
        </div>
      </Html>
    </group>
  );
};

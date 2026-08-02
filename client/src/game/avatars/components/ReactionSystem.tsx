import React, { useRef, useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Reaction {
  id: string;
  emoji: string;
  xOffset: number;
  createdAt: number;
}

interface ReactionSystemProps {
  reactionEvent?: { reaction: string; timestamp: number } | null;
}

export const ReactionSystem: React.FC<ReactionSystemProps> = ({ reactionEvent }) => {
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (reactionEvent) {
      setReactions((prev) => [
        ...prev,
        {
          id: `reaction-${Date.now()}-${Math.random()}`,
          emoji: reactionEvent.reaction,
          xOffset: (Math.random() - 0.5) * 1.5,
          createdAt: Date.now()
        }
      ]);
    }
  }, [reactionEvent]);

  useFrame(() => {
    // Cleanup old reactions
    const now = Date.now();
    const activeReactions = reactions.filter((r) => now - r.createdAt < 2000);
    if (activeReactions.length !== reactions.length) {
      setReactions(activeReactions);
    }
  });

  return (
    <group ref={groupRef} position={[0, 2.4, 0]}>
      {reactions.map((r) => (
        <ReactionParticle key={r.id} reaction={r} />
      ))}
    </group>
  );
};

const ReactionParticle: React.FC<{ reaction: Reaction }> = ({ reaction }) => {
  const htmlRef = useRef<HTMLDivElement>(null);
  
  useFrame(() => {
    if (!htmlRef.current) return;
    const elapsed = (Date.now() - reaction.createdAt) / 1000; // seconds
    const progress = Math.min(elapsed / 2, 1); // 2 seconds max
    
    // Float up and fade out
    const y = progress * 100; // pixels up
    const x = Math.sin(progress * Math.PI * 2) * 20 * reaction.xOffset;
    const opacity = 1 - Math.pow(progress, 3);
    const scale = 1 + progress * 0.5;

    htmlRef.current.style.transform = `translate3d(${x}px, -${y}px, 0) scale(${scale})`;
    htmlRef.current.style.opacity = opacity.toString();
  });

  return (
    <Html center sprite zIndexRange={[90, 0]} className="pointer-events-none select-none">
      <div ref={htmlRef} className="text-3xl filter drop-shadow-md will-change-transform">
        {reaction.emoji}
      </div>
    </Html>
  );
};

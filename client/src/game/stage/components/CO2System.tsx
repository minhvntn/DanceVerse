import React, { useEffect, useRef, useState } from 'react';
import { CO2Cannon } from '../effects/CO2Cannon';
import { ConcertVisualState } from '../stageVisuals';

interface CO2SystemProps {
  visualState: ConcertVisualState;
}

export const CO2System: React.FC<CO2SystemProps> = ({ visualState }) => {
  const [triggered, setTriggered] = useState(false);
  const previousVideoRef = useRef<string | null>(null);

  useEffect(() => {
    const changedTrack = Boolean(visualState.videoId && visualState.videoId !== previousVideoRef.current);
    previousVideoRef.current = visualState.videoId;
    const hostCelebration = visualState.cueType === 'fireworks' || visualState.cueType === 'lighting';
    if ((!changedTrack && !visualState.isBeatDrop && !hostCelebration) || !visualState.isPlaying) return;

    setTriggered(true);
    const timer = window.setTimeout(() => setTriggered(false), visualState.isBeatDrop ? 1700 : 2400);
    return () => window.clearTimeout(timer);
  }, [visualState.videoId, visualState.isBeatDrop, visualState.isPlaying, visualState.cueId, visualState.cueType]);

  if (visualState.quality === 'low') return null;

  return (
    <group>
      <CO2Cannon position={[-9.4, 1.05, -15.2]} trigger={triggered} />
      <CO2Cannon position={[9.4, 1.05, -15.2]} trigger={triggered} />
    </group>
  );
};

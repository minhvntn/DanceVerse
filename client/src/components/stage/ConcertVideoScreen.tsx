import React, { useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useRoomStore } from '../../stores/useRoomStore';
import { YouTubeStagePlayer } from './YouTubeStagePlayer';
import { ConcertScreenFallback } from './ConcertScreen';

export const ConcertVideoScreen: React.FC = () => {
  const musicState = useRoomStore((state) => state.musicState);
  const activeStageCue = useRoomStore((state) => state.activeStageCue);
  
  const [isFallback, setIsFallback] = useState(false);
  
  // Reset fallback state when a new video starts
  useEffect(() => {
    setIsFallback(false);
  }, [musicState?.currentVideoId]);

  const hasVideo = musicState && musicState.currentVideoId && musicState.status !== 'idle';
  
  // If the host triggered a screen cue, we temporarily force fallback to show the message
  const isMessageCueActive = activeStageCue?.type === 'screen';

  if (!hasVideo || isFallback || isMessageCueActive) {
    return <ConcertScreenFallback />;
  }

  const iframeWidth = 1920;
  const iframeHeight = 1080;
  
  // 94% of 28.5 width = 26.79
  const target3DWidth = 26.79;
  const scale = target3DWidth / iframeWidth;

  return (
    <>
      <meshBasicMaterial color="#000" />
      <Html
        transform
        center
        position={[0, 0, 0.01]}
        scale={0.016} // ~ 26.79 / 1600
        style={{ pointerEvents: 'none' }}
      >
        <div style={{
          width: '1600px',
          height: '900px',
          background: 'red',
          border: '20px solid yellow',
          boxSizing: 'border-box'
        }} />
      </Html>
    </>
  );
};

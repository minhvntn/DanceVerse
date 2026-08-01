import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useRoomStore } from '../../stores/useRoomStore';
import { YouTubeRoomPlayer } from '../youtube/YouTubeRoomPlayer';
import { ConcertScreenFallback } from './ConcertScreen';

export const ConcertVideoScreen: React.FC = () => {
  const musicState = useRoomStore((state) => state.musicState);
  const activeStageCue = useRoomStore((state) => state.activeStageCue);
  
  const [isFallback, setIsFallback] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { camera, size } = useThree();
  
  useEffect(() => {
    setIsFallback(false);
  }, [musicState?.currentVideoId]);

  const handlePlayerError = useCallback(() => {
    setIsFallback(true);
  }, []);

  const hasVideo = Boolean(musicState?.currentVideoId);
  const isMessageCueActive = activeStageCue?.type === 'screen';
  const shouldShowFallback = !hasVideo || isFallback || isMessageCueActive || musicState?.status === 'idle';

  // Plane dimensions in 3D
  const planeWidth = 26.79;
  const planeHeight = 10.15;
  const planePosition = new THREE.Vector3(0, 8.5, -22.05);

  useFrame(() => {
    if (!containerRef.current) return;
    
    // Calculate distance from camera to the plane
    const distance = camera.position.distanceTo(planePosition);
    
    // Calculate visible height at that distance (in 3D units)
    // fov is in degrees, convert to radians
    const fov = (camera as THREE.PerspectiveCamera).fov;
    const vFov = (fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(vFov / 2) * distance;
    
    // Map 3D units to screen pixels
    const pixelsPerUnit = size.height / visibleHeight;
    
    const widthPx = planeWidth * pixelsPerUnit;
    const heightPx = planeHeight * pixelsPerUnit;
    
    containerRef.current.style.width = `${widthPx}px`;
    containerRef.current.style.height = `${heightPx}px`;
  });

  return (
    <>
      {shouldShowFallback ? <ConcertScreenFallback /> : <meshBasicMaterial color="#000" />}

      {hasVideo && !isFallback && (
        <Html
          center
          position={[0, 0, 0.01]}
          style={{
            pointerEvents: 'none',
            opacity: shouldShowFallback ? 0 : 1,
            visibility: shouldShowFallback ? 'hidden' : 'visible'
          }}
          zIndexRange={[0, 0]}
        >
          <div
            ref={containerRef}
            style={{
              backgroundColor: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderRadius: '12px',
              boxShadow: '0 0 50px rgba(0, 240, 255, 0.2)'
            }}
          >
            <YouTubeRoomPlayer
              videoId={musicState!.currentVideoId!}
              musicState={musicState}
              onError={handlePlayerError}
              volume={100}
              isMuted={false}
              className="w-full h-full"
            />
          </div>
        </Html>
      )}
    </>
  );
};

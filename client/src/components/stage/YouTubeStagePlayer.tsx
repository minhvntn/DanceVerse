import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MusicState } from '../../../../shared/types';
import { useRoomStore } from '../../stores/useRoomStore';
import { socketService } from '../../services/socket.service';

interface YouTubeStagePlayerProps {
  videoId: string;
  musicState: MusicState | null;
  onError: () => void;
  width?: string;
  height?: string;
}

export const YouTubeStagePlayer: React.FC<YouTubeStagePlayerProps> = ({
  videoId,
  musicState,
  onError,
  width = '1920',
  height = '1080'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isApiLoaded, setIsApiLoaded] = useState<boolean>(!!window.YT && !!window.YT.Player);
  const isApplyingServerSyncRef = useRef(false);
  const loadedVideoIdRef = useRef<string | null>(null);
  const lastAppliedRevisionRef = useRef(-1);

  // Memoize onError to prevent reload loops if it changes
  const stableOnError = useCallback(() => {
    onError();
  }, [onError]);

  // Initialize YT API if not loaded
  useEffect(() => {
    if (isApiLoaded) return;
    const checkYT = setInterval(() => {
      if (window.YT && window.YT.Player) {
        setIsApiLoaded(true);
        clearInterval(checkYT);
      }
    }, 500);
    return () => clearInterval(checkYT);
  }, [isApiLoaded]);

  // Handle Player Errors
  const handleError = useCallback((event: any) => {
    const errorCode = event.data;
    if (errorCode === 101 || errorCode === 150 || errorCode === 2 || errorCode === 100) {
      console.warn(`[YouTubeStagePlayer] Video embed restricted or unavailable (code ${errorCode}).`);
      stableOnError();
    }
  }, [stableOnError]);

  // Only init/destroy when critical dependencies change (NOT musicState)
  useEffect(() => {
    if (!isApiLoaded || !containerRef.current || playerRef.current) return;
    if (loadedVideoIdRef.current === videoId) return;

    loadedVideoIdRef.current = videoId;
    
    playerRef.current = new window.YT.Player(containerRef.current, {
      width,
      height,
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        origin: window.location.origin
      },
      events: {
        onReady: (event: any) => {
          event.target.mute();
          event.target.setVolume(0);
          // Initial state applied in the sync effect
        },
        onError: handleError,
        onStateChange: (event: any) => {
          // Ignore state changes caused by our own sync
          if (isApplyingServerSyncRef.current) return;
          // We DO NOT emit anything to the server here! This is purely visual.
        }
      }
    });

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
        loadedVideoIdRef.current = null;
      }
    };
  }, [isApiLoaded, videoId, width, height, handleError]);

  // Apply Sync (run whenever musicState changes, but cautiously)
  useEffect(() => {
    if (!playerRef.current || !playerRef.current.playVideo || !musicState) return;

    // Prevent re-applying the exact same revision unless it's just progress sync
    if (musicState.revision !== undefined && musicState.revision === lastAppliedRevisionRef.current) {
      // It's the same revision. Is it just a time sync?
      // We'll let the interval handle drift. Return early if we already applied play/pause for this revision.
      // Wait, we still need to keep it updated if the status changed.
    }
    lastAppliedRevisionRef.current = musicState.revision || -1;

    try {
      isApplyingServerSyncRef.current = true;
      
      const playerState = playerRef.current.getPlayerState();
      
      if (musicState.status === 'playing') {
        const serverTime = socketService.getServerTime();
        const expectedTime = musicState.startedAt 
          ? (serverTime - musicState.startedAt) / 1000 
          : 0;

        const currentTime = playerRef.current.getCurrentTime() || 0;
        const drift = Math.abs(expectedTime - currentTime);

        if (drift > 1.5) {
          playerRef.current.seekTo(expectedTime, true);
        }
        
        if (playerState !== 1 && playerState !== 3) { // 1 = playing, 3 = buffering
          playerRef.current.playVideo();
        }
      } else {
        if (playerState === 1 || playerState === 3) {
          playerRef.current.pauseVideo();
        }
        if (musicState.pausedPosition !== undefined) {
          const currentTime = playerRef.current.getCurrentTime() || 0;
          if (Math.abs(currentTime - musicState.pausedPosition) > 1.5) {
            playerRef.current.seekTo(musicState.pausedPosition, true);
          }
        }
      }
    } catch (err) {
      console.warn('[YouTubeStagePlayer] Sync error', err);
    } finally {
      // Allow YT state changes to fire again
      setTimeout(() => {
        isApplyingServerSyncRef.current = false;
      }, 500);
    }
  }, [musicState]);

  // Periodic Drift Correction (runs every 5 seconds)
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (playerRef.current && playerRef.current.playVideo && musicState?.status === 'playing') {
        const serverTime = socketService.getServerTime();
        const expectedTime = musicState.startedAt ? (serverTime - musicState.startedAt) / 1000 : 0;
        const currentTime = playerRef.current.getCurrentTime() || 0;
        
        if (Math.abs(expectedTime - currentTime) > 2) {
          isApplyingServerSyncRef.current = true;
          playerRef.current.seekTo(expectedTime, true);
          setTimeout(() => { isApplyingServerSyncRef.current = false; }, 500);
        }
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [musicState?.status, musicState?.startedAt]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', backgroundColor: 'black' }} />;
};

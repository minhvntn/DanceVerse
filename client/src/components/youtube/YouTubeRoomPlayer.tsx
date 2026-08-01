import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MusicState } from '../../../../shared/types';
import { useRoomStore } from '../../stores/useRoomStore';
import { socketService } from '../../services/socket.service';

const DEBUG_MUSIC = import.meta.env.DEV;

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubeRoomPlayerProps {
  videoId: string;
  musicState: MusicState | null;
  volume?: number;
  isMuted?: boolean;
  className?: string;
  onPlayerReady?: () => void;
  onError?: () => void;
}

export const YouTubeRoomPlayer: React.FC<YouTubeRoomPlayerProps> = ({
  videoId,
  musicState,
  volume = 50,
  isMuted = false,
  className = '',
  onPlayerReady,
  onError
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isApiLoaded, setIsApiLoaded] = useState<boolean>(!!window.YT && !!window.YT.Player);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const musicStateRef = useRef<MusicState | null | undefined>(musicState);
  const videoIdRef = useRef<string | null | undefined>(videoId);
  const hasEndedRef = useRef<boolean>(false);
  const onErrorRef = useRef(onError);

  // Keep refs in sync with props
  useEffect(() => {
    musicStateRef.current = musicState;
  }, [musicState]);

  useEffect(() => {
    videoIdRef.current = videoId;
  }, [videoId]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // Load YouTube IFrame API script
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiLoaded(true);
      return;
    }

    const scriptId = 'youtube-iframe-api-script';
    if (!document.getElementById(scriptId)) {
      const tag = document.createElement('script');
      tag.id = scriptId;
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      setIsApiLoaded(true);
    };
  }, []);

  // Handle YouTube player state changes event-driven
  const handleStateChange = useCallback((event: any) => {
    const state = event.data;
    const ms = musicStateRef.current;
    if (DEBUG_MUSIC) console.log('[YT] onStateChange:', state, 'musicStatus:', ms?.status, 'rev:', ms?.revision);

    // -1 = UNSTARTED, 0 = ENDED, 1 = PLAYING, 2 = PAUSED, 3 = BUFFERING, 5 = CUED
    if (state === -1 || state === 2) {
      // Player is UNSTARTED or PAUSED — if server says playing, force play
      if (ms && ms.status === 'playing') {
        if (DEBUG_MUSIC) console.log('[YT] Forcing playVideo() — server says playing');
        setTimeout(() => {
          if (playerRef.current?.playVideo) {
            playerRef.current.playVideo();
          }
        }, 300);
      }
    }

    if (state === 1) {
      hasEndedRef.current = false;
      setPlayerError(null);
    }

    if (state === 0 && !hasEndedRef.current && ms && ms.status === 'playing') {
      const currentTime = playerRef.current?.getCurrentTime?.() || 0;
      if (DEBUG_MUSIC) console.log('[YT] ENDED, currentTime:', currentTime);
      if (currentTime > 10) {
        hasEndedRef.current = true;
        const socket = socketService.getSocket();
        const roomId = useRoomStore.getState().currentRoom?.id;
        if (socket && roomId && ms.currentVideoId) {
          socket.emit('CLIENT_MUSIC_ENDED', { roomId });
        }
      } else {
        // Premature end — try replaying
        if (DEBUG_MUSIC) console.log('[YT] Premature end, replaying');
        setTimeout(() => {
          if (playerRef.current?.playVideo) {
            playerRef.current.seekTo(0, true);
            playerRef.current.playVideo();
          }
        }, 500);
      }
    }
  }, []);

  // Handle YouTube player errors with clear messages
  const handleError = useCallback((event: any) => {
    const errorCode = event.data;
    const errorMessages: Record<number, string> = {
      2: 'Invalid video ID',
      5: 'HTML5 player error — video cannot be played',
      100: 'Video not found or has been removed',
      101: 'Video owner does not allow embedding',
      150: 'Video owner does not allow embedding'
    };
    const msg = errorMessages[errorCode] || `YouTube error (code ${errorCode})`;
    console.warn('[YouTubePlayer] Error:', msg);
    setPlayerError(msg);
    onErrorRef.current?.();
  }, []);

  // Initialize YT.Player once API is loaded and container is mounted
  useEffect(() => {
    if (!isApiLoaded || !containerRef.current || playerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      videoId: videoId || undefined,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        enablejsapi: 1,
        origin: window.location.origin
      },
      events: {
        onReady: (event: any) => {
          setIsReady(true);
          event.target.setVolume(isMuted ? 0 : Math.max(0, Math.min(100, volume)));
          if (onPlayerReady) onPlayerReady();
          event.target.playVideo();
        },
        onStateChange: handleStateChange,
        onError: handleError
      }
    });

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
      if (playerRef.current?.destroy) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [isApiLoaded, handleStateChange, handleError]);

  // Update videoId when track changes
  useEffect(() => {
    if (!isReady || !playerRef.current || !videoId) return;
    const currentVideoUrl = playerRef.current.getVideoUrl?.() || '';
    if (!currentVideoUrl.includes(videoId)) {
      hasEndedRef.current = false;
      setPlayerError(null);
      playerRef.current.loadVideoById(videoId);
    }
  }, [videoId, isReady]);

  // Update volume & mute
  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    if (isMuted) {
      playerRef.current.mute();
    } else {
      playerRef.current.unMute();
      playerRef.current.setVolume(Math.max(0, Math.min(100, volume)));
    }
  }, [volume, isMuted, isReady]);

  // Sync loop — reads musicState from ref so dependency is only [isReady].
  // This prevents interval teardown on every musicState change.
  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    const syncPlayer = () => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
      const ms = musicStateRef.current;
      if (!ms) return;

      if (ms.status === 'playing' && ms.startedAt) {
        const serverTime = socketService.getServerTime();
        let expectedTime = (serverTime - ms.startedAt) / 1000;
        if (expectedTime < 0) expectedTime = 0;

        const currentTime = playerRef.current.getCurrentTime?.() || 0;
        const state = playerRef.current.getPlayerState?.() ?? null;
        const drift = Math.abs(currentTime - expectedTime);

        if (DEBUG_MUSIC) console.log(`[SYNC] st=${state} cur=${currentTime.toFixed(1)} exp=${expectedTime.toFixed(1)} drift=${drift.toFixed(1)}`);

        // Only hard-seek if drift > 1.5s and not buffering
        if (state !== 3 && drift > 1.5) {
          if (DEBUG_MUSIC) console.log(`[SYNC] Seeking to ${expectedTime.toFixed(1)} (drift=${drift.toFixed(1)})`);
          playerRef.current.seekTo(expectedTime, true);
        }

        // Nudge play if paused/unstarted but should be playing
        if (state === 2 || state === -1) {
          if (DEBUG_MUSIC) console.log('[SYNC] Nudging playVideo, state=', state);
          playerRef.current.playVideo();
        }
        // state === 0 (ENDED) handled by onStateChange, not here
      } else if (ms.status === 'paused') {
        const state = playerRef.current.getPlayerState?.() ?? null;
        if (state === 1) {
          playerRef.current.pauseVideo();
        }
        if (ms.pausedPosition !== undefined && ms.pausedPosition > 0) {
          const currentTime = playerRef.current.getCurrentTime?.() || 0;
          if (Math.abs(currentTime - ms.pausedPosition) > 1.5) {
            playerRef.current.seekTo(ms.pausedPosition, true);
          }
        }
      }
    };

    syncPlayer();
    syncIntervalRef.current = setInterval(syncPlayer, 2000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, [isReady]);

  // Immediate sync on significant musicState changes (play/pause/track change)
  useEffect(() => {
    if (!isReady || !playerRef.current || !musicState) return;
    const state = playerRef.current.getPlayerState?.() ?? null;

    if (musicState.status === 'playing') {
      if (state === 2 || state === -1 || state === 5) {
        playerRef.current.playVideo();
      }
    } else if (musicState.status === 'paused') {
      if (state === 1) {
        playerRef.current.pauseVideo();
      }
    }
  }, [musicState?.status, musicState?.currentVideoId, musicState?.revision, isReady]);

  return (
    <div className={`relative w-full h-full bg-black overflow-hidden rounded-lg ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
      {playerError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
          <div className="text-center px-6">
            <p className="text-red-400 text-lg font-bold mb-2">⚠️ Playback Error</p>
            <p className="text-white/70 text-sm">{playerError}</p>
          </div>
        </div>
      )}
    </div>
  );
};

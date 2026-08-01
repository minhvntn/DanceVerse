import { useEffect, useRef } from 'react';
import { useRoomStore } from '../stores/useRoomStore';
import { socketService } from '../services/socket.service';
import { StageCue } from '../types';

// Default show timeline for any song
const DEFAULT_TIMELINE: StageCue[] = [
  { id: 't1', timeSeconds: 0, type: 'lighting', payload: { preset: 'intro' } },
  { id: 't2', timeSeconds: 5, type: 'camera', payload: { angle: 'wide' } },
  { id: 't3', timeSeconds: 15, type: 'laser', payload: { sweep: true } },
  { id: 't4', timeSeconds: 25, type: 'camera', payload: { angle: 'dj' } },
  { id: 't5', timeSeconds: 35, type: 'screen', payload: { message: 'MAKE SOME NOISE' } },
  { id: 't6', timeSeconds: 40, type: 'camera', payload: { angle: 'audience' } },
  { id: 't7', timeSeconds: 50, type: 'confetti', payload: {} },
  { id: 't8', timeSeconds: 65, type: 'camera', payload: { angle: 'side-left' } },
  { id: 't9', timeSeconds: 80, type: 'fireworks', payload: {} },
  { id: 't10', timeSeconds: 95, type: 'camera', payload: { angle: 'side-right' } },
];

export const useShowTimeline = () => {
  const musicState = useRoomStore((state) => state.musicState);
  const setActiveStageCue = useRoomStore((state) => state.setActiveStageCue);
  
  // Track which cues have been fired for the current revision
  const firedCuesRef = useRef<Set<string>>(new Set());
  const lastRevisionRef = useRef<number | null>(null);

  useEffect(() => {
    if (!musicState) return;

    // Reset fired cues if the music revision changes (e.g. seek, skip, play new)
    if (musicState.revision !== lastRevisionRef.current) {
      firedCuesRef.current.clear();
      lastRevisionRef.current = musicState.revision;
      setActiveStageCue(null);
    }

    if (musicState.status !== 'playing' || !musicState.startedAt) return;

    const interval = setInterval(() => {
      const serverTime = socketService.getServerTime();
      let currentSeconds = (serverTime - musicState.startedAt!) / 1000;
      if (currentSeconds < 0) currentSeconds = 0;

      // Find all cues that should have fired by now but haven't
      const pendingCues = DEFAULT_TIMELINE.filter(cue => 
        cue.timeSeconds <= currentSeconds && 
        !firedCuesRef.current.has(cue.id)
      );

      // Only dispatch the most recent cue if multiple passed (e.g. due to seek jumping forward)
      // Actually, if we jump forward, we might want to skip effects like confetti, 
      // but we definitely want camera/lighting states.
      // For simplicity, we just dispatch all pending cues quickly, or just the most relevant.
      if (pendingCues.length > 0) {
        pendingCues.forEach(cue => {
          firedCuesRef.current.add(cue.id);
          // Only actually dispatch if it's within 2 seconds of its intended time
          // This prevents a seek from 0 to 100 triggering 10 confetti blasts at once
          if (currentSeconds - cue.timeSeconds <= 2.0) {
            setActiveStageCue(cue);
          }
        });
      }

    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [musicState, setActiveStageCue]);
};

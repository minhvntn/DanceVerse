import { useRoomStore } from '../../stores/useRoomStore';
import { audioService } from '../../services/audio.service';
import { socketService } from '../../services/socket.service';

export interface BeatState {
  beatIndex: number;
  beatPhase: number; // 0 to 1
  barIndex: number;
  beatInBar: number;
  bpm: number;
  isPaused: boolean;
}

export type BeatListener = (state: BeatState) => void;
export type BarListener = (state: BeatState) => void;

class BeatClockManager {
  private listeners: Set<(state: BeatState) => void> = new Set();
  private beatListeners: Set<BeatListener> = new Set();
  private barListeners: Set<BarListener> = new Set();
  
  private lastBeatIndex: number = -1;
  private lastBarIndex: number = -1;

  public subscribe(listener: (state: BeatState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public onBeat(listener: BeatListener) {
    this.beatListeners.add(listener);
    return () => this.beatListeners.delete(listener);
  }

  public onBar(listener: BarListener) {
    this.barListeners.add(listener);
    return () => this.barListeners.delete(listener);
  }

  public getState(): BeatState {
    const { musicState, currentTrack } = useRoomStore.getState();
    const bpm = currentTrack?.metadata?.bpm || 120;
    const beatOffsetSeconds = currentTrack?.metadata?.beatOffsetSeconds || 0;
    const beatsPerBar = currentTrack?.metadata?.beatsPerBar || 4;
    const isPaused = !musicState || musicState.status !== 'playing';

    if (!musicState || !currentTrack) {
      return { beatIndex: 0, beatPhase: 0, barIndex: 0, beatInBar: 0, bpm, isPaused: true };
    }

    let elapsed = 0;
    if (musicState.status === 'playing' && musicState.startedAt) {
      // Determine audio current time
      const ytPlayerTime = (window as any).__YOUTUBE_PLAYER_TIME; 
      // If we use youtube, we can't reliably read it synchronously unless we store it or use socket time.
      // For precision, we use server synchronized time.
      elapsed = (socketService.getServerTime() - musicState.startedAt) / 1000;
      
      // Fallback to audioService if local MP3
      if (currentTrack.source !== 'youtube') {
        elapsed = audioService.getCurrentTime();
      }
    } else {
      elapsed = musicState.pausedPosition || 0;
    }

    const relativeTime = Math.max(0, elapsed - beatOffsetSeconds);
    const beatDuration = 60 / Math.max(1, bpm); // seconds per beat
    
    const beatIndex = Math.floor(relativeTime / beatDuration);
    const beatPhase = (relativeTime % beatDuration) / beatDuration;
    
    const barIndex = Math.floor(beatIndex / beatsPerBar);
    const beatInBar = beatIndex % beatsPerBar;

    return {
      beatIndex,
      beatPhase,
      barIndex,
      beatInBar,
      bpm,
      isPaused
    };
  }

  public update() {
    const state = this.getState();
    
    // Notify all tick listeners (e.g. for useFrame)
    for (const listener of this.listeners) {
      listener(state);
    }

    // Trigger beat events
    if (state.beatIndex !== this.lastBeatIndex && !state.isPaused) {
      this.lastBeatIndex = state.beatIndex;
      for (const listener of this.beatListeners) {
        listener(state);
      }
      
      if (state.barIndex !== this.lastBarIndex) {
        this.lastBarIndex = state.barIndex;
        for (const listener of this.barListeners) {
          listener(state);
        }
      }
    }
  }

  public reset() {
    this.lastBeatIndex = -1;
    this.lastBarIndex = -1;
  }
}

export const BeatClock = new BeatClockManager();

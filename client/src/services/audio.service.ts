import { Track, MusicState } from '../types';

class AudioService {
  private audio: HTMLAudioElement | null = null;
  private currentTrackId: string | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.5;
  private hasUserInteracted: boolean = false;

  public unlockAudio(): void {
    this.hasUserInteracted = true;
    if (this.audio && this.audio.paused && !this.isMuted) {
      this.audio.play().catch(() => {});
    }
  }

  public syncMusic(track: Track | null, musicState: MusicState | null): void {
    if (!track || !musicState) {
      this.stop();
      return;
    }

    if (track.source === 'youtube' || !track.url) {
      if (this.audio) {
        this.audio.pause();
        this.audio = null;
      }
      this.currentTrackId = track.id;
      return;
    }

    if (this.currentTrackId !== track.id || !this.audio) {
      this.stop();
      this.audio = new Audio(track.url);
      this.audio.loop = true;
      this.audio.volume = this.isMuted ? 0 : this.volume;
      this.currentTrackId = track.id;
    }

    const isPlaying = musicState.isPlaying || musicState.status === 'playing';
    if (isPlaying && this.audio) {
      const startedAt = musicState.startedAt || Date.now();
      const expectedTime = (Date.now() - startedAt) / 1000;
      const trackTime = expectedTime % (track.duration || 180);

      // Avoid glitchy resets if already close (within 0.8s)
      if (Math.abs(this.audio.currentTime - trackTime) > 0.8) {
        this.audio.currentTime = trackTime;
      }

      if (this.audio.paused && !this.isMuted && this.hasUserInteracted) {
        this.audio.play().catch(() => {
          // Browser autoplay restrictions require user gesture
        });
      }
    } else if (!isPlaying && this.audio) {
      this.audio.pause();
    }
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.audio) {
      this.audio.volume = muted ? 0 : this.volume;
      if (!muted && this.audio.paused) {
        this.audio.play().catch(() => {});
      }
    }
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio && !this.isMuted) {
      this.audio.volume = this.volume;
    }
  }

  public getCurrentTime(): number {
    return this.audio ? this.audio.currentTime : 0;
  }

  public stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio = null;
      this.currentTrackId = null;
    }
  }
}

export const audioService = new AudioService();

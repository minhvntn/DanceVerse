class DanceSfxManager {
  private ctx: AudioContext | null = null;
  private volume: number = 0.6;
  private enabled: boolean = true;
  private mainGain: GainNode | null = null;

  public init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.mainGain = this.ctx.createGain();
        this.mainGain.gain.value = this.volume;
        this.mainGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.mainGain) {
      this.mainGain.gain.value = this.volume;
    }
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public getVolume() { return this.volume; }
  public isEnabled() { return this.enabled; }

  private playTone(
    freqStart: number, 
    freqEnd: number, 
    duration: number, 
    type: OscillatorType = 'sine',
    vol: number = 1
  ) {
    if (!this.enabled || !this.ctx || !this.mainGain) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    const now = this.ctx.currentTime;
    
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, now + duration * 0.8);
    }

    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(gain);
    gain.connect(this.mainGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  public playArrowTick() {
    this.init();
    // Very short, soft high-pitch click
    this.playTone(1200, 1500, 0.05, 'sine', 0.1);
  }

  public playSequenceReady() {
    this.init();
    // Light ding
    this.playTone(880, 880, 0.15, 'sine', 0.15);
    setTimeout(() => this.playTone(1760, 1760, 0.2, 'sine', 0.15), 50);
  }

  public playJudgement(result: 'PerfectMax' | 'Perfect' | 'Great' | 'Good' | 'Miss') {
    this.init();
    if (!this.enabled || !this.ctx || !this.mainGain) return;

    const now = this.ctx.currentTime;
    
    switch (result) {
      case 'Miss': {
        this.playTone(150, 50, 0.2, 'square', 0.2);
        break;
      }
      case 'Good': {
        this.playTone(400, 400, 0.1, 'sine', 0.3);
        break;
      }
      case 'Great': {
        this.playTone(600, 800, 0.15, 'triangle', 0.3);
        setTimeout(() => this.playTone(1200, 1200, 0.1, 'sine', 0.2), 50);
        break;
      }
      case 'Perfect': {
        this.playTone(880, 880, 0.15, 'sine', 0.4);
        this.playTone(1318.51, 1318.51, 0.2, 'sine', 0.3); // E6
        setTimeout(() => this.playTone(1760, 2000, 0.15, 'triangle', 0.3), 30);
        break;
      }
      case 'PerfectMax': {
        // Impact
        this.playTone(200, 40, 0.2, 'square', 0.3);
        // Crystal chord
        this.playTone(1046.50, 1046.50, 0.25, 'sine', 0.5); // C6
        this.playTone(1318.51, 1318.51, 0.25, 'sine', 0.4); // E6
        this.playTone(1567.98, 1567.98, 0.25, 'sine', 0.4); // G6
        // Sparkle
        setTimeout(() => this.playTone(2093, 3000, 0.15, 'triangle', 0.3), 20);
        setTimeout(() => this.playTone(4186, 4000, 0.1, 'sine', 0.2), 60);
        break;
      }
    }
  }

  public playComboMilestone(combo: number) {
    this.init();
    if (combo === 10) {
      this.playTone(440, 440, 0.2, 'sine', 0.3);
      setTimeout(() => this.playTone(660, 660, 0.3, 'sine', 0.3), 100);
    } else if (combo === 25) {
      this.playTone(523.25, 523.25, 0.2, 'sine', 0.3);
      setTimeout(() => this.playTone(659.25, 659.25, 0.2, 'sine', 0.3), 100);
      setTimeout(() => this.playTone(783.99, 783.99, 0.4, 'sine', 0.3), 200);
    } else if (combo === 50) {
      this.playTone(523.25, 523.25, 0.15, 'triangle', 0.4);
      setTimeout(() => this.playTone(783.99, 783.99, 0.15, 'triangle', 0.4), 100);
      setTimeout(() => this.playTone(1046.50, 1046.50, 0.5, 'triangle', 0.4), 200);
    } else if (combo >= 100 && combo % 100 === 0) {
      this.playTone(1046.50, 1046.50, 0.15, 'square', 0.3);
      setTimeout(() => this.playTone(1318.51, 1318.51, 0.15, 'square', 0.3), 100);
      setTimeout(() => this.playTone(1567.98, 1567.98, 0.15, 'square', 0.3), 200);
      setTimeout(() => this.playTone(2093, 2093, 0.6, 'square', 0.3), 300);
    }
  }

  public playLevelUp() {
    this.init();
    if (!this.enabled || !this.ctx || !this.mainGain) return;
    // Ascending celebratory fanfare chord
    this.playTone(587.33, 587.33, 0.15, 'sine', 0.35); // D5
    setTimeout(() => this.playTone(739.99, 739.99, 0.15, 'sine', 0.35), 80); // F#5
    setTimeout(() => this.playTone(880.00, 880.00, 0.15, 'sine', 0.4), 160); // A5
    setTimeout(() => {
      this.playTone(1174.66, 1174.66, 0.4, 'triangle', 0.5); // D6
      this.playTone(1760.00, 1760.00, 0.4, 'sine', 0.3); // A6
    }, 240);
  }
}

export const danceSfx = new DanceSfxManager();

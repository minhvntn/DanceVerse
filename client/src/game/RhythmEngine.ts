import { BeatClock } from './stage/BeatClock';

export class RhythmEngine {
  // Thresholds in ms
  private static THRESHOLD_PERFECT = 80;
  private static THRESHOLD_GREAT = 150;
  private static THRESHOLD_GOOD = 250;

  // Base scores
  private static SCORE_PERFECT = 100;
  private static SCORE_GREAT = 75;
  private static SCORE_GOOD = 50;
  private static SCORE_MISS = 0;

  // Energy values
  private static ENERGY_PERFECT = 2.0;
  private static ENERGY_GREAT = 1.0;
  private static ENERGY_GOOD = 0.5;
  private static ENERGY_MISS = 0;

  public static evaluateHit(currentAudioTimeMs: number): {
    rating: 'perfect' | 'great' | 'good' | 'miss';
    scoreAdd: number;
    energyAdd: number;
    multiplier: number;
  } {
    const beatState = BeatClock.getState();
    const bpm = beatState.bpm || 120;
    const beatIntervalMs = (60 / bpm) * 1000;
    
    // Evaluate based on the phase instead of currentAudioTime directly,
    // to account for beat offsets
    const diffPhase = beatState.beatPhase > 0.5 ? 1.0 - beatState.beatPhase : beatState.beatPhase;
    const diffMs = diffPhase * beatIntervalMs;

    if (diffMs <= this.THRESHOLD_PERFECT) {
      return { rating: 'perfect', scoreAdd: this.SCORE_PERFECT, energyAdd: this.ENERGY_PERFECT, multiplier: 1 };
    }
    if (diffMs <= this.THRESHOLD_GREAT) {
      return { rating: 'great', scoreAdd: this.SCORE_GREAT, energyAdd: this.ENERGY_GREAT, multiplier: 1 };
    }
    if (diffMs <= this.THRESHOLD_GOOD) {
      return { rating: 'good', scoreAdd: this.SCORE_GOOD, energyAdd: this.ENERGY_GOOD, multiplier: 1 };
    }
    
    return { rating: 'miss', scoreAdd: this.SCORE_MISS, energyAdd: this.ENERGY_MISS, multiplier: 1 };
  }

  public static calculateMultiplier(combo: number): number {
    if (combo >= 50) return 2.0;
    if (combo >= 25) return 1.5;
    if (combo >= 10) return 1.2;
    return 1.0;
  }
}

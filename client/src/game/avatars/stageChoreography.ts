import type { DanceAnimationType } from '../../types';

export type StageChoreographySection = 'Intro' | 'Verse' | 'Chorus' | 'Dance Break' | 'Finale';

export interface StageChoreographyStep {
  id: string;
  section: StageChoreographySection;
  startSeconds: number;
  durationSeconds: number;
  animation: DanceAnimationType;
}

export const STAGE_CHOREOGRAPHY_DURATION = 96;

export const STAGE_CHOREOGRAPHY: readonly StageChoreographyStep[] = [
  { id: 'intro-wave', section: 'Intro', startSeconds: 0, durationSeconds: 4, animation: 'Wave' },
  { id: 'intro-clap', section: 'Intro', startSeconds: 4, durationSeconds: 4, animation: 'Clap' },
  { id: 'verse-hiphop-a', section: 'Verse', startSeconds: 8, durationSeconds: 8, animation: 'HipHop' },
  { id: 'verse-shuffle-a', section: 'Verse', startSeconds: 16, durationSeconds: 8, animation: 'Shuffle' },
  { id: 'verse-hiphop-b', section: 'Verse', startSeconds: 24, durationSeconds: 8, animation: 'HipHop' },
  { id: 'chorus-cheer', section: 'Chorus', startSeconds: 32, durationSeconds: 4, animation: 'Cheer' },
  { id: 'chorus-random', section: 'Chorus', startSeconds: 36, durationSeconds: 8, animation: 'RandomDance' },
  { id: 'chorus-spin', section: 'Chorus', startSeconds: 44, durationSeconds: 4, animation: 'Spin' },
  { id: 'break-moonwalk', section: 'Dance Break', startSeconds: 48, durationSeconds: 8, animation: 'Moonwalk' },
  { id: 'break-breakdance', section: 'Dance Break', startSeconds: 56, durationSeconds: 8, animation: 'Breakdance' },
  { id: 'finale-shuffle', section: 'Finale', startSeconds: 64, durationSeconds: 8, animation: 'Shuffle' },
  { id: 'finale-hiphop', section: 'Finale', startSeconds: 72, durationSeconds: 8, animation: 'HipHop' },
  { id: 'finale-cheer', section: 'Finale', startSeconds: 80, durationSeconds: 4, animation: 'Cheer' },
  { id: 'finale-spin', section: 'Finale', startSeconds: 84, durationSeconds: 4, animation: 'Spin' },
  { id: 'finale-random', section: 'Finale', startSeconds: 88, durationSeconds: 8, animation: 'RandomDance' }
];

export const getStageChoreographyStep = (playbackSeconds: number): StageChoreographyStep => {
  const safeSeconds = Number.isFinite(playbackSeconds) ? Math.max(0, playbackSeconds) : 0;
  const routineSeconds = safeSeconds % STAGE_CHOREOGRAPHY_DURATION;

  return STAGE_CHOREOGRAPHY.find((step) => (
    routineSeconds >= step.startSeconds &&
    routineSeconds < step.startSeconds + step.durationSeconds
  )) ?? STAGE_CHOREOGRAPHY[0];
};

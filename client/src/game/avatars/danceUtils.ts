import { DanceAnimationType } from '../../types';

export const AUTO_DANCE_ANIMATIONS = [
  'HipHop',
  'Shuffle',
  'Cheer',
  'RandomDance'
] as const satisfies readonly DanceAnimationType[];

const hashSeed = (seed: string | number): number => {
  const value = String(seed);
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
};

export const getAutoDanceAnimation = (seed: string | number): DanceAnimationType => {
  return AUTO_DANCE_ANIMATIONS[hashSeed(seed) % AUTO_DANCE_ANIMATIONS.length];
};

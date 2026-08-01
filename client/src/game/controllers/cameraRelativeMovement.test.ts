import { describe, expect, it } from 'vitest';
import { getCameraRelativeMovement } from './cameraRelativeMovement';

const expectDirection = (
  actual: { x: number; z: number },
  expected: { x: number; z: number }
) => {
  expect(actual.x).toBeCloseTo(expected.x, 6);
  expect(actual.z).toBeCloseTo(expected.z, 6);
};

describe('getCameraRelativeMovement', () => {
  it('moves W toward default camera forward on negative Z', () => {
    expectDirection(
      getCameraRelativeMovement(0, 1, 0, -1),
      { x: 0, z: -1 }
    );
  });

  it('moves W with a camera rotated 90 degrees', () => {
    expectDirection(
      getCameraRelativeMovement(0, 1, 1, 0),
      { x: 1, z: 0 }
    );
  });

  it('keeps A and D perpendicular to camera forward', () => {
    expectDirection(
      getCameraRelativeMovement(-1, 0, 1, 0),
      { x: 0, z: -1 }
    );
    expectDirection(
      getCameraRelativeMovement(1, 0, 1, 0),
      { x: 0, z: 1 }
    );
  });

  it('normalizes diagonal movement', () => {
    const result = getCameraRelativeMovement(1, 1, 0, -1);
    expect(Math.hypot(result.x, result.z)).toBeCloseTo(1, 6);
    expectDirection(result, {
      x: Math.SQRT1_2,
      z: -Math.SQRT1_2
    });
  });

  it('falls back to negative Z for a vertical camera direction', () => {
    expectDirection(
      getCameraRelativeMovement(0, 1, 0, 0),
      { x: 0, z: -1 }
    );
  });
});

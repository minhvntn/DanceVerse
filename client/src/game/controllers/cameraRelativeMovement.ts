export interface FlatMovement {
  x: number;
  z: number;
}

const EPSILON = 1e-6;

export function getCameraRelativeMovement(
  inputRight: number,
  inputForward: number,
  cameraForwardX: number,
  cameraForwardZ: number
): FlatMovement {
  let forwardX = cameraForwardX;
  let forwardZ = cameraForwardZ;
  const forwardLength = Math.hypot(forwardX, forwardZ);

  if (forwardLength < EPSILON) {
    forwardX = 0;
    forwardZ = -1;
  } else {
    forwardX /= forwardLength;
    forwardZ /= forwardLength;
  }

  const rightX = -forwardZ;
  const rightZ = forwardX;
  const movementX = rightX * inputRight + forwardX * inputForward;
  const movementZ = rightZ * inputRight + forwardZ * inputForward;
  const movementLength = Math.hypot(movementX, movementZ);

  if (movementLength < EPSILON) {
    return { x: 0, z: 0 };
  }

  return {
    x: movementX / movementLength,
    z: movementZ / movementLength
  };
}

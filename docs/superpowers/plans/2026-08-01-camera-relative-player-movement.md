# Camera-Relative Player Movement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make WASD follow the rotated Player Camera while preserving movement behavior in Concert and Cinematic modes.

**Architecture:** Extract camera-relative X/Z vector math into a pure helper with no Three.js dependency, then call it from `PlayerController` only when `cameraMode === 'player'`. Continue using the existing normalized world-axis path for the other camera modes and leave the socket payload unchanged.

**Tech Stack:** React 18, TypeScript 5.5, React Three Fiber, Three.js 0.166, Zustand, Vitest 2.1.

## Global Constraints

- In Player Camera mode, `W/S/A/D` follow camera forward/back/left/right projected onto the floor.
- Diagonal movement stays normalized.
- Degenerate flattened camera direction falls back to world forward `(0, -1)`.
- Keep speed, Shift run, animation, avatar facing, audience bounds, and Socket.IO move payload unchanged.
- Keep Concert and Cinematic movement on the existing world axes.
- Do not change `CameraController`, server code, event formats, room state, or deployment.

---

## File Structure

- Create `client/src/game/controllers/cameraRelativeMovement.ts`: pure floor-plane vector conversion.
- Create `client/src/game/controllers/cameraRelativeMovement.test.ts`: direction, normalization, and fallback regression tests.
- Modify `client/src/game/controllers/PlayerController.tsx`: use current frame camera direction in Player mode.

### Task 1: Add the camera-relative movement helper

**Files:**
- Create: `client/src/game/controllers/cameraRelativeMovement.test.ts`
- Create: `client/src/game/controllers/cameraRelativeMovement.ts`

**Interfaces:**
- Produces: `getCameraRelativeMovement(inputRight: number, inputForward: number, cameraForwardX: number, cameraForwardZ: number): FlatMovement`.
- Produces: `FlatMovement = { x: number; z: number }` with normalized length for nonzero input.

- [ ] **Step 1: Write the failing movement tests**

Create `client/src/game/controllers/cameraRelativeMovement.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm test --prefix client -- src/game/controllers/cameraRelativeMovement.test.ts
```

Expected: FAIL because `./cameraRelativeMovement` does not exist.

- [ ] **Step 3: Implement the pure helper**

Create `client/src/game/controllers/cameraRelativeMovement.ts`:

```ts
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
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run:

```powershell
npm test --prefix client -- src/game/controllers/cameraRelativeMovement.test.ts
```

Expected: PASS, 5 tests passing.

- [ ] **Step 5: Commit the independently testable helper**

```powershell
git add client/src/game/controllers/cameraRelativeMovement.ts client/src/game/controllers/cameraRelativeMovement.test.ts
git commit -m "test: cover camera-relative movement"
```

### Task 2: Apply the camera direction in PlayerController

**Files:**
- Modify: `client/src/game/controllers/PlayerController.tsx`
- Test: `client/src/game/controllers/cameraRelativeMovement.test.ts`

**Interfaces:**
- Consumes: `getCameraRelativeMovement` from Task 1.
- Consumes: `state.camera.getWorldDirection(target)` from React Three Fiber's frame state.
- Produces: existing normalized `nx/nz` world movement used by position, rotation, bounds, and socket emission.

- [ ] **Step 1: Add stable camera movement inputs**

Import the helper:

```ts
import { getCameraRelativeMovement } from './cameraRelativeMovement';
```

Read the active camera mode and add a reusable vector:

```ts
const cameraMode = useRoomStore((state) => state.cameraMode);
const cameraForwardRef = useRef(new THREE.Vector3());
```

- [ ] **Step 2: Replace only the direction calculation inside useFrame**

Keep the existing `moveX`, `moveZ`, `isMoving`, speed, bounds, position, rotation, and socket code. Replace:

```ts
const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
const nx = moveX / length;
const nz = moveZ / length;
```

with:

```ts
let nx: number;
let nz: number;

if (cameraMode === 'player') {
  state.camera.getWorldDirection(cameraForwardRef.current);
  const movement = getCameraRelativeMovement(
    moveX,
    -moveZ,
    cameraForwardRef.current.x,
    cameraForwardRef.current.z
  );
  nx = movement.x;
  nz = movement.z;
} else {
  const length = Math.hypot(moveX, moveZ);
  nx = moveX / length;
  nz = moveZ / length;
}
```

The `-moveZ` conversion preserves the existing input mapping where `W`
sets `moveZ = -1` while the helper defines forward input as positive.

- [ ] **Step 3: Run the complete client tests**

Run:

```powershell
npm test --prefix client
```

Expected: PASS, 11 tests passing.

- [ ] **Step 4: Run typecheck and client production build**

Run:

```powershell
npm run typecheck --prefix client
npm run build --prefix client
```

Expected: both commands exit 0. The existing Vite large-chunk warning is allowed.

- [ ] **Step 5: Verify the diff stays in scope**

Run:

```powershell
git diff --check
git status --short
```

Expected: only `PlayerController.tsx` is modified after Task 1's commit and no whitespace errors are reported.

- [ ] **Step 6: Commit the controller integration**

```powershell
git add client/src/game/controllers/PlayerController.tsx
git commit -m "fix: align Player Camera movement with view"
```

## Final Verification

- [ ] Run `npm test --prefix client` and confirm 11 tests pass.
- [ ] Run `npm run build --prefix client` and confirm exit code 0.
- [ ] Confirm the commits remain local and do not push or redeploy without explicit approval.


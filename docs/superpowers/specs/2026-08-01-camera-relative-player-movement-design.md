# Camera-Relative Player Movement Design

## Problem

`PlayerController` currently maps WASD directly to the world's X/Z axes.
`OrbitControls` can rotate the Player Camera around the avatar, but the
movement axes do not rotate with it. After the user changes the camera angle,
the keys no longer match the directions visible on screen.

## Required behavior

- In Player Camera mode, `W` moves along the camera's forward direction
  projected onto the floor.
- `S` moves backward relative to the camera.
- `A` and `D` move left and right relative to the camera.
- Diagonal movement stays normalized and does not become faster.
- Movement remains on the floor and keeps the existing audience bounds.
- Existing speed, run modifier, animation, avatar facing, and Socket.IO move
  payload behavior remain unchanged.
- Concert and Cinematic Camera movement behavior remains unchanged.

## Design

Create a small pure movement helper that converts two-dimensional input and a
camera forward vector into a normalized world-space X/Z direction.

For Player Camera mode, `PlayerController` obtains the current Three.js camera
forward vector during `useFrame`, removes its Y component, and passes the
flattened X/Z direction with the WASD input to the helper. The helper derives a
right vector perpendicular to camera forward and combines forward/back and
left/right input.

For Concert and Cinematic modes, `PlayerController` keeps the current
world-axis calculation so automatic camera changes do not alter movement.

## Degenerate camera direction

If the flattened camera forward vector has effectively zero length, the helper
uses world forward `(0, -1)` on the X/Z plane. This prevents NaN positions or
rotation values when a camera is almost vertical.

## Testing

Add pure Vitest coverage for:

- Default camera forward: `W` produces negative Z.
- Camera rotated 90 degrees: `W` follows the rotated screen-forward direction.
- `A` and `D` remain perpendicular to camera forward.
- Diagonal input is normalized.
- Degenerate camera forward falls back to negative Z.

Run the focused movement test, complete client test suite, typecheck, and client
production build.

## Scope

This is a client-only movement correction. It does not modify camera controls,
camera mode transitions, world bounds, player speed, server code, socket event
formats, room state, or deployment.


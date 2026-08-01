# Single Local Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the current host exactly once as the controllable local audience avatar and identify it with a `HOST` label.

**Architecture:** Persist the authoritative socket player ID when the lobby receives the initial room state. Use pure identity helpers to split the local player from remote users/NPCs before rendering, and use the server-side local player record for the avatar's displayed identity. Keep the rules pure so the duplicate and host-label behavior are covered without mounting Three.js.

**Tech Stack:** React 18, TypeScript 5.5, Zustand, React Three Fiber, Socket.IO Client, Vitest 2.1.

## Global Constraints

- Each connected human renders exactly one avatar.
- The current player renders through `PlayerController` and remains controllable.
- A host stays in the audience area and the local badge identifies the host.
- Other users continue to render through `RemotePlayer`.
- NPC performers continue to render on stage without changes.
- Identity matching uses socket player ID only, never nickname or avatar type.
- Do not change server room membership, networking events, NPC behavior, or positioning.

---

## File Structure

- Create `client/src/game/world/playerIdentity.ts`: pure local/remote partition and local label helpers.
- Create `client/src/game/world/playerIdentity.test.ts`: duplicate-player and host-label regression tests.
- Create `client/src/features/room-session/applyInitialRoomState.ts`: applies initial room state and authoritative local ID in one boundary operation.
- Create `client/src/features/room-session/applyInitialRoomState.test.ts`: verifies identity is stored before entering the game.
- Modify `client/src/pages/LobbyPage.tsx`: use the initial-room-state boundary helper.
- Modify `client/src/game/world/WorldScene.tsx`: render the selected local record once and map only remote records.
- Modify `client/package.json` and `client/package-lock.json`: add the Vitest client test runner.
- `PlayerController.tsx` remains presentation-only and needs no socket identity logic.

### Task 1: Add the client regression test harness and player identity selector

**Files:**
- Create: `client/src/game/world/playerIdentity.test.ts`
- Create: `client/src/game/world/playerIdentity.ts`
- Modify: `client/package.json`
- Modify: `client/package-lock.json`

**Interfaces:**
- Consumes: `Player` and `UserRole` from `client/src/types.ts`.
- Produces: `selectWorldPlayers(players: Record<string, Player>, myPlayerId: string): { localPlayer?: Player; remotePlayers: Player[] }`.
- Produces: `getLocalPlayerLabel(nickname: string, role: UserRole): string`.

- [ ] **Step 1: Install the existing Vitest version in the client and add the test script**

Run:

```powershell
npm install --prefix client --save-dev vitest@^2.1.8
```

Add to `client/package.json` scripts:

```json
"test": "vitest run"
```

Expected: `client/package.json` and `client/package-lock.json` include Vitest 2.1.x.

- [ ] **Step 2: Write the failing identity tests**

Create `client/src/game/world/playerIdentity.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { Player } from '../../types';
import { getLocalPlayerLabel, selectWorldPlayers } from './playerIdentity';

const player = (id: string, nickname: string, isNpc = false): Player => ({
  id,
  nickname,
  avatarType: 'Boy',
  roomId: 'room-test',
  position: { x: 0, y: 0, z: 8 },
  rotation: 0,
  animation: 'Idle',
  isNpc
});

describe('selectWorldPlayers', () => {
  it('returns the socket owner as local and excludes it from remote rendering', () => {
    const host = player('socket-host', 'Host');
    const guest = player('socket-guest', 'Guest');
    const npc = player('npc-1', 'DJMax', true);

    const result = selectWorldPlayers(
      { [host.id]: host, [guest.id]: guest, [npc.id]: npc },
      host.id
    );

    expect(result.localPlayer).toBe(host);
    expect(result.remotePlayers).toEqual([guest, npc]);
  });

  it('does not guess identity when myPlayerId is missing', () => {
    const host = player('socket-host', 'Host');
    const result = selectWorldPlayers({ [host.id]: host }, '');

    expect(result.localPlayer).toBeUndefined();
    expect(result.remotePlayers).toEqual([host]);
  });
});

describe('getLocalPlayerLabel', () => {
  it('marks a named host without duplicating the fallback Host name', () => {
    expect(getLocalPlayerLabel('Bo', 'host')).toBe('Bo · HOST');
    expect(getLocalPlayerLabel('Host', 'host')).toBe('HOST');
  });

  it('keeps a guest nickname unchanged', () => {
    expect(getLocalPlayerLabel('Dancer', 'guest')).toBe('Dancer');
  });
});
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```powershell
npm test --prefix client -- src/game/world/playerIdentity.test.ts
```

Expected: FAIL because `./playerIdentity` does not exist.

- [ ] **Step 4: Implement the pure helpers**

Create `client/src/game/world/playerIdentity.ts`:

```ts
import { Player, UserRole } from '../../types';

export interface WorldPlayerSelection {
  localPlayer?: Player;
  remotePlayers: Player[];
}

export function selectWorldPlayers(
  players: Record<string, Player>,
  myPlayerId: string
): WorldPlayerSelection {
  const localPlayer = myPlayerId ? players[myPlayerId] : undefined;
  const remotePlayers = Object.values(players).filter(
    (player) => !myPlayerId || player.id !== myPlayerId
  );

  return { localPlayer, remotePlayers };
}

export function getLocalPlayerLabel(nickname: string, role: UserRole): string {
  const cleanNickname = nickname.trim();
  if (role !== 'host') return cleanNickname || 'Dancer';
  if (!cleanNickname || cleanNickname.toLowerCase() === 'host') return 'HOST';
  return `${cleanNickname} · HOST`;
}
```

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```powershell
npm test --prefix client -- src/game/world/playerIdentity.test.ts
```

Expected: PASS, 4 tests passing.

- [ ] **Step 6: Commit the independently testable helper**

```powershell
git add client/package.json client/package-lock.json client/src/game/world/playerIdentity.ts client/src/game/world/playerIdentity.test.ts
git commit -m "test: cover local player identity selection"
```

### Task 2: Persist the local socket identity at the lobby boundary

**Files:**
- Create: `client/src/features/room-session/applyInitialRoomState.test.ts`
- Create: `client/src/features/room-session/applyInitialRoomState.ts`
- Modify: `client/src/pages/LobbyPage.tsx`

**Interfaces:**
- Consumes: `RoomStatePayload` and two store setters.
- Produces: `applyInitialRoomState(payload, actions): void`.

- [ ] **Step 1: Write the failing boundary test**

Create `client/src/features/room-session/applyInitialRoomState.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { RoomStatePayload } from '../../types';
import { applyInitialRoomState } from './applyInitialRoomState';

const payload = {
  room: { id: 'room-test', name: 'Test', thumbnail: '', currentPlayers: 1, maxPlayers: 30, isFull: false },
  players: [],
  musicState: { currentItemId: null, status: 'idle', startedAt: null, pausedAt: null, pausedPosition: 0, volume: 1, revision: 0 },
  currentTrack: null,
  leaderboard: [],
  myPlayerId: 'socket-host',
  role: 'host'
} satisfies RoomStatePayload;

describe('applyInitialRoomState', () => {
  it('stores room state and the authoritative local player id', () => {
    const setRoomState = vi.fn();
    const setMyPlayerId = vi.fn();

    applyInitialRoomState(payload, { setRoomState, setMyPlayerId });

    expect(setRoomState).toHaveBeenCalledWith(payload);
    expect(setMyPlayerId).toHaveBeenCalledWith('socket-host');
  });

  it('does not overwrite identity when the payload omits myPlayerId', () => {
    const setRoomState = vi.fn();
    const setMyPlayerId = vi.fn();

    applyInitialRoomState({ ...payload, myPlayerId: undefined }, { setRoomState, setMyPlayerId });

    expect(setRoomState).toHaveBeenCalled();
    expect(setMyPlayerId).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the boundary test and verify RED**

Run:

```powershell
npm test --prefix client -- src/features/room-session/applyInitialRoomState.test.ts
```

Expected: FAIL because `./applyInitialRoomState` does not exist.

- [ ] **Step 3: Implement the boundary helper**

Create `client/src/features/room-session/applyInitialRoomState.ts`:

```ts
import { RoomStatePayload } from '../../types';

interface InitialRoomStateActions {
  setRoomState: (payload: RoomStatePayload) => void;
  setMyPlayerId: (id: string) => void;
}

export function applyInitialRoomState(
  payload: RoomStatePayload,
  actions: InitialRoomStateActions
): void {
  actions.setRoomState(payload);
  if (payload.myPlayerId) actions.setMyPlayerId(payload.myPlayerId);
}
```

- [ ] **Step 4: Wire the helper into LobbyPage**

In `client/src/pages/LobbyPage.tsx`, select `setMyPlayerId`:

```ts
const { nickname, avatarType, setMyPlayerId } = usePlayerStore();
```

Import the helper and replace the initial room-state body with:

```ts
const handleRoomState = (payload: RoomStatePayload) => {
  setJoiningId(null);
  setPasswordModalRoomId(null);
  setErrorMsg(null);
  applyInitialRoomState(payload, { setRoomState, setMyPlayerId });
  setPageStep('game');
};
```

Include `setMyPlayerId` in the socket effect dependency list.

- [ ] **Step 5: Run the boundary test and verify GREEN**

Run:

```powershell
npm test --prefix client -- src/features/room-session/applyInitialRoomState.test.ts
```

Expected: PASS, 2 tests passing.

- [ ] **Step 6: Commit the identity synchronization**

```powershell
git add client/src/features/room-session client/src/pages/LobbyPage.tsx
git commit -m "fix: persist local player identity before entering room"
```

### Task 3: Render the authoritative local avatar and Host badge once

**Files:**
- Modify: `client/src/game/world/WorldScene.tsx`
- Test: `client/src/game/world/playerIdentity.test.ts`

**Interfaces:**
- Consumes: `selectWorldPlayers` and `getLocalPlayerLabel` from Task 1.
- Produces: one `PlayerController` for the local ID and `RemotePlayer` components only for other IDs.

- [ ] **Step 1: Replace the inline remote-player filter in WorldScene**

Import the Task 1 helpers and read `role` from `useRoomStore`:

```ts
const { players, role } = useRoomStore();
const { nickname, avatarType, myPlayerId } = usePlayerStore();
const { localPlayer, remotePlayers } = selectWorldPlayers(players, myPlayerId);
const localNickname = localPlayer?.nickname || nickname || 'Dancer';
const localAvatarType = localPlayer?.avatarType || avatarType;
const localLabel = getLocalPlayerLabel(localNickname, role);
```

Pass the authoritative values to the controller:

```tsx
<PlayerController
  myPlayerId={myPlayerId}
  nickname={localLabel}
  avatarType={localAvatarType}
  initialPosition={localPlayer?.position}
  showNames={showNames}
  playerPosRef={playerPosRef}
  activeEmote={activeEmote}
/>
```

Map `remotePlayers` instead of the old inline-filter result.

- [ ] **Step 2: Run all client tests**

Run:

```powershell
npm test --prefix client
```

Expected: PASS, 6 tests passing.

- [ ] **Step 3: Run client typecheck and production build**

Run:

```powershell
npm run typecheck --prefix client
npm run build --prefix client
```

Expected: both commands exit 0. The existing Vite large-chunk warning is allowed; TypeScript errors are not.

- [ ] **Step 4: Verify the local diff is scoped**

Run:

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors and only the files listed in this plan are modified after the plan commits.

- [ ] **Step 5: Commit the rendering fix**

```powershell
git add client/src/game/world/WorldScene.tsx
git commit -m "fix: render host as a single local avatar"
```

## Final Verification

- [ ] Run `npm test --prefix client` and confirm 6 tests pass.
- [ ] Run `npm run build --prefix client` and confirm exit code 0.
- [ ] Confirm the changes remain local and do not push or redeploy without explicit approval.


# Audience Fan Label Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use `Fan` as the default identity for human audience members without renaming dance-related UI.

**Architecture:** Keep the existing player identity helper as the authoritative 3D fallback and update only client-side audience-specific copy. Verify the fallback with the existing Vitest suite before changing production strings.

**Tech Stack:** React 18, TypeScript 5.5, Zustand, Vitest 2.1.

## Global Constraints

- A guest without a nickname is displayed as `Fan`.
- The local audience avatar fallback label is `Fan`.
- The avatar selection identity caption uses `Fan:`.
- Hosts continue to use the existing `HOST` presentation.
- Explicit nicknames remain unchanged.
- Keep `Top Dancers`, `Dancer Level`, `Max Dancers`, `Active Dancers`, stage `DANCERS`, and NPC dancer copy unchanged.
- Do not change server code, room roles, socket payloads, or deployment.

---

## File Structure

- Modify `client/src/game/world/playerIdentity.test.ts`: define the empty guest fallback as `Fan`.
- Modify `client/src/game/world/playerIdentity.ts`: return `Fan` for an empty guest nickname.
- Modify `client/src/game/world/WorldScene.tsx`: use `Fan` as the pre-helper local fallback.
- Modify `client/src/pages/LobbyPage.tsx`: send `Fan` when a joining guest has no nickname.
- Modify `client/src/pages/AvatarSelectPage.tsx`: show the audience identity caption as `Fan:`.

### Task 1: Rename only the audience fallback to Fan

**Files:**
- Modify: `client/src/game/world/playerIdentity.test.ts`
- Modify: `client/src/game/world/playerIdentity.ts`
- Modify: `client/src/game/world/WorldScene.tsx`
- Modify: `client/src/pages/LobbyPage.tsx`
- Modify: `client/src/pages/AvatarSelectPage.tsx`

**Interfaces:**
- Consumes: existing `getLocalPlayerLabel(nickname: string, role: UserRole): string`.
- Produces: `Fan` only when the guest/audience nickname is empty.

- [ ] **Step 1: Write the failing fallback assertion**

Replace the guest-label test in `client/src/game/world/playerIdentity.test.ts` with:

```ts
it('uses Fan for an empty guest while preserving an explicit nickname', () => {
  expect(getLocalPlayerLabel('', 'guest')).toBe('Fan');
  expect(getLocalPlayerLabel('Dancer', 'guest')).toBe('Dancer');
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
npm test --prefix client -- src/game/world/playerIdentity.test.ts
```

Expected: FAIL with expected `Fan` but received `Dancer`.

- [ ] **Step 3: Update the authoritative helper fallback**

In `client/src/game/world/playerIdentity.ts`, replace:

```ts
if (role !== 'host') return cleanNickname || 'Dancer';
```

with:

```ts
if (role !== 'host') return cleanNickname || 'Fan';
```

- [ ] **Step 4: Update the remaining audience-specific copy**

In `client/src/game/world/WorldScene.tsx`, use:

```ts
const localNickname = localPlayer?.nickname || nickname || 'Fan';
```

In the room-join payload in `client/src/pages/LobbyPage.tsx`, use:

```ts
nickname: nickname || 'Fan',
```

In `client/src/pages/AvatarSelectPage.tsx`, replace the identity caption with:

```tsx
<span className="text-xs text-slate-400">Fan:</span>
```

Do not change the host-create fallback `nickname || 'Host'`.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run:

```powershell
npm test --prefix client -- src/game/world/playerIdentity.test.ts
```

Expected: PASS, 4 tests passing.

- [ ] **Step 6: Run the complete client verification**

Run:

```powershell
npm test --prefix client
npm run typecheck --prefix client
npm run build --prefix client
```

Expected: 6 tests pass, typecheck exits 0, and build exits 0. The existing Vite large-chunk warning is allowed.

- [ ] **Step 7: Confirm dance terminology was preserved**

Run:

```powershell
rg -n -i "dancer" client/src
git diff --check
git status --short
```

Expected: ranking, level, capacity, host-control, stage, comments, and NPC usages remain; only the five files listed above are modified.

- [ ] **Step 8: Commit locally**

```powershell
git add client/src/game/world/playerIdentity.test.ts client/src/game/world/playerIdentity.ts client/src/game/world/WorldScene.tsx client/src/pages/LobbyPage.tsx client/src/pages/AvatarSelectPage.tsx
git commit -m "fix: label audience players as Fans"
```

## Final Verification

- [ ] Run `npm test --prefix client` and confirm 6 tests pass.
- [ ] Run `npm run build --prefix client` and confirm exit code 0.
- [ ] Keep the commit local; do not push or redeploy without explicit approval.


# Audience Fan Label Design

## Goal

Use `Fan` as the default identity for human audience members while keeping
dance-related UI terminology unchanged.

## Required behavior

- A guest without a nickname is displayed as `Fan`.
- The local audience avatar fallback label is `Fan`.
- The avatar selection identity caption uses `Fan:`.
- Hosts continue to use the existing `HOST` presentation.
- Explicit nicknames remain unchanged.

## Preserved terminology

The following text remains unchanged because it describes dancing, rankings,
capacity, or stage performers rather than the default audience identity:

- `Top Dancers`
- `Dancer Level`
- `Max Dancers`
- `Active Dancers`
- Stage `DANCERS`
- NPC dancer descriptions and comments

## Design

Update only the audience-specific fallback strings in:

- `client/src/game/world/playerIdentity.ts`
- `client/src/game/world/WorldScene.tsx`
- `client/src/pages/LobbyPage.tsx`
- `client/src/pages/AvatarSelectPage.tsx`

The existing `getLocalPlayerLabel` helper remains the authoritative fallback
for the 3D name badge. No role, socket, server, or room-state logic changes.

## Verification

Update the existing identity test so an empty guest nickname resolves to
`Fan`. Run the focused regression test, the complete client test suite, and
the client production build.

## Scope

This is a client-only wording change. It does not alter explicit user
nicknames, host identity, NPCs, leaderboard terminology, gameplay roles,
network payloads, or deployment.


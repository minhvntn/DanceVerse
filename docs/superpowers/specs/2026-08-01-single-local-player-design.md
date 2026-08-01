# Single Local Player Design

## Problem

When a player creates or joins a room, `LobbyPage` receives the initial
`ROOM_STATE` payload and transitions to `GamePage`. It stores the room data but
does not store `payload.myPlayerId`. `WorldScene` therefore cannot exclude the
local player from the server player collection and renders the same person as
both `PlayerController` and `RemotePlayer`.

## Required behavior

- Each connected human renders exactly one avatar.
- The current player renders through `PlayerController` and remains controllable.
- A host stays in the audience area and the local badge identifies the host.
- Other users continue to render through `RemotePlayer`.
- NPC performers continue to render on stage without changes.

## Design

1. Handle the complete initial room identity at the lobby boundary. When
   `LobbyPage` receives `ROOM_STATE`, persist `payload.myPlayerId` before moving
   to the game page.
2. Keep `WorldScene` filtering remote players by the authoritative socket player
   ID. Extract the partition rule into a small pure helper so the duplicate
   regression can be tested without mounting the Three.js canvas.
3. Pass the current room role to `PlayerController`. Its local name badge shows
   a clear `HOST` marker for hosts while guest display remains unchanged.
4. Do not filter by nickname or avatar type because those values are not unique.

## Data flow

`ROOM_STATE.myPlayerId` -> `usePlayerStore.myPlayerId` -> `WorldScene` player
partition -> local player omitted from `RemotePlayer` list.

`ROOM_STATE.role` -> `useRoomStore.role` -> `WorldScene` ->
`PlayerController` local badge.

## Error handling

If an older or malformed payload has no `myPlayerId`, no guessed identity is
used. The existing local player remains available, and the missing identity is
not replaced using nickname matching.

## Verification

- A regression test starts with a player collection containing the local socket
  ID and confirms that ID is excluded while remote users and NPCs remain.
- A second assertion covers an empty local ID so the helper does not hide a real
  remote player accidentally.
- Run the focused test, the client test suite, and the client production build.

## Scope

This change is limited to client-side identity synchronization, player
partitioning, and the local host badge. It does not change room membership,
server player creation, NPC behavior, positioning, or networking protocol.

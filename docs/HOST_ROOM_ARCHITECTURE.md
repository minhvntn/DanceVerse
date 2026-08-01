# Host Room Architecture — DanceVerse Live

DanceVerse Live supports a **Host / Guest Concert Room Model** where a **Host** creates and controls the room, while **Guests** join to listen to synchronized music, watch YouTube music videos, dance, and chat in real-time.

---

## 1. Roles & Permissions

```ts
export type UserRole = 'host' | 'guest';
```

### Host Permissions
- **Room Management**:
  - Create and name custom concert rooms.
  - Set visibility (`public` | `private`) and optional password protection.
  - Configure maximum capacity (`maxPlayers` from 2 to 50).
  - Toggle live chat (`allowChat`) and guest emote reactions (`allowGuestEmotes`).
  - End the concert room (`SOCKET_EVENTS.HOST_ROOM_END`).
- **Music & DJ Control**:
  - Add songs via YouTube URLs (`SOCKET_EVENTS.HOST_PLAYLIST_ADD`).
  - Play, Pause, Resume, and Skip tracks (`HOST_MUSIC_PAUSE`, `HOST_MUSIC_RESUME`, `HOST_MUSIC_NEXT`, `HOST_MUSIC_PREVIOUS`).
  - Adjust room master volume (`HOST_MUSIC_VOLUME`).
  - Reorder, remove, or clear playlist tracks (`HOST_PLAYLIST_REORDER`, `HOST_PLAYLIST_REMOVE`, `HOST_PLAYLIST_CLEAR`).
- **Moderation**:
  - Kick disruptive players from the concert (`HOST_PLAYER_KICK`).

### Guest Permissions
- Join public rooms or password-protected rooms (if correct password is provided).
- Dance, emote (when enabled), and chat (when enabled).
- View authoritative room playlist and real-time playback progress.
- Toggle local stage TV display for YouTube video clip streaming.

---

## 2. Room Lifecycle & Reconnect Grace Period

1. **Room Creation**:
   - Host emits `SOCKET_EVENTS.ROOM_CREATE` with room settings.
   - Server generates a unique `roomId`, a cryptographically random `hostToken`, and stores `hostTokenHash = sha256(hostToken)`.
   - Server returns `{ roomId, hostToken, room }` to the creator.
2. **Session Persistence**:
   - Client stores `hostToken` in `sessionStorage` under `dv_hostToken_${roomId}`.
   - If the host refreshes the page or temporarily disconnects, they rejoin with their saved `hostToken`.
3. **Host Disconnect Grace Period**:
   - When a host disconnects, `RoomManager.handleHostDisconnect(roomId)` starts a **60-second grace timer**.
   - If the host reconnects and rejoins within 60 seconds with their valid `hostToken`, their host privileges are restored immediately and the timer is cancelled.
   - If the timer expires before the host returns, the room is automatically ended (`status: 'ended'`) and remaining guests are notified via `SOCKET_EVENTS.ROOM_ENDED`.

---

## 3. Communication Protocol (Socket.IO Events)

### Client -> Server (Host Commands)
All host commands require `{ roomId, hostToken, ...payload }`:
- `HOST_ROOM_UPDATE`: Update room name, visibility, password, max capacity, or toggles.
- `HOST_ROOM_END`: Terminate room for all players.
- `HOST_PLAYLIST_ADD`: Add YouTube URL or track to room playlist.
- `HOST_PLAYLIST_REMOVE`: Remove item by ID.
- `HOST_PLAYLIST_REORDER`: Submit reordered track ID array.
- `HOST_PLAYLIST_CLEAR`: Empty the playlist.
- `HOST_MUSIC_PAUSE` / `HOST_MUSIC_RESUME` / `HOST_MUSIC_NEXT` / `HOST_MUSIC_PREVIOUS` / `HOST_MUSIC_VOLUME`
- `HOST_PLAYER_KICK`: Kick target player by ID.

### Server -> Client (Broadcast Events)
- `ROOM_STATE`: Full snapshot sent on join (room details, player list, playlist, current track, role).
- `PLAYLIST_UPDATED`: Broadcast whenever tracks are added, removed, reordered, or cleared.
- `MUSIC_STATE`: Broadcast whenever playback status, track, or timestamp changes.
- `PLAYER_KICKED`: Sent directly to kicked player with reason.
- `ROOM_ENDED`: Sent to all room players when host ends the room or grace period expires.
- `CHAT_MESSAGE`: System messages emitted for join, leave, kick, and playlist additions.

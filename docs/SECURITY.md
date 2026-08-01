# Security & Authorization Architecture — DanceVerse Live

DanceVerse Live implements defense-in-depth security for room management, host authorization, chat moderation, and input sanitization.

---

## 1. Host Authentication & Token Security

1. **Server-Side Token Hash Generation**:
   - When a room is created, the server generates a cryptographically secure random token (`hostToken`).
   - The plain token is sent **once** to the creator client over Socket.IO.
   - The server stores **only the SHA-256 hash** (`hostTokenHash`):
     ```ts
     const hostTokenHash = crypto.createHash('sha256').update(hostToken).digest('hex');
     ```
2. **Command Verification (`host.validator.ts`)**:
   - Every host Socket.IO event (`HOST_ROOM_UPDATE`, `HOST_PLAYLIST_ADD`, `HOST_PLAYER_KICK`, etc.) must pass `validateHostCommand(socket, roomId, hostToken)`.
   - The server re-hashes the supplied token and compares it against `hostTokenHash`.
   - Unauthorized attempts are logged and rejected with an `UNAUTHORIZED` error payload.

---

## 2. Password-Protected Rooms

- Rooms created with `visibility: 'private'` or an optional password use SHA-256 password hashing.
- On join, `RoomManager.addPlayerToRoom(player, password)` verifies the hash before allowing socket membership or broadcasting room state.
- Unauthorized join attempts receive error code `'INVALID_PASSWORD'`.

---

## 3. Chat Moderation & Rate Limiting

- **Host Room Toggles**:
  - Hosts can dynamically disable room chat (`allowChat: false`) or emote reactions (`allowGuestEmotes: false`).
  - When disabled, server-side handlers in `chat.handler.ts` and `player.handler.ts` intercept and reject events before broadcasting.
- **Rate Limiting (`ValidationService`)**:
  - Players are restricted from spamming chat messages (cooldown & frequency limiter).
- **Sanitization & XSS Prevention**:
  - All nicknames, room names, track titles, and chat messages are sanitized using `ValidationService.sanitizeNickname` and `ValidationService.sanitizeChat` to strip HTML tags, script injection attempts, and excessive whitespace.

---

## 4. Legal Audio Stream Compliance

- DanceVerse Live does **not** scrape, convert, or distribute copyrighted audio files.
- All YouTube tracks use the official **YouTube IFrame API** embedded within the browser, complying with YouTube's Terms of Service and content owner monetization rules.

# Authoritative Music Synchronization & YouTube Player — DanceVerse Live

DanceVerse Live guarantees that **all players in a concert room hear the exact same song at the exact same timestamp**, while complying with browser autoplay restrictions and YouTube API policies.

---

## 1. Authoritative Server Clock & State

The server (`MusicService`) maintains authoritative state for each room:

```ts
export interface MusicState {
  currentItemId: string | null;
  currentTrackId?: string | null;
  currentVideoId?: string | null;
  trackId?: string;
  status: 'idle' | 'playing' | 'paused';
  isPlaying?: boolean;
  startedAt: number | null;     // Epoch timestamp in ms when track began playing
  pausedAt: number | null;      // Epoch timestamp when paused
  pausedPosition: number;       // Elapsed seconds when paused
  volume: number;               // Master room volume (0-100)
  revision: number;             // Incremented on every change
}
```

### Server Timestamp Math
When a client joins or requests synchronization, the server calculates exact playback time:
```ts
const elapsedSeconds = (Date.now() - musicState.startedAt) / 1000;
```
This avoids accumulating drift from client network latency.

---

## 2. YouTube IFrame API Integration

DanceVerse Live embeds legal YouTube streams via the official **YouTube IFrame Player API** (`YouTubeRoomPlayer.tsx`), preventing unauthorized scraping.

- **URL & Video ID Extraction**:
  Supports `youtube.com/watch?v=ID`, `youtu.be/ID`, `/shorts/ID`, `/live/ID`, `/embed/ID`, and raw 11-character video IDs.
- **Clock Drift Detection & Correction**:
  - The client runs a sync check interval every `1000ms`.
  - It compares current YouTube playback time (`player.getCurrentTime()`) against expected server time:
    ```ts
    const expectedTime = (Date.now() - musicState.startedAt) / 1000;
    const drift = Math.abs(currentTime - expectedTime);
    if (drift > 1.5) {
      player.seekTo(expectedTime, true);
    }
    ```
  - Any drift exceeding **1.5 seconds** triggers an instant seek correction.

---

## 3. Autoplay & Browser Policy Compliance

Modern browsers (Chrome, Safari, Edge, Firefox) block unmuted audio playback without a prior user gesture.
DanceVerse Live handles this cleanly via `SoundUnlockOverlay.tsx`:
1. When a player enters a room, if audio is blocked, an interactive **"Tap anywhere to enter & start concert audio"** overlay appears.
2. The user's first click/tap calls `audioService.unlockAudio()`, resuming WebAudio contexts and unmuting the embedded YouTube player seamlessly.

---

## 4. Stage TV Screen Display

In addition to background audio, `GamePage.tsx` renders a toggleable cyberpunk **Stage TV Screen** (`Show TV 📺` / `Hide TV 📺`).
When shown, players can watch the official YouTube music video while dancing on the 3D WebGL stage.

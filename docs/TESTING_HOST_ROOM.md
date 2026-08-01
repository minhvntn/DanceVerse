# Host Room System — Testing Guide & Verification Checklist

This guide covers how to test and verify all Host/Guest Concert Room features in DanceVerse Live, including automated unit/integration tests and multi-client browser walkthroughs.

---

## 1. Automated Unit & Integration Tests

The server includes automated test suites built with **Vitest**:

- **`test/youtube.test.ts`**:
  - Tests `extractYouTubeVideoId(url)` across standard watch URLs, short `youtu.be` links, `/shorts/`, `/live/`, `/embed/`, raw 11-character IDs, and invalid input strings.
- **`test/host.test.ts`**:
  - **Password Protection**: Creates protected room, verifies join fails without password or with wrong password, and succeeds with correct password.
  - **Host Token Security**: Verifies `RoomManager.verifyHostToken(roomId, token)` succeeds for genuine token and rejects forged tokens.
  - **Authoritative Playlist**: Adds multiple songs, tests reordering (`reorderPlaylist`), and removes items (`removePlaylistItem`).
  - **Music Math**: Tests `MusicService.getCurrentPlaybackTime(state)` during live playback vs paused states.

### Running Automated Tests
From the root monorepo directory:
```bash
npm test
```
Or inside `server/`:
```bash
npm test
```
Expected output:
```
 ✓ test/youtube.test.ts (5 tests)
 ✓ test/host.test.ts (4 tests)
 Test Files  2 passed (2)
      Tests  9 passed (9)
```

---

## 2. End-to-End Multi-Client Manual Verification

### Step 1: Start Local Development Servers
```bash
npm run dev
```
Open **http://localhost:5173** in two different browser windows (e.g., Window 1: Chrome Incognito [Host], Window 2: Firefox [Guest]).

### Step 2: Create Concert Room (Host)
1. In **Window 1 (Host)**, enter nickname `"DJ_Luna"`, select an avatar, and go to the Lobby.
2. Click the **"Create Concert Room"** tab.
3. Fill in:
   - **Room Name**: `"Neon Cyber Lounge"`
   - **Visibility**: `Public` (or set a Password)
   - **Max Players**: `15`
   - **Allow Chat**: Checked
   - **Allow Emotes**: Checked
4. Click **"Create Room & Host Concert"**.
5. Verify you enter the 3D Stage and see the **`HOST 👑`** badge in the top-left profile card.

### Step 3: Invite & Join Room (Guest)
1. In **Window 1 (Host)**, click the **"Invite 🔗"** button in the HUD to copy the link (`http://localhost:5173/?room=ROOM_ID`).
2. Paste the link into **Window 2 (Guest)**.
3. Enter nickname `"Guest_Dancer"`, select an avatar, and join.
4. Verify both players appear on stage and in the Active Dancers list.

### Step 4: Authoritative Music & YouTube Video Sync
1. In **Window 1 (Host)**, click **"Host Controls"** -> **"Music & YT"** tab.
2. Paste a YouTube URL (e.g., `https://youtu.be/jfKfPfyJRdk` or Lofi Girl stream) and click **"Add to Playlist"**.
3. Verify that both Host and Guest automatically receive `MUSIC_STATE` and start playing the song at the exact same timestamp.
4. Click **"Show TV 📺"** on either window to verify the video clip plays smoothly in the bottom-right Stage TV screen.
5. In **Window 1 (Host)**, click **Pause** and **Play** to verify music pauses and resumes simultaneously for both clients.

### Step 5: Playlist Reordering & Kick Moderation
1. In **Window 1 (Host)**, add a second and third YouTube song.
2. Click **"Playlist 📜"** and test clicking **Move Up / Move Down / Remove Song**. Verify Guest's playlist updates instantly.
3. In **Host Controls -> Players**, click **"Kick"** next to `"Guest_Dancer"`.
4. Verify Guest receives a kick alert and is returned to the lobby, and a system message `🚫 A player was kicked by the host.` appears in chat.

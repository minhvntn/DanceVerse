# 🧪 DanceVerse Live — Technical Testing & Quality Assurance Guide

This document outlines the testing instructions, multiplayer QA checklist, mobile responsiveness checks, and known limitations for **DanceVerse Live**.

---

## 1. Local Testing Instructions

### Step 1: Install Dependencies & Build
Run the following root commands to verify packages and type checking:
```bash
npm install
npm run typecheck
npm run build
```

### Step 2: Launch Development Servers
Start both the React client (`5173`) and Express/Socket.IO backend (`3001`):
```bash
npm run dev
```

### Step 3: Open Multiple Browser Clients
1. Open **Browser Client 1** in Google Chrome or Firefox: [http://localhost:5173](http://localhost:5173)
2. Open **Browser Client 2** in an Incognito / Private window: [http://localhost:5173](http://localhost:5173)
3. Enter distinct nicknames (e.g., `DancerOne` and `DancerTwo`) and select different chibi avatars.

---

## 2. Multiplayer Testing Checklist

- [x] **Room Joining & Player Counts**: Verify that when Client 1 joins `Neon City Concert`, the lobby count increases from `0/50` to `1/50`, and when Client 2 joins the same room, both clients see `2/50` in the top HUD and lobby.
- [x] **Real-Time Position & Movement Sync**: Move Client 1 using `W/A/S/D` and observe Client 2 rendering smooth position/rotation changes without jitter or teleports. Throttling is capped at **15 Hz (~66ms intervals)**.
- [x] **Remote Player Interpolation**: Verify that `RemotePlayer` linearly interpolates position (`.lerp(targetPos, 0.18)`) and calculates the shortest path angle for Y-axis rotation.
- [x] **Dance Animations & Shortcuts**: Press keys `1-0` or click HUD dance shortcuts on Client 1 and confirm Client 2 immediately plays the corresponding procedural animation (`Wave`, `HipHop`, `Breakdance`, etc.).
- [x] **Emote Bubble Broadcast & Cooldowns**: Send an emote (`😂`, `❤️`, `🔥`, `👏`, `🎉`, `😮`) from the bottom-right emote bar. Verify the floating bubble appears above the avatar for 3 seconds on all clients. Check that rapid clicks are rate-limited to 1.5-second cooldowns.
- [x] **Real-Time Chat & Sanitization**:
  - Verify HTML/XSS stripping by sending `<script>alert("test")</script>Hello`. Ensure it renders safely as `Hello`.
  - Confirm messages appear instantly on both clients and enforce a 500ms spam cooldown.
- [x] **Room Isolation**: Have Client 1 join `Neon City Concert` and Client 2 join `Beach Festival`. Check that chat messages, movement, and animations do NOT leak across different rooms.
- [x] **Disconnect & Cleanup**: Close Client 2's browser tab. Confirm Client 1 receives `player:left` and removes Client 2's avatar from the 3D world and leaderboard.
- [x] **Music Synchronization**: Check that background music plays only after an explicit user interaction (e.g., clicking "JOIN STAGE" or clicking inside the game window). Confirm that both clients stay synchronized to the server timestamp `currentTime = (Date.now() - startedAt) / 1000`.

---

## 3. Mobile & Tablet Testing Checklist

- [x] **Breakpoint Layout Enforcement**:
  - Screens `< 1025px` (Mobile phones, Tablets, iPad up to 1024px width): Displays the on-screen **MobileControls** (Virtual Joystick on the bottom-left and Jump/Action button on the bottom-right).
  - Screens `>= 1025px` (Desktop / Laptop): Displays the **ActionBar** (`1-0` shortcut keys on the bottom-center).
- [x] **Touch Input Handling**:
  - Verify touch drag/press on the directional virtual buttons dispatches window keyboard events (`W/A/S/D`).
  - Verify the "JUMP" button triggers spacebar jumping animation.
- [x] **Performance Switcher**:
  - Test toggling graphic modes (`Low`, `Medium`, `High`, `Auto`) in the `TopBarHUD`.
  - Check that `Low` disables shadows and confetti particles for maximum mobile FPS.

---

## 4. Known Limitations

1. **In-Memory Server State**:
   - Room state, player lists, and leaderboard scores are kept in Node.js server memory. If the server process restarts, active rooms reset to default initial state.
2. **Audio Autoplay Policy**:
   - Web browsers (Chrome/Safari) block automatic audio playback without user interaction. Players must click a button (such as "JOIN STAGE" in the lobby) before music playback begins.
3. **Procedural Chibi Geometry**:
   - Avatars use Three.js primitive shapes (`BoxGeometry`, `SphereGeometry`, `CylinderGeometry`) with procedural math-based animations instead of glTF skeletal rigs to maintain zero-asset load overhead and fast rendering.

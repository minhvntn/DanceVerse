# 🎵 DanceVerse Live — 3D Online Concert Multiplayer Game

**DanceVerse Live** is a web-based, real-time multiplayer 3D concert game inspired by *Roblox Concerts*, *Club Penguin*, *VRChat*, and *Party Animals*. Players jump into vibrant virtual stages, choose cute chibi characters, dance with 10 synchronized animations, drop emote bubbles, chat with dancers worldwide, and compete in the rhythm mini-game **Beat Drop** — all synchronized over Socket.IO and WebGL.

---

## 🌟 Key Features

### 🎮 1. Full-Stack Monorepo Architecture
- **Client**: React 18, Vite, TypeScript, Three.js, React Three Fiber (R3F), Drei, Zustand, Tailwind CSS.
- **Server**: Express, Socket.IO, CORS, Node.js, TypeScript, In-Memory Room & Leaderboard state.
- **Shared**: Source-of-truth TypeScript interfaces and event name constants shared between client and server.

### 💃 2. 8 Cute 3D Primitive Avatars
- **Boy** (*Cyber Boy* - Cyan & Blue)
- **Girl** (*Pop Girl* - Neon Pink & Rose)
- **Robot** (*B-Bot 3000* - Silver & Sky Blue)
- **Panda** (*DJ Panda* - Black & White)
- **Alien** (*Zorlax* - Neon Green & Emerald)
- **Cat** (*Neko Chan* - Orange & Yellow with cat ears)
- **Bunny** (*Hop Hop* - Pink & White with rabbit ears)
- **Dinosaur** (*Rexy* - Green & Amber with dorsal tail)

### 🎪 3. Host / Guest Concert Room Model & Password Protection
- **Create Custom Rooms**: Hosts can create custom rooms, set player capacity (2-50), choose `public` or `private` visibility, and set optional password protection.
- **Copy Invite Links**: Instantly copy shareable invite links (`http://localhost:5173/?room=ROOM_ID`) to bring friends directly into your concert.
- **Host Reconnect Grace Period**: Hosts who disconnect can reconnect within 60 seconds with their saved `hostToken` to regain DJ control without disrupting the room.

### 🕺 4. 13 Synchronized Dance Animations & Shortcuts
- Trigger dances instantly via on-screen HUD buttons or keyboard shortcuts:
  - **[1]** Wave | **[2]** HipHop | **[3]** Shuffle | **[4]** Moonwalk
  - **[5]** Breakdance | **[6]** Jump | **[7]** Clap | **[8]** Spin
  - **[9]** Cheer | **[0]** RandomDance | **[Space]** Jump Dance

### 💬 5. Real-Time Chat, Emote Bubbles & Moderation
- **Emote Bubbles**: Send emoji bubbles (`😂`, `❤️`, `🔥`, `👏`, `🎉`, `😮`) floating above your character in 3D space.
- **Host Toggles**: Hosts can toggle live chat (`allowChat`) and guest emote reactions (`allowGuestEmotes`) on the fly.
- **System Messages**: Automated notifications in chat when players join, leave, are kicked, or when the host adds a track.

### 🎧 6. Authoritative YouTube Music Sync & Stage TV
- **YouTube IFrame Player API**: Stream legal YouTube music videos directly in the concert room.
- **Stage TV Screen**: Watch the music video clip on a floating cyberpunk TV screen while dancing on the 3D WebGL stage.
- **Authoritative DJ Controls**: Hosts can add songs, pause/resume, skip tracks, reorder the playlist, remove tracks, and adjust master room volume.
- **Drift Correction**: Clients automatically resync if playback time drifts by more than 1.5 seconds from server authoritative clock.

### ⚡ 7. Rhythm Mini-Game: "Beat Drop"
- Open the **Beat Drop** overlay during the concert!
- Notes slide down toward the Hit Zone.
- Press **SPACE** or tap the button at the perfect moment to score:
  - **Perfect** (+100 pts) | **Great** (+50 pts) | **Good** (+25 pts) | **Miss** (Combo reset)
- Scores broadcast in real-time to the **Room Leaderboard** displayed on the stage HUD.

### 🕹️ 8. Responsive Desktop & Mobile Controls
- **Desktop**: `W/A/S/D` or Arrow keys to move, `Shift` to sprint, `Space` to jump, Mouse drag to rotate camera.
- **Mobile**: On-screen Touch D-Pad / Virtual Joystick on bottom-left, quick Jump and Emote action buttons on bottom-right.
- **Performance Graphic Modes**: Choose between `Low`, `Medium`, `High`, and `Auto` to optimize shaders, shadows, and confetti particle density for 60 FPS on desktop and 30+ FPS on mobile.

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18 or v20+)
- npm (v9+)

### 1. Install Dependencies
In the root directory, run:
```bash
npm install
npm install --prefix client
npm install --prefix server
```

### 2. Start Development Servers (Client + Server concurrently)
Run the root development script:
```bash
npm run dev
```
- **Client UI**: [http://localhost:5173](http://localhost:5173)
- **Socket.IO Server**: [http://localhost:3001](http://localhost:3001)

### 3. Verify TypeScript, Automated Tests & Production Build
To run type checking, automated Vitest unit/integration tests, and production builds across the monorepo:
```bash
npm run typecheck
npm test
npm run build
```

---

## ⚙️ Environment Variables

### Client (`client/.env` or runtime environment)
- `VITE_SERVER_URL`: Optional. URL of the Socket.IO backend server (defaults to `http://localhost:3001` in local dev or dynamic host in production).
- `VITE_APP_TITLE`: Optional. Custom page title.

### Server (`server/.env` or runtime environment)
- `PORT`: Optional. Port for the backend server to bind (defaults to `3001`).
- `NODE_ENV`: Set to `production` or `development`.

---

## 🐳 Docker Deployment

You can launch both services using Docker Compose:
```bash
docker-compose up --build -d
```
- **Client container**: Built with Nginx serving static assets on port `5173` / `80`
- **Server container**: Express & Socket.IO runtime accessible on port `3001`

To shut down the containers:
```bash
docker-compose down
```

---

## 📁 Project Structure
```
DanceVerseLive/
├── shared/
│   ├── types.ts           # Core TypeScript data models (Player, Room, Music, Chat)
│   └── events.ts          # Socket.IO event constants
├── server/
│   ├── src/
│   │   ├── index.ts       # Express + Socket.IO server & tick loops
│   │   ├── rooms/         # RoomManager & MusicService
│   │   ├── game/          # NpcController & ValidationService
│   │   └── socket/        # Event handlers (room, player, chat)
│   └── Dockerfile
├── client/
│   ├── src/
│   │   ├── components/    # HUD, ChatBox, ActionBar, EmoteBar, BeatDropModal, MobileControls
│   │   ├── game/          # Three.js 3D world (ConcertArena, AvatarPrimitive, ThirdPersonCamera)
│   │   ├── pages/         # LandingPage, AvatarSelectPage, LobbyPage, GamePage
│   │   ├── services/      # SocketService, AudioService
│   │   └── stores/        # Zustand state management (useGameStore, usePlayerStore, useRoomStore)
│   └── Dockerfile
├── docker-compose.yml
├── TESTING.md             # Quality Assurance, Local Testing & QA Checklists
└── package.json           # Root monorepo scripts
```


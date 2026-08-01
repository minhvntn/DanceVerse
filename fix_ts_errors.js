const fs = require('fs');
const path = require('path');

// 1. Fix myPlayerId in RoleManagementPanel
const rolePanelPath = path.join(__dirname, 'client', 'src', 'features', 'room-roles', 'components', 'RoleManagementPanel.tsx');
let rolePanel = fs.readFileSync(rolePanelPath, 'utf8');
rolePanel = rolePanel.replace(`import { useRoomStore } from '../../../stores/useRoomStore';`, `import { useRoomStore } from '../../../stores/useRoomStore';\nimport { usePlayerStore } from '../../../stores/usePlayerStore';`);
rolePanel = rolePanel.replace(`  const { players, currentRoom, hostToken, role, myPlayerId } = useRoomStore();`, `  const { players, currentRoom, hostToken, role } = useRoomStore();\n  const { myPlayerId } = usePlayerStore();`);
fs.writeFileSync(rolePanelPath, rolePanel);

// 2. Fix myPlayerId in SongRequestQueue
const queuePath = path.join(__dirname, 'client', 'src', 'features', 'song-requests', 'components', 'SongRequestQueue.tsx');
let queue = fs.readFileSync(queuePath, 'utf8');
queue = queue.replace(`import { useRoomStore } from '../../../stores/useRoomStore';`, `import { useRoomStore } from '../../../stores/useRoomStore';\nimport { usePlayerStore } from '../../../stores/usePlayerStore';`);
queue = queue.replace(`  const { songRequests, currentRoom, role, hostToken, players, myPlayerId } = useRoomStore();`, `  const { songRequests, currentRoom, role, hostToken, players } = useRoomStore();\n  const { myPlayerId } = usePlayerStore();`);
fs.writeFileSync(queuePath, queue);

// 3. Fix myPlayerId in GamePage.tsx
const gamePagePath = path.join(__dirname, 'client', 'src', 'pages', 'GamePage.tsx');
let gamePage = fs.readFileSync(gamePagePath, 'utf8');
gamePage = gamePage.replace(`if (payload.playerId === useRoomStore.getState().myPlayerId) {`, `if (payload.playerId === usePlayerStore.getState().myPlayerId) {`);
fs.writeFileSync(gamePagePath, gamePage);

// 4. Fix Duplicate setPlaylist in useRoomStore
const storePath = path.join(__dirname, 'client', 'src', 'stores', 'useRoomStore.ts');
let store = fs.readFileSync(storePath, 'utf8');
store = store.replace(/  setPlaylist: \(playlist: PlaylistItem\[\]\) => void;\n/g, ''); // remove all
store = store.replace(`  setSongRequests:`, `  setPlaylist: (playlist: PlaylistItem[]) => void;\n  setSongRequests:`);
fs.writeFileSync(storePath, store);

console.log('Fixed TypeScript errors');

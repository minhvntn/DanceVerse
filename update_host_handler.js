const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'server', 'src', 'socket', 'host.handler.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace import
content = content.replace(
  `import { validateHostCommand } from '../middleware/host.validator';`,
  `import { authorizeRoomAction } from '../permissions/authorizeRoomAction';\nimport { RoleService } from '../roles/role.service';\nimport { CohostAssignPayload, CohostRemovePayload } from '../../../shared/types';`
);

// Replace individual commands
const replacements = [
  ['HOST_ROOM_UPDATE', 'room.manage'],
  ['HOST_ROOM_END', 'room.end'],
  ['HOST_PLAYER_KICK', 'player.kick'],
  ['HOST_PLAYLIST_ADD', 'playlist.manage'],
  ['HOST_PLAYLIST_REMOVE', 'playlist.manage'],
  ['HOST_PLAYLIST_REORDER', 'playlist.manage'],
  ['HOST_PLAYLIST_CLEAR', 'playlist.manage'],
  ['HOST_MUSIC_PLAY', 'music.control'],
  ['HOST_MUSIC_PAUSE', 'music.control'],
  ['HOST_MUSIC_RESUME', 'music.control'],
  ['HOST_MUSIC_SEEK', 'music.control'],
  ['HOST_MUSIC_NEXT', 'music.control'],
  ['HOST_MUSIC_PREVIOUS', 'music.control'],
  ['HOST_MUSIC_VOLUME', 'music.control']
];

for (const [event, perm] of replacements) {
  const regex = new RegExp(`socket\\.on\\(SOCKET_EVENTS\\.${event}, \\(payload: [^)]+\\) => \\{\\n\\s+const check = validateHostCommand\\(socket, payload\\?\\.roomId, payload\\?\\.hostToken\\);`, 'g');
  content = content.replace(regex, (match) => {
    return match.replace('validateHostCommand', `authorizeRoomAction`).replace('payload?.hostToken', `'${perm}', payload?.hostToken`);
  });
}

// Append new role handlers
const roleHandlers = `
  socket.on(SOCKET_EVENTS.HOST_COHOST_ASSIGN, (payload: CohostAssignPayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'role.manage', payload?.hostToken);
    if (!check.authorized) return;

    const res = RoleService.assignCohost(payload.roomId, payload.targetPlayerId);
    if (res.success && res.player) {
      io.to(payload.roomId).emit(SOCKET_EVENTS.ROOM_ROLES_UPDATED, {
        playerId: res.player.id,
        role: 'co-host'
      });
      io.to(payload.roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        id: \`sys-\${Date.now()}\`,
        senderId: 'system',
        nickname: 'System',
        message: \`\${res.player.nickname} is now a co-host.\`,
        timestamp: Date.now(),
        isSystem: true,
        type: 'system'
      });
    } else {
      socket.emit(SOCKET_EVENTS.ERROR, { message: res.error || 'Failed to assign co-host' });
    }
  });

  socket.on(SOCKET_EVENTS.HOST_COHOST_REMOVE, (payload: CohostRemovePayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'role.manage', payload?.hostToken);
    if (!check.authorized) return;

    const res = RoleService.removeCohost(payload.roomId, payload.targetPlayerId);
    if (res.success && res.player) {
      io.to(payload.roomId).emit(SOCKET_EVENTS.ROOM_ROLES_UPDATED, {
        playerId: res.player.id,
        role: 'guest'
      });
      io.to(payload.roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        id: \`sys-\${Date.now()}\`,
        senderId: 'system',
        nickname: 'System',
        message: \`\${res.player.nickname} is no longer a co-host.\`,
        timestamp: Date.now(),
        isSystem: true,
        type: 'system'
      });
    } else {
      socket.emit(SOCKET_EVENTS.ERROR, { message: res.error || 'Failed to remove co-host' });
    }
  });
}
`;

content = content.replace(/}\n$/, roleHandlers);

fs.writeFileSync(filePath, content);
console.log('Successfully updated host.handler.ts');

import { Socket, Server } from 'socket.io';
import { SOCKET_EVENTS } from '../../../shared/events';
import {
  CreateRoomPayload,
  HostRoomUpdatePayload,
  HostCommandPayload,
  KickPlayerPayload,
  PlaylistItemAddPayload,
  PlaylistItemRemovePayload,
  PlaylistReorderPayload,
  HostPlayMusicPayload,
  MusicSeekPayload,
  MusicVolumePayload
} from '../../../shared/types';
import { RoomManager } from '../rooms/room.manager';
import { MusicService } from '../rooms/music.service';
import { authorizeRoomAction } from '../permissions/authorizeRoomAction';
import { RoleService } from '../roles/role.service';
import { CohostAssignPayload, CohostRemovePayload } from '../../../shared/types';
import { extractYouTubeVideoId } from '../game/youtube.utils';
import { ValidationService } from '../game/validation.service';

export function registerHostHandlers(io: Server, socket: Socket): void {
  socket.on(SOCKET_EVENTS.HOST_ROOM_CREATE, (payload: CreateRoomPayload, callback?: (res: any) => void) => {
    if (!payload || !payload.name || payload.name.trim().length < 2 || payload.name.trim().length > 30) {
      const errorMsg = 'Room name must be between 2 and 30 characters.';
      socket.emit(SOCKET_EVENTS.ERROR, { message: errorMsg });
      if (typeof callback === 'function') callback({ success: false, error: errorMsg });
      return;
    }

    const userId = (socket as any).userId;
    const { roomId, hostToken, room } = RoomManager.createRoom({
      ...payload,
      hostId: socket.id,
      ownerUserId: userId
    });

    const response = { success: true, roomId, hostToken, room };
    if (typeof callback === 'function') {
      callback(response);
    }
    socket.emit('host:room:created', response);
    io.emit(SOCKET_EVENTS.ROOM_LIST, RoomManager.getRoomList());
  });

  socket.on(SOCKET_EVENTS.HOST_ROOM_UPDATE, (payload: HostRoomUpdatePayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'room.manage', payload?.hostToken);
    if (!check.authorized) return;

    const instance = RoomManager.getRoomInstance(payload.roomId);
    if (!instance) return;

    if (payload.name !== undefined && payload.name.trim().length >= 2) {
      instance.room.name = payload.name.trim();
    }
    if (payload.visibility && ['public', 'private', 'password'].includes(payload.visibility)) {
      instance.room.visibility = payload.visibility as any;
    }
    if (payload.allowChat !== undefined) {
      instance.room.allowChat = payload.allowChat;
    }
    if (payload.allowGuestEmotes !== undefined) {
      instance.room.allowGuestEmotes = payload.allowGuestEmotes;
    }
    if (payload.maxPlayers !== undefined) {
      instance.room.maxPlayers = Math.max(2, Math.min(50, payload.maxPlayers));
      instance.room.isFull = instance.room.currentPlayers >= instance.room.maxPlayers;
    }
    if (payload.rhythmMode !== undefined) {
      instance.room.rhythmMode = payload.rhythmMode;
    }

    io.to(payload.roomId).emit(SOCKET_EVENTS.ROOM_STATE, {
      room: instance.room,
      players: Array.from(instance.players.values()),
      musicState: MusicService.getMusicState(payload.roomId) || instance.musicState,
      currentTrack: instance.playlist[instance.currentTrackIndex] || null,
      playlist: instance.playlist,
      leaderboard: Array.from(instance.leaderboard.values()).sort((a, b) => b.score - a.score)
    });
    io.emit(SOCKET_EVENTS.ROOM_LIST, RoomManager.getRoomList());
  });

  socket.on(SOCKET_EVENTS.HOST_ROOM_END, (payload: HostCommandPayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'room.end', payload?.hostToken);
    if (!check.authorized) return;

    RoomManager.endRoom(payload.roomId);
    io.to(payload.roomId).emit(SOCKET_EVENTS.ROOM_ENDED, { roomId: payload.roomId });
    io.emit(SOCKET_EVENTS.ROOM_LIST, RoomManager.getRoomList());
  });

  socket.on(SOCKET_EVENTS.HOST_PLAYER_KICK, (payload: KickPlayerPayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'player.kick', payload?.hostToken);
    if (!check.authorized) return;

    if (payload.targetPlayerId === socket.id) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Cannot kick yourself.' });
      return;
    }

    const removed = RoomManager.removePlayerFromRoom(payload.targetPlayerId, payload.roomId);
    if (removed) {
      io.to(payload.targetPlayerId).emit(SOCKET_EVENTS.PLAYER_KICKED, {
        reason: payload.reason || 'Kicked by Host'
      });
      io.to(payload.roomId).emit(SOCKET_EVENTS.PLAYER_LEFT, { id: payload.targetPlayerId });
      io.to(payload.roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        senderId: 'system',
        nickname: 'System',
        message: `🚫 A player was kicked by the host.`,
        timestamp: Date.now(),
        isSystem: true,
        type: 'system'
      });
      io.emit(SOCKET_EVENTS.ROOM_LIST, RoomManager.getRoomList());
    }
  });

  socket.on('host:sync-dance', (payload: HostCommandPayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'room.manage', payload?.hostToken);
    if (!check.authorized) return;

    io.to(payload.roomId).emit('room:sync-dance', {
      moveId: 'group-dance-01',
      startsAt: Date.now() + 1000
    });
    
    io.to(payload.roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
      id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: 'system',
      nickname: 'System',
      message: `👯 Host initiated a SYNC DANCE!`,
      timestamp: Date.now(),
      isSystem: true,
      type: 'system'
    });
  });

  socket.on(SOCKET_EVENTS.HOST_BATTLE_START, (payload: HostCommandPayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'room.manage', payload?.hostToken);
    if (!check.authorized) return;

    const instance = RoomManager.getRoomInstance(payload.roomId);
    if (!instance) return;

    instance.room.battleState = 'active';
    instance.room.battleScores = { cyan: 0, pink: 0 };
    
    // Assign teams evenly
    let isCyan = true;
    for (const player of instance.players.values()) {
      if (player.isNpc) continue;
      player.team = isCyan ? 'cyan' : 'pink';
      isCyan = !isCyan;
    }

    io.to(payload.roomId).emit(SOCKET_EVENTS.ROOM_STATE, {
      room: instance.room,
      players: Array.from(instance.players.values()),
      musicState: MusicService.getMusicState(payload.roomId) || instance.musicState,
      currentTrack: instance.playlist[instance.currentTrackIndex] || null,
      playlist: instance.playlist,
      leaderboard: Array.from(instance.leaderboard.values()).sort((a, b) => b.score - a.score)
    });

    io.to(payload.roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
      id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: 'system',
      nickname: 'System',
      message: `🔥 DANCE BATTLE STARTED! Cyan vs Pink!`,
      timestamp: Date.now(),
      isSystem: true,
      type: 'system'
    });
  });

  socket.on(SOCKET_EVENTS.HOST_BATTLE_END, (payload: HostCommandPayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'room.manage', payload?.hostToken);
    if (!check.authorized) return;

    const instance = RoomManager.getRoomInstance(payload.roomId);
    if (!instance || instance.room.battleState !== 'active') return;

    instance.room.battleState = 'finished';

    io.to(payload.roomId).emit(SOCKET_EVENTS.BATTLE_RESULT, {
      scores: instance.room.battleScores
    });
    
    io.to(payload.roomId).emit(SOCKET_EVENTS.ROOM_STATE, {
      room: instance.room,
      players: Array.from(instance.players.values()),
      musicState: MusicService.getMusicState(payload.roomId) || instance.musicState,
      currentTrack: instance.playlist[instance.currentTrackIndex] || null,
      playlist: instance.playlist,
      leaderboard: Array.from(instance.leaderboard.values()).sort((a, b) => b.score - a.score)
    });

    const cyanScore = instance.room.battleScores?.cyan || 0;
    const pinkScore = instance.room.battleScores?.pink || 0;
    const winner = cyanScore > pinkScore ? 'CYAN' : pinkScore > cyanScore ? 'PINK' : 'TIE';

    io.to(payload.roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
      id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: 'system',
      nickname: 'System',
      message: `🏁 BATTLE ENDED! Winner: ${winner}!`,
      timestamp: Date.now(),
      isSystem: true,
      type: 'system'
    });
  });

  // Playlist management
  socket.on(SOCKET_EVENTS.HOST_PLAYLIST_ADD, (payload: PlaylistItemAddPayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'playlist.manage', payload?.hostToken);
    if (!check.authorized) return;

    const videoId = extractYouTubeVideoId(payload.url);
    if (!videoId) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid YouTube URL or Video ID.' });
      return;
    }

    const cleanTitle = ValidationService.sanitizeNickname(payload.title || `YouTube Video (${videoId})`) || `Video ${videoId}`;
    const item = MusicService.addPlaylistItem(
      payload.roomId,
      videoId,
      payload.url,
      cleanTitle,
      'Host'
    );

    const playlist = MusicService.getPlaylist(payload.roomId);
    io.to(payload.roomId).emit(SOCKET_EVENTS.PLAYLIST_UPDATED, playlist);

    io.to(payload.roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
      id: `sys-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      senderId: 'system',
      nickname: 'System',
      message: `🎵 Host added "${cleanTitle}" to the concert playlist!`,
      timestamp: Date.now(),
      isSystem: true,
      type: 'system'
    });

    // If room idle or currently playing default background music, play newly added YouTube track automatically
    const state = MusicService.getMusicState(payload.roomId);
    if (!state || state.status === 'idle' || !state.currentVideoId) {
      const updatedState = MusicService.play(payload.roomId, item.id);
      io.to(payload.roomId).emit(SOCKET_EVENTS.MUSIC_STATE, updatedState);
    }
  });

  socket.on(SOCKET_EVENTS.HOST_PLAYLIST_REMOVE, (payload: PlaylistItemRemovePayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'playlist.manage', payload?.hostToken);
    if (!check.authorized) return;

    MusicService.removePlaylistItem(payload.roomId, payload.itemId);
    const playlist = MusicService.getPlaylist(payload.roomId);
    io.to(payload.roomId).emit(SOCKET_EVENTS.PLAYLIST_UPDATED, playlist);
  });

  socket.on(SOCKET_EVENTS.HOST_PLAYLIST_REORDER, (payload: PlaylistReorderPayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'playlist.manage', payload?.hostToken);
    if (!check.authorized) return;

    MusicService.reorderPlaylist(payload.roomId, payload.newOrder);
    const playlist = MusicService.getPlaylist(payload.roomId);
    io.to(payload.roomId).emit(SOCKET_EVENTS.PLAYLIST_UPDATED, playlist);
  });

  socket.on(SOCKET_EVENTS.HOST_PLAYLIST_CLEAR, (payload: HostCommandPayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'playlist.manage', payload?.hostToken);
    if (!check.authorized) return;

    MusicService.clearPlaylist(payload.roomId);
    const playlist = MusicService.getPlaylist(payload.roomId);
    io.to(payload.roomId).emit(SOCKET_EVENTS.PLAYLIST_UPDATED, playlist);
    const state = MusicService.pause(payload.roomId);
    io.to(payload.roomId).emit(SOCKET_EVENTS.MUSIC_STATE, state);
  });

  // Music playback controls
  socket.on(SOCKET_EVENTS.HOST_MUSIC_PLAY, (payload: HostPlayMusicPayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'music.control', payload?.hostToken);
    if (!check.authorized) return;

    const state = MusicService.play(payload.roomId, payload.itemId);
    io.to(payload.roomId).emit(SOCKET_EVENTS.MUSIC_STATE, state);
  });

  socket.on(SOCKET_EVENTS.HOST_MUSIC_PAUSE, (payload: HostCommandPayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'music.control', payload?.hostToken);
    if (!check.authorized) return;

    const state = MusicService.pause(payload.roomId);
    io.to(payload.roomId).emit(SOCKET_EVENTS.MUSIC_STATE, state);
  });

  socket.on(SOCKET_EVENTS.HOST_MUSIC_RESUME, (payload: HostCommandPayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'music.control', payload?.hostToken);
    if (!check.authorized) return;

    const state = MusicService.resume(payload.roomId);
    io.to(payload.roomId).emit(SOCKET_EVENTS.MUSIC_STATE, state);
  });

  socket.on(SOCKET_EVENTS.HOST_MUSIC_SEEK, (payload: MusicSeekPayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'music.control', payload?.hostToken);
    if (!check.authorized) return;

    const state = MusicService.seek(payload.roomId, payload.position);
    io.to(payload.roomId).emit(SOCKET_EVENTS.MUSIC_STATE, state);
  });

  socket.on(SOCKET_EVENTS.HOST_MUSIC_NEXT, (payload: HostCommandPayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'music.control', payload?.hostToken);
    if (!check.authorized) return;

    if (payload.revision !== undefined) {
      const state = MusicService.getMusicState(payload.roomId);
      if (state && payload.revision < state.revision) {
        socket.emit(SOCKET_EVENTS.ERROR, { message: 'Concurrent action blocked: state has changed.' });
        return;
      }
    }

    const { musicState } = MusicService.next(payload.roomId);
    io.to(payload.roomId).emit(SOCKET_EVENTS.MUSIC_STATE, musicState);
  });

  socket.on(SOCKET_EVENTS.HOST_MUSIC_PREVIOUS, (payload: HostCommandPayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'music.control', payload?.hostToken);
    if (!check.authorized) return;

    const { musicState } = MusicService.previous(payload.roomId);
    io.to(payload.roomId).emit(SOCKET_EVENTS.MUSIC_STATE, musicState);
  });

  socket.on(SOCKET_EVENTS.HOST_MUSIC_VOLUME, (payload: MusicVolumePayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'music.control', payload?.hostToken);
    if (!check.authorized) return;

    const state = MusicService.setVolume(payload.roomId, payload.volume);
    io.to(payload.roomId).emit(SOCKET_EVENTS.MUSIC_STATE, state);
  });

  socket.on(SOCKET_EVENTS.HOST_TRACK_METADATA_UPDATE, async (payload: import('../../../shared/types').HostTrackMetadataUpdatePayload) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'playlist.manage', payload?.hostToken);
    if (!check.authorized) return;

    const updatedTrack = await MusicService.updateTrackMetadata(payload.roomId, payload.trackId, payload.metadata);
    if (updatedTrack) {
      io.to(payload.roomId).emit(SOCKET_EVENTS.TRACK_METADATA_UPDATED, { trackId: payload.trackId, metadata: payload.metadata });
      
      // Also broadcast updated playlist so it syncs up completely
      const playlist = MusicService.getPlaylist(payload.roomId);
      io.to(payload.roomId).emit(SOCKET_EVENTS.PLAYLIST_UPDATED, playlist);
    }
  });

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
        id: `sys-${Date.now()}`,
        senderId: 'system',
        nickname: 'System',
        message: `${res.player.nickname} is now a co-host.`,
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
        id: `sys-${Date.now()}`,
        senderId: 'system',
        nickname: 'System',
        message: `${res.player.nickname} is no longer a co-host.`,
        timestamp: Date.now(),
        isSystem: true,
        type: 'system'
      });
    } else {
      socket.emit(SOCKET_EVENTS.ERROR, { message: res.error || 'Failed to remove co-host' });
    }
  });

  socket.on(SOCKET_EVENTS.HOST_TRIGGER_CUE, (payload: { roomId: string; hostToken: string; cue: any }) => {
    const check = authorizeRoomAction(socket, payload?.roomId, 'music.control', payload?.hostToken);
    if (!check.authorized) return;

    io.to(payload.roomId).emit(SOCKET_EVENTS.SERVER_STAGE_CUE, payload.cue);
  });
}

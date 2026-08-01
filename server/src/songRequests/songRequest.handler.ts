import { Server, Socket } from 'socket.io';
import { RoomManager } from '../rooms/room.manager';
import { SongRequestService } from './songRequest.service';
import { SOCKET_EVENTS } from '../../../shared/events';
import {
  SocketErrorCode,
  SongRequestCreatePayload,
  SongRequestPlayNowPayload,
  SongRequestReviewPayload,
  SongRequestVotePayload
} from '../../../shared/types';
import { authorizeRoomAction } from '../permissions/authorizeRoomAction';
import { extractYouTubeVideoId } from '../game/youtube.utils';
import { MusicService } from '../rooms/music.service';
import { AutoDjService } from '../autoDj/autoDj.service';

export function registerSongRequestHandlers(io: Server, socket: Socket) {
  socket.on(SOCKET_EVENTS.SONG_REQUEST_CREATE, (payload: SongRequestCreatePayload) => {
    const { roomId, url, message } = payload;
    const player = RoomManager.getPlayer(roomId, socket.id);
    if (!player) {
      return socket.emit(SOCKET_EVENTS.ERROR, { message: 'Not in room.', code: 'UNAUTHORIZED' as SocketErrorCode });
    }

    const room = RoomManager.getRoomSummary(roomId);
    if (!room || (room.requestSettings && !room.requestSettings.allowSongRequests)) {
      return socket.emit(SOCKET_EVENTS.ERROR, { message: 'Song requests are disabled in this room.', code: 'UNAUTHORIZED' as SocketErrorCode });
    }

    const sourceId = extractYouTubeVideoId(url);
    if (!sourceId) {
      return socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid YouTube URL.', code: 'INVALID_YOUTUBE_URL' as SocketErrorCode });
    }

    // Attempt to fetch title from a mock/real YT service if we had one.
    // For MVP, we will just use a generic title or derive from ID.
    const title = `Requested Video (${sourceId})`;

    const res = SongRequestService.createRequest(roomId, sourceId, url, title, player.id, player.nickname, message);
    if (!res.success) {
      return socket.emit(SOCKET_EVENTS.ERROR, { message: res.error, code: 'INVALID_PAYLOAD' as SocketErrorCode });
    }

    // Broadcast new request
    io.to(roomId).emit(SOCKET_EVENTS.SONG_REQUEST_UPDATED, { request: res.request });
    
    // Broadcast chat
    io.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
      id: `msg-${Date.now()}`,
      roomId,
      senderId: 'system',
      nickname: 'System',
      message: `${player.nickname} requested a song.`,
      timestamp: Date.now(),
      type: 'system',
      isSystem: true
    });
  });

  socket.on(SOCKET_EVENTS.SONG_REQUEST_VOTE, (payload: SongRequestVotePayload) => {
    const { roomId, requestId } = payload;
    const player = RoomManager.getPlayer(roomId, socket.id);
    if (!player) return;

    const res = SongRequestService.voteRequest(roomId, requestId, player.id);
    if (res.success && res.request) {
      io.to(roomId).emit(SOCKET_EVENTS.SONG_REQUEST_UPDATED, { request: res.request });
      AutoDjService.evaluateRequest(roomId, res.request);
    } else {
      socket.emit(SOCKET_EVENTS.ERROR, { message: res.error, code: 'INVALID_PAYLOAD' as SocketErrorCode });
    }
  });

  socket.on(SOCKET_EVENTS.SONG_REQUEST_UNVOTE, (payload: SongRequestVotePayload) => {
    const { roomId, requestId } = payload;
    const player = RoomManager.getPlayer(roomId, socket.id);
    if (!player) return;

    const res = SongRequestService.unvoteRequest(roomId, requestId, player.id);
    if (res.success && res.request) {
      io.to(roomId).emit(SOCKET_EVENTS.SONG_REQUEST_UPDATED, { request: res.request });
    } else {
      socket.emit(SOCKET_EVENTS.ERROR, { message: res.error, code: 'INVALID_PAYLOAD' as SocketErrorCode });
    }
  });

  socket.on(SOCKET_EVENTS.SONG_REQUEST_APPROVE, (payload: SongRequestReviewPayload) => {
    const { roomId, requestId, hostToken } = payload;
    const auth = authorizeRoomAction(socket, roomId, 'request.review', hostToken);
    if (!auth.authorized) return;

    const res = SongRequestService.approveRequest(roomId, requestId, auth.playerId || 'host');
    if (res.success && res.request) {
      const item = MusicService.addPlaylistItem(
        roomId,
        res.request.sourceId,
        res.request.originalUrl,
        res.request.title,
        res.request.requestedByNickname
      );
      io.to(roomId).emit(SOCKET_EVENTS.SONG_REQUEST_UPDATED, { request: res.request });
      io.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        id: `msg-${Date.now()}`,
        roomId,
        senderId: 'system',
        nickname: 'System',
        message: `“${res.request.title}” was added to the playlist.`,
        timestamp: Date.now(),
        type: 'system',
        isSystem: true
      });
    } else {
      socket.emit(SOCKET_EVENTS.ERROR, { message: res.error, code: 'INVALID_PAYLOAD' as SocketErrorCode });
    }
  });

  socket.on(SOCKET_EVENTS.SONG_REQUEST_REJECT, (payload: SongRequestReviewPayload) => {
    const { roomId, requestId, reason, hostToken } = payload;
    const auth = authorizeRoomAction(socket, roomId, 'request.review', hostToken);
    if (!auth.authorized) return;

    const res = SongRequestService.rejectRequest(roomId, requestId, reason || 'other', auth.playerId || 'host');
    if (res.success && res.request) {
      io.to(roomId).emit(SOCKET_EVENTS.SONG_REQUEST_UPDATED, { request: res.request });
    } else {
      socket.emit(SOCKET_EVENTS.ERROR, { message: res.error, code: 'INVALID_PAYLOAD' as SocketErrorCode });
    }
  });

  socket.on(SOCKET_EVENTS.SONG_REQUEST_PLAY_NOW, (payload: SongRequestPlayNowPayload) => {
    const { roomId, requestId, hostToken } = payload;
    const auth = authorizeRoomAction(socket, roomId, 'music.control', hostToken);
    if (!auth.authorized) return;

    // Approve if pending
    let request = SongRequestService.getRequest(roomId, requestId);
    if (!request) {
      return socket.emit(SOCKET_EVENTS.ERROR, { message: 'Request not found', code: 'INVALID_PAYLOAD' as SocketErrorCode });
    }

    if (request.status === 'pending') {
      SongRequestService.approveRequest(roomId, requestId, auth.playerId || 'host');
      request = SongRequestService.getRequest(roomId, requestId)!;
    }

    if (request.status === 'approved') {
      const item = MusicService.addPlaylistItem(
        roomId,
        request.sourceId,
        request.originalUrl,
        request.title,
        request.requestedByNickname
      );
      if (item) {
        MusicService.play(roomId, item.id);
        SongRequestService.markAsPlayed(roomId, requestId);
        io.to(roomId).emit(SOCKET_EVENTS.SONG_REQUEST_UPDATED, { request: SongRequestService.getRequest(roomId, requestId) });
      }
    }
  });

  socket.on(SOCKET_EVENTS.SONG_REQUEST_LIST, (payload: { roomId: string }) => {
    const { roomId } = payload;
    const requests = SongRequestService.getRoomRequests(roomId);
    socket.emit(SOCKET_EVENTS.SONG_REQUEST_LIST, { requests });
  });
}

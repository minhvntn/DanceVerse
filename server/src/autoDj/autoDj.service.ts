import { RoomManager } from '../rooms/room.manager';
import { SongRequestService } from '../songRequests/songRequest.service';
import { SongRequest } from '../../../shared/types';
import { MusicService } from '../rooms/music.service';
import { SOCKET_EVENTS } from '../../../shared/events';
import { Server } from 'socket.io';

export class AutoDjService {
  private static io: Server | null = null;

  public static initialize(io: Server) {
    this.io = io;
  }

  public static evaluateRequest(roomId: string, request: SongRequest): void {
    const room = RoomManager.getRoomSummary(roomId);
    if (!room || !room.requestSettings?.autoDj?.enabled) return;

    const { autoApproveVoteThreshold } = room.requestSettings.autoDj;
    if (autoApproveVoteThreshold > 0 && request.voteCount >= autoApproveVoteThreshold && request.status === 'pending') {
      const res = SongRequestService.approveRequest(roomId, request.id, 'auto-dj');
      if (res.success && res.request) {
        // Automatically add to playlist
        MusicService.addPlaylistItem(
          roomId,
          request.sourceId,
          request.originalUrl,
          request.title,
          'Auto-DJ'
        );

        // Broadcast updates
        this.io?.to(roomId).emit(SOCKET_EVENTS.SONG_REQUEST_UPDATED, { request: res.request });
        this.io?.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
          id: `msg-${Date.now()}`,
          roomId,
          senderId: 'system',
          nickname: 'System',
          message: `“${request.title}” reached ${autoApproveVoteThreshold} votes and was added by Auto-DJ.`,
          timestamp: Date.now(),
          type: 'system',
          isSystem: true
        });
      }
    }
  }

  public static handlePlaylistEnded(roomId: string): boolean {
    const room = RoomManager.getRoomSummary(roomId);
    if (!room || !room.requestSettings?.autoDj?.enabled || !room.requestSettings.autoDj.playHighestVotedWhenPlaylistEnds) {
      return false;
    }

    const pendingRequests = SongRequestService.getRoomRequests(roomId).filter((r) => r.status === 'pending');
    if (pendingRequests.length === 0) return false;

    // Sort by vote count descending, then by requestedAt ascending
    pendingRequests.sort((a, b) => {
      if (b.voteCount !== a.voteCount) {
        return b.voteCount - a.voteCount;
      }
      return a.requestedAt - b.requestedAt;
    });

    const topRequest = pendingRequests[0];
    const res = SongRequestService.approveRequest(roomId, topRequest.id, 'auto-dj');
    if (res.success && res.request) {
      // Add to playlist and play immediately
      const item = MusicService.addPlaylistItem(
        roomId,
        topRequest.sourceId,
        topRequest.originalUrl,
        topRequest.title,
        'Auto-DJ'
      );

      if (item) {
        MusicService.play(roomId, item.id);
        SongRequestService.markAsPlayed(roomId, topRequest.id);
        this.io?.to(roomId).emit(SOCKET_EVENTS.SONG_REQUEST_UPDATED, { request: topRequest });
        this.io?.to(roomId).emit(SOCKET_EVENTS.CHAT_MESSAGE, {
          id: `msg-${Date.now()}`,
          roomId,
          senderId: 'system',
          nickname: 'System',
          message: `Auto-DJ selected the highest-voted song: “${topRequest.title}”.`,
          timestamp: Date.now(),
          type: 'system',
          isSystem: true
        });
        return true;
      }
    }
    return false;
  }
}

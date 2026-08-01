import { SongRequest, SongRejectionReason, SongRequestStatus } from '../../../shared/types';
import { MusicService } from '../rooms/music.service';

const MAX_PENDING_REQUESTS_PER_USER = 3;
const MAX_PENDING_REQUESTS_PER_ROOM = 50;
const SONG_REQUEST_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export class SongRequestService {
  // Key: roomId, Value: Array of SongRequests
  private static requests: Map<string, SongRequest[]> = new Map();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  public static initialize() {
    if (this.cleanupInterval) clearInterval(this.cleanupInterval);
    this.cleanupInterval = setInterval(() => this.cleanupExpiredRequests(), 60_000);
  }

  public static getRoomRequests(roomId: string): SongRequest[] {
    return this.requests.get(roomId) || [];
  }

  public static getRequest(roomId: string, requestId: string): SongRequest | undefined {
    return this.getRoomRequests(roomId).find((r) => r.id === requestId);
  }

  public static createRequest(
    roomId: string,
    sourceId: string,
    originalUrl: string,
    title: string,
    playerId: string,
    nickname: string,
    message?: string
  ): { success: boolean; error?: string; request?: SongRequest } {
    const roomRequests = this.getRoomRequests(roomId);
    
    // 1. Check room limit
    const pendingCount = roomRequests.filter((r) => r.status === 'pending').length;
    if (pendingCount >= MAX_PENDING_REQUESTS_PER_ROOM) {
      return { success: false, error: 'Room request queue is full.' };
    }

    // 2. Check user limit
    const userPending = roomRequests.filter((r) => r.status === 'pending' && r.requestedByPlayerId === playerId).length;
    if (userPending >= MAX_PENDING_REQUESTS_PER_USER) {
      return { success: false, error: 'You have reached the maximum pending requests limit.' };
    }

    // 3. Check duplicate in playlist
    const playlist = MusicService.getPlaylist(roomId);
    if (playlist.some((item) => item.source === 'youtube' && item.sourceId === sourceId)) {
      return { success: false, error: 'This song is already in the playlist.' };
    }

    // 4. Check duplicate in pending/approved requests
    if (roomRequests.some((r) => (r.status === 'pending' || r.status === 'approved') && r.sourceId === sourceId)) {
      return { success: false, error: 'This song has already been requested.' };
    }

    const newRequest: SongRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      roomId,
      source: 'youtube',
      sourceId,
      originalUrl,
      title,
      thumbnailUrl: `https://img.youtube.com/vi/${sourceId}/hqdefault.jpg`,
      requestedByPlayerId: playerId,
      requestedByNickname: nickname,
      requestMessage: message?.substring(0, 100),
      requestedAt: Date.now(),
      status: 'pending',
      votes: [playerId], // Auto-vote for own request
      voteCount: 1
    };

    roomRequests.push(newRequest);
    this.requests.set(roomId, roomRequests);

    return { success: true, request: newRequest };
  }

  public static voteRequest(roomId: string, requestId: string, playerId: string): { success: boolean; error?: string; request?: SongRequest } {
    const request = this.getRequest(roomId, requestId);
    if (!request) return { success: false, error: 'Request not found.' };
    if (request.status !== 'pending') return { success: false, error: 'Only pending requests can be voted on.' };
    if (request.votes.includes(playerId)) return { success: false, error: 'You have already voted for this song.' };

    request.votes.push(playerId);
    request.voteCount = request.votes.length;
    return { success: true, request };
  }

  public static unvoteRequest(roomId: string, requestId: string, playerId: string): { success: boolean; error?: string; request?: SongRequest } {
    const request = this.getRequest(roomId, requestId);
    if (!request) return { success: false, error: 'Request not found.' };
    if (request.status !== 'pending') return { success: false, error: 'Cannot unvote on this request anymore.' };
    
    const index = request.votes.indexOf(playerId);
    if (index === -1) return { success: false, error: 'You have not voted for this song.' };

    request.votes.splice(index, 1);
    request.voteCount = request.votes.length;
    return { success: true, request };
  }

  public static approveRequest(roomId: string, requestId: string, reviewerId?: string): { success: boolean; error?: string; request?: SongRequest } {
    const request = this.getRequest(roomId, requestId);
    if (!request) return { success: false, error: 'Request not found.' };
    if (request.status !== 'pending') return { success: false, error: 'Request is not pending.' };

    request.status = 'approved';
    request.reviewedByPlayerId = reviewerId;
    request.reviewedAt = Date.now();
    return { success: true, request };
  }

  public static rejectRequest(roomId: string, requestId: string, reason: SongRejectionReason | string, reviewerId?: string): { success: boolean; error?: string; request?: SongRequest } {
    const request = this.getRequest(roomId, requestId);
    if (!request) return { success: false, error: 'Request not found.' };
    if (request.status !== 'pending') return { success: false, error: 'Request is not pending.' };

    request.status = 'rejected';
    request.rejectionReason = reason;
    request.reviewedByPlayerId = reviewerId;
    request.reviewedAt = Date.now();
    return { success: true, request };
  }

  public static markAsPlayed(roomId: string, requestId: string): void {
    const request = this.getRequest(roomId, requestId);
    if (request) {
      request.status = 'played';
    }
  }

  public static cleanupExpiredRequests(): void {
    const now = Date.now();
    this.requests.forEach((roomRequests, roomId) => {
      let changed = false;
      roomRequests.forEach((req) => {
        if (req.status === 'pending' && now - req.requestedAt > SONG_REQUEST_TTL_MS) {
          req.status = 'expired';
          changed = true;
        }
      });
      // Optionally prune very old rejected/played/expired requests to save memory
      const pruned = roomRequests.filter(
        (req) => req.status === 'pending' || req.status === 'approved' || (now - (req.reviewedAt || req.requestedAt) < SONG_REQUEST_TTL_MS)
      );
      if (pruned.length !== roomRequests.length) {
        this.requests.set(roomId, pruned);
      }
    });
  }

  public static clearRoom(roomId: string): void {
    this.requests.delete(roomId);
  }
}

// Start cleanup interval
SongRequestService.initialize();

import { describe, it, expect, beforeEach } from 'vitest';
import { SongRequestService } from './songRequest.service';
import { MusicService } from '../rooms/music.service';

describe('SongRequestService', () => {
  const roomId = 'room-123';
  const sourceId = 'dQw4w9WgXcQ';
  const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ';

  beforeEach(() => {
    SongRequestService.clearRoom(roomId);
    MusicService.clearPlaylist(roomId);
  });

  it('should create a new song request', () => {
    const res = SongRequestService.createRequest(roomId, sourceId, url, 'Never Gonna Give You Up', 'player1', 'Player 1');
    expect(res.success).toBe(true);
    expect(res.request).toBeDefined();
    expect(res.request?.status).toBe('pending');
    expect(res.request?.voteCount).toBe(1);
    expect(res.request?.votes).toContain('player1');
  });

  it('should not allow duplicate requests for the same sourceId', () => {
    SongRequestService.createRequest(roomId, sourceId, url, 'Song', 'player1', 'P1');
    const res = SongRequestService.createRequest(roomId, sourceId, url, 'Song 2', 'player2', 'P2');
    
    expect(res.success).toBe(false);
    expect(res.error).toContain('already been requested');
  });

  it('should not allow requests if song is already in playlist', () => {
    MusicService.addPlaylistItem(roomId, sourceId, url, 'Song in playlist', 'Host');
    const res = SongRequestService.createRequest(roomId, sourceId, url, 'Song', 'player1', 'P1');
    
    expect(res.success).toBe(false);
    expect(res.error).toContain('already in the playlist');
  });

  it('should allow voting and unvoting', () => {
    const { request } = SongRequestService.createRequest(roomId, sourceId, url, 'Song', 'player1', 'P1');
    const reqId = request!.id;

    const voteRes = SongRequestService.voteRequest(roomId, reqId, 'player2');
    expect(voteRes.success).toBe(true);
    expect(voteRes.request?.voteCount).toBe(2);

    const unvoteRes = SongRequestService.unvoteRequest(roomId, reqId, 'player2');
    expect(unvoteRes.success).toBe(true);
    expect(unvoteRes.request?.voteCount).toBe(1);
  });

  it('should reject double voting', () => {
    const { request } = SongRequestService.createRequest(roomId, sourceId, url, 'Song', 'player1', 'P1');
    const reqId = request!.id;

    const voteRes1 = SongRequestService.voteRequest(roomId, reqId, 'player2');
    expect(voteRes1.success).toBe(true);

    const voteRes2 = SongRequestService.voteRequest(roomId, reqId, 'player2');
    expect(voteRes2.success).toBe(false);
  });

  it('should approve requests', () => {
    const { request } = SongRequestService.createRequest(roomId, sourceId, url, 'Song', 'player1', 'P1');
    const res = SongRequestService.approveRequest(roomId, request!.id, 'host1');
    
    expect(res.success).toBe(true);
    expect(res.request?.status).toBe('approved');
    expect(res.request?.reviewedByPlayerId).toBe('host1');
  });

  it('should reject requests', () => {
    const { request } = SongRequestService.createRequest(roomId, sourceId, url, 'Song', 'player1', 'P1');
    const res = SongRequestService.rejectRequest(roomId, request!.id, 'inappropriate', 'host1');
    
    expect(res.success).toBe(true);
    expect(res.request?.status).toBe('rejected');
    expect(res.request?.rejectionReason).toBe('inappropriate');
  });
});

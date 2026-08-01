import { describe, it, expect, beforeEach } from 'vitest';
import { RoomManager } from '../src/rooms/room.manager';
import { MusicService } from '../src/rooms/music.service';
import { Player } from '../../shared/types';

describe('Host Room & Music System Tests', () => {
  beforeEach(() => {
    // Reset rooms and music state before each test
    const allRooms = RoomManager.getRoomList();
    allRooms.forEach((r) => RoomManager.endRoom(r.id));
  });

  it('creates a protected room and validates password on join', () => {
    const hostPlayer: Player = {
      id: 'host-socket-1',
      nickname: 'DJ_Luna',
      avatarType: 'CyberPunk',
      roomId: '',
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      animation: 'Idle'
    };

    const created = RoomManager.createRoom(
      {
        name: 'VIP Cyber Lounge',
        visibility: 'private',
        password: 'secret_password',
        maxPlayers: 10,
        allowChat: true,
        allowGuestEmotes: true
      },
      hostPlayer
    );

    expect(created.room.name).toBe('VIP Cyber Lounge');
    expect(created.room.hasPassword).toBe(true);
    expect(created.hostToken).toBeDefined();

    // Try joining without password
    const guestPlayer1: Player = {
      id: 'guest-socket-1',
      nickname: 'Guest_1',
      avatarType: 'Boy',
      roomId: created.room.id,
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      animation: 'Idle'
    };

    const failJoin = RoomManager.addPlayerToRoom(guestPlayer1, undefined);
    expect(failJoin.success).toBe(false);
    expect(failJoin.error).toBe('Wrong password');

    // Join with wrong password
    const failJoin2 = RoomManager.addPlayerToRoom(guestPlayer1, 'wrong_pass');
    expect(failJoin2.success).toBe(false);
    expect(failJoin2.error).toBe('Wrong password');

    // Join with correct password
    const successJoin = RoomManager.addPlayerToRoom(guestPlayer1, 'secret_password');
    expect(successJoin.success).toBe(true);
    const guestFound = successJoin.state?.players.find((p) => p.id === 'guest-socket-1');
    expect(guestFound).toBeDefined();
    expect(successJoin.state?.role).toBe('guest');
  });

  it('validates host token correctly for host commands', () => {
    const hostPlayer: Player = {
      id: 'host-socket-2',
      nickname: 'Host_Neon',
      avatarType: 'Girl',
      roomId: '',
      position: { x: 0, y: 0, z: 0 },
      rotation: 0,
      animation: 'Idle'
    };

    const { room, hostToken } = RoomManager.createRoom(
      { name: 'Open Concert', visibility: 'public' },
      hostPlayer
    );

    // Host token should authorize
    expect(RoomManager.verifyHostToken(room.id, hostToken)).toBe(true);

    // Wrong token should be rejected
    expect(RoomManager.verifyHostToken(room.id, 'fake-token-123')).toBe(false);
  });

  it('adds, reorders, and removes tracks from authoritative playlist', () => {
    const roomId = 'test-room-playlist';
    MusicService.setPlaylist(roomId, []);

    const item1 = MusicService.addPlaylistItem(roomId, 'vid-1111111', 'https://youtu.be/vid-1111111', 'First Track', 'Host');
    const item2 = MusicService.addPlaylistItem(roomId, 'vid-2222222', 'https://youtu.be/vid-2222222', 'Second Track', 'Host');
    const item3 = MusicService.addPlaylistItem(roomId, 'vid-3333333', 'https://youtu.be/vid-3333333', 'Third Track', 'Host');

    let playlist = MusicService.getPlaylist(roomId);
    expect(playlist).toHaveLength(3);
    expect(playlist[0].id).toBe(item1.id);
    expect(playlist[2].id).toBe(item3.id);

    // Reorder: move 3rd track to top
    const newOrder = [item3.id, item1.id, item2.id];
    MusicService.reorderPlaylist(roomId, newOrder);

    playlist = MusicService.getPlaylist(roomId);
    expect(playlist[0].id).toBe(item3.id);
    expect(playlist[1].id).toBe(item1.id);
    expect(playlist[2].id).toBe(item2.id);

    // Remove middle track (item1)
    const removed = MusicService.removePlaylistItem(roomId, item1.id);
    expect(removed).toBe(true);

    playlist = MusicService.getPlaylist(roomId);
    expect(playlist).toHaveLength(2);
    expect(playlist.map((i) => i.id)).toEqual([item3.id, item2.id]);
  });

  it('calculates music timestamp math correctly when playing vs paused', () => {
    const state = {
      currentItemId: 'track-1',
      status: 'playing' as const,
      isPlaying: true,
      startedAt: Date.now() - 30000, // started 30 seconds ago
      pausedAt: null,
      pausedPosition: 0,
      volume: 80,
      revision: 1
    };

    const currentTime = MusicService.getCurrentPlaybackTime(state);
    expect(currentTime).toBeGreaterThanOrEqual(29.9);
    expect(currentTime).toBeLessThanOrEqual(31.0);

    // Paused state
    const pausedState = {
      ...state,
      status: 'paused' as const,
      isPlaying: false,
      startedAt: null,
      pausedPosition: 42.5
    };

    expect(MusicService.getCurrentPlaybackTime(pausedState)).toBe(42.5);
  });
});

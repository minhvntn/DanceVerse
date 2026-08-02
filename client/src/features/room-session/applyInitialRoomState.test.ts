import { describe, expect, it, vi } from 'vitest';
import { RoomStatePayload, Room } from '../../types';
import { applyInitialRoomState } from './applyInitialRoomState';

const payload = {
  room: {
    id: 'room-test',
    name: 'Test',
    thumbnail: '',
    currentPlayers: 1,
    maxPlayers: 30,
    isFull: false
  } as unknown as Room,
  players: [],
  musicState: {
    currentItemId: null,
    status: 'idle',
    startedAt: null,
    pausedAt: null,
    pausedPosition: 0,
    volume: 1,
    revision: 0
  },
  currentTrack: null,
  leaderboard: [],
  myPlayerId: 'socket-host',
  role: 'host'
} satisfies RoomStatePayload;

describe('applyInitialRoomState', () => {
  it('stores room state and the authoritative local player id', () => {
    const setRoomState = vi.fn();
    const setMyPlayerId = vi.fn();

    applyInitialRoomState(payload, { setRoomState, setMyPlayerId });

    expect(setRoomState).toHaveBeenCalledWith(payload);
    expect(setMyPlayerId).toHaveBeenCalledWith('socket-host');
  });

  it('does not overwrite identity when the payload omits myPlayerId', () => {
    const setRoomState = vi.fn();
    const setMyPlayerId = vi.fn();

    applyInitialRoomState(
      { ...payload, myPlayerId: undefined },
      { setRoomState, setMyPlayerId }
    );

    expect(setRoomState).toHaveBeenCalled();
    expect(setMyPlayerId).not.toHaveBeenCalled();
  });
});

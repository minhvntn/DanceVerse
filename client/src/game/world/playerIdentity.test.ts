import { describe, expect, it } from 'vitest';
import { Player } from '../../types';
import { getLocalPlayerLabel, selectWorldPlayers } from './playerIdentity';

const player = (id: string, nickname: string, isNpc = false): Player => ({
  id,
  nickname,
  avatarType: 'Boy',
  roomId: 'room-test',
  position: { x: 0, y: 0, z: 8 },
  rotation: 0,
  animation: 'Idle',
  isNpc
});

describe('selectWorldPlayers', () => {
  it('returns the socket owner as local and excludes it from remote rendering', () => {
    const host = player('socket-host', 'Host');
    const guest = player('socket-guest', 'Guest');
    const npc = player('npc-1', 'DJMax', true);

    const result = selectWorldPlayers(
      { [host.id]: host, [guest.id]: guest, [npc.id]: npc },
      host.id
    );

    expect(result.localPlayer).toBe(host);
    expect(result.remotePlayers).toEqual([guest, npc]);
  });

  it('does not guess identity when myPlayerId is missing', () => {
    const host = player('socket-host', 'Host');
    const result = selectWorldPlayers({ [host.id]: host }, '');

    expect(result.localPlayer).toBeUndefined();
    expect(result.remotePlayers).toEqual([host]);
  });
});

describe('getLocalPlayerLabel', () => {
  it('marks a named host without duplicating the fallback Host name', () => {
    expect(getLocalPlayerLabel('Bo', 'host')).toBe('Bo · HOST');
    expect(getLocalPlayerLabel('Host', 'host')).toBe('HOST');
  });

  it('uses Fan for an empty guest while preserving an explicit nickname', () => {
    expect(getLocalPlayerLabel('', 'guest')).toBe('Fan');
    expect(getLocalPlayerLabel('Dancer', 'guest')).toBe('Dancer');
  });
});

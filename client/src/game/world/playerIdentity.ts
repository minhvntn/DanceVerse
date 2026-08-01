import { Player, UserRole } from '../../types';

export interface WorldPlayerSelection {
  localPlayer?: Player;
  remotePlayers: Player[];
}

export function selectWorldPlayers(
  players: Record<string, Player>,
  myPlayerId: string
): WorldPlayerSelection {
  const localPlayer = myPlayerId ? players[myPlayerId] : undefined;
  const remotePlayers = Object.values(players).filter(
    (player) => !myPlayerId || player.id !== myPlayerId
  );

  return { localPlayer, remotePlayers };
}

export function getLocalPlayerLabel(nickname: string, role: UserRole): string {
  const cleanNickname = nickname.trim();
  if (role !== 'host') return cleanNickname || 'Dancer';
  if (!cleanNickname || cleanNickname.toLowerCase() === 'host') return 'HOST';
  return `${cleanNickname} · HOST`;
}

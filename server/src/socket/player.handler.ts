import { Socket, Server } from 'socket.io';
import { SOCKET_EVENTS } from '../../../shared/events';
import { Player, DanceAnimationType, Vector3D } from '../../../shared/types';
import { RoomManager } from '../rooms/room.manager';
import { ValidationService } from '../game/validation.service';
import { getCellId, getAdjacentCellIds } from '../game/grid.util';

import { RateLimiter } from '../utils/RateLimiter';

const emoteRateLimiter = new RateLimiter(3, 0.5); // Max 3 burst, 1 every 2s

export function registerPlayerHandlers(io: Server, socket: Socket, playerSession: { current: Player | null }): void {
  // Throttled movement broadcast (server-side tracking last move time)
  let lastMoveBroadcast = 0;
  const MOVE_INTERVAL = 1000 / 15; // ~15 Hz

  // Helper to get current spatial cell room for the player
  const getCellRoom = () => {
    if (!playerSession.current) return null;
    const cell = (socket as any).currentCell || getCellId(playerSession.current.position.x, playerSession.current.position.z);
    return `${playerSession.current.roomId}:cell:${cell}`;
  };

  socket.on(SOCKET_EVENTS.PLAYER_MOVE, (payload: { position: { x: number; z: number }; rotation: number; animation?: DanceAnimationType; seq?: number }) => {
    if (!playerSession.current) return;

    const now = Date.now();
    // Allow up to 15Hz (66ms) + slight jitter allowance
    if (now - lastMoveBroadcast < 50) return;
    lastMoveBroadcast = now;

    // Validate position ranges
    const x = Math.max(-40, Math.min(40, payload.position?.x || 0));
    const z = Math.max(-20, Math.min(40, payload.position?.z || 0));
    const validPosition = { x, y: 0, z };
    
    const rotation = typeof payload.rotation === 'number' ? payload.rotation : playerSession.current.rotation;
    const animation = payload.animation || playerSession.current.animation;

    playerSession.current.position = validPosition;
    playerSession.current.rotation = rotation;
    playerSession.current.animation = animation;

    // Update in RoomManager
    const instance = RoomManager.getRoomInstance(playerSession.current.roomId);
    if (instance) {
      instance.players.set(socket.id, playerSession.current);
    }

    // Spatial Grid Interest Management
    const newCell = getCellId(validPosition.x, validPosition.z);
    const oldCell = (socket as any).currentCell;

    if (oldCell !== newCell) {
      // Transition cells
      const oldCells = oldCell ? getAdjacentCellIds(oldCell) : [];
      const newCells = getAdjacentCellIds(newCell);

      const toLeave = oldCells.filter(c => !newCells.includes(c));
      const toJoin = newCells.filter(c => !oldCells.includes(c));

      const baseRoom = playerSession.current.roomId;
      toLeave.forEach(c => socket.leave(`${baseRoom}:cell:${c}`));
      toJoin.forEach(c => socket.join(`${baseRoom}:cell:${c}`));

      (socket as any).currentCell = newCell;
    }

    // Emit ONLY to the player's current cell room
    const cellRoom = `${playerSession.current.roomId}:cell:${newCell}`;
    socket.to(cellRoom).emit(SOCKET_EVENTS.PLAYER_MOVE, {
      id: socket.id,
      position: { x: validPosition.x, z: validPosition.z }, // strip y
      rotation,
      animation,
      seq: payload.seq
    });
  });

  socket.on(SOCKET_EVENTS.PLAYER_ANIMATION, (payload: { animation: DanceAnimationType }) => {
    if (!playerSession.current || !payload.animation) return;

    playerSession.current.animation = payload.animation;
    const instance = RoomManager.getRoomInstance(playerSession.current.roomId);
    if (instance) {
      instance.players.set(socket.id, playerSession.current);
      
      // Give energy based on animation type
      if (['WaveLightstick', 'Jump', 'Cheer'].includes(payload.animation)) {
        RoomManager.addEnergy(playerSession.current.roomId, 1.5);
      } else {
        RoomManager.addEnergy(playerSession.current.roomId, 0.5);
      }
    }

    const cellRoom = getCellRoom();
    if (cellRoom) {
      socket.to(cellRoom).emit(SOCKET_EVENTS.PLAYER_ANIMATION, {
        id: socket.id,
        animation: payload.animation
      });
    } else {
      socket.to(playerSession.current.roomId).emit(SOCKET_EVENTS.PLAYER_ANIMATION, {
        id: socket.id,
        animation: payload.animation
      });
    }
  });

  socket.on(SOCKET_EVENTS.PLAYER_EMOTE, (payload: { emote: string }) => {
    if (!playerSession.current || !payload.emote) return;

    if (!emoteRateLimiter.tryConsume(socket.id)) {
      return; // Silently drop spam emotes
    }

    RoomManager.addEnergy(playerSession.current.roomId, 2);

    io.to(playerSession.current.roomId).emit(SOCKET_EVENTS.PLAYER_EMOTE, {
      id: socket.id,
      emote: payload.emote,
      startedAt: Date.now()
    });
  });

  socket.on(SOCKET_EVENTS.PLAYER_AVATAR_UPDATE, (payload: { avatarConfig: any }) => {
    if (!playerSession.current) return;
    
    playerSession.current.avatarConfig = payload.avatarConfig;
    
    const instance = RoomManager.getRoomInstance(playerSession.current.roomId);
    if (instance) {
      instance.players.set(socket.id, playerSession.current);
    }
    
    // Broadcast to others in spatial cell
    const cellRoom = getCellRoom();
    if (cellRoom) {
      socket.to(cellRoom).emit(SOCKET_EVENTS.PLAYER_AVATAR_UPDATE, {
        id: socket.id,
        avatarConfig: payload.avatarConfig
      });
    } else {
      socket.to(playerSession.current.roomId).emit(SOCKET_EVENTS.PLAYER_AVATAR_UPDATE, {
        id: socket.id,
        avatarConfig: payload.avatarConfig
      });
    }
  });

  socket.on(SOCKET_EVENTS.PLAYER_LIGHTSTICK_UPDATE, (payload: { equippedLightstick: boolean; lightstickColor: string }) => {
    if (!playerSession.current) return;

    playerSession.current.equippedLightstick = payload.equippedLightstick;
    playerSession.current.lightstickColor = payload.lightstickColor;

    const instance = RoomManager.getRoomInstance(playerSession.current.roomId);
    if (instance) {
      instance.players.set(socket.id, playerSession.current);
    }

    // Broadcast to others in spatial cell
    const cellRoom = getCellRoom();
    if (cellRoom) {
      socket.to(cellRoom).emit(SOCKET_EVENTS.PLAYER_LIGHTSTICK_UPDATE, {
        id: socket.id,
        equippedLightstick: payload.equippedLightstick,
        lightstickColor: payload.lightstickColor
      });
    } else {
      socket.to(playerSession.current.roomId).emit(SOCKET_EVENTS.PLAYER_LIGHTSTICK_UPDATE, {
        id: socket.id,
        equippedLightstick: payload.equippedLightstick,
        lightstickColor: payload.lightstickColor
      });
    }
  });

  socket.on(SOCKET_EVENTS.PLAYER_SCORE, (payload: { scoreAdd: number }) => {
    if (!playerSession.current || typeof payload.scoreAdd !== 'number') return;

    RoomManager.updatePlayerScore(
      playerSession.current.roomId,
      socket.id,
      playerSession.current.nickname,
      payload.scoreAdd
    );
    // Leaderboard broadcast is debounced externally or client pulls it
    RoomManager.triggerLeaderboardBroadcast(playerSession.current.roomId, io);
  });

  let rhythmHitTimestamps: number[] = [];
  const pairHitBuffer = new Map<string, { [playerId: string]: { time: number; judgement: string } }>();

  socket.on(SOCKET_EVENTS.PLAYER_RHYTHM_HIT, (payload: { rating: string; scoreAdd: number; energyAdd: number; combo: number; hitTime?: number; roundId?: string }) => {
    if (!playerSession.current) return;

    // Rate limit: max 5 hits per second to prevent spamming
    const now = Date.now();
    rhythmHitTimestamps = rhythmHitTimestamps.filter(t => now - t < 1000);
    if (rhythmHitTimestamps.length >= 5) {
      return; // Too many hits
    }
    rhythmHitTimestamps.push(now);

    const instance = RoomManager.getRoomInstance(playerSession.current.roomId);
    if (!instance || !instance.room.rhythmMode) return;

    // Update Energy
    if (typeof payload.energyAdd === 'number' && payload.energyAdd > 0) {
      instance.energy = Math.min(100, (instance.energy || 0) + payload.energyAdd);
      io.to(playerSession.current.roomId).emit('room:energy:update', { energy: instance.energy });
    }

    // Update Score
    if (typeof payload.scoreAdd === 'number' && payload.scoreAdd > 0) {
      RoomManager.updatePlayerScore(
        playerSession.current.roomId,
        socket.id,
        playerSession.current.nickname,
        payload.scoreAdd
      );
      RoomManager.triggerLeaderboardBroadcast(playerSession.current.roomId, io);
    }
    
    // Broadcast to others for reactions
    socket.to(playerSession.current.roomId).emit(SOCKET_EVENTS.PLAYER_RHYTHM_HIT, {
      id: socket.id,
      rating: payload.rating,
      combo: payload.combo
    });

    // Pair Logic
    const pairId = playerSession.current.pairId;
    if (pairId && instance.pairs && payload.roundId && payload.hitTime) {
      const pair = instance.pairs.get(pairId);
      if (pair) {
        if (!pairHitBuffer.has(payload.roundId)) {
          pairHitBuffer.set(payload.roundId, {});
        }
        const roundBuffer = pairHitBuffer.get(payload.roundId)!;
        roundBuffer[playerSession.current.id] = { time: payload.hitTime, judgement: payload.rating };

        const p1Hit = roundBuffer[pair.player1Id];
        const p2Hit = roundBuffer[pair.player2Id];

        if (p1Hit && p2Hit) {
          // Both have hit
          pairHitBuffer.delete(payload.roundId); // clean up

          let syncJudgement: 'ULTRA' | 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS' = 'MISS';
          let differenceMs = Math.abs(p1Hit.time - p2Hit.time);

          if (p1Hit.judgement === 'miss' || p2Hit.judgement === 'miss') {
            syncJudgement = 'MISS';
            pair.pairCombo = 0;
          } else {
            pair.pairCombo += 1;
            
            if (differenceMs <= 30 && (p1Hit.judgement === 'perfectmax' || p1Hit.judgement === 'perfect') && (p2Hit.judgement === 'perfectmax' || p2Hit.judgement === 'perfect')) {
              syncJudgement = 'ULTRA';
            } else if (differenceMs <= 60) {
              syncJudgement = 'PERFECT';
            } else if (differenceMs <= 120) {
              syncJudgement = 'GREAT';
            } else {
              syncJudgement = 'GOOD';
            }
          }

          let pairScoreBonus = 0;
          if (syncJudgement === 'ULTRA') pairScoreBonus = 300;
          else if (syncJudgement === 'PERFECT') pairScoreBonus = 200;
          else if (syncJudgement === 'GREAT') pairScoreBonus = 100;
          else if (syncJudgement === 'GOOD') pairScoreBonus = 50;

          if (pair.feverMeter !== undefined) {
             if (syncJudgement === 'ULTRA') pair.feverMeter = Math.min(100, pair.feverMeter + 10);
             else if (syncJudgement === 'PERFECT') pair.feverMeter = Math.min(100, pair.feverMeter + 5);
          }

          pair.pairScore += pairScoreBonus;

          // Add bonus to both personal scores
          if (pairScoreBonus > 0) {
             RoomManager.updatePlayerScore(playerSession.current.roomId, pair.player1Id, 'Player', pairScoreBonus);
             RoomManager.updatePlayerScore(playerSession.current.roomId, pair.player2Id, 'Player', pairScoreBonus);
             RoomManager.triggerLeaderboardBroadcast(playerSession.current.roomId, io);
          }

          io.to(pair.player1Id).emit(SOCKET_EVENTS.PAIR_SYNC_RESULT, {
            pairId: pair.id,
            roundId: payload.roundId,
            judgement: syncJudgement,
            differenceMs,
            pairScoreBonus,
            pairCombo: pair.pairCombo,
            feverMeter: pair.feverMeter
          });
          io.to(pair.player2Id).emit(SOCKET_EVENTS.PAIR_SYNC_RESULT, {
            pairId: pair.id,
            roundId: payload.roundId,
            judgement: syncJudgement,
            differenceMs,
            pairScoreBonus,
            pairCombo: pair.pairCombo,
            feverMeter: pair.feverMeter
          });
          
          io.to(pair.player1Id).emit(SOCKET_EVENTS.PAIR_UPDATE, pair);
          io.to(pair.player2Id).emit(SOCKET_EVENTS.PAIR_UPDATE, pair);
        }
        
        // Clean up old rounds after 10 seconds to avoid memory leak
        setTimeout(() => {
           if (pairHitBuffer.has(payload.roundId as string)) pairHitBuffer.delete(payload.roundId as string);
        }, 10000);
      }
    }
  });

  socket.on(SOCKET_EVENTS.PLAYER_BATTLE_HIT, (payload: { judgement: string, combo: number }) => {
    if (!playerSession.current) return;
    const instance = RoomManager.getRoomInstance(playerSession.current.roomId) as any;
    if (!instance || !instance.room || instance.room.battleState !== 'active') return;

    const player = instance.players.get(socket.id);
    if (!player || !player.team) return;

    const scoreMap: Record<string, number> = {
      'perfectmax': 120,
      'perfect': 100,
      'great': 75,
      'good': 50,
      'miss': 0
    };
    const scoreAdd = scoreMap[payload.judgement] || 0;
    
    let comboBonus = 0;
    if (payload.judgement.startsWith('perfect')) {
       if (payload.combo > 0 && payload.combo % 10 === 0) comboBonus = 250;
       else if (payload.combo > 0 && payload.combo % 5 === 0) comboBonus = 100;
    }

    const totalAdd = scoreAdd + comboBonus;
    if (totalAdd > 0) {
      if (!instance.room.battleScores) instance.room.battleScores = { cyan: 0, pink: 0 };
      instance.room.battleScores[player.team] += totalAdd;
      
      // Track hits
      if (!instance.recentHits) instance.recentHits = [];
      instance.recentHits.push({ team: player.team, judgement: payload.judgement, time: Date.now() });
      instance.recentHits = instance.recentHits.filter((h: any) => Date.now() - h.time <= 300);
      
      const teamHits = instance.recentHits.filter((h: any) => h.team === player.team);
      if (teamHits.length >= 3) {
        if (!instance.lastTeamSync) instance.lastTeamSync = {};
        if (Date.now() - (instance.lastTeamSync[player.team] || 0) > 3000) {
          const isMassPerfect = teamHits.every((h: any) => h.judgement.startsWith('perfect'));
          
          io.to(instance.room.id).emit(SOCKET_EVENTS.TEAM_SYNC_EVENT, {
            team: player.team,
            type: isMassPerfect ? 'MASS_PERFECT' : 'TEAM_SYNC',
            count: teamHits.length
          });
          
          instance.lastTeamSync[player.team] = Date.now();
        }
      }

      // Throttled score broadcast
      if (!instance.lastBattleUpdate || Date.now() - instance.lastBattleUpdate > 250) {
        io.to(instance.room.id).emit(SOCKET_EVENTS.BATTLE_UPDATE, {
          scores: instance.room.battleScores
        });
        instance.lastBattleUpdate = Date.now();
      }
    }
  });
}

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useRoomStore } from '../stores/useRoomStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { socketService } from '../services/socket.service';
import { audioService } from '../services/audio.service';
import {
  SOCKET_EVENTS,
  RoomStatePayload,
  Player,
  MusicSyncPayload,
  PlaylistItem
} from '../types';

import { WorldScene } from '../game/world/WorldScene';
import { TopBarHUD } from '../components/hud/TopBarHUD';
import { LeaderboardWidget } from '../components/hud/LeaderboardWidget';
import { ChatBox } from '../components/chat/ChatBox';
import { ActionBar } from '../components/hud/ActionBar';
import { EmoteBar } from '../components/hud/EmoteBar';
import { MobileControls } from '../components/hud/MobileControls';

import { PlaylistModal } from '../components/hud/PlaylistModal';
import { HostControlPanel } from '../components/hud/HostControlPanel';
import { YouTubeRoomPlayer } from '../components/youtube/YouTubeRoomPlayer';
import { SoundUnlockOverlay } from '../components/hud/SoundUnlockOverlay';
import { SongRequestQueue } from '../features/song-requests/components/SongRequestQueue';
import { RoomNotificationCenter } from '../features/notifications/components/RoomNotificationCenter';
import { ProfileModal } from '../components/modals/ProfileModal';
import { CameraSwitcherWidget } from '../components/hud/CameraSwitcherWidget';
import { LightstickWidget } from '../components/hud/LightstickWidget';
import { EnergyMeter } from '../components/hud/EnergyMeter';
import { FanActionBar } from '../components/hud/FanActionBar';
import { RhythmHUD } from '../components/hud/RhythmHUD';
import { MobileBeatButton } from '../components/hud/MobileBeatButton';
import { ResultScreen } from '../components/hud/ResultScreen';
import { DanceModeHUD } from '../components/minigame/DanceModeHUD';
import { PlayerInteractionCard } from '../components/hud/PlayerInteractionCard';
import { PairInviteManager } from '../components/hud/PairInviteManager';
import { SocialPanel } from '../components/hud/SocialPanel';
import { BeatVisualizerDebug } from '../components/hud/BeatVisualizerDebug';
import { RhythmEngine } from '../game/RhythmEngine';
import { useSocialStore } from '../stores/useSocialStore';
import { Users } from 'lucide-react';
import { useShowTimeline } from '../hooks/useShowTimeline';
import { DebugPanel } from '../components/hud/DebugPanel';
import { ConcertLoadingScreen } from '../components/stage/ConcertLoadingScreen';

export const GamePage: React.FC = () => {
  useShowTimeline();
  const { setPageStep } = useGameStore();
  const {
    currentRoom,
    currentTrack,
    musicState,
    role,
    hostToken,
    setRoomState,
    addPlayer,
    removePlayer,
    updatePlayer,
    updatePlayerLightstick,
    setMusicSync,
    updateLeaderboard,
    setSongRequests,
    updateSongRequest,
    updatePlayerEmote,
    players
  } = useRoomStore();
  const { setMyPlayerId, myPlayerId } = usePlayerStore();
  const localPlayer = myPlayerId ? players[myPlayerId] : undefined;

  const [activeEmote, setActiveEmote] = useState<string | undefined>(undefined);
  const [showMinigame, setShowMinigame] = useState(false);
  const [isBeatDropEffect, setIsBeatDropEffect] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isSceneReady, setIsSceneReady] = useState(false);

  // Host & Playlist Modal State
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isHostControlsOpen, setIsHostControlsOpen] = useState(false);
  const [isSongRequestQueueOpen, setIsSongRequestQueueOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (currentRoom) {
      socketService.getSocket().emit(SOCKET_EVENTS.SONG_REQUEST_LIST, { roomId: currentRoom.id });
    }
  }, [currentRoom?.id]);

  useEffect(() => {
    const socket = socketService.getSocket();

    const handleRoomState = (payload: RoomStatePayload) => {
      setRoomState(payload);
      if (payload.myPlayerId) {
        setMyPlayerId(payload.myPlayerId);
      }
      setIsReconnecting(false);
      audioService.syncMusic(payload.currentTrack, payload.musicState);
    };

    const handlePlayerJoin = (player: Player) => {
      addPlayer(player);
    };

    const handleConnect = () => {
      // If we have a currentRoom, we are reconnecting
      if (useRoomStore.getState().currentRoom) {
        const room = useRoomStore.getState().currentRoom;
        const player = useRoomStore.getState().players[usePlayerStore.getState().myPlayerId || ''];
        if (room) {
          socket.emit(SOCKET_EVENTS.ROOM_JOIN, {
            roomId: room.id,
            nickname: player?.nickname || usePlayerStore.getState().nickname,
            avatarType: player?.avatarType || 'Boy',
            avatarConfig: player?.avatarConfig,
            password: '', 
            hostToken: useRoomStore.getState().hostToken
          });
        }
      }
    };

    const handleDisconnect = () => {
      setIsReconnecting(true);
    };

    const handlePlayerLeave = (payload: { id: string }) => {
      removePlayer(payload.id);
    };

    const handlePlayerMove = (payload: { id: string; position: { x: number; z: number }; rotation: number; animation?: any; seq?: number }) => {
      const current = useRoomStore.getState().players[payload.id];
      if (current && payload.seq && current.seq && payload.seq < current.seq) {
        return; // Drop out-of-order packet
      }
      updatePlayer(payload.id, {
        position: { x: payload.position.x, y: 0, z: payload.position.z },
        rotation: payload.rotation,
        animation: payload.animation,
        seq: payload.seq
      });
    };

    const handlePlayerAnimation = (payload: { id: string; animation: any }) => {
      updatePlayer(payload.id, { animation: payload.animation });
    };

    const handlePlayerEmote = (payload: { id: string; emote: string; startedAt?: number }) => {
      updatePlayerEmote(payload.id, payload.emote, payload.startedAt);
    };

    const handleLightstickUpdate = (payload: {
      id: string;
      equippedLightstick: boolean;
      lightstickColor: string;
    }) => {
      updatePlayerLightstick(
        payload.id,
        payload.equippedLightstick,
        payload.lightstickColor
      );
    };

    const handleAvatarUpdate = (payload: { id: string; avatarConfig: any }) => {
      updatePlayer(payload.id, { avatarConfig: payload.avatarConfig });
    };

    const handleMusicSync = (payload: MusicSyncPayload) => {
      setMusicSync(payload.musicState, payload.currentTime);
      audioService.syncMusic(useRoomStore.getState().currentTrack, payload.musicState);
    };

    const handleLeaderboard = (leaderboard: any) => {
      updateLeaderboard(leaderboard);
    };

    const handlePlaylistUpdated = (playlist: PlaylistItem[]) => {
      useRoomStore.getState().setPlaylist(playlist);
    };

    const handleMusicState = (newMusicState: any) => {
      setMusicSync(newMusicState);
    };

    const handlePlayerKicked = (payload: { reason?: string }) => {
      alert(`You were removed from the room: ${payload?.reason || 'Kicked by Host'}`);
      socketService.emit(SOCKET_EVENTS.ROOM_LEAVE);
      audioService.stop();
      setPageStep('lobby');
    };

    const handleRoomEnded = () => {
      alert('The Concert Room has been ended by the host.');
      socketService.emit(SOCKET_EVENTS.ROOM_LEAVE);
      audioService.stop();
      setPageStep('lobby');
    };

    const handleSongRequestList = (payload: { requests: any[] }) => {
      setSongRequests(payload.requests);
    };

    const handleSongRequestUpdated = (payload: { request: any }) => {
      updateSongRequest(payload.request);
    };

    const handleRoleUpdated = (payload: { playerId: string; role: any }) => {
      updatePlayer(payload.playerId, { role: payload.role });
      if (payload.playerId === usePlayerStore.getState().myPlayerId) {
        useRoomStore.setState({ role: payload.role });
      }
    };

    const handleStageCue = (cue: any) => {
      useRoomStore.getState().setActiveStageCue(cue);
    };

    const handleEnergy = (payload: { energy: number }) => {
      useRoomStore.getState().setEnergy(payload.energy);
    };

    const handleFriendStatus = (payload: { friends: any[] }) => {
      useSocialStore.getState().setOnlineFriends(payload.friends);
    };

    const handlePartyUpdate = (payload: { party: any }) => {
      useSocialStore.getState().setCurrentParty(payload.party);
    };

    const handleSyncDance = (payload: { moveId: string; startsAt: number }) => {
      const { moveId, startsAt } = payload;
      const delay = Math.max(0, startsAt - Date.now());
      setTimeout(() => {
        // Trigger a fake DOM event so PlayerController can pick it up
        window.dispatchEvent(new CustomEvent('trigger-animation', { detail: moveId }));
        
        // Update all remote players manually
        useRoomStore.setState((state) => {
          const newPlayers = { ...state.players };
          for (const key in newPlayers) {
            newPlayers[key] = { ...newPlayers[key], animation: moveId as any };
          }
          return { players: newPlayers };
        });
      }, delay);
    };

    const handlePairUpdate = (pair: any) => {
      if (pair) {
        usePlayerStore.getState().setPairInfo(pair.id, pair);
      } else {
        usePlayerStore.getState().setPairInfo(undefined, null);
      }
    };

    socket.on(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
    socket.on(SOCKET_EVENTS.PLAYER_JOIN, handlePlayerJoin);
    socket.on(SOCKET_EVENTS.PLAYER_LEFT, handlePlayerLeave);
    socket.on(SOCKET_EVENTS.PLAYER_MOVE, handlePlayerMove);
    socket.on(SOCKET_EVENTS.PLAYER_ANIMATION, handlePlayerAnimation);
    socket.on(SOCKET_EVENTS.PLAYER_EMOTE, handlePlayerEmote);
    socket.on(SOCKET_EVENTS.PLAYER_LIGHTSTICK_UPDATE, handleLightstickUpdate);
    socket.on(SOCKET_EVENTS.MUSIC_SYNC, handleMusicSync);
    socket.on(SOCKET_EVENTS.ROOM_LEADERBOARD, handleLeaderboard);
    socket.on(SOCKET_EVENTS.PLAYLIST_UPDATED, handlePlaylistUpdated);
    socket.on(SOCKET_EVENTS.MUSIC_STATE, handleMusicState);
    socket.on(SOCKET_EVENTS.PLAYER_KICKED, handlePlayerKicked);
    socket.on(SOCKET_EVENTS.ROOM_ENDED, handleRoomEnded);
    socket.on(SOCKET_EVENTS.SONG_REQUEST_LIST, handleSongRequestList);
    socket.on(SOCKET_EVENTS.SONG_REQUEST_UPDATED, handleSongRequestUpdated);
    socket.on(SOCKET_EVENTS.ROOM_ROLES_UPDATED, handleRoleUpdated);
    socket.on(SOCKET_EVENTS.SERVER_STAGE_CUE, handleStageCue);
    socket.on('CONCERT_ENERGY', handleEnergy);
    socket.on(SOCKET_EVENTS.FRIEND_STATUS, handleFriendStatus);
    socket.on(SOCKET_EVENTS.PARTY_UPDATE, handlePartyUpdate);
    socket.on(SOCKET_EVENTS.PLAYER_AVATAR_UPDATE, handleAvatarUpdate);
    socket.on('room:sync-dance', handleSyncDance);
    socket.on(SOCKET_EVENTS.PAIR_UPDATE, handlePairUpdate);
    
    // Battle Events
    socket.on(SOCKET_EVENTS.BATTLE_UPDATE, (payload: { scores: { cyan: number, pink: number } }) => {
      useRoomStore.setState((state) => ({
        currentRoom: { ...state.currentRoom, battleScores: payload.scores } as any
      }));
    });
    
    socket.on(SOCKET_EVENTS.TEAM_SYNC_EVENT, (payload: { team: string, type: string, count: number }) => {
      // Dispatch a custom event to show in HUD
      window.dispatchEvent(new CustomEvent('team-sync-event', { detail: payload }));
    });
    
    socket.on(SOCKET_EVENTS.BATTLE_RESULT, (payload: { scores: any }) => {
      window.dispatchEvent(new CustomEvent('battle-result', { detail: payload }));
    });

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
      socket.off(SOCKET_EVENTS.PLAYER_JOIN, handlePlayerJoin);
      socket.off(SOCKET_EVENTS.PLAYER_LEFT, handlePlayerLeave);
      socket.off(SOCKET_EVENTS.PLAYER_MOVE, handlePlayerMove);
      socket.off(SOCKET_EVENTS.PLAYER_ANIMATION, handlePlayerAnimation);
      socket.off(SOCKET_EVENTS.PLAYER_EMOTE, handlePlayerEmote);
      socket.off(SOCKET_EVENTS.PLAYER_LIGHTSTICK_UPDATE, handleLightstickUpdate);
      socket.off(SOCKET_EVENTS.MUSIC_SYNC, handleMusicSync);
      socket.off(SOCKET_EVENTS.ROOM_LEADERBOARD, handleLeaderboard);
      socket.off(SOCKET_EVENTS.PLAYLIST_UPDATED, handlePlaylistUpdated);
      socket.off(SOCKET_EVENTS.MUSIC_STATE, handleMusicState);
      socket.off(SOCKET_EVENTS.PLAYER_KICKED, handlePlayerKicked);
      socket.off(SOCKET_EVENTS.ROOM_ENDED, handleRoomEnded);
      socket.off(SOCKET_EVENTS.SONG_REQUEST_LIST, handleSongRequestList);
      socket.off(SOCKET_EVENTS.SONG_REQUEST_UPDATED, handleSongRequestUpdated);
      socket.off(SOCKET_EVENTS.ROOM_ROLES_UPDATED, handleRoleUpdated);
      socket.off(SOCKET_EVENTS.SERVER_STAGE_CUE, handleStageCue);
      socket.off('CONCERT_ENERGY', handleEnergy);
      socket.off(SOCKET_EVENTS.FRIEND_STATUS, handleFriendStatus);
      socket.off(SOCKET_EVENTS.PARTY_UPDATE, handlePartyUpdate);
      socket.off(SOCKET_EVENTS.PLAYER_AVATAR_UPDATE, handleAvatarUpdate);
      socket.off('room:sync-dance', handleSyncDance);
      socket.off(SOCKET_EVENTS.BATTLE_UPDATE);
      socket.off(SOCKET_EVENTS.TEAM_SYNC_EVENT);
      socket.off(SOCKET_EVENTS.BATTLE_RESULT);
      socket.off(SOCKET_EVENTS.PAIR_UPDATE, handlePairUpdate);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [
    setRoomState,
    setMyPlayerId,
    addPlayer,
    removePlayer,
    updatePlayer,
    updatePlayerLightstick,
    setMusicSync,
    updateLeaderboard,
    setPageStep,
    setSongRequests,
    updateSongRequest
  ]);

  const [showResultScreen, setShowResultScreen] = useState(false);
  const previousTrackRef = useRef<string | null>(null);

  useEffect(() => {
    // Keep music synced when track changes
    audioService.syncMusic(currentTrack, musicState);

    // End of Song Detection
    const { score } = usePlayerStore.getState();
    const isTrackFinished = musicState?.status === 'idle';
    const isNewTrack = currentTrack?.id && previousTrackRef.current && currentTrack.id !== previousTrackRef.current;
    
    if (score > 0 && (isTrackFinished || isNewTrack)) {
      setShowResultScreen(true);
    }
    
    if (currentTrack?.id) {
      previousTrackRef.current = currentTrack.id;
    }
  }, [currentTrack, musicState]);

  const handleLeaveRoom = useCallback(() => {
    socketService.emit(SOCKET_EVENTS.ROOM_LEAVE);
    audioService.stop();
    setPageStep('lobby');
  }, [setPageStep]);

  const handleCameraReset = () => {
    window.dispatchEvent(new Event('reset-camera'));
  };

  const handleJump = () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space' }));
  };

  const handleBeatHit = useCallback(() => {
    if (!currentRoom?.rhythmMode) return;

    const currentAudioTime = audioService.getCurrentTime();
    const result = RhythmEngine.evaluateHit(currentAudioTime * 1000); // ms

    if (result.rating !== 'miss') {
      const { combo, score, setCombo, setScore, setRhythmFeedback, incrementStat } = usePlayerStore.getState();
      const newCombo = combo + 1;
      const multiplier = RhythmEngine.calculateMultiplier(newCombo);
      const scoreAdd = result.scoreAdd * multiplier;

      setCombo(newCombo);
      setScore(score + scoreAdd);
      setRhythmFeedback(result.rating);
      incrementStat(result.rating);

      socketService.emit('player:rhythm-hit', {
        rating: result.rating,
        scoreAdd: scoreAdd,
        energyAdd: result.energyAdd,
        combo: newCombo
      });

      // Emote visually on combo milestones
      if (newCombo === 25 || newCombo === 50 || newCombo === 100) {
         socketService.emit(SOCKET_EVENTS.PLAYER_EMOTE, { emote: 'wave-lightstick' });
      }
    } else {
      usePlayerStore.getState().setCombo(0);
      usePlayerStore.getState().setRhythmFeedback('miss');
      usePlayerStore.getState().incrementStat('miss');
      socketService.emit('player:rhythm-hit', {
        rating: 'miss',
        scoreAdd: 0,
        energyAdd: 0,
        combo: 0
      });
    }
  }, [currentRoom?.rhythmMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat && document.activeElement?.tagName !== 'INPUT') {
        if (currentRoom?.rhythmMode) {
          e.preventDefault();
          handleBeatHit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleBeatHit, currentRoom?.rhythmMode]);

  if (!currentRoom) return null;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans touch-none select-none">
      {/* Dynamic Cyberpunk Concert Loading & Pre-warming Screen */}
      <ConcertLoadingScreen
        roomName={currentRoom?.name || 'Grand Concert Arena'}
        currentTrackTitle={currentTrack?.title}
        currentTrackArtist={currentTrack?.artist}
        isSceneReady={isSceneReady}
      />

      <RoomNotificationCenter />
      {/* Sound Unlock Overlay (dismisses on any user interaction) */}
      <SoundUnlockOverlay
        onUnlock={() => audioService.unlockAudio()}
        roomName={currentRoom?.name || 'Concert Room'}
      />

      {/* Main 3D WebGL Canvas Area */}
      {/* World 3D Scene */}
      <WorldScene 
        activeEmote={activeEmote} 
        activeEmoteStartedAt={localPlayer?.emoteStartedAt} 
        isBeatDrop={isBeatDropEffect} 
        onSceneReady={() => setIsSceneReady(true)}
      />

      {/* UI Overlays */}
      {isReconnecting && (
        <div className="absolute inset-0 z-[1000] bg-black/80 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="w-16 h-16 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(0,240,255,0.5)]"></div>
          <h2 className="text-2xl font-bold text-white mb-2 tracking-wider">RECONNECTING...</h2>
          <p className="text-gray-400">Please wait while we restore your connection to the concert.</p>
        </div>
      )}
      
      <DebugPanel />
      <BeatVisualizerDebug />

      {/* Main HUD overlay */}
      <TopBarHUD
        onLeaveRoom={handleLeaveRoom}
        onOpenPlaylist={() => setIsPlaylistOpen(true)}
        onOpenHostControls={() => setIsHostControlsOpen(true)}
        onOpenSongRequests={() => setIsSongRequestQueueOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Camera Mode Switcher */}
      <CameraSwitcherWidget />

      {/* Lightstick Equipper Widget */}
      <LightstickWidget />

      {/* Leaderboard Scoreboard Widget */}
      <LeaderboardWidget />

      {/* Chat Box (Collapsible, bottom-left) */}
      <ChatBox />

      {/* Fan Concert Interactions */}
      <EnergyMeter />
      
      {/* Dance Action Bar (Shortcuts 1-0, bottom-center) */}
      <div className="hidden md:block">
        <ActionBar />
      </div>
      
      {/* Concert Fan Actions */}
      <FanActionBar />
      <RhythmHUD />
      <MobileBeatButton onHit={handleBeatHit} />

      {/* Emote Quick Bar (Bottom-right) */}
      <EmoteBar
        onEmoteTrigger={(em) => setActiveEmote(em)}
        onCameraReset={handleCameraReset}
        onOpenMinigame={() => setShowMinigame(true)}
      />

      {/* Stage TV Screen has been moved to ConcertArena 3D main screen */}

      {/* Responsive Touch Controls for Mobile */}
      <MobileControls
        onJump={handleJump}
        onOpenMinigame={() => setShowMinigame(true)}
      />

      {/* Rhythm Mini-Game Modal */}
      {showMinigame && (
        <DanceModeHUD
          onClose={() => setShowMinigame(false)}
          onDanceModeEffect={(active) => setIsBeatDropEffect(active)}
        />
      )}

      {/* Concert Playlist Modal */}
      <PlaylistModal
        isOpen={isPlaylistOpen}
        onClose={() => setIsPlaylistOpen(false)}
        roomId={currentRoom?.id || ''}
        hostToken={hostToken}
        isHost={role === 'host'}
      />

      {/* Host Control Panel Drawer */}
      {isHostControlsOpen && (
        <HostControlPanel onClose={() => setIsHostControlsOpen(false)} />
      )}
      
      {/* Song Request Queue Modal */}
      {isSongRequestQueueOpen && (
        <SongRequestQueue onClose={() => setIsSongRequestQueueOpen(false)} />
      )}
      
      {/* User Profile Modal */}
      {isProfileOpen && (
        <ProfileModal onClose={() => setIsProfileOpen(false)} />
      )}

      {/* Result Screen for Rhythm Mode */}
      {showResultScreen && (
        <ResultScreen onClose={() => setShowResultScreen(false)} />
      )}

      {/* Social Features */}
      <PlayerInteractionCard />
      <PairInviteManager />
      <SocialPanel />

      {/* Render Leaderboard and other overlays */}
      
      {/* Social Open Button */}
      <button 
        onClick={() => useSocialStore.getState().setShowSocialPanel(true)}
        className="fixed top-24 right-4 z-30 p-3 bg-slate-900/80 hover:bg-slate-800/80 border border-white/10 rounded-xl shadow-lg transition-all"
      >
        <Users className="w-5 h-5 text-neon-cyan" />
      </button>
    </div>
  );
};

export default GamePage;

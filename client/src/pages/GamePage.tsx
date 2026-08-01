import React, { useEffect, useState, useCallback } from 'react';
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
import { BeatDropModal } from '../components/minigame/BeatDropModal';
import { PlaylistModal } from '../components/hud/PlaylistModal';
import { HostControlPanel } from '../components/hud/HostControlPanel';
import { YouTubeRoomPlayer } from '../components/youtube/YouTubeRoomPlayer';
import { SoundUnlockOverlay } from '../components/hud/SoundUnlockOverlay';
import { SongRequestQueue } from '../features/song-requests/components/SongRequestQueue';
import { RoomNotificationCenter } from '../features/notifications/components/RoomNotificationCenter';
import { ProfileModal } from '../components/modals/ProfileModal';
import { CameraSwitcherWidget } from '../components/hud/CameraSwitcherWidget';

import { useShowTimeline } from '../hooks/useShowTimeline';

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
    setMusicSync,
    updateLeaderboard,
    setSongRequests,
    updateSongRequest
  } = useRoomStore();
  const { setMyPlayerId } = usePlayerStore();

  const [activeEmote, setActiveEmote] = useState<string | undefined>(undefined);
  const [showMinigame, setShowMinigame] = useState(false);
  const [isBeatDropEffect, setIsBeatDropEffect] = useState(false);

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
      audioService.syncMusic(payload.currentTrack, payload.musicState);
    };

    const handlePlayerJoin = (player: Player) => {
      addPlayer(player);
    };

    const handlePlayerLeave = (payload: { id: string }) => {
      removePlayer(payload.id);
    };

    const handlePlayerMove = (payload: { id: string; position: { x: number; y: number; z: number }; rotation: number; animation?: any }) => {
      updatePlayer(payload.id, {
        position: payload.position,
        rotation: payload.rotation,
        animation: payload.animation
      });
    };

    const handlePlayerAnimation = (payload: { id: string; animation: any }) => {
      updatePlayer(payload.id, { animation: payload.animation });
    };

    const handlePlayerEmote = (payload: { id: string; emote: string }) => {
      updatePlayer(payload.id, { emote: payload.emote });
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

    socket.on(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
    socket.on(SOCKET_EVENTS.PLAYER_JOIN, handlePlayerJoin);
    socket.on(SOCKET_EVENTS.PLAYER_LEFT, handlePlayerLeave);
    socket.on(SOCKET_EVENTS.PLAYER_MOVE, handlePlayerMove);
    socket.on(SOCKET_EVENTS.PLAYER_ANIMATION, handlePlayerAnimation);
    socket.on(SOCKET_EVENTS.PLAYER_EMOTE, handlePlayerEmote);
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

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
      socket.off(SOCKET_EVENTS.PLAYER_JOIN, handlePlayerJoin);
      socket.off(SOCKET_EVENTS.PLAYER_LEFT, handlePlayerLeave);
      socket.off(SOCKET_EVENTS.PLAYER_MOVE, handlePlayerMove);
      socket.off(SOCKET_EVENTS.PLAYER_ANIMATION, handlePlayerAnimation);
      socket.off(SOCKET_EVENTS.PLAYER_EMOTE, handlePlayerEmote);
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
    };
  }, [
    setRoomState,
    setMyPlayerId,
    addPlayer,
    removePlayer,
    updatePlayer,
    setMusicSync,
    updateLeaderboard,
    setPageStep,
    setSongRequests,
    updateSongRequest
  ]);

  useEffect(() => {
    // Keep music synced when track changes
    audioService.syncMusic(currentTrack, musicState);
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

  if (!currentRoom) return null;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-slate-950 font-sans touch-none select-none">
      <RoomNotificationCenter />
      {/* Sound Unlock Overlay (dismisses on any user interaction) */}
      <SoundUnlockOverlay
        onUnlock={() => audioService.unlockAudio()}
        roomName={currentRoom?.name || 'Concert Room'}
      />

      {/* Main 3D WebGL Canvas Area */}
      <WorldScene
        activeEmote={activeEmote}
        isBeatDrop={isBeatDropEffect}
      />

      {/* Top Bar HUD (Profile, Level, Coins, Music info, Settings, Leave) */}
      <TopBarHUD
        onLeaveRoom={handleLeaveRoom}
        onOpenPlaylist={() => setIsPlaylistOpen(true)}
        onOpenHostControls={() => setIsHostControlsOpen(true)}
        onOpenSongRequests={() => setIsSongRequestQueueOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Camera Mode Switcher */}
      <CameraSwitcherWidget />

      {/* Leaderboard Scoreboard Widget */}
      <LeaderboardWidget />

      {/* Chat Box (Collapsible, bottom-left) */}
      <ChatBox />

      {/* Dance Action Bar (Shortcuts 1-0, bottom-center) */}
      <ActionBar />

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
        <BeatDropModal
          onClose={() => setShowMinigame(false)}
          onBeatDropEffect={(active) => setIsBeatDropEffect(active)}
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
    </div>
  );
};

export default GamePage;

import React, { useState } from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { useGameStore } from '../../stores/useGameStore';
import { audioService } from '../../services/audio.service';
import { PerformanceMode } from '../../types';
import {
  Volume2,
  VolumeX,
  Settings,
  LogOut,
  Sparkles,
  Wifi,
  Sliders,
  Check,
  Award,
  Coins,
  Music2,
  Link as LinkIcon,
  User
} from 'lucide-react';

interface TopBarHUDProps {
  onLeaveRoom: () => void;
  onOpenPlaylist?: () => void;
  onOpenHostControls?: () => void;
  onOpenSongRequests?: () => void;
  onOpenProfile?: () => void;
}

export const TopBarHUD: React.FC<TopBarHUDProps> = ({
  onLeaveRoom,
  onOpenPlaylist,
  onOpenHostControls,
  onOpenSongRequests,
  onOpenProfile
}) => {
  const { nickname, avatarType } = usePlayerStore();
  const { currentRoom, currentTrack, role } = useRoomStore();
  const {
    showEffects,
    showMusic,
    showChat,
    showNames,
    performanceMode,
    connectionStatus,
    toggleEffects,
    toggleMusic,
    toggleChat,
    toggleNames,
    setPerformanceMode
  } = useGameStore();

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioService.setMute(newMuted);
  };

  const handleCopyInviteLink = () => {
    if (!currentRoom) return;
    const inviteUrl = `${window.location.origin}/?room=${currentRoom.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const perfModes: PerformanceMode[] = ['Low', 'Medium', 'High', 'Auto'];

  return (
    <>
      {/* Top Left Header Bar */}
      <div className="fixed top-4 left-4 z-40 flex items-center gap-2 sm:gap-3">
        {/* Profile Card */}
        <div className="flex items-center gap-2.5 px-3 sm:px-4 py-2 glass-panel rounded-2xl border border-white/10 shadow-xl">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-neon-pink to-purple-600 flex items-center justify-center text-xs font-black text-white shadow-inner">
            {avatarType.slice(0, 2)}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-black text-white leading-tight">{nickname}</span>
            <span className="text-[10px] font-semibold text-slate-400 truncate max-w-[120px]">
              {currentRoom?.name || 'Concert Arena'}
            </span>
          </div>

          <div className="h-6 w-px bg-white/10 mx-1" />

          {/* Host Badge */}
          {role === 'host' && (
            <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] font-black text-slate-950 shadow-md flex items-center gap-1">
              <span>HOST 👑</span>
            </div>
          )}

          {/* Copy Invite Link */}
          <button
            onClick={handleCopyInviteLink}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-neon-blue/20 hover:bg-neon-blue/30 border border-neon-blue/40 text-[11px] font-bold text-neon-blue transition-all"
            title="Copy Invite Link"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>{copiedLink ? 'Copied! ✓' : 'Invite'}</span>
          </button>

          {/* Level Badge */}
          <div className="hidden md:flex items-center gap-1 text-xs font-bold text-yellow-400" title="Dancer Level">
            <Award className="w-3.5 h-3.5" />
            <span>Lv. 12</span>
          </div>

          {/* Coins Badge */}
          <div className="hidden lg:flex items-center gap-1 text-xs font-bold text-neon-green" title="Concert Coins">
            <Coins className="w-3.5 h-3.5" />
            <span>2,450</span>
          </div>

          {/* Connection Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 ml-1 px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-white/10 text-[10px] font-bold">
            <Wifi
              className={`w-3 h-3 ${
                connectionStatus === 'Connected'
                  ? 'text-neon-green animate-pulse'
                  : 'text-amber-400'
              }`}
            />
            <span className="text-slate-300">{connectionStatus}</span>
          </div>
        </div>
      </div>

      {/* Top Right Header Bar */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        {/* Playlist Modal Button */}
        <button
          onClick={onOpenPlaylist}
          className="flex items-center gap-1.5 px-3 py-2 glass-panel rounded-2xl border border-white/10 text-xs font-bold text-slate-200 hover:text-white hover:border-neon-blue transition-all shadow-xl"
          title="View Concert Playlist"
        >
          <Music2 className="w-4 h-4 text-neon-blue" />
          <span className="hidden md:inline">Playlist</span>
        </button>

        {/* Host Controls Trigger (only visible to Host) */}
        {role === 'host' && (
          <button
            onClick={onOpenHostControls}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-neon-pink to-neon-purple text-white rounded-2xl border border-neon-pink/50 text-xs font-extrabold hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-neon-pink/20"
            title="Open Host DJ & Room Controls"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Host Controls</span>
          </button>
        )}

        {/* Music Player Info */}
        <div className="hidden lg:flex items-center gap-3 px-4 py-2 glass-panel rounded-2xl border border-white/10 shadow-xl">
          <Sparkles className="w-4 h-4 text-neon-blue animate-spin" style={{ animationDuration: '6s' }} />
          <div className="flex flex-col max-w-[140px]">
            <span className="text-xs font-bold text-white truncate">
              {currentTrack?.title || 'Cyberpunk Odyssey'}
            </span>
            <span className="text-[10px] text-slate-400 truncate">
              {currentTrack?.artist || 'DJ NeonX'}
            </span>
          </div>
        </div>

        {/* Song Requests Button */}
        {onOpenSongRequests && (
          <button
            onClick={onOpenSongRequests}
            className="px-3 py-2 bg-neon-pink/20 hover:bg-neon-pink/40 border border-neon-pink/30 text-neon-pink hover:text-white text-xs font-bold rounded-2xl transition-colors flex items-center gap-1.5"
            title="Song Requests"
          >
            <Music2 className="w-4 h-4" />
            <span className="hidden sm:inline">Requests</span>
          </button>
        )}

        {/* Mute Toggle */}
        <button
          onClick={handleToggleMute}
          className={`p-2.5 rounded-2xl border glass-panel transition-all ${
            isMuted
              ? 'border-rose-500/50 text-rose-400 bg-rose-950/40'
              : 'border-white/10 text-white hover:border-white/30'
          }`}
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Profile Button */}
        {onOpenProfile && (
          <button
            onClick={onOpenProfile}
            className="p-2.5 rounded-2xl border border-white/10 text-white hover:border-white/30 glass-panel transition-all"
            title="User Profile"
          >
            <User className="w-4 h-4" />
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className={`p-2.5 rounded-2xl border glass-panel transition-all ${
            settingsOpen
              ? 'border-neon-pink text-neon-pink bg-purple-950/60'
              : 'border-white/10 text-white hover:border-white/30'
          }`}
          title="Concert Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Leave Room Button */}
        <button
          onClick={onLeaveRoom}
          className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-2xl bg-rose-600/90 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

      {/* Settings Panel Dropdown */}
      {settingsOpen && (
        <div className="fixed top-20 right-4 z-50 w-72 p-5 glass-panel rounded-3xl border border-white/15 shadow-2xl flex flex-col gap-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-sm font-extrabold text-white">Concert Settings</span>
            <span className="text-[10px] text-neon-blue font-semibold uppercase tracking-wider">HUD Controls</span>
          </div>

          {/* Toggle Switches */}
          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-slate-300 font-medium">Stage Lighting & Effects</span>
              <input
                type="checkbox"
                checked={showEffects}
                onChange={toggleEffects}
                className="w-4 h-4 accent-neon-pink rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-slate-300 font-medium">Background Concert Audio</span>
              <input
                type="checkbox"
                checked={showMusic}
                onChange={toggleMusic}
                className="w-4 h-4 accent-neon-pink rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-slate-300 font-medium">Live Chat Stream</span>
              <input
                type="checkbox"
                checked={showChat}
                onChange={toggleChat}
                className="w-4 h-4 accent-neon-pink rounded"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-slate-300 font-medium">Player Names & Levels</span>
              <input
                type="checkbox"
                checked={showNames}
                onChange={toggleNames}
                className="w-4 h-4 accent-neon-pink rounded"
              />
            </label>
          </div>

          {/* Performance Mode Selector */}
          <div className="flex flex-col gap-2 pt-2 border-t border-white/10">
            <span className="text-xs text-slate-400 font-bold">Graphics Quality</span>
            <div className="grid grid-cols-2 gap-2">
              {perfModes.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPerformanceMode(mode)}
                  className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                    performanceMode === mode
                      ? 'bg-neon-pink/20 border-neon-pink text-white shadow-md'
                      : 'bg-slate-900/60 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {performanceMode === mode && <Check className="w-3 h-3 text-neon-pink" />}
                  <span>{mode}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

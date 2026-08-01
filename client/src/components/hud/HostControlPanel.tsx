import React, { useState } from 'react';
import { useRoomStore } from '../../stores/useRoomStore';
import { socketService } from '../../services/socket.service';
import { SOCKET_EVENTS, RoomVisibility } from '../../types';
import { RoleManagementPanel } from '../../features/room-roles/components/RoleManagementPanel';
import {
  Settings,
  Music,
  Users,
  X,
  Plus,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Globe,
  Lock,
  Key,
  ShieldAlert,
  MessageSquare,
  Smile,
  AlertTriangle,
  UserX,
  Camera,
  Sparkles,
  Zap
} from 'lucide-react';

interface HostControlPanelProps {
  onClose: () => void;
}

export const HostControlPanel: React.FC<HostControlPanelProps> = ({
  onClose
}) => {
  const { currentRoom, players, playlist, musicState, hostToken } = useRoomStore();
  const roomId = currentRoom?.id || '';

  const [activeTab, setActiveTab] = useState<'room' | 'music' | 'players' | 'roles' | 'show'>('room');

  // Room update form
  const [roomName, setRoomName] = useState(currentRoom?.name || '');
  const [visibility, setVisibility] = useState<RoomVisibility>(currentRoom?.visibility || 'public');
  const [password, setPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(currentRoom?.maxPlayers || 30);
  const [allowChat, setAllowChat] = useState(currentRoom?.allowChat !== false);
  const [allowGuestEmotes, setAllowGuestEmotes] = useState(currentRoom?.allowGuestEmotes !== false);

  // YouTube add form
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Volume
  const [volume, setVolume] = useState(musicState?.volume || 80);

  if (!currentRoom) return null;

  const handleUpdateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostToken) return;
    const socket = socketService.getSocket();
    socket.emit(SOCKET_EVENTS.HOST_ROOM_UPDATE, {
      roomId,
      hostToken,
      name: roomName.trim() || undefined,
      visibility,
      password: password.trim() || undefined,
      maxPlayers,
      allowChat,
      allowGuestEmotes
    });
  };

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostToken || !youtubeUrl.trim()) return;
    setErrorMsg(null);
    const socket = socketService.getSocket();
    socket.emit(SOCKET_EVENTS.HOST_PLAYLIST_ADD, {
      roomId,
      hostToken,
      url: youtubeUrl.trim(),
      title: videoTitle.trim() || undefined
    });
    setYoutubeUrl('');
    setVideoTitle('');
  };

  const handlePlayPause = () => {
    if (!hostToken) return;
    const socket = socketService.getSocket();
    const isPlaying = musicState?.isPlaying || musicState?.status === 'playing';
    if (isPlaying) {
      socket.emit(SOCKET_EVENTS.HOST_MUSIC_PAUSE, { roomId, hostToken });
    } else {
      socket.emit(SOCKET_EVENTS.HOST_MUSIC_RESUME, { roomId, hostToken });
    }
  };

  const handleNextTrack = () => {
    if (!hostToken) return;
    const socket = socketService.getSocket();
    socket.emit(SOCKET_EVENTS.HOST_MUSIC_NEXT, { roomId, hostToken });
  };

  const handlePrevTrack = () => {
    if (!hostToken) return;
    const socket = socketService.getSocket();
    socket.emit(SOCKET_EVENTS.HOST_MUSIC_PREVIOUS, { roomId, hostToken });
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    if (!hostToken) return;
    const socket = socketService.getSocket();
    socket.emit(SOCKET_EVENTS.HOST_MUSIC_VOLUME, { roomId, hostToken, volume: newVol });
  };

  const handleTriggerCue = (cueType: string, payload: any = {}) => {
    if (!hostToken) return;
    const socket = socketService.getSocket();
    socket.emit(SOCKET_EVENTS.HOST_TRIGGER_CUE, {
      roomId,
      hostToken,
      cue: {
        id: `manual-${Date.now()}`,
        timeSeconds: 0,
        type: cueType,
        payload
      }
    });
  };

  const handleKickPlayer = (targetId: string, name: string) => {
    if (!hostToken || !window.confirm(`Are you sure you want to kick "${name}" from the concert?`)) return;
    const socket = socketService.getSocket();
    socket.emit(SOCKET_EVENTS.HOST_PLAYER_KICK, {
      roomId,
      hostToken,
      targetPlayerId: targetId,
      reason: 'Kicked by Host'
    });
  };

  const handleEndRoom = () => {
    if (!hostToken || !window.confirm('WARNING: End this concert room for all players?')) return;
    const socket = socketService.getSocket();
    socket.emit(SOCKET_EVENTS.HOST_ROOM_END, { roomId, hostToken });
    onClose();
  };

  const playersList = Object.values(players);
  const isPlaying = musicState?.isPlaying || musicState?.status === 'playing';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-neon-pink" />
            <h2 className="text-lg font-black text-white">Host Control Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-slate-950/40">
          <button
            onClick={() => setActiveTab('room')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'room'
                ? 'border-neon-pink text-white bg-neon-pink/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Room</span>
          </button>
          <button
            onClick={() => setActiveTab('music')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'music'
                ? 'border-neon-blue text-white bg-neon-blue/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>Music & YT</span>
          </button>
          <button
            onClick={() => setActiveTab('players')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'players'
                ? 'border-neon-purple text-white bg-neon-purple/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Players ({playersList.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('show')}
            className={`flex-1 py-3 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'show'
                ? 'border-neon-cyan text-white bg-neon-cyan/10'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Show</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          {/* TAB 1: ROOM SETTINGS */}
          {activeTab === 'room' && (
            <form onSubmit={handleUpdateRoom} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Room Name</label>
                <input
                  type="text"
                  maxLength={30}
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-neon-pink"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300">Visibility</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility('public')}
                    className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                      visibility === 'public'
                        ? 'bg-neon-pink/20 border-neon-pink text-white'
                        : 'bg-slate-950 border-white/10 text-slate-400'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility('private')}
                    className={`py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
                      visibility === 'private'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-white/10 text-slate-400'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Private</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Update Password (Optional)</span>
                </label>
                <input
                  type="password"
                  maxLength={20}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-bold text-slate-300">
                  <span>Max Capacity</span>
                  <span className="text-neon-blue">{maxPlayers}</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={50}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10))}
                  className="accent-neon-pink"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-white/10 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={allowChat}
                    onChange={(e) => setAllowChat(e.target.checked)}
                    className="accent-neon-pink"
                  />
                  <MessageSquare className="w-4 h-4 text-neon-blue" />
                  <span>Chat</span>
                </label>
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-white/10 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={allowGuestEmotes}
                    onChange={(e) => setAllowGuestEmotes(e.target.checked)}
                    className="accent-neon-pink"
                  />
                  <Smile className="w-4 h-4 text-neon-pink" />
                  <span>Emotes</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-neon-pink to-neon-purple text-white font-bold rounded-xl shadow-lg hover:brightness-110 text-sm mt-2"
              >
                Save Room Settings
              </button>

              <hr className="border-white/10 my-2" />

              <button
                type="button"
                onClick={handleEndRoom}
                className="w-full py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/50 text-rose-300 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>End Concert Room</span>
              </button>
            </form>
          )}

          {/* TAB 2: MUSIC & YOUTUBE */}
          {activeTab === 'music' && (
            <div className="flex flex-col gap-5">
              {/* Add YouTube Form */}
              <form onSubmit={handleAddTrack} className="p-3 bg-slate-950/80 border border-white/10 rounded-xl flex flex-col gap-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neon-blue">
                  Add YouTube Track
                </h3>
                <input
                  type="text"
                  required
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="YouTube URL (e.g. https://youtu.be/...)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-neon-blue"
                />
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Custom Track Title (Optional)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-neon-blue"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-neon-blue/20 hover:bg-neon-blue/30 border border-neon-blue/40 text-neon-blue font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Playlist</span>
                </button>
              </form>

              {/* DJ Controls */}
              <div className="p-3 bg-slate-950/80 border border-white/10 rounded-xl flex flex-col gap-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neon-pink">
                  Host DJ Controls
                </h3>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handlePrevTrack}
                    className="p-2.5 rounded-full bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-neon-pink"
                    title="Previous Track"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handlePlayPause}
                    className="p-3.5 rounded-full bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg shadow-neon-pink/30 hover:brightness-110 active:scale-95"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                  <button
                    onClick={handleNextTrack}
                    className="p-2.5 rounded-full bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-neon-pink"
                    title="Next Track"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-2 pt-2">
                  <Volume2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                    className="w-full accent-neon-pink"
                  />
                  <span className="text-xs font-bold text-slate-300 w-8 text-right">{volume}%</span>
                </div>
              </div>

              {/* Playlist preview */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Playlist ({playlist.length})
                </h3>
                {playlist.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No tracks yet.</p>
                ) : (
                  <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1">
                    {playlist.map((item, idx) => (
                      <div
                        key={item.id}
                        className="px-3 py-2 bg-slate-950/80 border border-white/5 rounded-lg flex items-center justify-between text-xs text-slate-300"
                      >
                        <span className="truncate flex-1">
                          {idx + 1}. {item.title}
                        </span>
                        <span className="text-[10px] text-slate-500 ml-2">{item.addedBy}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PLAYER MANAGEMENT */}
          {activeTab === 'players' && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Active Dancers in Room ({playersList.length})
              </h3>
              <div className="flex flex-col gap-2">
                {playersList.map((p) => {
                  const isHostPlayer = p.isHost || p.role === 'host';

                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-slate-950/80 border border-white/10 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="text-sm font-bold text-white">{p.nickname}</span>
                        {isHostPlayer && (
                          <span className="px-2 py-0.5 rounded-full bg-neon-pink/20 border border-neon-pink/40 text-[10px] font-black text-neon-pink">
                            HOST
                          </span>
                        )}
                      </div>

                      {!isHostPlayer && (
                        <button
                          onClick={() => handleKickPlayer(p.id, p.nickname)}
                          className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Kick</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: SHOW CUES */}
          {activeTab === 'show' && (
            <div className="flex flex-col gap-6">
              <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                <h3 className="text-neon-cyan font-bold mb-4 flex items-center gap-2">
                  <Camera size={18} /> Camera Angles
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleTriggerCue('camera', { angle: 'wide' })} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 p-3 rounded-lg text-sm text-white font-bold transition">Wide Stage</button>
                  <button onClick={() => handleTriggerCue('camera', { angle: 'dj' })} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 p-3 rounded-lg text-sm text-white font-bold transition">DJ Close-up</button>
                  <button onClick={() => handleTriggerCue('camera', { angle: 'audience' })} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 p-3 rounded-lg text-sm text-white font-bold transition">Audience Sweep</button>
                  <button onClick={() => handleTriggerCue('camera', { angle: 'side-left' })} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 p-3 rounded-lg text-sm text-white font-bold transition">Side Angle</button>
                </div>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                <h3 className="text-neon-pink font-bold mb-4 flex items-center gap-2">
                  <Zap size={18} /> Stage Effects
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleTriggerCue('confetti')} className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-lg text-sm text-white font-bold hover:opacity-80 transition shadow-lg shadow-pink-500/20">Confetti Burst</button>
                  <button onClick={() => handleTriggerCue('fireworks')} className="bg-gradient-to-r from-yellow-500 to-orange-600 p-3 rounded-lg text-sm text-white font-bold hover:opacity-80 transition shadow-lg shadow-orange-500/20">Fireworks</button>
                  <button onClick={() => handleTriggerCue('laser')} className="bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan hover:text-slate-900 p-3 rounded-lg text-sm font-bold transition">Laser Sweep</button>
                  <button onClick={() => handleTriggerCue('screen', { message: 'MAKE SOME NOISE!' })} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 p-3 rounded-lg text-sm text-white font-bold transition">Screen Message</button>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-2">
                <AlertTriangle size={14} /> Note: Camera cues only affect users currently in Cinematic mode.
              </p>
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-white/10 text-center text-[11px] text-slate-500">
          Room ID: <span className="font-mono text-slate-400">{roomId}</span>
        </div>
      </div>
    </div>
  );
};

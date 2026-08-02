import React, { useState, useEffect } from 'react';
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
  const { currentRoom, players, playlist, musicState, hostToken, activeStageCue, currentTrack } = useRoomStore();
  const roomId = currentRoom?.id || '';

  const [activeTab, setActiveTab] = useState<'room' | 'music' | 'players' | 'roles' | 'show'>('room');

  // Room update form
  const [roomName, setRoomName] = useState(currentRoom?.name || '');
  const [visibility, setVisibility] = useState<RoomVisibility>(currentRoom?.visibility || 'public');
  const [password, setPassword] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(currentRoom?.maxPlayers || 30);
  const [allowChat, setAllowChat] = useState(currentRoom?.allowChat !== false);
  const [allowGuestEmotes, setAllowGuestEmotes] = useState(currentRoom?.allowGuestEmotes !== false);
  const [rhythmMode, setRhythmMode] = useState<boolean>(currentRoom?.rhythmMode === 'audition' || currentRoom?.rhythmMode === 'freestyle');

  // YouTube add form
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Volume
  const [volume, setVolume] = useState(musicState?.volume || 80);

  // Music Timing (BPM)
  const [bpmInput, setBpmInput] = useState(currentTrack?.metadata?.bpm?.toString() || '120');
  const [offsetInput, setOffsetInput] = useState(currentTrack?.metadata?.beatOffsetSeconds?.toString() || '0');
  const [beatsPerBarInput, setBeatsPerBarInput] = useState(currentTrack?.metadata?.beatsPerBar?.toString() || '4');
  const [tapTimes, setTapTimes] = useState<number[]>([]);

  useEffect(() => {
    if (currentTrack?.metadata) {
      setBpmInput(currentTrack.metadata.bpm.toString());
      setOffsetInput(currentTrack.metadata.beatOffsetSeconds.toString());
      setBeatsPerBarInput(currentTrack.metadata.beatsPerBar.toString());
    }
  }, [currentTrack?.metadata]);

  const handleTapBPM = () => {
    const now = Date.now();
    const newTaps = [...tapTimes, now].slice(-8); // Keep last 8 taps
    setTapTimes(newTaps);
    
    if (newTaps.length >= 4) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      // Simple average without outlier removal for brevity, or with simple sort
      intervals.sort();
      const avgInterval = intervals[Math.floor(intervals.length / 2)]; 
      const calculatedBpm = Math.round((60000 / avgInterval) * 10) / 10;
      if (calculatedBpm > 40 && calculatedBpm < 300) {
        setBpmInput(calculatedBpm.toString());
      }
    }
  };

  const saveTrackMetadata = () => {
    if (!hostToken || !currentTrack) return;
    const bpm = parseFloat(bpmInput) || 120;
    const offset = parseFloat(offsetInput) || 0;
    const beatsPerBar = parseInt(beatsPerBarInput, 10) || 4;

    const socket = socketService.getSocket();
    socket.emit('host:track:metadata:update', {
      roomId,
      hostToken,
      trackId: currentTrack.id,
      metadata: {
        ...(currentTrack.metadata || {}),
        bpm,
        beatOffsetSeconds: offset,
        beatsPerBar
      }
    });
  };

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
      allowGuestEmotes,
      rhythmMode: rhythmMode ? 'audition' : 'none'
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
                <label className="flex col-span-2 items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-white/10 cursor-pointer text-xs font-bold text-slate-300">
                  <input
                    type="checkbox"
                    checked={rhythmMode}
                    onChange={(e) => setRhythmMode(e.target.checked)}
                    className="accent-neon-pink"
                  />
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span>Rhythm Mode (Interactive Concert)</span>
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

              {/* MUSIC TIMING */}
              {currentTrack && (
                <div className="p-3 bg-slate-950/80 border border-white/10 rounded-xl flex flex-col gap-3 mt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-green-400">
                    Music Timing & BPM
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold">BPM</label>
                      <input 
                        type="number" 
                        value={bpmInput} 
                        onChange={e => setBpmInput(e.target.value)} 
                        className="w-full px-2 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs mt-1" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Offset (s)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={offsetInput} 
                        onChange={e => setOffsetInput(e.target.value)} 
                        className="w-full px-2 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs mt-1" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-bold">Beats/Bar</label>
                      <input 
                        type="number" 
                        value={beatsPerBarInput} 
                        onChange={e => setBeatsPerBarInput(e.target.value)} 
                        className="w-full px-2 py-1.5 rounded bg-slate-900 border border-white/10 text-white text-xs mt-1" 
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={handleTapBPM}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-bold rounded border border-white/20 active:bg-slate-600 transition-colors"
                    >
                      TAP BPM
                    </button>
                    <button 
                      type="button"
                      onClick={saveTrackMetadata}
                      className="flex-1 py-1.5 bg-green-600/30 hover:bg-green-600/50 text-green-400 text-[11px] font-bold rounded border border-green-500/30 transition-colors"
                    >
                      SAVE TIMING
                    </button>
                  </div>
                  
                  {/* Quick offset adjust */}
                  <div className="flex gap-1 justify-center mt-1">
                    {[-0.05, -0.01, 0.01, 0.05].map(v => (
                      <button 
                        key={v}
                        onClick={() => setOffsetInput((parseFloat(offsetInput || '0') + v).toFixed(2))}
                        className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[10px] text-slate-300"
                      >
                        {v > 0 ? '+' : ''}{v}s
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button 
                      type="button"
                      onClick={() => {
                         // A simple implementation would append a section marker to currentTrack.metadata.sections
                         // Since we are updating track metadata via socket, let's just trigger a server side cue for now, 
                         // or save it into sections array.
                         const socket = socketService.getSocket();
                         socket.emit('host:trigger-cue', { roomId, hostToken, type: 'laser', payload: { } });
                      }}
                      className="flex-1 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-400 text-[11px] font-bold rounded border border-red-500/30 transition-colors"
                    >
                      MARK DROP
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                         const socket = socketService.getSocket();
                         socket.emit('host:trigger-cue', { roomId, hostToken, type: 'lightstick', payload: { effect: 'pulse' } });
                      }}
                      className="flex-1 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 text-[11px] font-bold rounded border border-blue-500/30 transition-colors"
                    >
                      MARK BREAK
                    </button>
                  </div>
                </div>
              )}

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
                  <button onClick={() => handleTriggerCue('camera', { angle: 'wide' })} className={`p-3 rounded-lg text-sm text-white font-bold transition border ${activeStageCue?.type === 'camera' && (activeStageCue.payload as any)?.angle === 'wide' ? 'bg-slate-700 border-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-500'}`}>Wide Stage</button>
                  <button onClick={() => handleTriggerCue('camera', { angle: 'dj' })} className={`p-3 rounded-lg text-sm text-white font-bold transition border ${activeStageCue?.type === 'camera' && (activeStageCue.payload as any)?.angle === 'dj' ? 'bg-slate-700 border-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-500'}`}>DJ Close-up</button>
                  <button onClick={() => handleTriggerCue('camera', { angle: 'audience' })} className={`p-3 rounded-lg text-sm text-white font-bold transition border ${activeStageCue?.type === 'camera' && (activeStageCue.payload as any)?.angle === 'audience' ? 'bg-slate-700 border-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-500'}`}>Audience Sweep</button>
                  <button onClick={() => handleTriggerCue('camera', { angle: 'side-left' })} className={`p-3 rounded-lg text-sm text-white font-bold transition border ${activeStageCue?.type === 'camera' && (activeStageCue.payload as any)?.angle === 'side-left' ? 'bg-slate-700 border-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]' : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-500'}`}>Side Angle</button>
                </div>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                <h3 className="text-neon-pink font-bold mb-4 flex items-center gap-2">
                  <Zap size={18} /> Stage Effects
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => handleTriggerCue('confetti')} className={`p-3 rounded-lg text-sm text-white font-bold transition shadow-lg border ${activeStageCue?.type === 'confetti' ? 'bg-gradient-to-r from-pink-400 to-purple-500 border-white shadow-[0_0_15px_rgba(255,100,200,0.5)] scale-[0.98]' : 'bg-gradient-to-r from-pink-500 to-purple-600 border-transparent hover:opacity-80'}`}>Confetti Burst</button>
                  <button onClick={() => handleTriggerCue('fireworks')} className={`p-3 rounded-lg text-sm text-white font-bold transition shadow-lg border ${activeStageCue?.type === 'fireworks' ? 'bg-gradient-to-r from-yellow-400 to-orange-500 border-white shadow-[0_0_15px_rgba(255,160,0,0.5)] scale-[0.98]' : 'bg-gradient-to-r from-yellow-500 to-orange-600 border-transparent hover:opacity-80'}`}>Fireworks</button>
                  <button onClick={() => handleTriggerCue('laser')} className={`p-3 rounded-lg text-sm font-bold transition col-span-2 border ${activeStageCue?.type === 'laser' ? 'bg-neon-cyan text-slate-900 border-white shadow-[0_0_15px_rgba(0,240,255,0.5)] scale-[0.98]' : 'bg-neon-cyan/20 border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan hover:text-slate-900'}`}>Laser Sweep</button>
                </div>
              </div>

              <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5">
                <h3 className="text-[#00F0FF] font-bold mb-4 flex items-center gap-2">
                  <Sparkles size={18} /> Lightstick Show
                </h3>
                
                {/* Colors */}
                <div className="grid grid-cols-4 gap-2 mb-3">
                  <button onClick={() => handleTriggerCue('lightstick', { effect: 'color', color: '#00F0FF' })} className={`py-2 rounded-lg text-xs text-white font-bold transition border-b-2 ${activeStageCue?.type === 'lightstick' && (activeStageCue.payload as any)?.effect === 'color' && (activeStageCue.payload as any)?.color === '#00F0FF' ? 'bg-slate-700 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.3)]' : 'bg-slate-800 hover:bg-slate-700 border-[#00F0FF]/40 hover:border-[#00F0FF]'}`}>Cyan</button>
                  <button onClick={() => handleTriggerCue('lightstick', { effect: 'color', color: '#FF2B9B' })} className={`py-2 rounded-lg text-xs text-white font-bold transition border-b-2 ${activeStageCue?.type === 'lightstick' && (activeStageCue.payload as any)?.effect === 'color' && (activeStageCue.payload as any)?.color === '#FF2B9B' ? 'bg-slate-700 border-[#FF2B9B] shadow-[0_0_15px_rgba(255,43,155,0.3)]' : 'bg-slate-800 hover:bg-slate-700 border-[#FF2B9B]/40 hover:border-[#FF2B9B]'}`}>Pink</button>
                  <button onClick={() => handleTriggerCue('lightstick', { effect: 'color', color: '#7C3AED' })} className={`py-2 rounded-lg text-xs text-white font-bold transition border-b-2 ${activeStageCue?.type === 'lightstick' && (activeStageCue.payload as any)?.effect === 'color' && (activeStageCue.payload as any)?.color === '#7C3AED' ? 'bg-slate-700 border-[#7C3AED] shadow-[0_0_15px_rgba(124,58,237,0.3)]' : 'bg-slate-800 hover:bg-slate-700 border-[#7C3AED]/40 hover:border-[#7C3AED]'}`}>Purple</button>
                  <button onClick={() => handleTriggerCue('lightstick', { effect: 'color', color: '#FFFFFF' })} className={`py-2 rounded-lg text-xs text-white font-bold transition border-b-2 ${activeStageCue?.type === 'lightstick' && (activeStageCue.payload as any)?.effect === 'color' && (activeStageCue.payload as any)?.color === '#FFFFFF' ? 'bg-slate-700 border-[#FFFFFF] shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-slate-800 hover:bg-slate-700 border-[#FFFFFF]/40 hover:border-[#FFFFFF]'}`}>White</button>
                </div>

                {/* Effects */}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleTriggerCue('lightstick', { effect: 'pulse' })} className={`p-2 rounded-lg text-sm text-white font-bold transition flex items-center justify-center gap-2 border ${activeStageCue?.type === 'lightstick' && (activeStageCue.payload as any)?.effect === 'pulse' ? 'bg-slate-700 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-slate-800 hover:bg-slate-700 border-white/20 hover:border-white/50'}`}>
                    Pulse
                  </button>
                  <button onClick={() => handleTriggerCue('lightstick', { effect: 'rainbow' })} className={`p-2 rounded-lg text-sm text-white font-bold transition border ${activeStageCue?.type === 'lightstick' && (activeStageCue.payload as any)?.effect === 'rainbow' ? 'bg-gradient-to-r from-red-500/40 via-green-500/40 to-blue-500/40 border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'bg-gradient-to-r from-red-500/20 via-green-500/20 to-blue-500/20 hover:from-red-500/30 hover:via-green-500/30 hover:to-blue-500/30 border-white/20'}`}>
                    Rainbow
                  </button>
                  <button onClick={() => handleTriggerCue('lightstick', { effect: 'wave' })} className={`p-2 rounded-lg text-sm text-white font-bold transition border ${activeStageCue?.type === 'lightstick' && (activeStageCue.payload as any)?.effect === 'wave' ? 'bg-slate-700 border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.4)]' : 'bg-slate-800 hover:bg-slate-700 border-[#00F0FF]/50 shadow-[0_0_10px_rgba(0,240,255,0.1)]'}`}>
                    Sync Wave
                  </button>
                  <button onClick={() => handleTriggerCue('lightstick', { effect: 'crowd-wave' })} className={`p-2 rounded-lg text-sm text-white font-bold transition border shadow-lg ${activeStageCue?.type === 'lightstick' && (activeStageCue.payload as any)?.effect === 'crowd-wave' ? 'bg-gradient-to-r from-blue-500 to-cyan-400 border-white shadow-cyan-500/50 scale-[0.98]' : 'bg-gradient-to-r from-blue-600 to-cyan-500 border-transparent hover:opacity-80 shadow-cyan-500/20'}`}>
                    Crowd Wave
                  </button>
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

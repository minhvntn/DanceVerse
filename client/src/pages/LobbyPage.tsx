import React, { useEffect, useState } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useRoomStore } from '../stores/useRoomStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { socketService } from '../services/socket.service';
import { audioService } from '../services/audio.service';
import { SOCKET_EVENTS, Room, RoomStatePayload, RoomVisibility } from '../types';
import { applyInitialRoomState } from '../features/room-session/applyInitialRoomState';
import {
  Users,
  Music2,
  Sparkles,
  AlertCircle,
  PlusCircle,
  Globe,
  Lock,
  Key,
  Radio,
  Link as LinkIcon,
  Search,
  ArrowLeft,
  X,
  MessageSquare,
  Smile
} from 'lucide-react';

export const LobbyPage: React.FC = () => {
  const { roomList, setRoomList, setRoomState, targetRoomId, setTargetRoomId } = useRoomStore();
  const { nickname, avatarType, setMyPlayerId } = usePlayerStore();
  const setPageStep = useGameStore((state) => state.setPageStep);
  const setConnectionStatus = useGameStore((state) => state.setConnectionStatus);

  const [activeTab, setActiveTab] = useState<'browse' | 'create'>('browse');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Invite link input
  const [inviteInput, setInviteInput] = useState<string>(targetRoomId || '');

  // Password Modal
  const [passwordModalRoomId, setPasswordModalRoomId] = useState<string | null>(null);
  const [passwordModalName, setPasswordModalName] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');

  // Create Room Form State
  const [roomName, setRoomName] = useState<string>(`${nickname}'s Concert`);
  const [visibility, setVisibility] = useState<RoomVisibility>('public');
  const [roomPassword, setRoomPassword] = useState<string>('');
  const [maxPlayers, setMaxPlayers] = useState<number>(30);
  const [allowChat, setAllowChat] = useState<boolean>(true);
  const [allowGuestEmotes, setAllowGuestEmotes] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  useEffect(() => {
    const socket = socketService.connect();
    setConnectionStatus('Connected');

    const handleRoomList = (rooms: Room[]) => {
      setRoomList(rooms);
    };

    const handleRoomState = (payload: RoomStatePayload) => {
      setJoiningId(null);
      setPasswordModalRoomId(null);
      setErrorMsg(null);
      applyInitialRoomState(payload, { setRoomState, setMyPlayerId });
      setPageStep('game');
    };

    const handleError = (err: { message?: string }) => {
      setJoiningId(null);
      setIsCreating(false);
      setErrorMsg(err?.message || 'Failed to connect to room');
    };

    const handleRoomCreated = (res: any) => {
      setIsCreating(false);
      if (res && res.success && res.roomId) {
        if (res.hostToken) {
          sessionStorage.setItem(`dv_hostToken_${res.roomId}`, res.hostToken);
        }
        audioService.unlockAudio();
        socket.emit(SOCKET_EVENTS.ROOM_JOIN, {
          roomId: res.roomId,
          nickname: nickname || 'Host',
          avatarType,
          hostToken: res.hostToken
        });
      } else {
        setErrorMsg(res?.error || 'Failed to create room.');
      }
    };

    socket.on(SOCKET_EVENTS.ROOM_LIST, handleRoomList);
    socket.on(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
    socket.on(SOCKET_EVENTS.ERROR, handleError);
    socket.on('host:room:created', handleRoomCreated);

    socket.emit(SOCKET_EVENTS.ROOM_LIST);

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_LIST, handleRoomList);
      socket.off(SOCKET_EVENTS.ROOM_STATE, handleRoomState);
      socket.off(SOCKET_EVENTS.ERROR, handleError);
      socket.off('host:room:created', handleRoomCreated);
    };
  }, [setRoomList, setRoomState, setMyPlayerId, setPageStep, setConnectionStatus, nickname, avatarType]);

  // Handle URL invite check on mount
  useEffect(() => {
    if (targetRoomId) {
      setInviteInput(targetRoomId);
      handleJoinById(targetRoomId);
    }
  }, [targetRoomId]);

  const extractRoomId = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return '';

    try {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const url = new URL(trimmed);
        const roomParam = url.searchParams.get('room') || url.searchParams.get('invite');
        if (roomParam) return roomParam;
        if (url.pathname.startsWith('/room/')) {
          const parts = url.pathname.split('/').filter(Boolean);
          if (parts[1]) return parts[1];
        }
      }
    } catch {
      // Not an URL, treat as raw room ID
    }
    return trimmed;
  };

  const handleJoinById = (rawId: string, password?: string) => {
    const roomId = extractRoomId(rawId);
    if (!roomId) {
      setErrorMsg('Please enter a valid Room ID or Invite Link.');
      return;
    }

    const foundRoom = roomList.find((r) => r.id === roomId);
    if (foundRoom && foundRoom.hasPassword && !password) {
      setPasswordModalRoomId(foundRoom.id);
      setPasswordModalName(foundRoom.name);
      setPasswordInput('');
      return;
    }

    // Check if we have a saved host token for this room
    const savedHostToken = sessionStorage.getItem(`dv_hostToken_${roomId}`) || undefined;

    audioService.unlockAudio();
    setErrorMsg(null);
    setJoiningId(roomId);
    const socket = socketService.getSocket();
    socket.emit(SOCKET_EVENTS.ROOM_JOIN, {
      nickname: nickname || 'Dancer',
      avatarType,
      roomId,
      password,
      hostToken: savedHostToken
    });
  };

  const handleCreateRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = roomName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 30) {
      setErrorMsg('Room name must be between 2 and 30 characters.');
      return;
    }

    setErrorMsg(null);
    setIsCreating(true);
    const socket = socketService.getSocket();
    socket.emit(SOCKET_EVENTS.HOST_ROOM_CREATE, {
      name: trimmedName,
      nickname: nickname || 'Host',
      avatarType,
      maxPlayers,
      password: roomPassword.trim() || undefined,
      visibility,
      allowChat,
      allowGuestEmotes
    });
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 p-4 sm:p-8 overflow-y-auto">
      {/* Top Bar */}
      <div className="w-full max-w-5xl flex items-center justify-between z-10 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-neon-pink animate-pulse" />
          <span className="text-xl sm:text-2xl font-black text-white tracking-wider">DanceVerse Live</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setPageStep('avatar')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:border-neon-pink/40 hover:text-white transition-all text-xs sm:text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Change Avatar:</span>
            <span className="font-bold text-neon-pink">{avatarType}</span>
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10">
            <span className="text-xs text-slate-400 hidden sm:inline">Nickname:</span>
            <span className="text-sm font-bold text-neon-blue">{nickname}</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="z-10 w-full max-w-5xl flex flex-col items-center my-auto py-2">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 p-1.5 bg-slate-900/90 border border-white/10 rounded-2xl mb-6 shadow-xl">
          <button
            onClick={() => {
              setActiveTab('browse');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'browse'
                ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg shadow-neon-pink/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Live Concerts ({roomList.length})</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('create');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg shadow-neon-pink/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Concert Room</span>
          </button>
        </div>

        {errorMsg && (
          <div className="mb-6 px-4 py-3 bg-rose-500/20 border border-rose-500/40 rounded-xl flex items-center gap-2 text-rose-300 text-sm max-w-lg w-full">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="text-rose-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab 1: Browse Rooms */}
        {activeTab === 'browse' && (
          <div className="w-full flex flex-col items-center">
            {/* Invite Link / Room ID Join Bar */}
            <div className="w-full max-w-xl flex items-center gap-2 bg-slate-900/80 border border-white/10 p-2 rounded-2xl mb-8 shadow-inner">
              <LinkIcon className="w-5 h-5 text-neon-blue ml-2 shrink-0" />
              <input
                type="text"
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="Paste Invite Link or Room ID (e.g. room-neon)"
                className="flex-1 bg-transparent text-white text-sm placeholder-slate-500 focus:outline-none px-2 py-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleJoinById(inviteInput);
                }}
              />
              <button
                onClick={() => handleJoinById(inviteInput)}
                className="px-5 py-2 bg-neon-blue/20 hover:bg-neon-blue/30 border border-neon-blue/50 text-neon-blue font-bold rounded-xl text-sm transition-all flex items-center gap-1.5 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>Join by Link</span>
              </button>
            </div>

            {/* Room Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {roomList.map((room) => {
                const isFull = room.isFull || room.currentPlayers >= room.maxPlayers;
                const isJoiningThis = joiningId === room.id;

                return (
                  <div
                    key={room.id}
                    className="group relative flex flex-col justify-between bg-slate-900/80 border border-white/10 hover:border-neon-pink/50 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-neon-pink/20"
                  >
                    {/* Thumbnail background */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-800">
                      <img
                        src={room.thumbnail}
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                      {/* Status badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-sm border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-bold text-slate-200">LIVE</span>
                      </div>

                      {/* Password lock indicator */}
                      {room.hasPassword && (
                        <div
                          className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 backdrop-blur-sm border border-amber-500/40 text-amber-300"
                          title="Requires Password"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold">LOCKED</span>
                        </div>
                      )}

                      {/* Room Title overlay */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-lg font-black text-white tracking-wide drop-shadow-md truncate">
                          {room.name}
                        </h3>
                      </div>
                    </div>

                    {/* Footer Info & Action */}
                    <div className="p-4 flex items-center justify-between bg-slate-900/90 border-t border-white/5">
                      <div className="flex items-center gap-3 text-slate-300">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <Users className="w-4 h-4 text-neon-blue" />
                          <span>
                            {room.currentPlayers} / {room.maxPlayers}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <Music2 className="w-4 h-4 text-neon-pink" />
                          <span>DJ Set</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleJoinById(room.id)}
                        disabled={isFull || !!joiningId}
                        className={`px-5 py-2 rounded-xl font-bold text-sm transition-all ${
                          isFull
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : isJoiningThis
                            ? 'bg-neon-purple text-white animate-pulse'
                            : 'bg-gradient-to-r from-neon-pink to-neon-purple text-white hover:brightness-110 shadow-lg shadow-neon-pink/20 active:scale-95'
                        }`}
                      >
                        {isJoiningThis ? 'Joining...' : isFull ? 'Full' : 'Join Concert'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Create Room */}
        {activeTab === 'create' && (
          <form
            onSubmit={handleCreateRoomSubmit}
            className="w-full max-w-xl bg-slate-900/90 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6 animate-fadeIn"
          >
            <div className="text-center">
              <h2 className="text-2xl font-black text-white tracking-wide mb-1">Host Your Own Concert</h2>
              <p className="text-xs text-slate-400">
                Customize your room settings, choose privacy, and add YouTube music!
              </p>
            </div>

            {/* Room Name */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Concert Room Name
              </label>
              <input
                type="text"
                required
                maxLength={30}
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g., Neon City Friday Night"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-neon-pink transition-all font-semibold"
              />
            </div>

            {/* Visibility Options */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Visibility
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition-all ${
                    visibility === 'public'
                      ? 'bg-neon-pink/20 border-neon-pink text-white shadow-lg shadow-neon-pink/20'
                      : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Globe className="w-4 h-4 text-neon-blue" />
                  <span>Public (In Lobby)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold text-sm transition-all ${
                    visibility === 'private'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-lg shadow-amber-500/20'
                      : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span>Private (Invite Link Only)</span>
                </button>
              </div>
            </div>

            {/* Room Password */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Password (Optional)</span>
              </label>
              <input
                type="password"
                maxLength={20}
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Leave blank for open access"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all font-semibold"
              />
            </div>

            {/* Max Players Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
                <span>Max Capacity</span>
                <span className="text-neon-blue text-sm">{maxPlayers} Dancers</span>
              </div>
              <input
                type="range"
                min={2}
                max={50}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value, 10))}
                className="w-full accent-neon-pink cursor-pointer"
              />
            </div>

            {/* Chat & Emotes Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-white/10 cursor-pointer hover:border-white/20 transition-all">
                <input
                  type="checkbox"
                  checked={allowChat}
                  onChange={(e) => setAllowChat(e.target.checked)}
                  className="w-4 h-4 accent-neon-pink rounded"
                />
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                  <MessageSquare className="w-4 h-4 text-neon-blue" />
                  <span>Allow Chat</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-white/10 cursor-pointer hover:border-white/20 transition-all">
                <input
                  type="checkbox"
                  checked={allowGuestEmotes}
                  onChange={(e) => setAllowGuestEmotes(e.target.checked)}
                  className="w-4 h-4 accent-neon-pink rounded"
                />
                <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
                  <Smile className="w-4 h-4 text-neon-pink" />
                  <span>Allow Emotes</span>
                </div>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-4 bg-gradient-to-r from-neon-pink to-neon-purple text-white font-extrabold text-base rounded-2xl shadow-xl shadow-neon-pink/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isCreating ? 'Creating Concert...' : 'Launch Concert Room 🚀'}
            </button>
          </form>
        )}
      </div>

      {/* Password Modal for Joining Locked Rooms */}
      {passwordModalRoomId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Lock className="w-5 h-5" />
                <h3 className="font-extrabold text-white">Password Required</h3>
              </div>
              <button
                onClick={() => setPasswordModalRoomId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Concert room <span className="font-bold text-white">"{passwordModalName}"</span> is protected with a password.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleJoinById(passwordModalRoomId, passwordInput);
              }}
              className="flex flex-col gap-4"
            >
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl hover:brightness-110"
              >
                Unlock & Join
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="z-10 text-center text-xs text-slate-500 mt-4">
        Powered by React, Socket.IO & Three.js • DanceVerse Live
      </div>
    </div>
  );
};

export default LobbyPage;

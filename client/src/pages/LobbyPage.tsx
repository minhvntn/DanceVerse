import React, { useEffect, useState } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useRoomStore } from '../stores/useRoomStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useAuthStore } from '../stores/useAuthStore';
import { socketService } from '../services/socket.service';
import { audioService } from '../services/audio.service';
import { SOCKET_EVENTS, Room, RoomStatePayload, RoomVisibility } from '../types';
import { apiClient } from '../services/apiClient';
import { ConcertEventCard } from '../components/ui/ConcertEventCard';
import { EventDetailModal } from '../components/modals/EventDetailModal';
import { NotificationBell } from '../components/ui/NotificationBell';
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
  Smile,
  Settings,
  Calendar,
  Star,
  Plus
} from 'lucide-react';

const CONCERT_PRESET_THUMBNAILS = [
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80', // Neon City Concert
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80', // Beach Festival
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80', // Space Party
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80', // DJ Stadium Lights
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80', // Laser Party Club
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80', // Stage Lights & Crowd
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80', // Live Concert Performance
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&auto=format&fit=crop&q=80', // EDM Festival Stage
];

const ROOM_THUMBNAILS: Record<string, string> = {
  'room-neon': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
  'room-beach': 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80',
  'room-space': 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80'
};

export const getRoomThumbnail = (room: { id?: string; name?: string; thumbnail?: string; coverImage?: string }): string => {
  if (room.thumbnail) return room.thumbnail;
  if (room.coverImage) return room.coverImage;
  if (room.id && ROOM_THUMBNAILS[room.id]) return ROOM_THUMBNAILS[room.id];
  
  const seed = (room.id || room.name || 'concert');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CONCERT_PRESET_THUMBNAILS.length;
  return CONCERT_PRESET_THUMBNAILS[index];
};

export const LobbyPage: React.FC = () => {
  const { roomList, setRoomList, setRoomState, targetRoomId, setTargetRoomId } = useRoomStore();
  const { nickname, avatarType, setMyPlayerId } = usePlayerStore();
  const setPageStep = useGameStore((state) => state.setPageStep);
  const setConnectionStatus = useGameStore((state) => state.setConnectionStatus);

  const [activeTab, setActiveTab] = useState<'browse' | 'create' | 'upcoming' | 'following' | 'my-concerts'>('browse');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [followingEvents, setFollowingEvents] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Invite link input
  const [inviteInput, setInviteInput] = useState<string>(targetRoomId || '');

  // Password Modal
  const [passwordModalRoomId, setPasswordModalRoomId] = useState<string | null>(null);
  const [passwordModalName, setPasswordModalName] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');

  // Create Room Form State
  const [roomName, setRoomName] = useState<string>(nickname ? `${nickname}'s Concert` : 'Live Concert Stage');
  const [visibility, setVisibility] = useState<RoomVisibility>('public');
  const [roomPassword, setRoomPassword] = useState<string>('');
  const [maxPlayers, setMaxPlayers] = useState<number>(30);
  const [allowChat, setAllowChat] = useState<boolean>(true);
  const [allowGuestEmotes, setAllowGuestEmotes] = useState<boolean>(true);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  useEffect(() => {
    if (nickname && (roomName === "'s Concert" || roomName === 'Live Concert Stage' || !roomName)) {
      setRoomName(`${nickname}'s Concert`);
    }
  }, [nickname]);

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
          hostToken: res.hostToken,
          equippedLightstick: true,
          lightstickColor: '#00F0FF'
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

  useEffect(() => {
    if (activeTab === 'upcoming') {
      apiClient.get('/events?status=scheduled&orderBy=asc')
        .then(res => setUpcomingEvents(res.data))
        .catch(err => console.error(err));
    } else if (activeTab === 'following') {
      apiClient.get('/events/following')
        .then(res => setFollowingEvents(res.data))
        .catch(err => console.error(err));
    } else if (activeTab === 'my-concerts') {
      apiClient.get(`/events?hostId=${useAuthStore.getState().user?.id}&status=scheduled&status=live&status=ended`)
        .then(res => setMyEvents(res.data))
        .catch(err => console.error(err));
    }
  }, [activeTab]);

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
    if (foundRoom && !!foundRoom.password && !password) {
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
      nickname: nickname || 'Fan',
      avatarType,
      avatarConfig: usePlayerStore.getState().avatarConfig,
      roomId,
      password,
      hostToken: savedHostToken
    });
  };

  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState<string>('');

  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = roomName.trim();
    if (trimmedName.length < 2 || trimmedName.length > 30) {
      setErrorMsg('Room name must be between 2 and 30 characters.');
      return;
    }

    if (useAuthStore.getState().status !== 'authenticated') {
      setErrorMsg('You must be logged in to host a concert. Please log out and sign in with an account.');
      return;
    }
    
    if (isScheduled && !scheduledAt) {
      setErrorMsg('Please select a valid date and time.');
      return;
    }

    if (isScheduled && new Date(scheduledAt) < new Date()) {
      setErrorMsg('Scheduled time must be in the future.');
      return;
    }

    setErrorMsg(null);
    setIsCreating(true);

    try {
      const res = await apiClient.post('/events', {
        title: trimmedName,
        capacity: maxPlayers,
        visibility,
        goLiveNow: !isScheduled,
        scheduledAt: isScheduled ? new Date(scheduledAt).toISOString() : new Date().toISOString()
      });

      if (!isScheduled && res.roomId) {
        // Successfully went live now, join the room
        sessionStorage.setItem(`dv_hostToken_${res.roomId}`, res.hostToken);
        handleJoinById(res.roomId);
      } else {
        // Event scheduled, clear form and switch to upcoming
        setIsCreating(false);
        setRoomName('');
        setIsScheduled(false);
        setScheduledAt('');
        setActiveTab('upcoming');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create event');
      setIsCreating(false);
    }
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
          <NotificationBell />
          <button
            onClick={() => setPageStep('customize')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-slate-300 hover:border-neon-pink/40 hover:text-white transition-all text-xs sm:text-sm"
          >
            <Smile className="w-4 h-4" />
            <span className="hidden sm:inline">Customize Avatar</span>
          </button>
          <button 
            onClick={() => setPageStep('profile')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 hover:border-neon-blue/40 transition-all cursor-pointer"
          >
            <span className="text-xs text-slate-400 hidden sm:inline">Nickname:</span>
            <span className="text-sm font-bold text-neon-blue">{nickname}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="z-10 w-full max-w-5xl flex flex-col items-center my-auto py-2">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 p-1.5 bg-slate-900/90 border border-white/10 rounded-2xl mb-6 shadow-xl w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('browse');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
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
              setActiveTab('upcoming');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'upcoming'
                ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg shadow-neon-pink/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Upcoming Concerts</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('following');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'following'
                ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg shadow-neon-pink/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Following</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('create');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg shadow-neon-pink/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Host Concert</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('my-concerts');
              setErrorMsg(null);
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'my-concerts'
                ? 'bg-gradient-to-r from-neon-pink to-neon-purple text-white shadow-lg shadow-neon-pink/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Dashboard</span>
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
                    <div className="relative h-44 w-full overflow-hidden bg-slate-800">
                      <div 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-70"
                        style={{
                          background: `linear-gradient(135deg, hsl(${room.id.length * 25 % 360}, 60%, 15%), hsl(${room.id.length * 45 % 360}, 70%, 10%))`
                        }}
                      />
                      <img 
                        src={getRoomThumbnail(room)}
                        alt={room.name || 'Concert Room'}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80"
                        onError={(e) => {
                          const fallback = CONCERT_PRESET_THUMBNAILS[0];
                          if (e.currentTarget.src !== fallback) {
                            e.currentTarget.src = fallback;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                      {/* Status badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-sm border border-white/10">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-bold text-slate-200">LIVE</span>
                      </div>

                      {/* Password lock indicator */}
                      {!!room.password && (
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

        {/* Tab: Upcoming Events */}
        {activeTab === 'upcoming' && (
          <div className="w-full max-w-5xl px-4 flex flex-col gap-6">
            <h2 className="text-xl font-black text-white border-b border-white/10 pb-4">
              Upcoming Concerts
            </h2>
            
            {upcomingEvents.length === 0 ? (
              <div className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <Calendar className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-300">No upcoming events</h3>
                <p className="text-sm text-slate-500 mt-2">Check back later or host your own concert!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map((event) => (
                  <ConcertEventCard 
                    key={event.id}
                    event={event}
                    onView={() => {
                      setSelectedEventId(event.id);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Following Events */}
        {activeTab === 'following' && (
          <div className="w-full max-w-5xl px-4 flex flex-col gap-6">
            <h2 className="text-xl font-black text-white border-b border-white/10 pb-4">
              From DJs You Follow
            </h2>
            
            {followingEvents.length === 0 ? (
              <div className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <Star className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-300">No events found</h3>
                <p className="text-sm text-slate-500 mt-2">The DJs you follow don't have any upcoming or live events right now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {followingEvents.map((event) => (
                  <ConcertEventCard 
                    key={event.id}
                    event={event}
                    onView={() => {
                      setSelectedEventId(event.id);
                    }}
                  />
                ))}
              </div>
            )}
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

            {/* Schedule Options */}
            <div className="flex flex-col gap-3 pt-2 border-t border-white/10">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="w-4 h-4 accent-neon-pink rounded"
                />
                <span className="text-sm font-bold text-slate-300">Schedule for Later</span>
              </label>

              {isScheduled && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white focus:outline-none focus:border-neon-pink transition-all font-semibold"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-4 bg-gradient-to-r from-neon-pink to-neon-purple text-white font-extrabold text-base rounded-2xl shadow-xl shadow-neon-pink/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isCreating ? 'Processing...' : isScheduled ? 'Schedule Concert 📅' : 'Go Live Now 🚀'}
            </button>
          </form>
        )}

        {/* Tab: Dashboard / My Concerts */}
        {activeTab === 'my-concerts' && (
          <div className="w-full max-w-5xl px-4 flex flex-col gap-6">
            <h2 className="text-xl font-black text-white border-b border-white/10 pb-4">
              Host Dashboard
            </h2>
            
            {myEvents.length === 0 ? (
              <div className="w-full bg-slate-900/50 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center">
                <Settings className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-300">No concerts hosted yet</h3>
                <p className="text-sm text-slate-500 mt-2">Create a new concert to see it here.</p>
                <button 
                  onClick={() => setActiveTab('create')}
                  className="mt-6 px-6 py-2 bg-neon-purple rounded-xl font-bold text-white shadow-lg shadow-neon-purple/20"
                >
                  Create Concert
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myEvents.map((event) => (
                  <div key={event.id} className="relative group">
                    <ConcertEventCard 
                      event={event}
                      onView={() => setSelectedEventId(event.id)}
                    />
                    
                    {event.status === 'scheduled' && (
                      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('Start this concert early?')) {
                              try {
                                const res = await apiClient.post(`/events/${event.id}/start-early`);
                                sessionStorage.setItem(`dv_hostToken_${res.data.roomId}`, res.data.hostToken);
                                handleJoinById(res.data.roomId);
                              } catch (err: any) {
                                alert(err.response?.data?.message || 'Error starting early');
                              }
                            }
                          }}
                          className="px-3 py-1 bg-neon-cyan text-slate-900 font-bold text-xs rounded-lg shadow-lg"
                        >
                          Go Live Now
                        </button>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (window.confirm('Cancel this concert?')) {
                              try {
                                await apiClient.post(`/events/${event.id}/cancel`);
                                setMyEvents(myEvents.filter(ev => ev.id !== event.id));
                              } catch (err: any) {
                                alert(err.response?.data?.message || 'Error canceling');
                              }
                            }
                          }}
                          className="px-3 py-1 bg-red-500 text-white font-bold text-xs rounded-lg shadow-lg"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            localStorage.setItem('dv_dj_eventId', event.id);
                            setPageStep('djcontrol');
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs rounded-lg shadow-lg"
                        >
                          🎛️ DJ Control
                        </button>
                      </div>
                    )}
                    {event.status === 'live' && (
                      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (event.roomId) {
                              handleJoinById(event.roomId);
                            } else {
                              alert('Room ID not found for this live event.');
                            }
                          }}
                          className="px-3 py-1 bg-neon-purple text-white font-bold text-xs rounded-lg shadow-lg"
                        >
                          Rejoin Room
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            localStorage.setItem('dv_dj_eventId', event.id);
                            setPageStep('djcontrol');
                          }}
                          className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs rounded-lg shadow-lg"
                        >
                          🎛️ DJ Control
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
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
      {/* Event Detail Modal */}
      {selectedEventId && (
        <EventDetailModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
          onJoin={(roomId) => handleJoinById(roomId)}
        />
      )}
    </div>
  );
};

export default LobbyPage;

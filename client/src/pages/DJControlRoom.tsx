import React, { useState, useEffect, useCallback } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { useRoomStore } from '../stores/useRoomStore';
import { useAuthStore } from '../stores/useAuthStore';
import { apiClient } from '../services/apiClient';
import { PlaylistManager } from '../components/dj/PlaylistManager';
import { NowPlayingController } from '../components/dj/NowPlayingController';
import { RequestQueue } from '../components/dj/RequestQueue';
import { AudienceManager } from '../components/dj/AudienceManager';
import { StageControlPanel } from '../components/dj/StageControlPanel';
import {
  ArrowLeft, Music, ListMusic, Users, Sparkles, Clock,
  ToggleLeft, ToggleRight, Radio
} from 'lucide-react';

interface EventData {
  id: string;
  title: string;
  status: string;
  roomId: string | null;
  autoDjEnabled: boolean;
  slowMode: number;
}

type MobileTab = 'music' | 'requests' | 'audience' | 'stage';

export const DJControlRoom: React.FC = () => {
  const setPageStep = useGameStore(s => s.setPageStep);
  const currentRoom = useRoomStore(s => s.currentRoom);
  const user = useAuthStore(s => s.user);
  
  const [event, setEvent] = useState<EventData | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [autoDj, setAutoDj] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('music');
  const [confirmPlayNow, setConfirmPlayNow] = useState<any>(null);
  const [playHistory, setPlayHistory] = useState<any[]>([]);
  const [eventLogs, setEventLogs] = useState<any[]>([]);

  // Try to load the event ID from localStorage or URL
  useEffect(() => {
    const stored = localStorage.getItem('dv_dj_eventId');
    if (stored) {
      setEventId(stored);
    }
  }, []);

  // Fetch event data
  useEffect(() => {
    if (!eventId) return;
    apiClient.get(`/events/${eventId}`)
      .then(res => {
        setEvent(res.data);
        setAutoDj(res.data.autoDjEnabled ?? false);
      })
      .catch(() => {
        // Event not found, go back
        setPageStep('lobby');
      });
  }, [eventId, setPageStep]);

  const handleBack = () => {
    localStorage.removeItem('dv_dj_eventId');
    setPageStep('lobby');
  };

  const toggleAutoDj = async () => {
    if (!eventId) return;
    const newState = !autoDj;
    setAutoDj(newState);
    // Save autoDj setting
    try {
      // We'd need an endpoint for this, for now just local toggle
    } catch {
      setAutoDj(!newState);
    }
  };

  const handlePlayNow = (item: any) => {
    setConfirmPlayNow(item);
  };

  const confirmPlay = () => {
    // Emit play-now through socket
    if (confirmPlayNow && currentRoom) {
      const hostToken = useRoomStore.getState().hostToken;
      if (hostToken) {
        import('../services/socket.service').then(({ socketService }) => {
          socketService.emit('host:music:play', {
            roomId: currentRoom.id,
            hostToken,
            itemId: confirmPlayNow.videoId || confirmPlayNow.id
          });
        });
      }
    }
    setConfirmPlayNow(null);
  };

  if (!eventId) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
        <div className="glass-panel rounded-2xl p-8 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Radio className="text-purple-400" />
            DJ Control Room
          </h2>
          <p className="text-white/50 text-sm mb-6">Enter your Concert Event ID to access the control room.</p>
          <input
            type="text"
            placeholder="Event ID..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 mb-4"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim();
                if (value) {
                  localStorage.setItem('dv_dj_eventId', value);
                  setEventId(value);
                }
              }
            }}
          />
          <button
            onClick={handleBack}
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            ← Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  const roomId = event?.roomId || currentRoom?.id || null;

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-900 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-black/30 backdrop-blur-md flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-white/10 rounded-lg text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio size={14} className="text-purple-400" />
              {event?.title || 'DJ Control Room'}
            </h1>
            <span className={`text-[10px] uppercase tracking-wider font-medium px-1.5 py-0.5 rounded-full ${
              event?.status === 'live' 
                ? 'bg-red-600/30 text-red-400 animate-pulse' 
                : 'bg-white/10 text-white/40'
            }`}>
              {event?.status || 'loading'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto DJ Toggle */}
          <button
            onClick={toggleAutoDj}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              autoDj 
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/30' 
                : 'bg-white/5 text-white/40 border border-white/10'
            }`}
          >
            {autoDj ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
            Auto DJ
          </button>
        </div>
      </div>

      {/* Mobile Tab Bar (visible on small screens) */}
      <div className="flex lg:hidden border-b border-white/10 bg-black/20 flex-shrink-0">
        {([
          { id: 'music' as MobileTab, label: 'Music', icon: Music },
          { id: 'requests' as MobileTab, label: 'Requests', icon: ListMusic },
          { id: 'audience' as MobileTab, label: 'Audience', icon: Users },
          { id: 'stage' as MobileTab, label: 'Stage', icon: Sparkles },
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors ${
              mobileTab === tab.id 
                ? 'text-purple-400 border-b-2 border-purple-400' 
                : 'text-white/40 hover:text-white/60'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content — Desktop: 3-column, Mobile: tabbed */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — Playlist (desktop always, mobile: music tab) */}
        <div className={`w-80 border-r border-white/10 bg-black/20 flex-shrink-0 overflow-hidden ${
          mobileTab !== 'music' ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'
        }`}>
          <PlaylistManager eventId={eventId} isLive={event?.status === 'live'} onPlayNow={handlePlayNow} />
        </div>

        {/* CENTER — Now Playing + Timeline */}
        <div className={`flex-1 flex flex-col overflow-y-auto p-4 gap-4 ${
          mobileTab !== 'music' ? 'hidden lg:flex' : 'flex'
        }`}>
          <NowPlayingController roomId={roomId} />

          {/* Play History */}
          <div className="glass-panel rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
              <Clock size={14} className="text-white/40" />
              Recently Played
            </h3>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {playHistory.length === 0 && (
                <p className="text-white/30 text-xs">No songs played yet</p>
              )}
              {playHistory.map((h: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs text-white/50 py-1">
                  <span className="text-white/20">{new Date(h.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-white/70 truncate">{h.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Event Log */}
          <div className="glass-panel rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white/90 mb-3">📋 Event Log</h3>
            <div className="space-y-1 max-h-36 overflow-y-auto">
              {eventLogs.length === 0 && (
                <p className="text-white/30 text-xs">No events logged yet</p>
              )}
              {eventLogs.map((log: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs text-white/50 py-0.5">
                  <span className="text-white/20">{new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-white/60">{log.action}</span>
                  <span className="text-white/30">{log.user?.displayName || ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Requests + Audience */}
        <div className={`w-80 border-l border-white/10 bg-black/20 flex-shrink-0 flex flex-col overflow-hidden ${
          (mobileTab !== 'requests' && mobileTab !== 'audience') ? 'hidden lg:flex' : 'flex'
        }`}>
          {(mobileTab === 'requests' || mobileTab === 'music') && (
            <div className="flex-1 overflow-hidden border-b border-white/10 lg:border-b lg:flex lg:flex-col">
              <RequestQueue eventId={eventId} isHost={true} onPlayNow={handlePlayNow} />
            </div>
          )}
          {(mobileTab === 'audience' || mobileTab === 'music') && (
            <div className="flex-1 overflow-hidden hidden lg:flex lg:flex-col">
              <AudienceManager roomId={roomId} eventId={eventId} />
            </div>
          )}
          {mobileTab === 'audience' && (
            <div className="flex-1 overflow-hidden flex flex-col lg:hidden">
              <AudienceManager roomId={roomId} eventId={eventId} />
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM — Stage Controls (desktop always, mobile: stage tab) */}
      <div className={`border-t border-white/10 bg-black/20 flex-shrink-0 ${
        mobileTab !== 'stage' ? 'hidden lg:block' : 'block'
      }`}>
        <div className="p-3">
          <StageControlPanel roomId={roomId} />
        </div>
      </div>

      {/* Play Now Confirmation Modal */}
      {confirmPlayNow && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">Play Now?</h3>
            <p className="text-white/50 text-sm mb-1">Current song will stop.</p>
            <p className="text-white/70 text-sm mb-4">
              Play "<span className="text-purple-300">{confirmPlayNow.title}</span>" now?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmPlayNow(null)}
                className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPlay}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors"
              >
                Play Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

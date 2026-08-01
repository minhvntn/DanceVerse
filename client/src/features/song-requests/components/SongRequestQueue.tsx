import React, { useState } from 'react';
import { useRoomStore } from '../../../stores/useRoomStore';
import { usePlayerStore } from '../../../stores/usePlayerStore';
import { socketService } from '../../../services/socket.service';
import { SOCKET_EVENTS } from '../../../types';
import { SongRequestForm } from './SongRequestForm';
import { X, ThumbsUp, Music, Shield, Play, Ban } from 'lucide-react';

interface SongRequestQueueProps {
  onClose: () => void;
}

export const SongRequestQueue: React.FC<SongRequestQueueProps> = ({ onClose }) => {
  const [showForm, setShowForm] = useState(false);
  const { songRequests, currentRoom, role, hostToken, players } = useRoomStore();
  const { myPlayerId } = usePlayerStore();

  const isModerator = role === 'host' || role === 'co-host';
  const myPlayer = myPlayerId ? players[myPlayerId] : null;

  // Filter requests (Guests only see pending, approved, and played)
  // Moderators see everything
  const visibleRequests = songRequests.filter((req) => {
    if (isModerator) return true;
    return req.status === 'pending' || req.status === 'approved' || req.status === 'played';
  }).sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === 'pending') return -1;
      if (b.status === 'pending') return 1;
    }
    return b.voteCount - a.voteCount;
  });

  const handleVote = (requestId: string, hasVoted: boolean) => {
    if (!currentRoom) return;
    const socket = socketService.getSocket();
    const event = hasVoted ? SOCKET_EVENTS.SONG_REQUEST_UNVOTE : SOCKET_EVENTS.SONG_REQUEST_VOTE;
    socket.emit(event, { roomId: currentRoom.id, requestId });
  };

  const handleApprove = (requestId: string) => {
    if (!currentRoom || !isModerator) return;
    socketService.getSocket().emit(SOCKET_EVENTS.SONG_REQUEST_APPROVE, {
      roomId: currentRoom.id,
      requestId,
      hostToken
    });
  };

  const handleReject = (requestId: string) => {
    if (!currentRoom || !isModerator) return;
    socketService.getSocket().emit(SOCKET_EVENTS.SONG_REQUEST_REJECT, {
      roomId: currentRoom.id,
      requestId,
      reason: 'not_suitable',
      hostToken
    });
  };

  const handlePlayNow = (requestId: string) => {
    if (!currentRoom || !isModerator) return;
    if (window.confirm('Play this song immediately?')) {
      socketService.getSocket().emit(SOCKET_EVENTS.SONG_REQUEST_PLAY_NOW, {
        roomId: currentRoom.id,
        requestId,
        hostToken
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[85vh] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-neon-pink" />
            <h3 className="text-base font-black text-white">Song Requests</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-1.5 rounded-lg bg-neon-pink text-white text-sm font-bold shadow-lg shadow-neon-pink/20 hover:bg-pink-500 transition-colors"
            >
              {showForm ? 'View Queue' : 'Request a Song'}
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative">
          {showForm ? (
            <SongRequestForm onClose={() => setShowForm(false)} />
          ) : (
            <>
              {visibleRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Music className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No song requests yet.</p>
                  <p className="text-xs mt-1">Be the first to request a track!</p>
                </div>
              ) : (
                visibleRequests.map((req) => {
                  const hasVoted = myPlayerId ? req.votes.includes(myPlayerId) : false;
                  
                  return (
                    <div
                      key={req.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                        req.status === 'pending'
                          ? 'bg-slate-800/50 border-white/10'
                          : req.status === 'approved'
                          ? 'bg-neon-blue/10 border-neon-blue/30'
                          : req.status === 'rejected' || req.status === 'expired'
                          ? 'bg-slate-900 border-rose-500/20 opacity-70'
                          : 'bg-slate-900 border-white/5 opacity-50'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-20 h-14 bg-slate-950 rounded-lg overflow-hidden shrink-0 border border-white/5">
                        <img src={req.thumbnailUrl} alt={req.title} className="w-full h-full object-cover" />
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-[300px]">
                              {req.title}
                            </h4>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>Requested by {req.requestedByNickname}</span>
                              {req.status !== 'pending' && (
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                  req.status === 'approved' ? 'bg-neon-blue/20 text-neon-blue' :
                                  req.status === 'played' ? 'bg-slate-700 text-slate-300' :
                                  'bg-rose-500/20 text-rose-400'
                                }`}>
                                  {req.status}
                                </span>
                              )}
                            </div>
                            {req.requestMessage && (
                              <p className="text-xs text-slate-300 italic mt-1 line-clamp-1 border-l-2 border-slate-700 pl-2">
                                "{req.requestMessage}"
                              </p>
                            )}
                          </div>

                          {/* Vote Action */}
                          {req.status === 'pending' && (
                            <button
                              onClick={() => handleVote(req.id, hasVoted)}
                              className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg border transition-all ${
                                hasVoted
                                  ? 'bg-neon-pink/20 border-neon-pink text-neon-pink shadow-lg shadow-neon-pink/10'
                                  : 'bg-slate-900 border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                              }`}
                            >
                              <ThumbsUp className={`w-4 h-4 mb-0.5 ${hasVoted ? 'fill-current' : ''}`} />
                              <span className="text-[10px] font-black">{req.voteCount}</span>
                            </button>
                          )}
                        </div>

                        {/* Moderator Actions */}
                        {isModerator && req.status === 'pending' && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                            <Shield className="w-3 h-3 text-neon-yellow" />
                            <span className="text-[10px] text-neon-yellow font-bold uppercase tracking-widest mr-auto">
                              Mod Actions
                            </span>
                            <button
                              onClick={() => handleApprove(req.id)}
                              className="px-2.5 py-1 text-[10px] font-bold text-white bg-neon-blue/20 hover:bg-neon-blue/40 border border-neon-blue/40 rounded flex items-center gap-1"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handlePlayNow(req.id)}
                              className="px-2.5 py-1 text-[10px] font-bold text-white bg-neon-pink/20 hover:bg-neon-pink/40 border border-neon-pink/40 rounded flex items-center gap-1"
                            >
                              <Play className="w-3 h-3" /> Play Now
                            </button>
                            <button
                              onClick={() => handleReject(req.id)}
                              className="px-2.5 py-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/30 border border-rose-500/20 rounded flex items-center gap-1"
                            >
                              <Ban className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

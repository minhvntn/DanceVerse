import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';
import { ThumbsUp, Check, X, PlayCircle, Clock, User } from 'lucide-react';

interface SongRequestItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string | null;
  channel: string | null;
  duration: number | null;
  status: string;
  createdAt: string;
  user: { id: string; displayName: string; profileImageUrl: string | null };
  _count: { votes: number };
  hasVoted?: boolean;
}

interface Props {
  eventId: string;
  isHost: boolean;
  onPlayNow?: (request: SongRequestItem) => void;
  onRefresh?: () => void;
}

export const RequestQueue: React.FC<Props> = ({ eventId, isHost, onPlayNow }) => {
  const [requests, setRequests] = useState<SongRequestItem[]>([]);
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [sortBy, setSortBy] = useState<'votes' | 'newest' | 'oldest'>('votes');

  const fetchRequests = useCallback(async () => {
    try {
      const res = await apiClient.get(`/dj/${eventId}/requests`);
      setRequests(res.data);
    } catch {
      // ignore
    }
  }, [eventId]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // Poll every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleStatus = async (requestId: string, status: string) => {
    try {
      await apiClient.patch(`/dj/${eventId}/requests/${requestId}/status`, { status });
      await fetchRequests();
    } catch {
      // ignore
    }
  };

  const handleVote = async (requestId: string) => {
    try {
      await apiClient.post(`/dj/${eventId}/requests/${requestId}/vote`);
      await fetchRequests();
    } catch {
      // ignore
    }
  };

  const filtered = requests.filter(r => r.status === tab);
  
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'votes') return b._count.votes - a._count.votes;
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
          🎵 Song Requests
          {pendingCount > 0 && (
            <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>
          )}
        </h3>
        {isHost && (
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="text-xs bg-white/5 border border-white/10 rounded px-2 py-1 text-white/70"
          >
            <option value="votes">Most Votes</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['pending', 'approved', 'rejected'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs font-medium uppercase tracking-wider transition-colors ${
              tab === t ? 'text-purple-400 border-b-2 border-purple-400' : 'text-white/40 hover:text-white/60'
            }`}
          >
            {t} ({requests.filter(r => r.status === t).length})
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {sorted.length === 0 && (
          <div className="flex items-center justify-center h-32 text-white/30 text-sm">
            No {tab} requests
          </div>
        )}
        {sorted.map(req => (
          <div key={req.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-white/5 hover:bg-white/5 transition-colors group">
            {req.thumbnail && (
              <img src={req.thumbnail} alt="" className="w-10 h-7 rounded object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/90 truncate">{req.title}</p>
              <div className="flex items-center gap-2 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <User size={10} />
                  {req.user.displayName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Vote button */}
              <button
                onClick={() => handleVote(req.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                  req.hasVoted
                    ? 'bg-purple-600/30 text-purple-300'
                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                }`}
              >
                <ThumbsUp size={12} />
                {req._count.votes}
              </button>

              {/* Host actions */}
              {isHost && tab === 'pending' && (
                <>
                  <button
                    onClick={() => handleStatus(req.id, 'approved')}
                    className="p-1.5 hover:bg-green-600/30 rounded text-green-400 transition-colors"
                    title="Approve"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => handleStatus(req.id, 'rejected')}
                    className="p-1.5 hover:bg-red-600/30 rounded text-red-400 transition-colors"
                    title="Reject"
                  >
                    <X size={14} />
                  </button>
                </>
              )}
              {isHost && onPlayNow && tab === 'approved' && (
                <button
                  onClick={() => onPlayNow(req)}
                  className="p-1.5 hover:bg-purple-600/30 rounded text-purple-400 transition-colors"
                  title="Play Now"
                >
                  <PlayCircle size={14} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

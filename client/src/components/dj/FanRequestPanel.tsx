import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../../services/apiClient';
import { Music, Send, ThumbsUp, Clock, X } from 'lucide-react';

interface Props {
  eventId: string;
  userId?: string;
}

export const FanRequestPanel: React.FC<Props> = ({ eventId, userId }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myRequests, setMyRequests] = useState<any[]>([]);

  const fetchMyRequests = useCallback(async () => {
    try {
      const res = await apiClient.get(`/dj/${eventId}/requests`);
      // Filter by my requests
      if (userId) {
        setMyRequests(res.data.filter((r: any) => r.userId === userId || r.user?.id === userId));
      }
    } catch {
      // ignore
    }
  }, [eventId, userId]);

  useEffect(() => { fetchMyRequests(); }, [fetchMyRequests]);

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      // First resolve the YouTube URL
      const metaRes = await apiClient.get(`/dj/youtube/resolve?url=${encodeURIComponent(url)}`);
      const meta = metaRes.data;
      // Submit request
      await apiClient.post(`/dj/${eventId}/requests`, {
        videoId: meta.videoId,
        title: meta.title,
        thumbnail: meta.thumbnail,
        channel: meta.channel,
        duration: meta.duration,
      });
      setUrl('');
      setSuccess('Request submitted!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchMyRequests();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (requestId: string) => {
    try {
      await apiClient.post(`/dj/${eventId}/requests/${requestId}/vote`);
      await fetchMyRequests();
    } catch {
      // ignore
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600/20 text-yellow-400';
      case 'approved': return 'bg-green-600/20 text-green-400';
      case 'rejected': return 'bg-red-600/20 text-red-400';
      default: return 'bg-white/10 text-white/40';
    }
  };

  return (
    <div className="glass-panel rounded-xl p-3 w-72">
      <h3 className="text-sm font-semibold text-white/90 mb-2 flex items-center gap-2">
        <Music size={14} className="text-purple-400" />
        Request Song
      </h3>

      {/* Submit */}
      <div className="flex gap-1.5 mb-2">
        <input
          type="text"
          placeholder="YouTube URL..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !url.trim()}
          className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-xs transition-colors"
        >
          <Send size={12} />
        </button>
      </div>
      {error && <p className="text-red-400 text-[10px] mb-1">{error}</p>}
      {success && <p className="text-green-400 text-[10px] mb-1">{success}</p>}

      {/* My Requests */}
      {myRequests.length > 0 && (
        <>
          <h4 className="text-[10px] text-white/40 uppercase tracking-wider mt-2 mb-1">My Requests</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {myRequests.map(req => (
              <div key={req.id} className="flex items-center gap-2 py-1 text-xs">
                <span className="text-white/70 truncate flex-1">{req.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getStatusBadge(req.status)}`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

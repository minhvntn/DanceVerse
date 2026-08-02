import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../../services/apiClient';
import { Plus, Trash2, GripVertical, Music, ExternalLink } from 'lucide-react';

interface PlaylistItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string | null;
  channel: string | null;
  duration: number | null;
  order: number;
  notes: string | null;
  isPlayed: boolean;
}

interface Props {
  eventId: string;
  onPlayNow?: (item: PlaylistItem) => void;
  isLive?: boolean;
}

export const PlaylistManager: React.FC<Props> = ({ eventId, onPlayNow, isLive }) => {
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const fetchPlaylist = useCallback(async () => {
    try {
      const res = await apiClient.get(`/dj/${eventId}/playlist`);
      setPlaylist(res.data);
    } catch {
      // ignore
    }
  }, [eventId]);

  useEffect(() => { fetchPlaylist(); }, [fetchPlaylist]);

  const handleAddSong = async () => {
    if (!youtubeUrl.trim()) return;
    setLoading(true);
    setError('');
    try {
      const metaRes = await apiClient.get(`/dj/youtube/resolve?url=${encodeURIComponent(youtubeUrl)}`);
      const meta = metaRes.data;
      await apiClient.post(`/dj/${eventId}/playlist`, {
        videoId: meta.videoId,
        title: meta.title,
        thumbnail: meta.thumbnail,
        channel: meta.channel,
        duration: meta.duration,
      });
      setYoutubeUrl('');
      await fetchPlaylist();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to add song');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await apiClient.delete(`/dj/${eventId}/playlist/${itemId}`);
      await fetchPlaylist();
    } catch {
      // ignore
    }
  };

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const items = [...playlist];
    const dragged = items.splice(dragItem.current, 1)[0];
    items.splice(dragOverItem.current, 0, dragged);
    dragItem.current = null;
    dragOverItem.current = null;
    setPlaylist(items);

    setSaveStatus('saving');
    try {
      await apiClient.put(`/dj/${eventId}/playlist/order`, {
        orderedIds: items.map(i => i.id)
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1500);
    } catch {
      setSaveStatus('idle');
      await fetchPlaylist(); // revert
    }
  };

  const formatDuration = (sec: number | null) => {
    if (!sec) return '--:--';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
          <Music size={16} className="text-purple-400" />
          Playlist ({playlist.length})
        </h3>
        <span className="text-xs text-white/40">
          {saveStatus === 'saving' && 'Saving...'}
          {saveStatus === 'saved' && '✓ Saved'}
        </span>
      </div>

      {/* Add Song */}
      <div className="p-3 border-b border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Paste YouTube URL..."
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddSong()}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={handleAddSong}
            disabled={loading || !youtubeUrl.trim()}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
          >
            <Plus size={14} />
            {loading ? '...' : 'Add'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      </div>

      {/* Playlist Items */}
      <div className="flex-1 overflow-y-auto">
        {playlist.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/30 text-sm">
            <Music size={32} className="mb-2 opacity-40" />
            <p>No songs yet</p>
            <p className="text-xs">Paste a YouTube URL above</p>
          </div>
        )}
        {playlist.map((item, index) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={e => e.preventDefault()}
            className={`flex items-center gap-2 px-3 py-2 border-b border-white/5 hover:bg-white/5 transition-colors cursor-grab active:cursor-grabbing group ${item.isPlayed ? 'opacity-40' : ''}`}
          >
            <GripVertical size={14} className="text-white/20 group-hover:text-white/50 flex-shrink-0" />
            <span className="text-xs text-white/30 w-5 text-right flex-shrink-0">{index + 1}</span>
            {item.thumbnail && (
              <img
                src={item.thumbnail}
                alt=""
                className="w-10 h-7 rounded object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/90 truncate">{item.title}</p>
              <p className="text-xs text-white/40 truncate">{item.channel} · {formatDuration(item.duration)}</p>
              {item.notes && (
                <p className="text-xs text-yellow-400/70 mt-0.5 truncate">📝 {item.notes}</p>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isLive && onPlayNow && (
                <button
                  onClick={() => onPlayNow(item)}
                  className="p-1 hover:bg-purple-600/30 rounded text-purple-400 text-xs"
                  title="Play Now"
                >
                  ▶
                </button>
              )}
              <button
                onClick={() => {
                  setEditingNote(editingNote === item.id ? null : item.id);
                  setNoteText(item.notes || '');
                }}
                className="p-1 hover:bg-white/10 rounded text-white/40 text-xs"
                title="Add Note"
              >
                📝
              </button>
              <button
                onClick={() => handleRemove(item.id)}
                className="p-1 hover:bg-red-600/30 rounded text-red-400"
                title="Remove"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useRoomStore } from '../../stores/useRoomStore';
import { socketService } from '../../services/socket.service';
import { SOCKET_EVENTS } from '../../types';
import {
  Music2,
  X,
  Play,
  Trash2,
  ArrowUp,
  ArrowDown,
  Plus,
  Radio
} from 'lucide-react';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  hostToken?: string;
  isHost: boolean;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  roomId,
  hostToken,
  isHost
}) => {
  const { playlist, musicState } = useRoomStore();

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

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

  const handleRemoveTrack = (itemId: string) => {
    if (!hostToken) return;
    const socket = socketService.getSocket();
    socket.emit(SOCKET_EVENTS.HOST_PLAYLIST_REMOVE, {
      roomId,
      hostToken,
      itemId
    });
  };

  const handlePlaySong = (itemId: string) => {
    if (!isHost || !hostToken) return;
    const socket = socketService.getSocket();
    socket.emit(SOCKET_EVENTS.HOST_MUSIC_PLAY, {
      roomId,
      hostToken,
      itemId
    });
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (!hostToken) return;
    if (toIndex < 0 || toIndex >= playlist.length) return;

    const updated = [...playlist];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    const newOrderIds = updated.map((item) => item.id);
    const socket = socketService.getSocket();
    socket.emit(SOCKET_EVENTS.HOST_PLAYLIST_REORDER, {
      roomId,
      hostToken,
      newOrder: newOrderIds
    });
  };

  const handleClearPlaylist = () => {
    if (!hostToken || !window.confirm('Clear all songs from the playlist?')) return;
    const socket = socketService.getSocket();
    socket.emit(SOCKET_EVENTS.HOST_PLAYLIST_CLEAR, { roomId, hostToken });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="w-full max-w-lg max-h-[85vh] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950/80 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-neon-blue" />
            <h3 className="text-base font-black text-white">
              Concert Playlist ({playlist.length})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Playlist List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {playlist.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No tracks in playlist. {isHost ? 'Add YouTube links below!' : 'Waiting for Host to add songs.'}
            </div>
          ) : (
            playlist.map((item, index) => {
              const isCurrent = item.id === (musicState?.currentItemId || musicState?.trackId || musicState?.currentTrackId);
              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isCurrent
                      ? 'bg-neon-pink/15 border-neon-pink shadow-lg shadow-neon-pink/10'
                      : 'bg-slate-950/60 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isCurrent
                          ? 'bg-neon-pink text-white animate-pulse'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Radio className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>{item.source === 'youtube' ? 'YouTube Video' : 'Default MP3'}</span>
                        {item.addedBy && <span>• Added by {item.addedBy}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Host actions */}
                  {isHost && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePlaySong(item.id)}
                        className="px-2 py-1 rounded-lg bg-neon-pink/20 hover:bg-neon-pink/40 border border-neon-pink/40 text-neon-pink text-[10px] font-bold flex items-center gap-1"
                        title="Play Now"
                      >
                        <Play className="w-3 h-3" />
                        <span>Play</span>
                      </button>
                      <button
                        onClick={() => handleReorder(index, index - 1)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Up"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReorder(index, index + 1)}
                        disabled={index === playlist.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Move Down"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveTrack(item.id)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-200 hover:bg-rose-500/20"
                        title="Remove Song"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Host Add Track Footer */}
        {isHost && (
          <div className="p-4 bg-slate-950/90 border-t border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neon-blue uppercase tracking-wider">
                Add Song to Concert
              </span>
              {playlist.length > 0 && (
                <button
                  onClick={handleClearPlaylist}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Clear Playlist
                </button>
              )}
            </div>

            <form onSubmit={handleAddTrack} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Paste YouTube Link (e.g. https://youtu.be/...)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-neon-blue"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-neon-blue to-neon-purple text-white font-bold rounded-xl text-xs flex items-center gap-1 shrink-0 shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                placeholder="Custom Song Title (Optional)"
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-white text-xs focus:outline-none focus:border-neon-blue"
              />
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

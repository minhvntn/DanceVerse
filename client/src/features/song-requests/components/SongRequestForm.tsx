import React, { useState } from 'react';
import { useRoomStore } from '../../../stores/useRoomStore';
import { socketService } from '../../../services/socket.service';
import { SOCKET_EVENTS } from '../../../types';
import { Youtube, MessageSquare, Send } from 'lucide-react';

interface SongRequestFormProps {
  onClose: () => void;
}

export const SongRequestForm: React.FC<SongRequestFormProps> = ({ onClose }) => {
  const [url, setUrl] = useState('');
  const [message, setMessage] = useState('');
  const { currentRoom } = useRoomStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRoom || !url.trim()) return;

    socketService.getSocket().emit(SOCKET_EVENTS.SONG_REQUEST_CREATE, {
      roomId: currentRoom.id,
      url: url.trim(),
      message: message.trim()
    });
    
    setUrl('');
    setMessage('');
    onClose();
  };

  return (
    <div className="bg-slate-950/50 p-6 rounded-xl border border-white/10 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-neon-pink/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      
      <div className="text-center mb-6 relative">
        <div className="w-12 h-12 bg-gradient-to-tr from-neon-pink to-neon-purple rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-neon-pink/20">
          <Youtube className="w-6 h-6 text-white" />
        </div>
        <h4 className="text-lg font-black text-white">Request a Song</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Paste a YouTube link to add it to the queue. Songs will play after the DJ approves them!
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-widest pl-1">
            YouTube URL <span className="text-neon-pink">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Youtube className="w-4 h-4 text-slate-500" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              required
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all placeholder:text-slate-600 text-sm"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-widest pl-1 flex justify-between">
            <span>Message <span className="text-slate-500 normal-case tracking-normal">(Optional)</span></span>
            <span className={`text-[10px] ${message.length > 100 ? 'text-rose-400' : 'text-slate-500'}`}>
              {message.length}/100
            </span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 pt-3 pointer-events-none">
              <MessageSquare className="w-4 h-4 text-slate-500" />
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please play this next! 🎉"
              maxLength={100}
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-neon-pink focus:ring-1 focus:ring-neon-pink transition-all placeholder:text-slate-600 text-sm resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={!url.trim() || message.length > 100}
          className="w-full bg-gradient-to-r from-neon-pink to-neon-purple text-white font-black py-3 rounded-xl shadow-lg shadow-neon-pink/20 hover:shadow-neon-pink/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 group"
        >
          <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          Submit Request
        </button>
      </form>
    </div>
  );
};

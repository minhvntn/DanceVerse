import React, { useState } from 'react';
import { SOCKET_EVENTS } from '../../types';
import { socketService } from '../../services/socket.service';
import { Smile, Sparkles, RefreshCw } from 'lucide-react';

interface EmoteBarProps {
  onEmoteTrigger: (emote: string) => void;
  onCameraReset: () => void;
  onOpenMinigame: () => void;
}

const EMOTES = ['😂', '❤️', '🔥', '👏', '🎉', '😮'];

export const EmoteBar: React.FC<EmoteBarProps> = ({
  onEmoteTrigger,
  onCameraReset,
  onOpenMinigame
}) => {
  const [cooldown, setCooldown] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleEmote = (em: string) => {
    if (cooldown) return;
    onEmoteTrigger(em);
    socketService.emit(SOCKET_EVENTS.PLAYER_EMOTE, { emote: em });
    setCooldown(true);
    setTimeout(() => {
      setCooldown(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
      {/* Emote Panel (Expanded) */}
      {isOpen && (
        <div className="flex items-center gap-1.5 p-2 glass-panel rounded-2xl border border-white/10 shadow-2xl animate-fade-in">
          {EMOTES.map((em) => (
            <button
              key={em}
              onClick={() => handleEmote(em)}
              disabled={cooldown}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xl border border-slate-700 hover:border-neon-pink transform hover:scale-110 active:scale-95 transition-all disabled:opacity-40"
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {/* Main Action Buttons */}
      <div className="flex items-center gap-2">
        {/* Beat Drop Mini-Game Button */}
        <button
          onClick={onOpenMinigame}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-neon-pink to-purple-600 hover:from-neon-pink/90 hover:to-purple-500 text-white font-extrabold shadow-lg shadow-neon-pink/30 transform hover:scale-105 active:scale-95 transition-all"
        >
          <Sparkles className="w-4 h-4 text-yellow-300 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Beat Drop</span>
        </button>

        {/* Emote Toggle Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`p-2.5 rounded-xl border transition-all ${
            isOpen
              ? 'bg-neon-pink text-white border-neon-pink shadow-lg shadow-neon-pink/30'
              : 'bg-slate-900/80 text-slate-200 border-white/10 hover:bg-slate-800'
          }`}
          title="Emote Bubbles"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Camera Reset Button */}
        <button
          onClick={onCameraReset}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/10 transition-all"
          title="Reset Camera"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { Flame } from 'lucide-react';

export const RhythmHUD: React.FC = () => {
  const { combo, score, rhythmFeedback } = usePlayerStore();
  const rhythmMode = useRoomStore((state) => state.rhythmMode);
  const [activeFeedback, setActiveFeedback] = useState<{ rating: string; id: number } | null>(null);

  useEffect(() => {
    if (rhythmFeedback) {
      const id = Date.now();
      setActiveFeedback({ rating: rhythmFeedback.rating, id });
      const timer = setTimeout(() => {
        setActiveFeedback((prev) => (prev?.id === id ? null : prev));
      }, 500); // Fast fade out
      return () => clearTimeout(timer);
    }
  }, [rhythmFeedback]);

  if (!rhythmMode) return null;

  const getFeedbackColor = (rating: string) => {
    switch (rating) {
      case 'perfect': return 'text-neon-pink shadow-neon-pink drop-shadow-[0_0_15px_rgba(255,43,155,0.8)]';
      case 'great': return 'text-neon-blue shadow-neon-blue drop-shadow-[0_0_10px_rgba(0,240,255,0.6)]';
      case 'good': return 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]';
      case 'miss': return 'text-red-500/80';
      default: return 'text-white';
    }
  };

  const getFeedbackSize = (rating: string) => {
    switch (rating) {
      case 'perfect': return 'text-6xl tracking-widest scale-110';
      case 'great': return 'text-5xl tracking-wide scale-100';
      case 'good': return 'text-3xl scale-95';
      case 'miss': return 'text-2xl scale-90 opacity-70';
      default: return 'text-2xl';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col items-center justify-center pt-32">
      {/* Dynamic Feedback Text (Center) */}
      <div className="h-32 flex items-center justify-center">
        {activeFeedback && (
          <div
            key={activeFeedback.id}
            className={`font-black uppercase italic animate-pop-in ${getFeedbackColor(activeFeedback.rating)} ${getFeedbackSize(activeFeedback.rating)}`}
            style={{ WebkitTextStroke: activeFeedback.rating !== 'miss' ? '2px rgba(255,255,255,0.8)' : 'none' }}
          >
            {activeFeedback.rating}
          </div>
        )}
      </div>

      {/* Combo Display */}
      {combo > 2 && (
        <div className={`mt-4 flex items-center gap-2 animate-bounce ${combo >= 25 ? 'text-neon-pink drop-shadow-[0_0_15px_rgba(255,43,155,0.8)]' : combo >= 10 ? 'text-neon-blue drop-shadow-[0_0_10px_rgba(0,240,255,0.6)]' : 'text-white'}`}>
          <Flame size={combo >= 25 ? 40 : 28} className={combo >= 25 ? 'animate-pulse' : ''} />
          <span className={`font-black italic ${combo >= 25 ? 'text-5xl' : 'text-4xl'}`}>
            {combo} COMBO
          </span>
        </div>
      )}

      {/* Score Tracker (Top Right) */}
      <div className="fixed top-24 right-6 bg-black/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 flex flex-col items-end">
        <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Score</span>
        <span className="text-2xl font-black text-white font-mono">
          {score.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

import React, { useEffect } from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { Trophy } from 'lucide-react';

interface ResultScreenProps {
  onClose: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({ onClose }) => {
  const { score, maxCombo, perfectHits, greatHits, goodHits, missHits, resetRhythmStats, currentPair } = usePlayerStore();

  const totalHits = perfectHits + greatHits + goodHits + missHits;
  const accuracy = totalHits > 0 ? ((perfectHits + greatHits * 0.8 + goodHits * 0.5) / totalHits) * 100 : 0;
  
  let rank = 'C';
  if (accuracy >= 95 && missHits === 0) rank = 'S';
  else if (accuracy >= 85) rank = 'A';
  else if (accuracy >= 70) rank = 'B';

  useEffect(() => {
    const timer = setTimeout(() => {
      resetRhythmStats();
      onClose();
    }, 6000); // show for 6 seconds
    return () => clearTimeout(timer);
  }, [onClose, resetRhythmStats]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-white/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(0,240,255,0.3)] animate-slide-up text-center">
        
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-gradient-to-tr from-neon-pink to-neon-purple rounded-full flex items-center justify-center shadow-lg border-4 border-slate-900">
          <Trophy className="w-12 h-12 text-white" />
        </div>

        <h2 className="mt-8 text-3xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 uppercase tracking-widest">
          Song Complete
        </h2>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col">
            <span className="text-slate-400 text-sm font-bold uppercase tracking-widest">Score</span>
            <span className="text-5xl font-black text-neon-blue font-mono drop-shadow-[0_0_10px_rgba(0,240,255,0.6)]">
              {score.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center bg-slate-950/50 p-4 rounded-xl border border-white/5">
            <div className="flex flex-col items-center">
              <span className="text-slate-500 text-xs font-bold uppercase">Max Combo</span>
              <span className="text-2xl font-black text-white">{maxCombo}</span>
            </div>
            
            <div className="flex flex-col items-center">
              <span className="text-slate-500 text-xs font-bold uppercase">Rank</span>
              <span className={`text-4xl font-black ${
                rank === 'S' ? 'text-neon-pink drop-shadow-[0_0_15px_rgba(255,43,155,0.8)]' :
                rank === 'A' ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]' :
                rank === 'B' ? 'text-green-400' : 'text-slate-300'
              }`}>{rank}</span>
            </div>
          </div>

          {currentPair && (
            <div className="text-neon-pink font-bold uppercase tracking-widest text-sm animate-pulse">
              Duo Dance Complete!
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm font-bold mt-2">
            <div className="flex justify-between bg-slate-800/50 px-4 py-2 rounded-lg">
              <span className="text-neon-pink">PERFECT</span>
              <span className="text-white">{perfectHits}</span>
            </div>
            <div className="flex justify-between bg-slate-800/50 px-4 py-2 rounded-lg">
              <span className="text-neon-blue">GREAT</span>
              <span className="text-white">{greatHits}</span>
            </div>
            <div className="flex justify-between bg-slate-800/50 px-4 py-2 rounded-lg">
              <span className="text-green-400">GOOD</span>
              <span className="text-white">{goodHits}</span>
            </div>
            <div className="flex justify-between bg-slate-800/50 px-4 py-2 rounded-lg">
              <span className="text-red-400">MISS</span>
              <span className="text-white">{missHits}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => { resetRhythmStats(); onClose(); }}
          className="mt-8 w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

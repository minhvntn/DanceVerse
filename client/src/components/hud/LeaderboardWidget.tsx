import React, { useState } from 'react';
import { useRoomStore } from '../../stores/useRoomStore';
import { Trophy, ChevronDown, ChevronUp } from 'lucide-react';

export const LeaderboardWidget: React.FC = () => {
  const leaderboard = useRoomStore((state) => state.leaderboard);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const topFive = leaderboard.slice(0, 5);

  return (
    <div className="fixed top-20 left-4 z-40 w-56 glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-xl transition-all">
      {/* Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between px-3.5 py-2 bg-slate-900/85 cursor-pointer hover:bg-slate-800/80 transition-colors border-b border-white/10"
      >
        <div className="flex items-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-yellow-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Top Dancers
          </span>
        </div>
        <button className="text-slate-400 hover:text-white">
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="flex flex-col gap-1 p-2.5 bg-slate-950/40 text-xs">
          {topFive.length === 0 ? (
            <p className="text-slate-500 italic text-center py-2">No scores yet</p>
          ) : (
            topFive.map((entry, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-900/40 border border-white/5"
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className={`font-extrabold w-4 text-center ${
                      idx === 0
                        ? 'text-yellow-400'
                        : idx === 1
                        ? 'text-slate-300'
                        : idx === 2
                        ? 'text-amber-600'
                        : 'text-slate-500'
                    }`}
                  >
                    {idx + 1}.
                  </span>
                  <span className="font-bold text-white truncate">{entry.nickname}</span>
                </div>
                <span className="font-mono font-bold text-neon-green ml-2">
                  {entry.score.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useRoomStore } from '../../stores/useRoomStore';
import { Sparkles } from 'lucide-react';

export const EnergyMeter: React.FC = () => {
  const energy = useRoomStore((state) => state.energy);
  
  // Calculate level and color based on energy
  let level = 1;
  let colorClass = 'from-blue-500 to-cyan-400';
  
  if (energy > 80) {
    level = 5;
    colorClass = 'from-rose-500 to-pink-500 animate-pulse';
  } else if (energy > 60) {
    level = 4;
    colorClass = 'from-purple-500 to-fuchsia-500';
  } else if (energy > 40) {
    level = 3;
    colorClass = 'from-emerald-500 to-teal-400';
  } else if (energy > 20) {
    level = 2;
    colorClass = 'from-yellow-400 to-orange-500';
  }

  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 z-40">
      {/* Level Indicator */}
      <div className="bg-black/60 backdrop-blur-md rounded-full w-12 h-12 flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
        <div className="flex flex-col items-center">
          <span className="text-[10px] text-white/70 uppercase tracking-widest font-semibold mt-1">LVL</span>
          <span className="text-xl font-bold text-white leading-none mb-1">{level}</span>
        </div>
      </div>

      {/* Energy Bar */}
      <div className="h-64 w-4 bg-black/50 backdrop-blur-md rounded-full border border-white/10 overflow-hidden relative shadow-inner">
        {/* Fill */}
        <div 
          className={`absolute bottom-0 w-full rounded-full bg-gradient-to-t ${colorClass} transition-all duration-500 ease-out`}
          style={{ height: `${Math.max(5, energy)}%` }}
        >
          {/* Inner highlight */}
          <div className="absolute inset-0 bg-white/20 w-1/2 rounded-full"></div>
        </div>
        
        {/* Tick marks */}
        <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
          {[100, 80, 60, 40, 20, 0].map((tick) => (
            <div key={tick} className="w-full flex items-center">
              <div className="w-1.5 h-[1px] bg-white/30"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Icon */}
      <div className={`p-2 rounded-full ${energy > 80 ? 'bg-pink-500/20 text-pink-400' : 'bg-white/10 text-white/50'}`}>
        <Sparkles size={20} className={energy > 80 ? 'animate-spin-slow' : ''} />
      </div>
    </div>
  );
};

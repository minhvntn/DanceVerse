import React from 'react';
import { TimingBall } from './TimingBall';
import { HitZone } from './HitZone';

interface TimingBarProps {
  progress: number;
  hitCenter: number;
  goodWidthPercent: number;
  perfectWidthPercent: number;
  perfectMaxWidthPercent: number;
  isFeverActive?: boolean;
  isReadyToHit?: boolean;
  judged?: boolean;
}

export const TimingBar: React.FC<TimingBarProps> = ({
  progress,
  hitCenter,
  goodWidthPercent,
  perfectWidthPercent,
  perfectMaxWidthPercent,
  isFeverActive,
  isReadyToHit,
  judged,
}) => {
  return (
    <div className="w-full max-w-xl mb-2 md:mb-3 px-2 relative">
      {/* Outer Track Rail Frame */}
      <div className="w-full h-5 md:h-6 bg-slate-950/90 rounded-full relative border-2 border-slate-700/80 shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),0_0_15px_rgba(0,0,0,0.5)] flex items-center overflow-visible">
        
        {/* Glowing Center Line / Groove (●────────◎) */}
        <div className="absolute inset-x-2 h-1 bg-slate-800 rounded-full overflow-hidden">
          {/* Subtle Progress Fill Groove */}
          <div 
            className={`h-full opacity-40 transition-none ${
              isFeverActive 
                ? 'bg-gradient-to-r from-neon-pink to-rose-400' 
                : 'bg-gradient-to-r from-neon-blue via-neon-cyan to-white'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
          />
        </div>

        {/* Start Point Marker (● START) */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-500/80 border border-white/40" />
          <span className="absolute -bottom-4 text-[8px] font-bold text-slate-500 tracking-wider">START</span>
        </div>

        {/* Quarter Beat / Subdivision Tick Marks along the rail */}
        <div className="absolute left-[25%] top-1/2 -translate-y-1/2 w-0.5 h-2 bg-slate-700/80" />
        <div className="absolute left-[50%] top-1/2 -translate-y-1/2 w-0.5 h-3 bg-slate-600/80" />
        <div className="absolute left-[75%] top-1/2 -translate-y-1/2 w-0.5 h-2 bg-slate-700/80" />

        {/* HIT ZONE Component (◎) */}
        <HitZone
          hitCenter={hitCenter}
          goodWidthPercent={goodWidthPercent}
          perfectWidthPercent={perfectWidthPercent}
          perfectMaxWidthPercent={perfectMaxWidthPercent}
          isReadyToHit={isReadyToHit}
        />

        {/* MOVING TIMING BALL Component (●) */}
        <TimingBall
          progress={progress}
          isFeverActive={isFeverActive}
          judged={judged}
        />
      </div>
    </div>
  );
};

import React from 'react';

interface HitZoneProps {
  hitCenter: number; // 0.90
  goodWidthPercent: number;
  perfectWidthPercent: number;
  perfectMaxWidthPercent: number;
  isReadyToHit?: boolean;
}

export const HitZone: React.FC<HitZoneProps> = ({
  hitCenter,
  goodWidthPercent,
  perfectWidthPercent,
  perfectMaxWidthPercent,
  isReadyToHit,
}) => {
  const leftPercent = hitCenter * 100;

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-20 flex items-center justify-center"
      style={{ left: `${leftPercent}%` }}
    >
      {/* 1. GOOD Zone Tolerance Window (Outer Bracket & Shading) */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-7 rounded border-x-2 border-slate-400/60 bg-slate-800/40 pointer-events-none transition-all duration-200"
        style={{
          width: `${Math.max(goodWidthPercent, 12)}%`,
          minWidth: '56px',
        }}
        title="Good Hit Zone"
      />

      {/* 2. PERFECT Zone Tolerance Window (Middle Bracket & Shading) */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 rounded border-x-2 border-cyan-400/90 bg-cyan-950/30 pointer-events-none transition-all duration-200"
        style={{
          width: `${Math.max(perfectWidthPercent, 6)}%`,
          minWidth: '32px',
        }}
        title="Perfect Hit Zone"
      />

      {/* 3. Central Target Ring (◎ Target Disc / Bullseye) */}
      <div className="relative flex items-center justify-center">
        {/* Pulsing Aura when Ready */}
        {isReadyToHit && (
          <div className="absolute -inset-2.5 rounded-full border border-neon-cyan animate-ping opacity-60 pointer-events-none" />
        )}

        {/* Outer Glowing Ring */}
        <div className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-neon-cyan bg-slate-950/80 backdrop-blur-sm flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.85)]">
          {/* Inner Yellow Target Ring */}
          <div className="w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-yellow-300 flex items-center justify-center shadow-[0_0_8px_rgba(250,204,21,0.9)]">
            {/* Center Bullseye White Dot ◎ */}
            <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,1)]" />
          </div>
        </div>

        {/* Vertical Center Indicator Line */}
        <div className="absolute top-1/2 -translate-y-1/2 w-0.5 h-12 bg-white/80 shadow-[0_0_8px_rgba(255,255,255,1)] pointer-events-none" />
      </div>

      {/* HIT Badge / Label */}
      <div className="absolute -bottom-5 text-[10px] font-black text-neon-cyan tracking-widest uppercase drop-shadow-[0_0_6px_rgba(0,240,255,0.8)]">
        HIT
      </div>
    </div>
  );
};

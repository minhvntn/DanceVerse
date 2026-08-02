import React from 'react';

interface TimingBallProps {
  progress: number; // 0.0 to 1.0
  isFeverActive?: boolean;
  judged?: boolean;
}

export const TimingBall: React.FC<TimingBallProps> = ({ progress, isFeverActive, judged }) => {
  // Clamped percentage: 0% to 100%
  const leftPercent = Math.max(0, Math.min(100, progress * 100));

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-30 pointer-events-none transition-none"
      style={{
        left: `${leftPercent}%`,
      }}
    >
      {/* Dynamic Motion Trail Behind Ball */}
      <div 
        className={`absolute top-1/2 -translate-y-1/2 right-1/2 h-4 w-14 rounded-full pointer-events-none opacity-80 ${
          isFeverActive 
            ? 'bg-gradient-to-l from-neon-pink/90 via-purple-500/40 to-transparent' 
            : 'bg-gradient-to-l from-cyan-400/90 via-blue-500/40 to-transparent'
        }`}
        style={{ filter: 'blur(1px)' }}
      />

      {/* Main Glowing Orb (●) */}
      <div className="relative w-6 h-6 md:w-7 md:h-7 flex items-center justify-center">
        {/* Radiant Ambient Aura */}
        <div 
          className={`absolute -inset-1.5 rounded-full blur-[5px] ${
            isFeverActive 
              ? 'bg-gradient-to-r from-neon-pink to-rose-400 opacity-95 shadow-[0_0_20px_rgba(255,43,155,1)]' 
              : 'bg-gradient-to-r from-neon-cyan to-blue-400 opacity-95 shadow-[0_0_20px_rgba(0,240,255,1)]'
          }`} 
        />
        
        {/* Subtle Pulse ring */}
        <div 
          className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
            isFeverActive ? 'bg-neon-pink' : 'bg-neon-cyan'
          }`} 
        />

        {/* 3D Core Sphere with Sharp White Border and Specular Glint */}
        <div 
          className={`relative w-5 h-5 md:w-6 md:h-6 rounded-full border-2 border-white flex items-center justify-center shadow-2xl ${
            isFeverActive 
              ? 'bg-gradient-to-br from-white via-pink-200 to-rose-600' 
              : 'bg-gradient-to-br from-white via-cyan-100 to-blue-600'
          }`}
        >
          {/* Specular Highlight */}
          <div className="absolute top-0.5 left-1 w-1.5 h-1.5 bg-white rounded-full opacity-90 shadow-sm" />
          
          {/* Inner Core Glow */}
          <div 
            className={`w-2 h-2 rounded-full ${
              isFeverActive ? 'bg-white shadow-[0_0_4px_#fff]' : 'bg-white shadow-[0_0_4px_#fff]'
            }`} 
          />
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useProgress } from '@react-three/drei';
import { Sparkles, Music, Zap, Disc3, Radio } from 'lucide-react';

interface ConcertLoadingScreenProps {
  roomName?: string;
  currentTrackTitle?: string;
  currentTrackArtist?: string;
  isSceneReady: boolean;
  onLoadingComplete?: () => void;
}

const LOADING_HINTS = [
  'Connecting to Live Stage Audio Stream...',
  'Pre-warming Moving Head Lights & Top Truss Rigs...',
  'Compiling Neon LED Floor & Laser Shaders...',
  'Calibrating Concert Speaker Towers & Subwoofers...',
  'Synchronizing Avatar Wardrobes & Emote Animations...',
  'Stage Ready! Entering Concert Arena...',
];

export const ConcertLoadingScreen: React.FC<ConcertLoadingScreenProps> = ({
  roomName = 'DanceVerse Concert Arena',
  currentTrackTitle,
  currentTrackArtist,
  isSceneReady,
  onLoadingComplete,
}) => {
  const { progress: dreiProgress } = useProgress();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [hintIndex, setHintIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Rotate hints periodically
  useEffect(() => {
    const hintInterval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % LOADING_HINTS.length);
    }, 900);
    return () => clearInterval(hintInterval);
  }, []);

  // Smoothly interpolate progress to 100%
  useEffect(() => {
    const startTime = Date.now();
    const minDuration = 1200; // minimum 1.2s to show smooth loading and allow shaders to compile

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const timeRatio = Math.min(1, elapsed / minDuration);

      // Target progress is a blend of asset download progress and scene ready state
      const target = isSceneReady && (dreiProgress >= 100 || dreiProgress === 0)
        ? 100
        : Math.min(95, Math.max(dreiProgress, Math.floor(timeRatio * 90)));

      setDisplayProgress((prev) => {
        if (prev >= 100) return 100;
        const next = prev + (target - prev) * 0.25 + 1.2;
        return Math.min(target, Math.round(next));
      });

      // When ready and reached 100%, start fade-out
      if (isSceneReady && (dreiProgress >= 100 || dreiProgress === 0) && elapsed >= minDuration) {
        setDisplayProgress(100);
        clearInterval(timer);
        setTimeout(() => {
          setIsFading(true);
          setTimeout(() => {
            setIsFinished(true);
            onLoadingComplete?.();
          }, 700); // fade duration
        }, 200);
      }
    }, 40);

    // Absolute fallback: auto-dismiss after 3.8s max
    const fallbackTimer = setTimeout(() => {
      setDisplayProgress(100);
      setIsFading(true);
      setTimeout(() => {
        setIsFinished(true);
        onLoadingComplete?.();
      }, 700);
    }, 3800);

    return () => {
      clearInterval(timer);
      clearTimeout(fallbackTimer);
    };
  }, [isSceneReady, dreiProgress, onLoadingComplete]);

  if (isFinished) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#02040D] text-white transition-opacity duration-700 select-none ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Animated Neon Gradients & Cyberpunk Grid */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-b from-cyan-500/20 via-purple-600/15 to-transparent blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-t from-pink-600/20 via-rose-500/10 to-transparent blur-[100px] rounded-full" />
        
        {/* Subtle Perspective Stage Grid Lines */}
        <div 
          className="absolute inset-x-0 bottom-0 h-1/2 opacity-25"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(0, 240, 255, 0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            transform: 'perspective(500px) rotateX(60deg)',
            transformOrigin: 'bottom',
          }}
        />
      </div>

      {/* Main Center Content Card */}
      <div className="relative z-10 flex flex-col items-center max-w-lg w-full px-6 text-center">
        
        {/* Glowing Live Concert Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-neon-cyan/40 shadow-[0_0_20px_rgba(0,240,255,0.3)] mb-6">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <Radio className="w-4 h-4 text-neon-cyan animate-pulse" />
          <span className="text-xs font-black tracking-widest uppercase text-neon-cyan">
            LIVE STAGE ARENA
          </span>
        </div>

        {/* Center Animated Visualizer Disc / Spotlight Icon */}
        <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
          {/* Rotating Neon Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-neon-cyan/60 animate-[spin_8s_linear_infinite]" />
          <div className="absolute -inset-2 rounded-full border border-neon-pink/40 animate-[spin_12s_linear_infinite_reverse]" />
          
          {/* Center Pulsing Sphere */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-cyan-500 via-purple-600 to-pink-500 p-0.5 shadow-[0_0_30px_rgba(0,240,255,0.7)] flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-full flex items-center justify-center">
              <Disc3 className="w-8 h-8 text-white animate-[spin_3s_linear_infinite]" />
            </div>
          </div>
        </div>

        {/* Room Title */}
        <h1 className="text-2xl md:text-3xl font-black italic tracking-wider text-white uppercase drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] mb-2">
          {roomName}
        </h1>

        {/* Track / Audio Status if available */}
        {currentTrackTitle ? (
          <div className="flex items-center gap-2 text-sm text-purple-300/90 font-medium mb-6">
            <Music className="w-4 h-4 text-neon-pink" />
            <span className="truncate max-w-xs">{currentTrackTitle}</span>
            {currentTrackArtist && <span className="text-slate-400">• {currentTrackArtist}</span>}
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 tracking-wider uppercase mb-6 font-semibold">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span>High-Energy 3D Concert Experience</span>
          </div>
        )}

        {/* Equalizer Sound Waves */}
        <div className="flex items-end justify-center gap-1.5 h-8 mb-6">
          {[40, 75, 100, 60, 90, 45, 80, 100, 70, 50, 85, 60].map((h, i) => (
            <div
              key={i}
              className="w-1.5 bg-gradient-to-t from-cyan-500 via-purple-500 to-neon-pink rounded-full transition-all duration-300"
              style={{
                height: `${Math.max(15, (h * (displayProgress / 100)))}%`,
                animation: `bounce 0.8s ease-in-out infinite alternate ${i * 0.08}s`,
              }}
            />
          ))}
        </div>

        {/* Neon Progress Bar */}
        <div className="w-full bg-slate-900/90 rounded-full h-3 p-0.5 border border-slate-700 shadow-inner relative overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neon-blue via-neon-cyan to-neon-pink transition-all duration-150 relative shadow-[0_0_15px_rgba(0,240,255,0.8)]"
            style={{ width: `${displayProgress}%` }}
          >
            {/* Shimmer light effect across bar */}
            <div className="absolute inset-0 bg-white/25 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Percentage and Dynamic Hint Label */}
        <div className="w-full flex items-center justify-between text-xs font-bold text-slate-400 px-1 mb-2">
          <span className="text-neon-cyan tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-neon-cyan animate-spin" />
            {displayProgress === 100 ? 'READY!' : 'PREPARING STAGE'}
          </span>
          <span className="text-white font-mono text-sm tracking-wider">
            {displayProgress}%
          </span>
        </div>

        {/* Rotating Status Message */}
        <p className="text-xs text-slate-400 font-medium tracking-wide transition-opacity duration-300 min-h-[1.25rem]">
          {LOADING_HINTS[hintIndex]}
        </p>
      </div>
    </div>
  );
};

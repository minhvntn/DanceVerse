import React, { useState } from 'react';

interface SoundUnlockOverlayProps {
  onUnlock: () => void;
  roomName?: string;
}

export const SoundUnlockOverlay: React.FC<SoundUnlockOverlayProps> = ({
  onUnlock,
  roomName = 'Concert Room'
}) => {
  const [unlocked, setUnlocked] = useState(false);

  if (unlocked) {
    return null;
  }

  const handleClick = () => {
    setUnlocked(true);
    onUnlock();
  };

  return (
    <div
      onClick={handleClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md cursor-pointer transition-opacity duration-300 animate-fadeIn"
    >
      <div className="flex flex-col items-center gap-4 p-8 bg-slate-900/90 border border-neon-pink/50 rounded-2xl shadow-2xl max-w-sm text-center transform transition-all hover:scale-105">
        <div className="w-16 h-16 rounded-full bg-neon-pink/20 flex items-center justify-center border border-neon-pink animate-pulse">
          <span className="text-3xl">🎵</span>
        </div>
        <div>
          <h3 className="text-xl font-black text-white tracking-wide mb-1">
            {roomName}
          </h3>
          <p className="text-sm text-slate-300">
            Tham gia Concert — Nhấn để bật âm thanh & bắt đầu trải nghiệm!
          </p>
        </div>
        <button
          onClick={handleClick}
          className="mt-2 px-6 py-3 bg-gradient-to-r from-neon-pink to-neon-purple text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          START CONCERT
        </button>
      </div>
    </div>
  );
};

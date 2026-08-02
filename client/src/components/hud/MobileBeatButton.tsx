import React from 'react';
import { useRoomStore } from '../../stores/useRoomStore';

interface MobileBeatButtonProps {
  onHit: () => void;
}

export const MobileBeatButton: React.FC<MobileBeatButtonProps> = ({ onHit }) => {
  const rhythmMode = useRoomStore((state) => state.rhythmMode);

  if (!rhythmMode) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40 md:hidden">
      <button
        onClick={onHit}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-neon-pink to-neon-purple border-4 border-white/20 shadow-[0_0_20px_rgba(255,43,155,0.6)] flex items-center justify-center transform active:scale-90 transition-transform select-none touch-manipulation"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <span className="font-black text-white text-xl tracking-widest italic drop-shadow-md">
          BEAT
        </span>
      </button>
    </div>
  );
};

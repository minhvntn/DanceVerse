import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Zap, Music } from 'lucide-react';

interface MobileControlsProps {
  onJump: () => void;
  onOpenMinigame: () => void;
}

export const MobileControls: React.FC<MobileControlsProps> = ({ onJump, onOpenMinigame }) => {
  const triggerKey = (key: string, isDown: boolean) => {
    const eventType = isDown ? 'keydown' : 'keyup';
    window.dispatchEvent(new KeyboardEvent(eventType, { key, code: key }));
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 hidden max-[1024px]:flex items-end justify-between pointer-events-none">
      {/* Left: Directional D-Pad / Virtual Joystick */}
      <div className="grid grid-cols-3 gap-2 p-2 rounded-2xl glass-panel border border-white/10 pointer-events-auto">
        <div />
        <button
          onTouchStart={() => triggerKey('w', true)}
          onTouchEnd={() => triggerKey('w', false)}
          onMouseDown={() => triggerKey('w', true)}
          onMouseUp={() => triggerKey('w', false)}
          className="w-12 h-12 rounded-xl bg-slate-900/80 active:bg-neon-pink flex items-center justify-center border border-slate-700 text-white"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div />

        <button
          onTouchStart={() => triggerKey('a', true)}
          onTouchEnd={() => triggerKey('a', false)}
          onMouseDown={() => triggerKey('a', true)}
          onMouseUp={() => triggerKey('a', false)}
          className="w-12 h-12 rounded-xl bg-slate-900/80 active:bg-neon-pink flex items-center justify-center border border-slate-700 text-white"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button
          onTouchStart={() => triggerKey('s', true)}
          onTouchEnd={() => triggerKey('s', false)}
          onMouseDown={() => triggerKey('s', true)}
          onMouseUp={() => triggerKey('s', false)}
          className="w-12 h-12 rounded-xl bg-slate-900/80 active:bg-neon-pink flex items-center justify-center border border-slate-700 text-white"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
        <button
          onTouchStart={() => triggerKey('d', true)}
          onTouchEnd={() => triggerKey('d', false)}
          onMouseDown={() => triggerKey('d', true)}
          onMouseUp={() => triggerKey('d', false)}
          className="w-12 h-12 rounded-xl bg-slate-900/80 active:bg-neon-pink flex items-center justify-center border border-slate-700 text-white"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Right: Jump & Action Buttons */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        <button
          onClick={onJump}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-neon-pink to-purple-600 active:scale-95 flex flex-col items-center justify-center shadow-lg shadow-neon-pink/30 border border-white/20 text-white font-extrabold text-xs"
        >
          <Zap className="w-6 h-6 mb-0.5 fill-white" />
          <span>JUMP</span>
        </button>
      </div>
    </div>
  );
};

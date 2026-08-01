import React, { useState } from 'react';
import { DanceAnimationType, SOCKET_EVENTS } from '../../types';
import { socketService } from '../../services/socket.service';

interface DanceActionItem {
  key: string;
  label: string;
  animation: DanceAnimationType;
  icon: string;
}

const ACTIONS: DanceActionItem[] = [
  { key: '1', label: 'Wave', animation: 'Wave', icon: '👋' },
  { key: '2', label: 'HipHop', animation: 'HipHop', icon: '🎧' },
  { key: '3', label: 'Shuffle', animation: 'Shuffle', icon: '🕺' },
  { key: '4', label: 'Moonwalk', animation: 'Moonwalk', icon: '🌙' },
  { key: '5', label: 'Breakdance', animation: 'Breakdance', icon: '🤸' },
  { key: '6', label: 'Jump Dance', animation: 'Jump', icon: '🦘' },
  { key: '7', label: 'Clap', animation: 'Clap', icon: '👏' },
  { key: '8', label: 'Spin', animation: 'Spin', icon: '💫' },
  { key: '9', label: 'Cheer', animation: 'Cheer', icon: '🎉' },
  { key: '0', label: 'Random', animation: 'RandomDance', icon: '🎲' }
];

export const ActionBar: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string>('1');

  const triggerAnimation = (item: DanceActionItem) => {
    setActiveKey(item.key);
    window.dispatchEvent(new CustomEvent('trigger-animation', { detail: item.animation }));
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 hidden min-[1025px]:flex items-center gap-1.5 px-3 py-2 glass-panel rounded-2xl border border-white/10 shadow-2xl">
      {ACTIONS.map((item) => {
        const isSelected = activeKey === item.key;
        return (
          <button
            key={item.key}
            onClick={() => triggerAnimation(item)}
            className={`group relative flex flex-col items-center justify-center w-11 h-12 rounded-xl border transition-all ${
              isSelected
                ? 'bg-purple-900/60 border-neon-pink shadow-md shadow-neon-pink/20 scale-105'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            <span className="text-[10px] font-bold text-slate-300 group-hover:text-white">
              [{item.key}]
            </span>

            {/* Tooltip on hover */}
            <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-slate-900 border border-white/10 text-xs font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
              {item.label}
            </div>
          </button>
        );
      })}
    </div>
  );
};

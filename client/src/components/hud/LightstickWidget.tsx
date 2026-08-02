import React from 'react';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { Sparkles } from 'lucide-react';
import { socketService } from '../../services/socket.service';
import { SOCKET_EVENTS } from '../../types';

export const LightstickWidget: React.FC = () => {
  const { equippedLightstick, lightstickColor, setEquippedLightstick, setLightstickColor } = usePlayerStore();

  const colors = [
    { name: 'Cyan', hex: '#00F0FF' },
    { name: 'Pink', hex: '#FF2B9B' },
    { name: 'Purple', hex: '#7C3AED' },
    { name: 'Blue', hex: '#2563EB' },
    { name: 'White', hex: '#FFFFFF' }
  ];

  const handleWave = () => {
    socketService.emit(SOCKET_EVENTS.PLAYER_ANIMATION, { animation: 'WaveLightstick' });
    window.dispatchEvent(new CustomEvent('trigger-animation', { detail: 'WaveLightstick' }));
  };

  return (
    <div className="fixed bottom-36 right-4 z-40 bg-slate-900/80 backdrop-blur-md border border-white/10 p-3 rounded-xl shadow-2xl flex flex-col gap-3 min-w-[160px]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <Sparkles size={14} className="text-[#00F0FF]" /> Lightstick
        </span>
        <button
          onClick={() => setEquippedLightstick(!equippedLightstick)}
          className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition ${
            equippedLightstick 
              ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' 
              : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
          }`}
        >
          {equippedLightstick ? 'Unequip' : 'Equip'}
        </button>
      </div>

      {equippedLightstick && (
        <>
          <div className="flex gap-1.5 justify-between">
            {colors.map((c) => (
              <button
                key={c.name}
                title={c.name}
                onClick={() => setLightstickColor(c.hex)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  lightstickColor === c.hex ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c.hex, boxShadow: `0 0 8px ${c.hex}80` }}
              />
            ))}
          </div>
          
          <button
            onClick={handleWave}
            className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-bold text-white transition"
          >
            Wave Lightstick
          </button>
        </>
      )}
    </div>
  );
};

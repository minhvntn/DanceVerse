import React from 'react';
import { useRoomStore } from '../../stores/useRoomStore';
import { socketService } from '../../services/socket.service';
import { Zap, Sparkles, Cloud, Flame, Lightbulb, Rainbow, Waves, OctagonX } from 'lucide-react';

const EFFECTS = [
  { id: 'laser', type: 'laser', label: 'Laser', icon: Zap, color: 'from-red-500 to-orange-500' },
  { id: 'co2', type: 'co2', label: 'CO2', icon: Cloud, color: 'from-blue-400 to-cyan-300' },
  { id: 'confetti', type: 'confetti', label: 'Confetti', icon: Sparkles, color: 'from-yellow-400 to-pink-500' },
  { id: 'fireworks', type: 'fireworks', label: 'Fireworks', icon: Flame, color: 'from-orange-500 to-red-600' },
  { id: 'lightstick-pulse', type: 'lightstick', payload: { effect: 'pulse' }, label: 'Pulse', icon: Lightbulb, color: 'from-purple-500 to-pink-500' },
  { id: 'rainbow', type: 'lightstick', payload: { effect: 'rainbow' }, label: 'Rainbow', icon: Rainbow, color: 'from-green-400 to-purple-500' },
  { id: 'crowd-wave', type: 'lightstick', payload: { effect: 'crowd-wave' }, label: 'Wave', icon: Waves, color: 'from-cyan-400 to-blue-600' },
];

const FLOOR_EFFECTS = [
  { id: 'floor-pulse', type: 'floor', payload: { effect: 'pulse' }, label: 'Pulse' },
  { id: 'floor-burst', type: 'floor', payload: { effect: 'burst' }, label: 'Burst' },
  { id: 'floor-chase', type: 'floor', payload: { effect: 'chase' }, label: 'Chase' },
  { id: 'floor-fan', type: 'floor', payload: { effect: 'uplight-fan' }, label: 'Fan Up' },
  { id: 'floor-white', type: 'floor', payload: { effect: 'all-white' }, label: 'White' },
];

const MOVING_LIGHTS_EFFECTS = [
  { id: 'ml-sweep', type: 'moving-light', payload: { preset: 'SWEEP_LEFT_RIGHT' }, label: 'Sweep' },
  { id: 'ml-fan', type: 'moving-light', payload: { preset: 'FAN' }, label: 'Fan' },
  { id: 'ml-cross', type: 'moving-light', payload: { preset: 'CROSS' }, label: 'Cross' },
  { id: 'ml-audience', type: 'moving-light', payload: { preset: 'AUDIENCE_SCAN' }, label: 'Audience' },
  { id: 'ml-dj', type: 'moving-light', payload: { preset: 'DJ_FOCUS' }, label: 'DJ Focus' },
  { id: 'ml-burst', type: 'moving-light', payload: { preset: 'DROP_BURST' }, label: 'Burst' },
];

const PRESETS = [
  { id: 'calm', label: 'CALM', effects: ['lightstick-pulse'], color: 'bg-blue-900/40 border-blue-500/30 text-blue-300' },
  { id: 'hype', label: 'HYPE', effects: ['laser', 'lightstick-pulse', 'co2'], color: 'bg-orange-900/40 border-orange-500/30 text-orange-300' },
  { id: 'drop', label: 'DROP', effects: ['laser', 'co2', 'crowd-wave'], color: 'bg-red-900/40 border-red-500/30 text-red-300' },
  { id: 'finale', label: 'FINALE', effects: ['fireworks', 'confetti', 'rainbow'], color: 'bg-purple-900/40 border-purple-500/30 text-purple-300' },
];

interface Props {
  roomId: string | null;
}

export const StageControlPanel: React.FC<Props> = ({ roomId }) => {
  const hostToken = useRoomStore(s => s.hostToken);

  const triggerEffect = (effectItem: any) => {
    if (!roomId || !hostToken) return;
    const payload = effectItem.payload || {};
    socketService.emit('host:trigger-cue', { 
      roomId, 
      hostToken, 
      cue: { type: effectItem.type, payload, timeSeconds: 0, id: Math.random().toString() } 
    });
  };

  const triggerPreset = (preset: typeof PRESETS[0]) => {
    preset.effects.forEach(eId => {
      const effect = EFFECTS.find(e => e.id === eId);
      if (effect) triggerEffect(effect);
    });
  };

  const emergencyStop = () => {
    if (!roomId || !hostToken) return;
    socketService.emit('stage:emergency-stop', { roomId, hostToken });
  };

  return (
    <div className="glass-panel rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white/90 mb-3 flex items-center gap-2">
        🎆 Stage Controls
      </h3>

      {/* Quick Effects */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {EFFECTS.map(effect => (
          <button
            key={effect.id}
            onClick={() => triggerEffect(effect)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg bg-gradient-to-br ${effect.color} bg-opacity-20 hover:bg-opacity-40 border border-white/10 hover:border-white/20 transition-all text-white/80 hover:text-white hover:scale-105 active:scale-95`}
          >
            <effect.icon size={16} />
            <span className="text-[10px] font-medium">{effect.label}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] text-white/50 py-1 mr-1 uppercase font-bold tracking-widest shrink-0">FLOOR</span>
        {FLOOR_EFFECTS.map(effect => (
          <button
            key={effect.id}
            onClick={() => triggerEffect(effect)}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-white/70 hover:text-white text-[10px] font-bold uppercase tracking-widest shrink-0"
          >
            {effect.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] text-white/50 py-1 mr-1 uppercase font-bold tracking-widest shrink-0">LIGHTS</span>
        {MOVING_LIGHTS_EFFECTS.map(effect => (
          <button
            key={effect.id}
            onClick={() => triggerEffect(effect)}
            className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-800 border border-purple-500/30 text-purple-200 hover:text-white text-[10px] font-bold uppercase tracking-widest shrink-0"
          >
            {effect.label}
          </button>
        ))}
      </div>

      {/* Presets */}
      <div className="flex gap-2 mb-3">
        {PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => triggerPreset(preset)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all hover:scale-[1.02] active:scale-95 ${preset.color}`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Emergency Stop */}
      <button
        onClick={emergencyStop}
        className="w-full py-2 bg-red-900/40 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-800/50 transition-colors flex items-center justify-center gap-2"
      >
        <OctagonX size={14} />
        STOP ALL EFFECTS
      </button>
    </div>
  );
};

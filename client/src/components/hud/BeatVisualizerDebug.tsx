import React, { useEffect, useState } from 'react';
import { BeatClock, BeatState } from '../../game/stage/BeatClock';

export const BeatVisualizerDebug: React.FC = () => {
  const [state, setState] = useState<BeatState>(BeatClock.getState());
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const unsub = BeatClock.subscribe((s) => {
      setState(s);
    });

    const unsubBeat = BeatClock.onBeat(() => {
      setFlash(true);
      setTimeout(() => setFlash(false), 50);
    });

    return () => {
      unsub();
      unsubBeat();
    };
  }, []);

  if (state.isPaused) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/80 border border-white/20 p-4 rounded-xl font-mono text-[10px] text-green-400 pointer-events-none w-48 shadow-lg shadow-black/50">
      <div className="flex justify-between items-center border-b border-white/20 pb-2 mb-2">
        <span className="font-bold">BEAT DEBUG</span>
        <div className={`w-3 h-3 rounded-full transition-colors ${flash ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-slate-700'}`} />
      </div>
      
      <div className="flex justify-between mb-1">
        <span className="text-slate-400">BPM:</span>
        <span className="font-bold text-white">{state.bpm.toFixed(1)}</span>
      </div>
      <div className="flex justify-between mb-1">
        <span className="text-slate-400">Total Beat:</span>
        <span className="font-bold text-white">{state.beatIndex}</span>
      </div>
      <div className="flex justify-between mb-1">
        <span className="text-slate-400">Bar:</span>
        <span className="font-bold text-white">{state.barIndex}</span>
      </div>
      <div className="flex justify-between mb-1">
        <span className="text-slate-400">Beat in Bar:</span>
        <span className="font-bold text-white">{state.beatInBar + 1}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-slate-400">Phase:</span>
        <span className="font-bold text-white">{state.beatPhase.toFixed(2)}</span>
      </div>

      <div className="mt-2 h-1.5 bg-slate-800 rounded overflow-hidden">
        <div 
          className="h-full bg-green-500" 
          style={{ width: `${state.beatPhase * 100}%` }}
        />
      </div>
    </div>
  );
};

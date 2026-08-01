import React from 'react';
import { Camera, Video, MonitorPlay } from 'lucide-react';
import { useRoomStore, CameraMode } from '../../stores/useRoomStore';

export const CameraSwitcherWidget: React.FC = () => {
  const cameraMode = useRoomStore((state) => state.cameraMode);
  const setCameraMode = useRoomStore((state) => state.setCameraMode);

  const MODES: { id: CameraMode; label: string; icon: React.ReactNode }[] = [
    { id: 'player', label: 'Player', icon: <Camera size={16} /> },
    { id: 'concert', label: 'Concert', icon: <Video size={16} /> },
    { id: 'cinematic', label: 'Cinematic', icon: <MonitorPlay size={16} /> },
  ];

  return (
    <div className="fixed top-24 right-4 z-40 flex flex-col gap-1 p-1 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/10 shadow-lg">
      {MODES.map((mode) => {
        const isActive = cameraMode === mode.id;
        return (
          <button
            key={mode.id}
            onClick={() => setCameraMode(mode.id)}
            title={`Switch to ${mode.label} Camera`}
            className={`relative group flex items-center justify-center w-10 h-10 rounded-lg transition-all ${
              isActive 
                ? 'bg-neon-cyan text-slate-900 shadow-[0_0_10px_rgba(0,240,255,0.5)]' 
                : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {mode.icon}
            
            {/* Tooltip */}
            <div className="absolute right-12 px-2 py-1 bg-slate-800 text-white text-xs font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-slate-700">
              {mode.label} Cam
            </div>
          </button>
        );
      })}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useFPSMonitor } from '../../hooks/useFPSMonitor';
import { useRoomStore } from '../../stores/useRoomStore';
import { useGameStore } from '../../stores/useGameStore';
import { socketService } from '../../services/socket.service';

export const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const fps = useFPSMonitor();
  const { players, musicState } = useRoomStore();
  const { performanceMode } = useGameStore();
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        setIsVisible(v => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) return null;

  const playerCount = Object.keys(players).filter(k => !players[k].isNpc).length;
  const npcCount = Object.keys(players).filter(k => players[k].isNpc).length;

  return (
    <div className="absolute top-16 left-4 bg-black/80 text-green-400 font-mono text-xs p-3 rounded border border-green-500/50 z-[100] w-64 pointer-events-none">
      <div className="font-bold border-b border-green-500/30 mb-2 pb-1">DEV DEBUG PANEL</div>
      <div className="flex justify-between"><span>FPS:</span> <span>{fps}</span></div>
      <div className="flex justify-between"><span>Quality:</span> <span>{performanceMode}</span></div>
      <div className="flex justify-between"><span>Real Players:</span> <span>{playerCount}</span></div>
      <div className="flex justify-between"><span>NPCs:</span> <span>{npcCount}</span></div>
      <div className="flex justify-between"><span>Music Status:</span> <span>{musicState?.status || 'idle'}</span></div>
      <div className="flex justify-between"><span>Socket:</span> <span>{socketService.getSocket().connected ? 'CONNECTED' : 'DISCONNECTED'}</span></div>
    </div>
  );
};

import React from 'react';
import { useRoomStore } from '../../stores/useRoomStore';
import { socketService } from '../../services/socket.service';
import { HandMetal, Music, PersonStanding, Sparkles } from 'lucide-react';

export const FanActionBar: React.FC = () => {
  const role = useRoomStore((state) => state.role);
  
  // Fans and Guests can use these, Host already has HostControlPanel
  // but Host can also use FanActionBar if they want.
  
  const handleAction = (action: any) => {
    if (action.type === 'emote') {
      socketService.emit('player:emote', { emote: action.id });
    } else {
      socketService.emit('player:animation', { animation: action.id });
    }
  };

  const actions = [
    { id: 'wave-lightstick', type: 'emote', label: 'Wave', icon: <HandMetal size={20} /> },
    { id: 'Clap', type: 'animation', label: 'Clap', icon: <Sparkles size={20} /> },
    { id: 'Cheer', type: 'animation', label: 'Cheer', icon: <PersonStanding size={20} /> },
    { id: 'Jump', type: 'animation', label: 'Jump', icon: <Music size={20} /> },
  ];

  return (
    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 z-40">
      {actions.map((action) => (
        <button
          key={action.id}
          onClick={() => handleAction(action)}
          className="flex flex-col items-center justify-center w-16 h-16 rounded-xl hover:bg-white/10 transition-colors group relative"
        >
          <div className="text-cyan-400 group-hover:scale-110 transition-transform duration-200">
            {action.icon}
          </div>
          <span className="text-xs text-white/70 mt-1 font-medium">{action.label}</span>
          
          {/* Subtle click effect */}
          <div className="absolute inset-0 rounded-xl bg-white/0 group-active:bg-white/20 transition-colors duration-75 pointer-events-none" />
        </button>
      ))}
    </div>
  );
};

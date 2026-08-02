import React, { useEffect, useState } from 'react';
import { useSocialStore } from '../../stores/useSocialStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { socketService } from '../../services/socket.service';
import { SOCKET_EVENTS } from '../../types';
import { UserPlus, Hand, Heart, Flame, PartyPopper, X, Users, Activity } from 'lucide-react';

export const PlayerInteractionCard: React.FC = () => {
  const { selectedPlayerId, setSelectedPlayerId } = useSocialStore();
  const players = useRoomStore((state) => state.players);
  const myPlayerId = usePlayerStore((state) => state.myPlayerId);
  const [cooldown, setCooldown] = useState(false);

  const selectedPlayer = selectedPlayerId ? players[selectedPlayerId] : undefined;

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedPlayerId(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [setSelectedPlayerId]);

  if (!selectedPlayerId || !selectedPlayer || selectedPlayerId === myPlayerId) return null;

  const handleAction = (actionType: string, payload?: any) => {
    if (cooldown) return;
    setCooldown(true);
    setTimeout(() => setCooldown(false), 1000);

    switch (actionType) {
      case 'wave':
        socketService.emit(SOCKET_EVENTS.SOCIAL_WAVE, { targetPlayerId: selectedPlayerId });
        break;
      case 'friend_request':
        socketService.emit(SOCKET_EVENTS.FRIEND_REQUEST, { targetUserId: selectedPlayerId });
        break;
      case 'party_invite':
        socketService.emit(SOCKET_EVENTS.PARTY_INVITE, { targetPlayerId: selectedPlayerId });
        break;
      case 'pair_invite':
        socketService.emit(SOCKET_EVENTS.PAIR_INVITE, { targetId: selectedPlayerId });
        setSelectedPlayerId(null);
        break;
      case 'reaction':
        socketService.emit(SOCKET_EVENTS.REACTION_SEND, { reaction: payload });
        break;
    }
  };

  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] animate-in fade-in zoom-in duration-200">
      {/* Backdrop for closing */}
      <div 
        className="fixed inset-0" 
        onClick={() => setSelectedPlayerId(null)}
      />
      
      {/* Card Content */}
      <div className="relative bg-slate-950/95 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl shadow-neon-pink/20 min-w-[280px] max-w-sm pointer-events-auto">
        <button 
          onClick={() => setSelectedPlayerId(null)}
          className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-neon-pink to-neon-purple rounded-full mb-3 flex items-center justify-center text-3xl shadow-[0_0_15px_rgba(255,43,155,0.5)]">
            {selectedPlayer.avatarType === 'Robot' ? '🤖' : selectedPlayer.avatarType === 'Boy' ? '🕺' : '💃'}
          </div>
          <h3 className="text-xl font-black text-white text-center">
            {selectedPlayer.nickname}
            {selectedPlayer.isHost && <span className="ml-2 text-yellow-400 text-base">👑</span>}
          </h3>
          <p className="text-sm font-medium text-white/60">
            Level {Math.floor(Math.random() * 20) + 1}
          </p>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-2 mb-6">
          {selectedPlayer.combo !== undefined && (
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                <Activity className="w-4 h-4 text-neon-cyan" />
                Current Combo
              </div>
              <span className="text-lg font-black text-neon-cyan drop-shadow-[0_0_5px_rgba(0,240,255,0.5)]">{selectedPlayer.combo}</span>
            </div>
          )}
          {selectedPlayer.score !== undefined && (
            <div className="flex items-center justify-between px-4 py-2 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 text-sm font-medium text-white/80">
                <Flame className="w-4 h-4 text-neon-pink" />
                Total Score
              </div>
              <span className="text-lg font-black text-neon-pink drop-shadow-[0_0_5px_rgba(255,43,155,0.5)]">{selectedPlayer.score}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button 
            onClick={() => handleAction('friend_request')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/10 hover:bg-neon-pink hover:text-white hover:shadow-[0_0_15px_rgba(255,43,155,0.4)] text-white/90 rounded-xl transition-all font-bold text-sm"
          >
            <UserPlus className="w-4 h-4" /> Add Friend
          </button>
          
          <button 
            onClick={() => handleAction('wave')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/10 hover:bg-neon-cyan hover:text-slate-900 hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] text-white/90 rounded-xl transition-all font-bold text-sm"
          >
            <Hand className="w-4 h-4" /> Wave
          </button>
          
          <button 
            onClick={() => {
              // Stub for actual API call via social handler
              console.log('Follow clicked');
            }}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/10 hover:bg-emerald-400 hover:text-slate-900 hover:shadow-[0_0_15px_rgba(52,211,153,0.4)] text-white/90 rounded-xl transition-all font-bold text-sm"
          >
            <UserPlus className="w-4 h-4" /> Follow
          </button>

          <button 
            onClick={() => handleAction('party_invite')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/10 hover:bg-neon-purple hover:text-white hover:shadow-[0_0_15px_rgba(124,58,237,0.4)] text-white/90 rounded-xl transition-all font-bold text-sm"
          >
            <Users className="w-4 h-4" /> Party
          </button>
          
          <button 
            onClick={() => handleAction('pair_invite')}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-white/10 hover:bg-neon-pink hover:text-white hover:shadow-[0_0_15px_rgba(255,43,155,0.4)] text-white/90 rounded-xl transition-all font-bold text-sm col-span-2"
          >
            <Heart className="w-4 h-4 fill-current" /> Invite to Dance
          </button>
        </div>

        {/* Quick Reactions */}
        <div>
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2 text-center">Quick React</p>
          <div className="flex justify-center gap-2">
            {['❤️', '🔥', '👏', '😍', '🎉'].map((reaction) => (
              <button
                key={reaction}
                onClick={() => handleAction('reaction', reaction)}
                className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/20 rounded-full text-xl transition-all hover:scale-110 active:scale-95"
              >
                {reaction}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

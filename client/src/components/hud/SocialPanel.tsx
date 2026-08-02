import React from 'react';
import { useSocialStore } from '../../stores/useSocialStore';
import { useRoomStore } from '../../stores/useRoomStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { socketService } from '../../services/socket.service';
import { SOCKET_EVENTS } from '../../types';
import { Users, X, UserPlus, Zap, MessageSquare } from 'lucide-react';

export const SocialPanel: React.FC = () => {
  const { showSocialPanel, setShowSocialPanel, onlineFriends, currentParty } = useSocialStore();
  const { myPlayerId, nickname } = usePlayerStore();
  const players = useRoomStore(state => state.players);

  if (!showSocialPanel) return null;

  const handleLeaveParty = () => {
    socketService.emit(SOCKET_EVENTS.PARTY_LEAVE, {});
  };

  const handleGroupDance = () => {
    socketService.emit(SOCKET_EVENTS.GROUP_DANCE_START, { animation: 'RandomDance' });
  };

  return (
    <div className="fixed top-24 right-4 z-40 w-80 max-h-[70vh] bg-slate-950/90 glass-panel rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-neon-cyan" />
          <h2 className="font-bold text-white tracking-wide">SOCIAL</h2>
        </div>
        <button onClick={() => setShowSocialPanel(false)} className="text-slate-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        
        {/* Party Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Party</h3>
            {currentParty && (
              <span className="text-[10px] bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded-full font-bold border border-neon-purple/30">
                {currentParty.members.length}/6
              </span>
            )}
          </div>

          {!currentParty ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-300 mb-3">You are not in a party. Click on players to invite them!</p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {currentParty.members.map((memberId) => {
                const member = players[memberId];
                const isLeader = currentParty.leaderId === memberId;
                const isMe = memberId === myPlayerId;
                
                return (
                  <div key={memberId} className="flex items-center justify-between p-3 border-b border-white/5 last:border-0 bg-slate-900/30 hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-neon-purple to-neon-pink rounded-full flex items-center justify-center text-sm shadow-inner">
                        {member?.avatarType === 'Robot' ? '🤖' : '💃'}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white flex items-center gap-1">
                          {member?.nickname || (isMe ? nickname : 'Unknown')}
                          {isLeader && <span className="text-[10px] text-yellow-400">👑</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              <div className="p-3 bg-slate-900/50 flex flex-col gap-2">
                {currentParty.leaderId === myPlayerId && (
                  <button 
                    onClick={handleGroupDance}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-neon-pink/20 hover:bg-neon-pink text-neon-pink hover:text-white border border-neon-pink/50 rounded-lg text-xs font-bold transition-all shadow-[0_0_10px_rgba(255,43,155,0.2)] hover:shadow-[0_0_15px_rgba(255,43,155,0.6)]"
                  >
                    <Zap className="w-3.5 h-3.5" /> SYNC DANCE
                  </button>
                )}
                <button 
                  onClick={handleLeaveParty}
                  className="w-full py-1.5 bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg text-xs font-medium transition-colors"
                >
                  Leave Party
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Friends Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Online Friends</h3>
            <span className="text-[10px] bg-neon-cyan/20 text-neon-cyan px-2 py-0.5 rounded-full font-bold border border-neon-cyan/30">
              {onlineFriends.length}
            </span>
          </div>

          {onlineFriends.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center flex flex-col items-center">
              <UserPlus className="w-8 h-8 text-slate-500 mb-2 opacity-50" />
              <p className="text-xs text-slate-300">No friends online right now.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {onlineFriends.map(friend => (
                <div key={friend.id} className="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-sm">
                        👤
                      </div>
                      <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${friend.status === 'offline' ? 'bg-slate-500' : 'bg-green-500'}`} />
                    </div>
                    <span className="text-sm font-bold text-white">{friend.nickname}</span>
                  </div>
                  {friend.status !== 'offline' && friend.status !== 'lobby' && (
                    <button className="text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded-md transition-colors">
                      JOIN
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

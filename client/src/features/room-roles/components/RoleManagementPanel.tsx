import React from 'react';
import { useRoomStore } from '../../../stores/useRoomStore';
import { usePlayerStore } from '../../../stores/usePlayerStore';
import { socketService } from '../../../services/socket.service';
import { SOCKET_EVENTS } from '../../../types';
import { Shield, ShieldAlert, User, ShieldCheck } from 'lucide-react';

export const RoleManagementPanel: React.FC = () => {
  const { players, currentRoom, hostToken, role } = useRoomStore();
  const { myPlayerId } = usePlayerStore();

  if (role !== 'host') {
    return (
      <div className="p-6 text-center text-slate-400">
        <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>Only the Host can manage roles.</p>
      </div>
    );
  }

  const handleAssignCohost = (targetPlayerId: string) => {
    if (!currentRoom || !hostToken) return;
    socketService.getSocket().emit(SOCKET_EVENTS.HOST_COHOST_ASSIGN, {
      roomId: currentRoom.id,
      hostToken,
      targetPlayerId
    });
  };

  const handleRemoveCohost = (targetPlayerId: string) => {
    if (!currentRoom || !hostToken) return;
    socketService.getSocket().emit(SOCKET_EVENTS.HOST_COHOST_REMOVE, {
      roomId: currentRoom.id,
      hostToken,
      targetPlayerId
    });
  };

  const sortedPlayers = Object.values(players).sort((a, b) => {
    if (a.role === 'host') return -1;
    if (b.role === 'host') return 1;
    if (a.role === 'co-host' && b.role !== 'co-host') return -1;
    if (b.role === 'co-host' && a.role !== 'co-host') return 1;
    return a.nickname.localeCompare(b.nickname);
  });

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="px-2 py-3 bg-slate-950/50 rounded-xl mb-2 flex items-center justify-between border border-white/5">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-neon-yellow" />
            Room Roles
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Co-hosts can manage music, playlists, and song requests.
          </p>
        </div>
      </div>

      {sortedPlayers.map((p) => {
        const isMe = p.id === myPlayerId;
        const isHost = p.role === 'host';
        const isCohost = p.role === 'co-host';

        return (
          <div
            key={p.id}
            className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
              isHost
                ? 'bg-neon-yellow/10 border-neon-yellow/30'
                : isCohost
                ? 'bg-neon-blue/10 border-neon-blue/30'
                : 'bg-slate-900 border-white/5 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isHost ? 'bg-neon-yellow/20 text-neon-yellow' :
                isCohost ? 'bg-neon-blue/20 text-neon-blue' :
                'bg-slate-800 text-slate-400'
              }`}>
                {isHost ? <Shield className="w-5 h-5" /> :
                 isCohost ? <ShieldCheck className="w-5 h-5" /> :
                 <User className="w-5 h-5" />}
              </div>
              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  {p.nickname}
                  {isMe && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-slate-300 font-normal">You</span>}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${
                  isHost ? 'text-neon-yellow' :
                  isCohost ? 'text-neon-blue' :
                  'text-slate-500'
                }`}>
                  {p.role || 'Guest'}
                </div>
              </div>
            </div>

            {!isHost && !isMe && (
              <div>
                {isCohost ? (
                  <button
                    onClick={() => handleRemoveCohost(p.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 hover:bg-rose-500/40 border border-rose-500/30 transition-colors"
                  >
                    Remove Co-host
                  </button>
                ) : (
                  <button
                    onClick={() => handleAssignCohost(p.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/40 border border-neon-blue/30 transition-colors"
                  >
                    Make Co-host
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

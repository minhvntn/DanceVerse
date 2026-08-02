import React, { useState } from 'react';
import { useRoomStore } from '../../stores/useRoomStore';
import { socketService } from '../../services/socket.service';
import { Search, Shield, ShieldAlert, UserMinus, MessageSquareOff, Crown, Users } from 'lucide-react';

interface AudienceMember {
  id: string;
  nickname: string;
  role?: string;
  avatarType?: string;
}

interface Props {
  roomId: string | null;
  eventId: string;
}

export const AudienceManager: React.FC<Props> = ({ roomId }) => {
  const players = useRoomStore(s => s.players);
  const hostToken = useRoomStore(s => s.hostToken);
  const [search, setSearch] = useState('');

  const playerList: AudienceMember[] = Object.values(players).map(p => ({
    id: p.id,
    nickname: p.nickname,
    role: p.role || (p.isHost ? 'host' : 'guest'),
    avatarType: p.avatarType
  }));

  const filtered = playerList.filter(p =>
    p.nickname.toLowerCase().includes(search.toLowerCase())
  );

  const sortedPlayers = [...filtered].sort((a, b) => {
    const roleOrder: Record<string, number> = { host: 0, 'co-host': 1, moderator: 2, guest: 3 };
    return (roleOrder[a.role || 'guest'] || 3) - (roleOrder[b.role || 'guest'] || 3);
  });

  const kickPlayer = (playerId: string) => {
    if (!roomId || !hostToken) return;
    socketService.emit('host:player:kick', { roomId, hostToken, targetPlayerId: playerId });
  };

  const getRoleIcon = (role: string | undefined) => {
    switch (role) {
      case 'host': return <Crown size={12} className="text-yellow-400" />;
      case 'co-host': return <ShieldAlert size={12} className="text-purple-400" />;
      case 'moderator': return <Shield size={12} className="text-blue-400" />;
      default: return null;
    }
  };

  const getRoleBadge = (role: string | undefined) => {
    switch (role) {
      case 'host': return 'bg-yellow-600/20 text-yellow-400 border-yellow-500/20';
      case 'co-host': return 'bg-purple-600/20 text-purple-400 border-purple-500/20';
      case 'moderator': return 'bg-blue-600/20 text-blue-400 border-blue-500/20';
      default: return '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
          <Users size={16} className="text-blue-400" />
          Audience ({playerList.length})
        </h3>
        {hostToken && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (useRoomStore.getState().currentRoom?.battleState === 'active') {
                  socketService.emit('host:battle:end', { roomId, hostToken });
                } else {
                  socketService.emit('host:battle:start', { roomId, hostToken });
                }
              }}
              className={`px-3 py-1 border rounded text-xs font-bold uppercase transition-colors ${
                useRoomStore.getState().currentRoom?.battleState === 'active' 
                ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' 
                : 'bg-orange-500/20 text-orange-400 border-orange-500/30 hover:bg-orange-500/30'
              }`}
            >
              {useRoomStore.getState().currentRoom?.battleState === 'active' ? 'End Battle' : 'Start Battle'}
            </button>
            <button 
              onClick={() => socketService.emit('host:sync-dance', { roomId, hostToken })}
              className="px-3 py-1 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30 rounded text-xs font-bold uppercase hover:bg-neon-cyan/30 hover:border-neon-cyan transition-colors"
            >
              Sync Dance
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="p-3 border-b border-white/10">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
          />
        </div>
      </div>

      {/* Player List */}
      <div className="flex-1 overflow-y-auto">
        {sortedPlayers.map(player => (
          <div
            key={player.id}
            className="flex items-center gap-3 px-3 py-2 border-b border-white/5 hover:bg-white/5 transition-colors group"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-xs font-bold text-white/70">
              {player.nickname.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                {getRoleIcon(player.role)}
                <span className="text-sm text-white/90 truncate">{player.nickname}</span>
                {player.role && player.role !== 'guest' && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${getRoleBadge(player.role)}`}>
                    {player.role}
                  </span>
                )}
              </div>
            </div>
            {player.role !== 'host' && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {}}
                  className="p-1 hover:bg-yellow-600/30 rounded text-yellow-400"
                  title="Mute"
                >
                  <MessageSquareOff size={12} />
                </button>
                <button
                  onClick={() => kickPlayer(player.id)}
                  className="p-1 hover:bg-red-600/30 rounded text-red-400"
                  title="Kick"
                >
                  <UserMinus size={12} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

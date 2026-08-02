import React, { useEffect, useState } from 'react';
import { socketService } from '../../services/socket.service';
import { SOCKET_EVENTS } from '../../../../shared/events';
import { Heart, Check, X } from 'lucide-react';

interface Invite {
  inviterId: string;
  inviterName: string;
}

export const PairInviteManager: React.FC = () => {
  const [invite, setInvite] = useState<Invite | null>(null);

  useEffect(() => {
    const handleInvite = (payload: Invite) => {
      setInvite(payload);
    };

    socketService.on(SOCKET_EVENTS.PAIR_INVITE, handleInvite);
    return () => {
      socketService.off(SOCKET_EVENTS.PAIR_INVITE, handleInvite);
    };
  }, []);

  useEffect(() => {
    if (invite) {
      const timer = setTimeout(() => {
        setInvite(null); // Auto decline/hide after 15s
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [invite]);

  const handleAccept = () => {
    if (!invite) return;
    socketService.emit(SOCKET_EVENTS.PAIR_INVITE_RESPONSE, { inviterId: invite.inviterId, accept: true });
    setInvite(null);
  };

  const handleDecline = () => {
    if (!invite) return;
    socketService.emit(SOCKET_EVENTS.PAIR_INVITE_RESPONSE, { inviterId: invite.inviterId, accept: false });
    setInvite(null);
  };

  return (
    <>
      {invite && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-auto animate-pop-in"
        >
          <div className="bg-slate-900/90 backdrop-blur-md border border-neon-pink/50 rounded-xl p-4 shadow-2xl flex flex-col items-center gap-3 w-72">
            <div className="flex items-center gap-2 text-neon-pink">
              <Heart className="w-5 h-5 fill-current animate-pulse" />
              <span className="font-bold uppercase tracking-wider text-sm">Dance Invite</span>
            </div>
            
            <p className="text-sm text-slate-200 text-center">
              <strong className="text-white">{invite.inviterName}</strong> wants to couple dance!
            </p>
            
            <div className="flex w-full gap-2 mt-2">
              <button
                onClick={handleDecline}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 font-semibold transition-colors"
              >
                <X className="w-4 h-4" /> Decline
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-neon-pink hover:bg-neon-pink/80 text-white font-bold transition-colors"
              >
                <Check className="w-4 h-4" /> Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

import React, { useEffect, useState } from 'react';
import { socketService } from '../../../services/socket.service';
import { SOCKET_EVENTS, RoomNotification } from '../../../types';
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from 'lucide-react';

export const RoomNotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<RoomNotification[]>([]);

  useEffect(() => {
    const socket = socketService.getSocket();
    
    const handleNotification = (notification: RoomNotification) => {
      setNotifications((prev) => [...prev, notification]);
      
      const duration = notification.duration || 5000;
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      }, duration);
    };

    socket.on(SOCKET_EVENTS.ROOM_NOTIFICATION, handleNotification);
    
    // Auto-dismiss errors that might come through generic ERROR channel
    const handleError = (error: any) => {
      handleNotification({
        id: `err-${Date.now()}`,
        type: 'error',
        title: 'Error',
        message: error.message || 'An unknown error occurred.',
        createdAt: Date.now(),
        duration: 5000
      });
    };
    
    socket.on(SOCKET_EVENTS.ERROR, handleError);

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_NOTIFICATION, handleNotification);
      socket.off(SOCKET_EVENTS.ERROR, handleError);
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {notifications.map((n) => (
        <div
          key={n.id}
          className={`pointer-events-auto flex items-start gap-3 p-3 rounded-xl shadow-lg shadow-black/20 animate-slideInRight backdrop-blur-md border ${
            n.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30' :
            n.type === 'error' ? 'bg-rose-950/80 border-rose-500/30' :
            n.type === 'warning' ? 'bg-amber-950/80 border-amber-500/30' :
            'bg-slate-900/80 border-slate-700'
          }`}
        >
          <div className="shrink-0 mt-0.5">
            {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {n.type === 'error' && <XCircle className="w-5 h-5 text-rose-400" />}
            {n.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {n.type === 'info' && <Info className="w-5 h-5 text-slate-300" />}
          </div>
          <div className="flex-1 min-w-0">
            {n.title && (
              <h5 className={`text-xs font-bold ${
                n.type === 'success' ? 'text-emerald-400' :
                n.type === 'error' ? 'text-rose-400' :
                n.type === 'warning' ? 'text-amber-400' :
                'text-white'
              }`}>
                {n.title}
              </h5>
            )}
            <p className="text-sm text-slate-300 leading-tight mt-0.5">{n.message}</p>
          </div>
          <button
            onClick={() => removeNotification(n.id)}
            className="p-1 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 shrink-0 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

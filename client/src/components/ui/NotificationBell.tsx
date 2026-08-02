import React, { useEffect, useState, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { socketService } from '../../services/socket.service';

interface Notification {
  id: string;
  type: string;
  data: any;
  read: boolean;
  createdAt: string;
}

export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await apiClient.get('/notifications');
      setNotifications(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setNotifications([]);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const socket = socketService.getSocket();
    const handleNewNotif = (payload: any) => {
      fetchNotifications();
    };
    
    socket.on('notification:new', handleNewNotif);
    return () => {
      socket.off('notification:new', handleNewNotif);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => !n.read).length;

  const markAllRead = async () => {
    try {
      await apiClient.post('/notifications/mark-all-read');
      setNotifications(safeNotifications.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const markRead = async (id: string) => {
    try {
      await apiClient.post(`/notifications/${id}/read`);
      setNotifications(safeNotifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-900/80 border border-white/10 hover:border-neon-pink/40 hover:text-white text-slate-300 transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 bg-neon-pink text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg shadow-neon-pink/40">
            {unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-3 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
            <h3 className="font-bold text-white text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-neon-blue hover:text-neon-cyan font-semibold flex items-center gap-1">
                <Check size={12} /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {safeNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No notifications yet
              </div>
            ) : (
              safeNotifications.map(n => (
                <div 
                  key={n.id} 
                  onClick={() => !n.read && markRead(n.id)}
                  className={`p-3 border-b border-white/5 flex gap-3 cursor-pointer transition-colors ${
                    n.read ? 'bg-transparent hover:bg-slate-800/30' : 'bg-neon-purple/5 hover:bg-neon-purple/10'
                  }`}
                >
                  <div className="flex-1">
                    <p className={`text-sm ${n.read ? 'text-slate-300' : 'text-white font-bold'}`}>
                      {n.data.message || 'New notification'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.read && (
                    <div className="w-2 h-2 rounded-full bg-neon-pink mt-1 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

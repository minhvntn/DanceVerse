import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Star, User, X, Share2, Tag } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import { useRoomStore } from '../../stores/useRoomStore';

interface EventDetailModalProps {
  eventId: string;
  onClose: () => void;
  onJoin: (roomId: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({ eventId, onClose, onJoin }) => {
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const [isInterested, setIsInterested] = useState(false);
  
  useEffect(() => {
    apiClient.get(`/events/${eventId}`)
      .then(res => {
        setEvent(res.data);
        setLoading(false);
        // In a real implementation we would also check if the current user has RSVP'd
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [eventId]);

  useEffect(() => {
    if (!event) return;
    const updateCountdown = () => {
      const diff = new Date(event.scheduledAt).getTime() - new Date().getTime();
      if (diff <= 0) {
        if (event.status === 'live') setTimeLeft('LIVE NOW');
        else if (event.status === 'ended') setTimeLeft('ENDED');
        else setTimeLeft('STARTING SOON');
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };
    updateCountdown();
    const int = setInterval(updateCountdown, 1000);
    return () => clearInterval(int);
  }, [event]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="text-white font-bold animate-pulse">Loading Event...</div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-slate-900 border border-rose-500/50 p-8 rounded-3xl text-center">
          <h2 className="text-xl font-bold text-white mb-4">Event Not Found</h2>
          <button onClick={onClose} className="px-6 py-2 bg-slate-800 rounded-full text-white">Close</button>
        </div>
      </div>
    );
  }

  const toggleInterest = async () => {
    try {
      if (isInterested) {
        await apiClient.delete(`/events/${event.id}/rsvp`);
        setEvent({ ...event, _count: { rsvps: event._count.rsvps - 1 } });
      } else {
        await apiClient.post(`/events/${event.id}/rsvp`);
        setEvent({ ...event, _count: { rsvps: event._count.rsvps + 1 } });
      }
      setIsInterested(!isInterested);
    } catch (err) {
      console.error(err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/?event=${event.id}`);
    alert('Link copied to clipboard!');
  };

  const eventDate = new Date(event.scheduledAt);
  const FALLBACK_CONCERT_IMAGES = [
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
  ];
  const coverSrc = event.coverImage || FALLBACK_CONCERT_IMAGES[Math.abs(event.id?.charCodeAt(0) || 0) % FALLBACK_CONCERT_IMAGES.length];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cover */}
        <div className="relative h-48 sm:h-56 w-full bg-slate-800 shrink-0">
          <img 
            src={coverSrc} 
            className="w-full h-full object-cover" 
            alt={event.title || 'Concert cover'} 
            onError={(e) => {
              if (e.currentTarget.src !== FALLBACK_CONCERT_IMAGES[0]) {
                e.currentTarget.src = FALLBACK_CONCERT_IMAGES[0];
              }
            }}
          />
          
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-colors">
            <X size={20} />
          </button>
          
          <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
            <Clock size={16} className="text-neon-cyan" />
            <span className="font-black text-white">{timeLeft}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <h2 className="text-2xl font-black text-white mb-2">{event.title}</h2>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center">
              {event.host.profileImageUrl ? (
                <img src={event.host.profileImageUrl} alt={event.host.displayName} className="w-full h-full object-cover" />
              ) : (
                <User size={20} className="text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-slate-400">Hosted by</p>
              <p className="text-base font-bold text-neon-blue">{event.host.displayName}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">Date</p>
              <p className="text-sm font-bold text-white">{eventDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
              <p className="text-slate-400 text-xs font-bold uppercase mb-1">Time</p>
              <p className="text-sm font-bold text-white">{eventDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-slate-300 text-sm whitespace-pre-wrap">{event.description || 'No description provided.'}</p>
          </div>

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {event.tags.map((tag: string) => (
                <span key={tag} className="flex items-center gap-1 text-xs font-bold text-neon-purple bg-neon-purple/10 px-2 py-1 rounded-lg">
                  <Tag size={12} /> {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-slate-950 border-t border-white/10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleShare}
              className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors"
            >
              <Share2 size={20} />
            </button>
            <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-800/50 rounded-xl text-sm font-bold text-slate-300">
              <Star size={16} className={isInterested ? "text-neon-pink" : "text-slate-500"} />
              {event._count.rsvps}
            </div>
          </div>

          {event.status === 'live' ? (
            <button 
              onClick={() => {
                if (event.roomId) {
                  onJoin(event.roomId);
                  onClose();
                }
              }}
              className="flex-1 bg-neon-purple text-white py-3 px-6 rounded-xl font-black text-sm uppercase tracking-wider hover:brightness-110 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all"
            >
              Join Concert
            </button>
          ) : (
            <button 
              onClick={toggleInterest}
              className={`flex-1 py-3 px-6 rounded-xl font-black text-sm uppercase tracking-wider transition-all border ${
                isInterested 
                  ? 'bg-neon-pink/20 text-neon-pink border-neon-pink/50' 
                  : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'
              }`}
            >
              {isInterested ? 'Interested' : 'Mark Interested'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

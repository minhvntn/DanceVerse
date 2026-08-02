import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Users, Star, User } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface ConcertEvent {
  id: string;
  title: string;
  description: string;
  coverImage?: string;
  tags: string[];
  scheduledAt: string;
  status: string;
  host: {
    id: string;
    displayName: string;
    profileImageUrl?: string;
  };
  _count: {
    rsvps: number;
  };
}

interface Props {
  event: ConcertEvent;
  onJoin?: () => void;
  onView?: () => void;
}

const FALLBACK_CONCERT_IMAGES = [
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&auto=format&fit=crop&q=80',
];

const getEventCoverImage = (event: ConcertEvent): string => {
  if (event.coverImage) return event.coverImage;
  let hash = 0;
  const seed = event.id || event.title;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return FALLBACK_CONCERT_IMAGES[Math.abs(hash) % FALLBACK_CONCERT_IMAGES.length];
};

export const ConcertEventCard: React.FC<Props> = ({ event, onJoin, onView }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isInterested, setIsInterested] = useState(false); // TODO: Sync with actual RSVP status
  const [rsvpCount, setRsvpCount] = useState(event._count.rsvps);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const scheduled = new Date(event.scheduledAt);
      const diff = scheduled.getTime() - now.getTime();

      if (diff <= 0) {
        if (event.status === 'live') {
          setTimeLeft('LIVE NOW');
        } else if (event.status === 'ended') {
          setTimeLeft('ENDED');
        } else {
          setTimeLeft('STARTING SOON');
        }
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [event.scheduledAt, event.status]);

  const toggleInterest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Stub for real API
      if (isInterested) {
        await apiClient.delete(`/events/${event.id}/rsvp`);
        setRsvpCount(c => c - 1);
      } else {
        await apiClient.post(`/events/${event.id}/rsvp`);
        setRsvpCount(c => c + 1);
      }
      setIsInterested(!isInterested);
    } catch (err) {
      console.error(err);
    }
  };

  const eventDate = new Date(event.scheduledAt);
  const formattedDate = eventDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = eventDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  return (
    <div 
      onClick={onView}
      className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden hover:border-neon-pink/40 hover:shadow-[0_0_20px_rgba(255,43,155,0.15)] transition-all cursor-pointer group flex flex-col"
    >
      {/* Cover Image */}
      <div className="h-32 w-full bg-slate-800 relative overflow-hidden flex-shrink-0">
        <img 
          src={getEventCoverImage(event)} 
          alt={event.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          onError={(e) => {
            if (e.currentTarget.src !== FALLBACK_CONCERT_IMAGES[0]) {
              e.currentTarget.src = FALLBACK_CONCERT_IMAGES[0];
            }
          }}
        />
        <div className="absolute top-2 right-2 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1">
          <Clock size={12} className="text-neon-cyan" />
          {timeLeft}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="text-lg font-black text-white mb-1 line-clamp-1">{event.title}</h3>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden">
            {event.host.profileImageUrl ? (
              <img src={event.host.profileImageUrl} alt={event.host.displayName} className="w-full h-full object-cover" />
            ) : (
              <User size={12} className="text-slate-400" />
            )}
          </div>
          <span className="text-xs text-slate-400">Hosted by <span className="text-neon-blue font-bold">{event.host.displayName}</span></span>
        </div>

        <div className="text-sm text-slate-300 mb-4 font-semibold uppercase tracking-wider flex items-center gap-2">
           <Calendar size={14} className="text-purple-400" />
           {formattedDate} • {formattedTime}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <Star size={14} className={isInterested ? "text-neon-pink" : "text-slate-500"} />
            {rsvpCount} Interested
          </div>
          
          <button 
            onClick={toggleInterest}
            className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
              isInterested 
                ? 'bg-neon-pink/20 text-neon-pink border-neon-pink/50' 
                : 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700'
            }`}
          >
            {isInterested ? 'INTERESTED' : 'INTERESTED'}
          </button>
        </div>
      </div>
    </div>
  );
};

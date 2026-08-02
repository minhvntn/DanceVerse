import React from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import { useRoomStore } from '../../stores/useRoomStore';
import { socketService } from '../../services/socket.service';

interface Props {
  roomId: string | null;
}

export const NowPlayingController: React.FC<Props> = ({ roomId }) => {
  const musicState = useRoomStore(s => s.musicState);
  const currentTrack = useRoomStore(s => s.currentTrack);
  const hostToken = useRoomStore(s => s.hostToken);

  const emit = (event: string, extra?: any) => {
    if (!roomId || !hostToken) return;
    socketService.emit(event, {
      roomId,
      hostToken,
      revision: musicState?.revision,
      ...extra
    });
  };

  const handlePlay = () => emit('host:music:resume');
  const handlePause = () => emit('host:music:pause');
  const handleNext = () => emit('host:music:next');
  const handlePrev = () => emit('host:music:previous');

  const isPlaying = musicState?.status === 'playing';

  // Compute elapsed time
  let elapsed = 0;
  if (musicState) {
    if (musicState.status === 'playing' && musicState.startedAt) {
      elapsed = (Date.now() - musicState.startedAt) / 1000 + (musicState.pausedPosition || 0);
    } else {
      elapsed = musicState.pausedPosition || 0;
    }
  }

  const duration = currentTrack?.duration || 0;
  const progress = duration > 0 ? Math.min(elapsed / duration, 1) : 0;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-panel rounded-xl p-4">
      {/* Track Info */}
      <div className="flex items-center gap-3 mb-4">
        {currentTrack?.thumbnailUrl ? (
          <img
            src={currentTrack.thumbnailUrl}
            alt=""
            className="w-16 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-16 h-12 rounded-lg bg-white/5 flex items-center justify-center">
            <Volume2 size={20} className="text-white/20" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {currentTrack?.title || 'No track playing'}
          </p>
          <p className="text-xs text-white/40 truncate">
            {currentTrack?.artist || ''}
          </p>
          <span className={`inline-block mt-0.5 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
            isPlaying ? 'bg-green-600/30 text-green-400' : 'bg-white/10 text-white/40'
          }`}>
            {musicState?.status || 'idle'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/30 mt-1">
          <span>{formatTime(elapsed)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handlePrev}
          className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
        >
          <SkipBack size={18} />
        </button>
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className="p-3 bg-purple-600 hover:bg-purple-500 rounded-full text-white transition-colors shadow-lg shadow-purple-600/30"
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button
          onClick={handleNext}
          className="p-2 hover:bg-white/10 rounded-full text-white/60 hover:text-white transition-colors"
        >
          <SkipForward size={18} />
        </button>
      </div>
    </div>
  );
};

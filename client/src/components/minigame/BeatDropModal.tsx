import React, { useState, useEffect, useRef } from 'react';
import { socketService } from '../../services/socket.service';
import { SOCKET_EVENTS } from '../../types';
import { Sparkles, X, Trophy, Zap, Flame, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BeatDropModalProps {
  onClose: () => void;
  onBeatDropEffect: (active: boolean) => void;
}

interface Note {
  id: string;
  y: number; // 0 (top) to 100 (bottom hit zone is around 85-95)
  hit: boolean;
}

type HitResult = 'Perfect' | 'Great' | 'Good' | 'Miss' | null;

export const BeatDropModal: React.FC<BeatDropModalProps> = ({ onClose, onBeatDropEffect }) => {
  const [countdown, setCountdown] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [totalNotes, setTotalNotes] = useState<number>(0);
  const [hitCount, setHitCount] = useState<number>(0);
  const [lastResult, setLastResult] = useState<HitResult>(null);

  const notesRef = useRef<Note[]>([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setIsPlaying(true);
      onBeatDropEffect(true);
    }
  }, [countdown, onBeatDropEffect]);

  // Note generation interval
  useEffect(() => {
    if (!isPlaying) return;

    const spawnInterval = setInterval(() => {
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random()}`,
        y: 0,
        hit: false
      };
      notesRef.current = [...notesRef.current, newNote];
      setNotes(notesRef.current);
    }, 1200);

    return () => clearInterval(spawnInterval);
  }, [isPlaying]);

  // Note falling game loop
  useEffect(() => {
    if (!isPlaying) return;

    const gameLoop = setInterval(() => {
      notesRef.current = notesRef.current
        .map((n) => ({ ...n, y: n.y + 4.5 }))
        .filter((n) => {
          if (n.y > 105 && !n.hit) {
            // Missed note
            setLastResult('Miss');
            setCombo(0);
            setTotalNotes((t) => t + 1);
            return false;
          }
          return n.y <= 105;
        });
      setNotes(notesRef.current);
    }, 50);

    return () => clearInterval(gameLoop);
  }, [isPlaying]);

  // Spacebar trigger handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleHitNote();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const handleHitNote = () => {
    if (!isPlaying) return;

    // Find the note closest to Hit Zone (around y: 85 - 95)
    let bestNote: Note | null = null;
    let minDiff = 999;

    notesRef.current.forEach((n) => {
      if (!n.hit) {
        const diff = Math.abs(n.y - 90);
        if (diff < minDiff && diff < 25) {
          minDiff = diff;
          bestNote = n;
        }
      }
    });

    if (bestNote) {
      (bestNote as Note).hit = true;
      notesRef.current = notesRef.current.filter((n) => n.id !== (bestNote as Note).id);
      setNotes(notesRef.current);

      let pts = 0;
      let res: HitResult = 'Good';
      if (minDiff < 5) {
        res = 'Perfect';
        pts = 100;
        confetti({ particleCount: 20, spread: 60, origin: { y: 0.8 } });
      } else if (minDiff < 12) {
        res = 'Great';
        pts = 50;
      } else {
        res = 'Good';
        pts = 25;
      }

      setLastResult(res);
      setScore((s) => s + pts);
      setHitCount((h) => h + 1);
      setTotalNotes((t) => t + 1);
      setCombo((c) => {
        const next = c + 1;
        if (next > maxCombo) setMaxCombo(next);
        return next;
      });

      // Broadcast score to server leaderboard
      socketService.emit(SOCKET_EVENTS.PLAYER_SCORE, { scoreAdd: pts });
    } else {
      // Tapped space with no note near Hit Zone
      setLastResult('Miss');
      setCombo(0);
      setTotalNotes((t) => t + 1);
    }
  };

  const handleClose = () => {
    onBeatDropEffect(false);
    onClose();
  };

  const accuracy = totalNotes > 0 ? Math.round((hitCount / totalNotes) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg glass-panel rounded-3xl border border-white/20 p-6 shadow-2xl flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-yellow-400 animate-spin" style={{ animationDuration: '4s' }} />
            <h3 className="text-2xl font-black text-white tracking-tight">Beat Drop Mini-Game</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Row */}
        <div className="w-full grid grid-cols-4 gap-2 my-4">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col items-center">
            <span className="text-[10px] uppercase text-slate-400 font-bold">Score</span>
            <span className="text-lg font-black text-neon-green">{score}</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col items-center">
            <span className="text-[10px] uppercase text-slate-400 font-bold">Combo</span>
            <span className="text-lg font-black text-neon-pink">{combo}x</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col items-center">
            <span className="text-[10px] uppercase text-slate-400 font-bold">Max Combo</span>
            <span className="text-lg font-black text-yellow-400">{maxCombo}x</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col items-center">
            <span className="text-[10px] uppercase text-slate-400 font-bold">Accuracy</span>
            <span className="text-lg font-black text-neon-blue">{accuracy}%</span>
          </div>
        </div>

        {/* Countdown Overlay */}
        {countdown > 0 ? (
          <div className="my-16 flex flex-col items-center justify-center">
            <span className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-yellow-400 to-neon-blue animate-pulse">
              {countdown}
            </span>
            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">
              Get Ready to Drop!
            </span>
          </div>
        ) : (
          /* Falling Notes Track Area */
          <div className="relative w-64 h-80 my-4 rounded-2xl bg-slate-950/90 border-2 border-slate-800 overflow-hidden flex flex-col items-center">
            {/* Hit Line */}
            <div className="absolute bottom-10 left-0 right-0 h-2 bg-gradient-to-r from-neon-pink via-yellow-400 to-neon-blue shadow-lg shadow-neon-pink/40" />
            <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
              [Hit Zone - Press SPACE]
            </div>

            {/* Falling Notes */}
            {notes.map((note) => (
              <div
                key={note.id}
                className="absolute w-28 h-6 rounded-lg bg-gradient-to-r from-neon-pink to-purple-500 shadow-md shadow-neon-pink/50 flex items-center justify-center font-black text-xs text-white"
                style={{ top: `${note.y}%` }}
              >
                BEAT NOTE
              </div>
            ))}

            {/* Feedback Badge */}
            {lastResult && (
              <div
                className={`absolute top-6 px-4 py-1.5 rounded-full font-black text-lg tracking-wider animate-bounce ${
                  lastResult === 'Perfect'
                    ? 'bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-400/50'
                    : lastResult === 'Great'
                    ? 'bg-neon-pink text-white shadow-lg shadow-neon-pink/50'
                    : lastResult === 'Good'
                    ? 'bg-neon-blue text-slate-950'
                    : 'bg-rose-600 text-white'
                }`}
              >
                {lastResult}!
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleHitNote}
          disabled={!isPlaying}
          className="w-full mt-2 py-4 rounded-2xl bg-gradient-to-r from-yellow-400 via-neon-pink to-purple-600 hover:opacity-95 text-slate-950 font-black text-lg uppercase tracking-wider shadow-xl transform active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Zap className="w-5 h-5 fill-slate-950" />
          <span>Hit Beat (SPACE)</span>
        </button>

        <p className="text-[11px] text-slate-400 mt-3 text-center">
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-mono">SPACE</kbd> when a falling note crosses the Hit Zone!
        </p>
      </div>
    </div>
  );
};

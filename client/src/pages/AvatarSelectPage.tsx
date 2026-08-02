import React from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useGameStore } from '../stores/useGameStore';
import { useAuthStore } from '../stores/useAuthStore';
import { AvatarType } from '../types';
import { AVATAR_CONFIGS } from '../game/avatars/AvatarPrimitive';
import { AvatarPreviewCanvas } from '../components/ui/AvatarPreviewCanvas';
import { Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';

export const AvatarSelectPage: React.FC = () => {
  const { nickname, avatarType, setAvatarType, setNickname } = usePlayerStore();
  const setPageStep = useGameStore((state) => state.setPageStep);
  const user = useAuthStore((state) => state.user);

  React.useEffect(() => {
    if (user && user.displayName) {
      setNickname(user.displayName);
    }
    if (user && user.avatarConfig) {
      try {
        const config = typeof user.avatarConfig === 'string' ? JSON.parse(user.avatarConfig) : user.avatarConfig;
        usePlayerStore.getState().setAvatarConfig(config);
      } catch (e) {
        console.error('Failed to parse avatarConfig', e);
      }
    }
  }, [user, setNickname]);

  const avatars: AvatarType[] = [
    'Boy', 'Girl', 'Robot', 'Panda',
    'Alien', 'Cat', 'Bunny', 'Dinosaur', 'CelestialQueen'
  ];

  const currentConfig = AVATAR_CONFIGS[avatarType] || AVATAR_CONFIGS.Boy;

  return (
    <div className="avatar-page-scroll relative w-full h-full min-h-0 flex flex-col items-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 overflow-y-auto overscroll-y-contain touch-pan-y">
      {/* Top Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 shrink-0 px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-8">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-neon-pink" />
          <span className="text-xl font-extrabold text-white">DanceVerse Live</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/80 border border-white/10">
          <span className="text-xs text-slate-400">Fan:</span>
          {!user ? (
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value.substring(0, 16))}
              placeholder="Guest Nickname"
              className="bg-transparent border-b border-slate-600 text-sm font-bold text-neon-blue focus:outline-none focus:border-neon-pink w-28 placeholder-slate-600"
            />
          ) : (
            <span className="text-sm font-bold text-neon-blue">{nickname}</span>
          )}
        </div>
      </div>

      {/* Main Grid: Preview & Selection */}
      <div className="z-10 w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-4 px-4 sm:px-8 shrink-0 md:flex-1">
        {/* Left: 3D Preview */}
        <div className="md:col-span-5 flex flex-col items-center">
          <AvatarPreviewCanvas avatarType={avatarType} />
          <div className="mt-4 text-center">
            <h3 className="text-2xl font-black text-white" style={{ color: currentConfig.primaryColor }}>
              {currentConfig.name}
            </h3>
            <p className="text-sm text-slate-300 mt-1 max-w-xs">{currentConfig.description}</p>
          </div>
        </div>

        {/* Right: Avatar Grid */}
        <div className="md:col-span-7 flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider text-center md:text-left">
            Choose Your Style
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {avatars.map((av) => {
              const cfg = AVATAR_CONFIGS[av];
              const isSelected = avatarType === av;
              return (
                <button
                  key={av}
                  onClick={() => setAvatarType(av)}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all transform hover:scale-105 active:scale-95 ${
                    isSelected
                      ? 'bg-purple-900/50 border-neon-pink shadow-lg shadow-neon-pink/25'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {/* Color badge preview */}
                  <div
                    className="w-8 h-8 rounded-full mb-2 shadow-inner border border-white/20"
                    style={{ backgroundColor: cfg.primaryColor }}
                  />
                  <span className="text-sm font-bold text-white">{av}</span>
                  <span className="text-[11px] text-slate-400 mt-0.5 truncate max-w-full">
                    {cfg.name}
                  </span>
                  {isSelected && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-neon-pink animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="sticky bottom-0 z-20 w-full shrink-0 border-t border-white/10 bg-slate-950/90 backdrop-blur-xl px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 md:static md:bg-transparent md:backdrop-blur-none md:pt-4 md:pb-8">
        <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={() => setPageStep('landing')}
            aria-label="Back"
            className="shrink-0 flex items-center justify-center gap-2 p-3 sm:px-6 sm:py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-semibold border border-white/10 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <button
            onClick={() => setPageStep('lobby')}
            className="min-w-0 flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-8 py-3 rounded-xl bg-gradient-to-r from-neon-pink to-purple-600 hover:from-neon-pink/90 hover:to-purple-500 text-sm sm:text-base text-white font-bold shadow-lg shadow-neon-pink/25 transform hover:scale-[1.02] active:scale-95 transition-all"
          >
            <span className="truncate">Choose Concert Room</span>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useGameStore } from '../stores/useGameStore';
import { useAuthStore } from '../stores/useAuthStore';
import { Music, Sparkles } from 'lucide-react';
import { getOAuthUrl } from '../config/runtime';

export const LandingPage: React.FC = () => {
  const setPageStep = useGameStore((state) => state.setPageStep);
  const continueAsGuest = useAuthStore((state) => state.continueAsGuest);

  const handleGuest = () => {
    continueAsGuest();
    setPageStep('avatar');
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 overflow-hidden">
      {/* Background ambient light orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-neon-pink/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-neon-blue/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

      {/* Main Container */}
      <div className="z-10 flex flex-col items-center max-w-md w-full px-6 py-10 glass-panel rounded-3xl shadow-2xl border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-6 h-6 text-neon-pink animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-xs uppercase tracking-widest text-neon-blue font-bold">Online Concert Experience</span>
        </div>

        <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-neon-pink via-purple-400 to-neon-blue mb-2 text-center">
          DanceVerse Live
        </h1>
        <p className="text-sm text-slate-400 text-center mb-8">
          Step onto the stage, vibe with players worldwide, and light up the concert floor!
        </p>

        <div className="w-full flex flex-col gap-4 mt-6">
          <button
            onClick={() => setPageStep('login')}
            className="w-full py-4 bg-gradient-to-r from-neon-blue to-purple-600 hover:from-neon-blue/90 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Sign In</span>
          </button>
          
          <button
            onClick={() => setPageStep('register')}
            className="w-full py-4 bg-gradient-to-r from-neon-pink to-purple-600 hover:from-neon-pink/90 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <span>Create Account</span>
          </button>

          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={() => window.location.assign(getOAuthUrl('google'))}
              className="w-full py-3 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-xl shadow transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                <path d="M1 1h22v22H1z" fill="none"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            
            <button
              onClick={() => window.location.assign(getOAuthUrl('facebook'))}
              className="w-full py-3 bg-[#1877F2] hover:bg-[#1864D9] text-white font-bold rounded-xl shadow transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Continue with Facebook</span>
            </button>
          </div>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase tracking-wider">or</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <button
            onClick={handleGuest}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-500 text-slate-300 font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Music className="w-5 h-5" />
            <span>Continue as Guest</span>
          </button>
        </div>
      </div>

      <footer className="absolute bottom-6 text-xs text-slate-500">
        DanceVerse Live MVP — Powered by React Three Fiber &amp; Socket.IO
      </footer>
    </div>
  );
};

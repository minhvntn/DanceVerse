import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useGameStore } from '../stores/useGameStore';
import { LogIn, ArrowLeft } from 'lucide-react';
import { getOAuthUrl, ENABLE_FACEBOOK_LOGIN } from '../config/runtime';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const login = useAuthStore((state) => state.login);
  const setPageStep = useGameStore((state) => state.setPageStep);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({ emailOrUsername: identifier, password });
      setPageStep('avatar'); // Move to avatar selection next
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 overflow-hidden">
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-neon-blue/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      
      <div className="z-10 flex flex-col items-center max-w-md w-full px-6 py-10 glass-panel rounded-3xl shadow-2xl border border-white/10">
        <button 
          onClick={() => setPageStep('landing')}
          className="self-start mb-4 text-slate-400 hover:text-white flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-purple-400 mb-6">
          Welcome Back
        </h1>

        <div className="w-full flex flex-col gap-3 mb-5">
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
          
          {ENABLE_FACEBOOK_LOGIN && (
            <button
              onClick={() => window.location.assign(getOAuthUrl('facebook'))}
              className="w-full py-3 bg-[#1877F2] hover:bg-[#1864D9] text-white font-bold rounded-xl shadow transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span>Continue with Facebook</span>
            </button>
          )}
        </div>

        <div className="relative flex py-2 items-center w-full mb-6">
          <div className="flex-grow border-t border-slate-700"></div>
          <span className="flex-shrink-0 mx-4 text-slate-500 text-xs uppercase tracking-wider">or Email/Username</span>
          <div className="flex-grow border-t border-slate-700"></div>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email or Username</label>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-neon-blue transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-neon-blue transition-colors"
              required
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          <button
            type="submit"
            className="w-full py-4 mt-4 bg-gradient-to-r from-neon-blue to-purple-600 hover:from-neon-blue/90 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            <span>Sign In</span>
          </button>
        </form>
      </div>
    </div>
  );
};

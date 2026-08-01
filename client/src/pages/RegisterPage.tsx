import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useGameStore } from '../stores/useGameStore';
import { UserPlus, ArrowLeft } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const register = useAuthStore((state) => state.register);
  const setPageStep = useGameStore((state) => state.setPageStep);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    try {
      await register({ email, username, displayName, password });
      setPageStep('avatar'); // Move to avatar selection next
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 overflow-hidden">
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-neon-pink/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      
      <div className="z-10 flex flex-col items-center max-w-md w-full px-6 py-8 glass-panel rounded-3xl shadow-2xl border border-white/10 max-h-full overflow-y-auto">
        <button 
          onClick={() => setPageStep('landing')}
          className="self-start mb-4 text-slate-400 hover:text-white flex items-center gap-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-purple-400 mb-6">
          Create Account
        </h1>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-neon-pink transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-neon-pink transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-neon-pink transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-neon-pink transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-neon-pink transition-colors"
              required
            />
          </div>

          {error && <p className="text-xs text-rose-400 font-medium">{error}</p>}

          <button
            type="submit"
            className="w-full py-3 mt-4 bg-gradient-to-r from-neon-pink to-purple-600 hover:from-neon-pink/90 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            <span>Register</span>
          </button>
        </form>
      </div>
    </div>
  );
};

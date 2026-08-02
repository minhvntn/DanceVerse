import React, { useEffect, useState } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useAuthStore } from '../stores/useAuthStore';
import { AvatarPreview } from '../components/avatar/AvatarPreview';
import { ArrowLeft, Edit3, Music2, Trophy, Star, History, LogOut } from 'lucide-react';
import { DEFAULT_AVATAR } from '../game/avatars/avatarCosmetics';
import { apiClient } from '../services/apiClient';

export const ProfilePage: React.FC = () => {
  const setPageStep = useGameStore(state => state.setPageStep);
  const { avatarConfig, nickname, maxCombo, perfectHits, greatHits } = usePlayerStore();
  const { user, logout } = useAuthStore();
  const [historyCount, setHistoryCount] = useState(0);

  useEffect(() => {
    if (user) {
      apiClient.get('/users/history')
        .then(res => setHistoryCount(res.data.length))
        .catch(() => {});
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <div className="w-full h-full flex flex-col md:flex-row bg-slate-950 text-white overflow-hidden relative">
      {/* 3D Avatar Area */}
      <div className="flex-1 relative border-b md:border-b-0 md:border-r border-white/10 min-h-[50vh] md:min-h-0">
        <AvatarPreview config={avatarConfig || DEFAULT_AVATAR} animation="Idle" />
        
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-10">
          <button 
            onClick={() => setPageStep('lobby')} 
            className="p-3 bg-slate-900/80 hover:bg-slate-800 rounded-full border border-white/10 backdrop-blur-md transition-transform hover:scale-105"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Customize Button */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <button 
            onClick={() => setPageStep('customize')}
            className="flex items-center gap-2 px-6 py-3 bg-neon-cyan text-slate-900 font-black rounded-full hover:brightness-110 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all hover:scale-105"
          >
            <Edit3 size={18} />
            CUSTOMIZE AVATAR
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="w-full md:w-[450px] bg-slate-900/80 backdrop-blur-md flex flex-col h-full overflow-y-auto">
        <div className="p-8 border-b border-white/10 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-neon-pink to-neon-purple p-1 mb-4 shadow-[0_0_30px_rgba(255,43,155,0.3)]">
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-3xl">
              {nickname.charAt(0).toUpperCase()}
            </div>
          </div>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-1">
            {nickname}
          </h2>
          <p className="text-neon-cyan font-semibold text-sm uppercase tracking-widest">
            {user ? 'Verified Dancer' : 'Guest Dancer'}
          </p>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Stats Grid */}
          <section>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Trophy size={16} className="text-neon-pink" /> Rhythm Stats
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Max Combo</p>
                <p className="text-2xl font-black text-white">{maxCombo}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Perfect Hits</p>
                <p className="text-2xl font-black text-neon-pink">{perfectHits}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Great Hits</p>
                <p className="text-2xl font-black text-neon-cyan">{greatHits}</p>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl border border-white/5">
                <p className="text-slate-400 text-xs font-bold uppercase mb-1">Concerts Joined</p>
                <p className="text-2xl font-black text-purple-400">{historyCount}</p>
              </div>
            </div>
          </section>

          {/* Account Actions */}
          {user && (
            <section className="pt-4 border-t border-white/10">
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 w-full p-4 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 font-bold transition-colors"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </section>
          )}
          {!user && (
            <section className="pt-4 border-t border-white/10">
               <button 
                onClick={() => { setPageStep('login'); }}
                className="flex items-center justify-center gap-2 w-full p-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
              >
                Sign In to Save Progress
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/useAuthStore';
import { usePlayerStore } from '../../stores/usePlayerStore';
import { apiClient } from '../../services/apiClient';
import { X, Save, LogOut } from 'lucide-react';
import { ENABLE_FACEBOOK_LOGIN } from '../../config/runtime';

interface ProfileModalProps {
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user, logout } = useAuthStore();
  const { nickname, avatarType, setNickname } = usePlayerStore();
  
  const [displayName, setDisplayName] = useState(user?.displayName || nickname);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'playlists' | 'security'>('profile');
  const [history, setHistory] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [providers, setProviders] = useState<any>(null);

  const fetchProviders = async () => {
    try {
      const res = await apiClient.get('/auth/oauth/providers/me');
      setProviders(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'history') {
      apiClient.get('/users/history').then(res => setHistory(res.data)).catch(console.error);
    } else if (user && activeTab === 'playlists') {
      apiClient.get('/users/playlists').then(res => setPlaylists(res.data)).catch(console.error);
    } else if (user && activeTab === 'security') {
      fetchProviders();
    }
  }, [user, activeTab]);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');
    try {
      await apiClient.patch('/users/me', { displayName, avatarType });
      setNickname(displayName);
      setMessage('Profile saved successfully!');
    } catch (e: any) {
      setMessage(e.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  const handleLinkProvider = async (provider: string) => {
    try {
      const res = await apiClient.post(`/auth/oauth/link/${provider}`);
      if (res.data.url) {
        window.location.assign(res.data.url);
      }
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to link account');
    }
  };

  const handleUnlinkProvider = async (provider: string) => {
    try {
      await apiClient.delete(`/auth/oauth/providers/${provider}`);
      fetchProviders();
    } catch (e: any) {
      setMessage(e.response?.data?.message || 'Failed to unlink account');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md glass-panel rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50">
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-purple-400">
            User Profile
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        {user && (
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'profile' ? 'text-neon-blue border-b-2 border-neon-blue' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'history' ? 'text-neon-pink border-b-2 border-neon-pink' : 'text-slate-400 hover:text-slate-200'}`}
            >
              History
            </button>
            <button
              onClick={() => setActiveTab('playlists')}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'playlists' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Playlists
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'security' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Security
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 flex flex-col gap-6 overflow-y-auto">
          {!user ? (
            <div className="text-center text-slate-300">
              <p>You are currently playing as a Guest.</p>
              <p className="text-xs mt-2 text-slate-500">Create an account to save your profile, playlists, and history!</p>
            </div>
          ) : activeTab === 'profile' ? (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account Info</label>
                <div className="px-4 py-3 bg-slate-900/50 rounded-xl border border-white/5">
                  <p className="text-sm text-slate-300"><span className="font-semibold text-white">Email:</span> {user.email}</p>
                  <p className="text-sm text-slate-300"><span className="font-semibold text-white">Username:</span> @{user.username}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-neon-blue transition-colors"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Avatar</label>
                <div className="px-4 py-3 bg-slate-900/50 rounded-xl border border-white/5 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{avatarType}</span>
                  <span className="text-xs text-slate-400">Change in Avatar Select Screen</span>
                </div>
              </div>

              {message && (
                <p className={`text-xs font-bold ${message.includes('success') ? 'text-neon-green' : 'text-rose-400'}`}>
                  {message}
                </p>
              )}

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-3 bg-gradient-to-r from-neon-blue to-purple-600 hover:from-neon-blue/90 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
              </button>

              <button
                onClick={handleLogout}
                className="w-full py-3 mt-4 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 font-bold rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </>
          ) : activeTab === 'history' ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recently Visited Concerts</h3>
              {history.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No history yet. Join a concert!</p>
              ) : (
                history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-white/5">
                    <span className="text-sm font-bold text-white">{h.roomName}</span>
                    <span className="text-xs text-slate-400">{new Date(h.joinedAt).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'playlists' ? (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Saved Playlists</h3>
              {playlists.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No playlists yet.</p>
              ) : (
                playlists.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-white/5">
                    <span className="text-sm font-bold text-white">{p.name}</span>
                    <span className="text-xs text-slate-400">{p.items?.length || 0} tracks</span>
                  </div>
                ))
              )}
            </div>
          ) : activeTab === 'security' ? (
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Connected Accounts</h3>
              {message && <p className="text-xs text-rose-400">{message}</p>}
              
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-white/5">
                  <div>
                    <span className="text-sm font-bold text-white">Google</span>
                    {providers?.google?.email && <p className="text-xs text-slate-400">{providers.google.email}</p>}
                  </div>
                  {providers?.google?.connected ? (
                    <button onClick={() => handleUnlinkProvider('google')} className="text-xs text-rose-400 font-bold border border-rose-500/30 px-3 py-1 rounded-lg hover:bg-rose-500/10 transition-colors">Disconnect</button>
                  ) : (
                    <button onClick={() => handleLinkProvider('google')} className="text-xs text-neon-blue font-bold border border-neon-blue/30 px-3 py-1 rounded-lg hover:bg-neon-blue/10 transition-colors">Connect</button>
                  )}
                </div>

                {(ENABLE_FACEBOOK_LOGIN || providers?.facebook?.connected) && (
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-white/5">
                    <div>
                      <span className="text-sm font-bold text-white">Facebook</span>
                      {providers?.facebook?.email && <p className="text-xs text-slate-400">{providers.facebook.email}</p>}
                    </div>
                    {providers?.facebook?.connected ? (
                      <button onClick={() => handleUnlinkProvider('facebook')} className="text-xs text-rose-400 font-bold border border-rose-500/30 px-3 py-1 rounded-lg hover:bg-rose-500/10 transition-colors">Disconnect</button>
                    ) : (
                      <button onClick={() => handleLinkProvider('facebook')} className="text-xs text-[#1877F2] font-bold border border-[#1877F2]/30 px-3 py-1 rounded-lg hover:bg-[#1877F2]/10 transition-colors">Connect</button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-white/5">
                  <div>
                    <span className="text-sm font-bold text-white">Password</span>
                    <p className="text-xs text-slate-400">{providers?.password?.enabled ? 'Password is set' : 'No password set'}</p>
                  </div>
                  {!providers?.password?.enabled && (
                    <button onClick={() => {
                      const p = prompt('Enter a new password (min 6 chars):');
                      if (p && p.length >= 6) {
                        apiClient.post('/auth/set-password', { password: p }).then(() => fetchProviders()).catch(e => setMessage(e.response?.data?.message || 'Failed'));
                      }
                    }} className="text-xs text-neon-pink font-bold border border-neon-pink/30 px-3 py-1 rounded-lg hover:bg-neon-pink/10 transition-colors">Set Password</button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../stores/useGameStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { AvatarPreview } from '../components/avatar/AvatarPreview';
import { AvatarCustomization, DanceAnimationType } from '../../../shared/types';
import { 
  DEFAULT_AVATAR,
  BODY_COLORS,
  HAIR_STYLES,
  HAIR_COLORS,
  FACE_STYLES,
  OUTFIT_STYLES,
  OUTFIT_COLORS,
  SHOE_STYLES,
  SHOE_COLORS,
  LIGHTSTICK_STYLES,
  LIGHTSTICK_COLORS
} from '../game/avatars/avatarCosmetics';
import { ArrowLeft, Save, Dices, Play, Hand } from 'lucide-react';
import { socketService } from '../services/socket.service';

export const AvatarCustomizer: React.FC = () => {
  const setPageStep = useGameStore(state => state.setPageStep);
  const { avatarConfig, setAvatarConfig, nickname, avatarType } = usePlayerStore();
  const token = localStorage.getItem('token');
  
  // Local state for edits before saving
  const [config, setConfig] = useState<AvatarCustomization>(avatarConfig || DEFAULT_AVATAR);
  const [animation, setAnimation] = useState<DanceAnimationType>('Idle');
  const [activeTab, setActiveTab] = useState<'body' | 'hair' | 'face' | 'outfit' | 'lightstick'>('body');
  const [isSaving, setIsSaving] = useState(false);

  // Helper to pick random item from array
  const pickRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)].id;

  const handleRandomize = () => {
    setConfig({
      bodyColor: pickRandom(BODY_COLORS),
      hairStyle: pickRandom(HAIR_STYLES),
      hairColor: pickRandom(HAIR_COLORS),
      faceStyle: pickRandom(FACE_STYLES),
      outfitTop: pickRandom(OUTFIT_STYLES),
      outfitBottom: pickRandom(OUTFIT_STYLES),
      outfitColor: pickRandom(OUTFIT_COLORS),
      shoes: pickRandom(SHOE_STYLES),
      shoesColor: pickRandom(SHOE_COLORS),
      lightstickStyle: pickRandom(LIGHTSTICK_STYLES),
      lightstickColor: pickRandom(LIGHTSTICK_COLORS),
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (token) {
        await fetch('/api/users/me', { 
          method: 'PATCH', 
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            avatarConfig: JSON.stringify(config) 
          }) 
        });
      }
      
      // Update local store
      setAvatarConfig(config);
      
      // If we are connected via socket, emit an update so room is aware
      const socket = socketService.getSocket();
      if (socket?.connected) {
        socket.emit('player:avatar-update', { avatarConfig: config });
      }
      
      setPageStep('lobby');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const renderColorGrid = (field: keyof AvatarCustomization, items: any[]) => (
    <div className="grid grid-cols-4 gap-2 mt-4">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => setConfig(prev => ({ ...prev, [field]: item.id }))}
          className={`h-10 rounded-lg border-2 transition-transform hover:scale-105 ${config[field] === item.id ? 'border-white scale-110' : 'border-transparent'}`}
          style={{ backgroundColor: item.color }}
          title={item.name}
        />
      ))}
    </div>
  );

  const renderStyleGrid = (field: keyof AvatarCustomization, items: any[]) => (
    <div className="grid grid-cols-2 gap-3 mt-4">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => setConfig(prev => ({ ...prev, [field]: item.id }))}
          className={`p-3 rounded-xl border font-bold transition-all ${config[field] === item.id ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700'}`}
        >
          {item.name}
        </button>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col md:flex-row text-white z-50 overflow-hidden">
      
      {/* 3D Preview Area */}
      <div className="flex-1 relative border-b md:border-b-0 md:border-r border-white/10">
        <AvatarPreview config={config} animation={animation} />
        
        {/* Top bar controls */}
        <div className="absolute top-4 left-4 z-10 flex gap-2">
          <button onClick={() => setPageStep('lobby')} className="p-3 bg-slate-900/80 hover:bg-slate-800 rounded-full border border-white/10 backdrop-blur-md">
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Animation Controls */}
        <div className="absolute bottom-4 left-4 z-10 flex gap-2">
          <button 
            onClick={() => setAnimation(prev => prev === 'Idle' ? 'HipHop' : 'Idle')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md font-bold ${animation === 'HipHop' ? 'bg-neon-pink/20 border-neon-pink text-neon-pink' : 'bg-slate-900/80 border-white/10'}`}
          >
            <Play size={16} /> Dance
          </button>
          <button 
            onClick={() => setAnimation(prev => prev === 'Idle' ? 'WaveLightstick' : 'Idle')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md font-bold ${animation === 'WaveLightstick' ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'bg-slate-900/80 border-white/10'}`}
          >
            <Hand size={16} /> Wave
          </button>
        </div>
      </div>

      {/* Customizer Panel */}
      <div className="w-full md:w-[450px] bg-slate-900 flex flex-col h-[50vh] md:h-full">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-black italic tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-pink">
            CUSTOMIZE AVATAR
          </h2>
          <div className="flex gap-2">
            <button onClick={handleRandomize} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300" title="Randomize">
              <Dices size={20} />
            </button>
            <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-neon-cyan text-slate-900 font-bold rounded-lg hover:brightness-110">
              <Save size={18} /> {isSaving ? 'SAVING...' : 'SAVE'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-white/5 no-scrollbar">
          {(['body', 'hair', 'face', 'outfit', 'lightstick'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 px-2 text-sm font-bold capitalize whitespace-nowrap transition-colors ${activeTab === tab ? 'text-neon-cyan border-b-2 border-neon-cyan' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          {activeTab === 'body' && (
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Skin Color</h3>
              {renderColorGrid('bodyColor', BODY_COLORS)}
            </section>
          )}

          {activeTab === 'hair' && (
            <>
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Hair Style</h3>
                {renderStyleGrid('hairStyle', HAIR_STYLES)}
              </section>
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Hair Color</h3>
                {renderColorGrid('hairColor', HAIR_COLORS)}
              </section>
            </>
          )}

          {activeTab === 'face' && (
            <section>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Face Expression</h3>
              {renderStyleGrid('faceStyle', FACE_STYLES)}
            </section>
          )}

          {activeTab === 'outfit' && (
            <>
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Outfit Style</h3>
                {renderStyleGrid('outfitTop', OUTFIT_STYLES)}
              </section>
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Outfit Color</h3>
                {renderColorGrid('outfitColor', OUTFIT_COLORS)}
              </section>
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Shoes Style</h3>
                {renderStyleGrid('shoes', SHOE_STYLES)}
              </section>
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Shoes Color</h3>
                {renderColorGrid('shoesColor', SHOE_COLORS)}
              </section>
            </>
          )}

          {activeTab === 'lightstick' && (
            <>
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Lightstick Style</h3>
                {renderStyleGrid('lightstickStyle', LIGHTSTICK_STYLES)}
              </section>
              <section>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Glow Color</h3>
                {renderColorGrid('lightstickColor', LIGHTSTICK_COLORS)}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

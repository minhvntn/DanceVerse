import React, { useState, useEffect, useRef } from 'react';
import { useRoomStore } from '../../stores/useRoomStore';
import { useGameStore } from '../../stores/useGameStore';
import { socketService } from '../../services/socket.service';
import { SOCKET_EVENTS, ChatMessage } from '../../types';
import { useSocialStore } from '../../stores/useSocialStore';
import { MessageSquare, Send, ChevronDown, ChevronUp, Users } from 'lucide-react';

export const ChatBox: React.FC = () => {
  const { chatMessages, teamMessages, addChatMessage, addTeamMessage, currentRoom } = useRoomStore();
  const showChat = useGameStore((state) => state.showChat);
  const { currentParty, partyMessages, addPartyMessage } = useSocialStore();
  
  const [inputMsg, setInputMsg] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [activeTab, setActiveTab] = useState<'room' | 'party' | 'team'>('room');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allowChat = currentRoom?.allowChat !== false;

  useEffect(() => {
    const handleMessage = (msg: ChatMessage) => {
      // Assuming server sends Party messages as a different event or type, but we will reuse CHAT_MESSAGE with a partyId if we implemented it.
      // For this phase, if we receive a party chat, we add it to party messages. We didn't add party chat on server yet, so we'll just implement the UI tab.
      if ((msg as any).target === 'party') {
        addPartyMessage(msg);
      } else if ((msg as any).target === 'team') {
        addTeamMessage(msg);
      } else {
        addChatMessage(msg);
      }
    };

    socketService.on(SOCKET_EVENTS.CHAT_MESSAGE, handleMessage);
    return () => {
      socketService.off(SOCKET_EVENTS.CHAT_MESSAGE, handleMessage);
    };
  }, [addChatMessage]);

  useEffect(() => {
    if (!isCollapsed) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isCollapsed]);

  if (!showChat) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowChat) return;
    const trimmed = inputMsg.trim();
    if (!trimmed || cooldown) return;

    socketService.emit(SOCKET_EVENTS.CHAT_MESSAGE, { message: trimmed, target: activeTab });
    setInputMsg('');
    setCooldown(true);
    setTimeout(() => setCooldown(false), 500);
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 w-80 max-w-[calc(100vw-2rem)] bg-slate-950/90 glass-panel rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col transition-all">
      {/* Chat Header */}
      <div
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 cursor-pointer hover:bg-slate-800/80 transition-colors border-b border-white/10"
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-neon-pink" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Concert Chat ({chatMessages.length})
          </span>
        </div>
        <div className="flex items-center">
          {isCollapsed ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Tabs */}
          <div className="flex bg-slate-900 border-b border-white/5">
            <button
              onClick={() => setActiveTab('room')}
              className={`flex-1 py-1.5 text-xs font-bold transition-colors ${activeTab === 'room' ? 'text-neon-pink bg-white/5' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Room
            </button>
            <button
              onClick={() => setActiveTab('party')}
              className={`flex-1 py-1.5 text-xs font-bold transition-colors ${activeTab === 'party' ? 'text-neon-purple bg-white/5' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Users className="w-3.5 h-3.5 inline mr-1" /> Party
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`flex-1 py-1.5 text-xs font-bold transition-colors ${activeTab === 'team' ? 'text-neon-cyan bg-white/5' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Team
            </button>
          </div>
          
          {/* Chat Messages */}
          <div className="flex flex-col gap-2 p-3.5 h-48 overflow-y-auto text-xs">
            {activeTab === 'room' && chatMessages.length === 0 && (
              <p className="text-slate-500 italic text-center my-auto">
                No messages yet. Say hello to the concert!
              </p>
            )}
            {activeTab === 'party' && !currentParty && (
              <p className="text-slate-500 italic text-center my-auto">
                You are not in a party.
              </p>
            )}
            {activeTab === 'party' && currentParty && partyMessages.length === 0 && (
              <p className="text-slate-500 italic text-center my-auto">
                Party chat is empty.
              </p>
            )}

            {activeTab === 'team' && teamMessages.length === 0 && (
              <p className="text-slate-500 italic text-center my-auto">
                No messages in team chat.
              </p>
            )}

            {(activeTab === 'room' ? chatMessages : activeTab === 'team' ? teamMessages : partyMessages).map((msg) => {
                const isSystem = msg.type === 'system' || msg.isSystem;
                const content = msg.message || msg.text || '';
                const timeStr = new Date(msg.timestamp || msg.sentAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return isSystem ? (
                  <div key={msg.id} className="text-xs italic text-amber-400 py-1 px-2 my-0.5 text-center bg-amber-500/10 rounded border border-amber-500/20">
                    ★ {content} [{timeStr}]
                  </div>
                ) : (
                  <div key={msg.id} className="flex flex-col gap-0.5 leading-snug">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-neon-blue">{msg.nickname}</span>
                      <span className="text-[10px] text-slate-400">
                        [{timeStr}]
                      </span>
                    </div>
                    <p className="text-slate-200 pl-2 border-l-2 border-neon-pink/40 break-words">
                      {content}
                    </p>
                  </div>
                );
              })
            }
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSend} className="p-2 bg-slate-900/90 border-t border-white/10 flex items-center gap-2">
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder={!allowChat ? 'Chat is disabled by Host' : (cooldown ? 'Wait a moment...' : 'Send a message (150 chars)...')}
              maxLength={150}
              disabled={cooldown || !allowChat}
              className="flex-1 bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-neon-pink transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputMsg.trim() || cooldown || !allowChat}
              className="p-2 bg-neon-pink text-white rounded-xl hover:bg-neon-pink/80 disabled:opacity-40 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Smile, Paperclip, Search, MoreHorizontal, Phone, Video, Hash, Plus } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { messageService } from '../services/message.service';
import { teamService } from '../services/team.service';

interface Team { _id: string; name: string; }
interface Message {
  _id: string;
  content?: string;
  message?: string;
  sender?: { _id: string; name: string } | string;
  createdAt?: string;
  time?: string;
  isMe?: boolean;
}

export default function ChatPage() {
  const { currentUser } = useAppStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load teams on mount
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await teamService.getTeams();
        const teamList: Team[] = Array.isArray(res) ? res : res?.teams ?? [];
        setTeams(teamList);
        if (teamList.length > 0) setActiveTeam(teamList[0]);
      } catch {
        setTeams([]);
      }
    };
    fetchTeams();
  }, []);

  // Load messages when team changes
  useEffect(() => {
    if (!activeTeam) { setLoading(false); return; }
    setLoading(true);
    const fetchMessages = async () => {
      try {
        const res = await messageService.getMessages(activeTeam._id);
        const msgs: Message[] = Array.isArray(res) ? res : res?.messages ?? [];
        // Mark own messages
        const marked = msgs.map(m => ({
          ...m,
          isMe: typeof m.sender === 'object'
            ? (m.sender as { _id: string })._id === currentUser?.id
            : m.sender === currentUser?.id,
        }));
        setMessages(marked);
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [activeTeam, currentUser?.id]);

  const sendMessage = async () => {
    if (!input.trim() || !activeTeam) return;
    const text = input;
    setInput('');

    // Optimistic UI
    const optimistic: Message = {
      _id: `tmp-${Date.now()}`,
      content: text,
      isMe: true,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      await messageService.sendMessage({ content: text, team: activeTeam._id });
    } catch {
      // Silently keep optimistic message
    }
  };

  const getSenderName = (msg: Message) =>
    typeof msg.sender === 'object' ? (msg.sender as { name: string }).name : currentUser?.name ?? 'User';

  const getSenderInitials = (msg: Message) => {
    const name = getSenderName(msg);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTime = (msg: Message) =>
    msg.time ?? (msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '');

  return (
    <div className="flex h-full page-fade-in overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Teams Sidebar */}
      <div className="w-56 glass-dark border-r border-white/5 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/30 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Teams</span>
            <button className="text-gray-600 hover:text-gray-400"><Plus className="w-3.5 h-3.5" /></button>
          </div>
          <div className="space-y-0.5">
            {teams.length === 0 ? (
              <p className="text-xs text-gray-600 px-2 py-2">No teams yet</p>
            ) : (
              teams.map(team => (
                <button
                  key={team._id}
                  onClick={() => setActiveTeam(team)}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ${
                    activeTeam?._id === team._id ? 'bg-indigo-600/20 text-indigo-300' : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                  }`}
                >
                  <Hash className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 text-left truncate">{team.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="h-14 glass-dark border-b border-white/5 flex items-center px-4 gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1">
            <Hash className="w-4 h-4 text-gray-400" />
            <span className="font-bold text-white text-sm">{activeTeam?.name ?? 'Select a team'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"><Phone className="w-4 h-4" /></button>
            <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"><Video className="w-4 h-4" /></button>
            <button className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"><MoreHorizontal className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/5" />
            <span className="text-xs text-gray-600">Today</span>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className={`flex items-start gap-3 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
                <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse shrink-0" />
                <div className={`w-48 h-10 bg-white/5 rounded-2xl animate-pulse`} />
              </div>
            ))
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-gray-600">
              <Hash className="w-10 h-10 mb-3" />
              <p className="text-sm">No messages yet. Say hello! 👋</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={msg._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={`flex items-start gap-3 group ${msg.isMe ? 'flex-row-reverse' : ''}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {getSenderInitials(msg)}
                </div>
                <div className={`flex flex-col gap-1 max-w-lg ${msg.isMe ? 'items-end' : ''}`}>
                  {!msg.isMe && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-300">{getSenderName(msg)}</span>
                      <span className="text-xs text-gray-600">{getTime(msg)}</span>
                    </div>
                  )}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.isMe
                      ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm'
                      : 'bg-white/5 text-gray-200 rounded-tl-sm border border-white/5'
                  }`}>
                    {msg.content ?? msg.message}
                  </div>
                  {msg.isMe && <span className="text-xs text-gray-600">{getTime(msg)}</span>}
                </div>
              </motion.div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 glass-dark border-t border-white/5 shrink-0">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={activeTeam ? `Message ${activeTeam.name}...` : 'Select a team to chat'}
                disabled={!activeTeam}
                rows={1}
                className="w-full px-4 py-3 pr-24 rounded-2xl bg-white/5 border border-white/10 focus:border-indigo-500/30 focus:outline-none text-sm text-white placeholder-gray-600 resize-none transition-all leading-relaxed disabled:opacity-40"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                <button className="text-gray-600 hover:text-gray-400 transition-colors"><Paperclip className="w-4 h-4" /></button>
                <button className="text-gray-600 hover:text-gray-400 transition-colors"><Smile className="w-4 h-4" /></button>
              </div>
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || !activeTeam}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-100 shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

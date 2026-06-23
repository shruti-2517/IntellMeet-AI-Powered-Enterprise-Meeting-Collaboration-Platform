import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Paperclip, Search, MoreHorizontal, Phone, Video, Hash, Plus, X, FileText, Image, Bell, BellOff, LogOut, Link, Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { messageService } from '../services/message.service';
import { teamService } from '../services/team.service';

// ── Emoji picker data ─────────────────────────────────────────────────────────
const EMOJI_GROUPS = [
  { label: '😀 Smileys', emojis: ['😀', '😂', '😍', '🥰', '😎', '🤩', '😢', '😤', '😳', '🤔', '😴', '🥳', '😇', '🤗', '😬', '🙃', '😐', '😑', '🤐', '😶'] },
  { label: '👍 Gestures', emojis: ['👍', '👎', '👏', '🙌', '🤝', '🤜', '✌️', '🤞', '🖐️', '👋', '🤙', '💪', '🦾', '🫶', '❤️', '🔥', '✨', '🎉', '🚀', '💯'] },
  { label: '🐶 Animals', emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🦋', '🦄', '🐬', '🦋'] },
  { label: '🍎 Food', emojis: ['🍎', '🍊', '🍋', '🍇', '🍓', '🍔', '🍕', '🌮', '🍜', '🍣', '☕', '🧋', '🍺', '🥂', '🎂', '🍰', '🍩', '🍪', '🍫', '🍬'] },
  { label: '⚽ Activities', emojis: ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🏓', '🥊', '🎯', '🎮', '🕹️', '🎲', '🎸', '🎹', '🎺', '🎻', '🎤', '🎬', '📸'] },
  { label: '🌍 Travel', emojis: ['🌍', '🌎', '🌏', '🗺️', '🏔️', '🏖️', '🌃', '🌆', '🎡', '✈️', '🚀', '🚂', '⛵', '🚗', '🏍️', '🛸', '⛺', '🏕️', '🗼', '🗽'] },
  { label: '💡 Objects', emojis: ['💡', '🔦', '📱', '💻', '🖥️', '⌨️', '🖱️', '📷', '📺', '📻', '🔭', '🔬', '💊', '🔑', '🔒', '📚', '📝', '📌', '📎', '✂️'] },
  { label: '❤️ Symbols', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💔', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '♻️', '✅', '❌', '⭐'] },
];


// ── Types ─────────────────────────────────────────────────────────────────────
interface Team { _id: string; name: string; }
interface Message {
  _id: string;
  content?: string;
  message?: string;
  sender?: { _id: string; name: string } | string;
  senderName?: string;
  attachedFile?: { name: string; size: string; type: string };
  createdAt?: string;
  time?: string;
  isMe?: boolean;
}

// ── Mock fallback data (used when backend is unreachable) ─────────────────────
const MOCK_TEAMS = [
  { _id: 'mock-eng', name: 'Engineering' },
  { _id: 'mock-product', name: 'Product' },
  { _id: 'mock-design', name: 'Design' },
  { _id: 'mock-leadership', name: 'Leadership' },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  'mock-eng': [
    { _id: 'm1', content: 'Hey team! The new video recording feature just hit staging 🚀', isMe: false, time: '09:12 AM', senderName: 'Mike Torres' },
    { _id: 'm2', content: 'Nice! I\'ll review the PR after standup.', isMe: true, time: '09:14 AM', senderName: 'You' },
    { _id: 'm3', content: 'Make sure to test the edge case with stream buffers — it was tricky.', isMe: false, time: '09:15 AM', senderName: 'Alex Johnson' },
    { _id: 'm4', content: 'Got it. Also pushing the Redis caching config today.', isMe: false, time: '09:22 AM', senderName: 'James Park' },
  ],
  'mock-product': [
    { _id: 'p1', content: 'Q3 roadmap deck is ready for review 📊', isMe: false, time: '10:00 AM', senderName: 'Sarah Chen' },
    { _id: 'p2', content: 'Looks great! Let\'s align with engineering before Friday.', isMe: true, time: '10:03 AM', senderName: 'You' },
  ],
  'mock-design': [
    { _id: 'd1', content: 'Dark mode token system is complete ✅', isMe: false, time: '08:45 AM', senderName: 'Priya Sharma' },
    { _id: 'd2', content: 'Amazing work! The new palette looks premium 🎨', isMe: true, time: '08:50 AM', senderName: 'You' },
    { _id: 'd3', content: 'Thanks! Accessibility contrast ratios all pass too.', isMe: false, time: '08:52 AM', senderName: 'Priya Sharma' },
  ],
  'mock-leadership': [
    { _id: 'l1', content: 'Sprint velocity up 15% this week — great momentum everyone 💪', isMe: false, time: '09:00 AM', senderName: 'David Kim' },
  ],
};



export default function ChatPage() {
  const { currentUser, startMeeting, toggleCamera, pendingChatMember, setPendingChatMember } = useAppStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);
  const [activeEmojiGroup, setActiveEmojiGroup] = useState(0);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: string; type: string } | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [mutedChannels, setMutedChannels] = useState<Set<string>>(new Set());
  const [callToast, setCallToast] = useState<{ type: 'audio' | 'video'; team: string } | null>(null);
  const [dmChannels, setDmChannels] = useState<Team[]>([]); // Direct message channels
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    if (showEmoji) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmoji]);

  // Close + menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    if (showAddMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showAddMenu]);

  // Close more menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showMoreMenu]);

  // Helper: start a call and navigate to meeting room
  const handleStartCall = useCallback((type: 'audio' | 'video') => {
    if (!activeTeam) return;
    // For audio-only call, ensure camera is toggled off
    if (type === 'audio') {
      // camera starts off in the meeting store default; toggle if currently on
      const store = useAppStore.getState();
      if (!store.isCameraOff) toggleCamera();
    } else {
      // For video call, ensure camera is on
      const store = useAppStore.getState();
      if (store.isCameraOff) toggleCamera();
    }
    setCallToast({ type, team: activeTeam.name });
    setTimeout(() => {
      setCallToast(null);
      startMeeting();
    }, 1200);
  }, [activeTeam, startMeeting, toggleCamera]);

  // Load teams on mount — fall back to mock data when API is unreachable
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await teamService.getTeams();
        const teamList: Team[] = Array.isArray(res) ? res : res?.teams ?? [];
        if (teamList.length > 0) {
          setTeams(teamList);
          setActiveTeam(teamList[0]);
          return;
        }
        throw new Error('empty');
      } catch {
        // Backend unavailable — use mock channels
        setTeams(MOCK_TEAMS);
        setActiveTeam(MOCK_TEAMS[0]);
      }
    };
    fetchTeams();
  }, []);

  // Consume pendingChatMember: create or select a DM channel for the member
  useEffect(() => {
    if (!pendingChatMember) return;
    const dmId = `dm-${pendingChatMember.id}`;
    const dmName = `DM: ${pendingChatMember.name}`;
    // Create DM channel if it doesn't exist
    setDmChannels(prev => {
      const already = prev.find(t => t._id === dmId);
      if (!already) {
        const dmTeam: Team = { _id: dmId, name: dmName };
        if (!MOCK_MESSAGES[dmId]) MOCK_MESSAGES[dmId] = [];
        const updated = [dmTeam, ...prev];
        return updated;
      }
      return prev;
    });
    // Select the DM channel
    const dmTeam: Team = { _id: dmId, name: dmName };
    if (!MOCK_MESSAGES[dmId]) MOCK_MESSAGES[dmId] = [];
    setActiveTeam(dmTeam);
    setMessages([]);
    // Clear the pending member so navigating back doesn't re-trigger
    setPendingChatMember(null);
  }, [pendingChatMember, setPendingChatMember]);

  // Load messages when team changes — fall back to mock messages
  useEffect(() => {
    if (!activeTeam) { setLoading(false); return; }
    setLoading(true);
    const fetchMessages = async () => {
      try {
        const res = await messageService.getMessages(activeTeam._id);
        const msgs: Message[] = Array.isArray(res) ? res : res?.messages ?? [];
        if (msgs.length > 0) {
          const marked = msgs.map(m => ({
            ...m,
            isMe: typeof m.sender === 'object'
              ? (m.sender as { _id: string })._id === currentUser?.id
              : m.sender === currentUser?.id,
          }));
          setMessages(marked);
          return;
        }
        throw new Error('empty');
      } catch {
        // Fall back to mock messages for this channel
        setMessages(MOCK_MESSAGES[activeTeam._id] ?? []);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, [activeTeam, currentUser?.id]);

  // Filtered teams for search
  const filteredTeams = useMemo(
    () => teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase())),
    [teams, search],
  );

  const handleCreateChannel = () => {
    const name = newChannelName.trim();
    if (!name) return;
    const newTeam: Team = { _id: `local-${Date.now()}`, name };
    MOCK_MESSAGES[newTeam._id] = [];
    setTeams(prev => [...prev, newTeam]);
    setActiveTeam(newTeam);
    setMessages([]);
    setNewChannelName('');
    setNewChannelDesc('');
    setShowCreateModal(false);
  };

  const handleEmojiClick = useCallback((emoji: string) => {
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart ?? input.length;
      const end = ta.selectionEnd ?? input.length;
      const next = input.slice(0, start) + emoji + input.slice(end);
      setInput(next);
      // restore cursor after emoji
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(start + emoji.length, start + emoji.length);
      });
    } else {
      setInput(prev => prev + emoji);
    }
  }, [input]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeStr = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    setAttachedFile({ name: file.name, size: sizeStr, type: file.type });
    // reset so same file can be re-selected
    e.target.value = '';
  };

  const sendMessage = async () => {
    const hasText = input.trim();
    if (!hasText && !attachedFile) return;
    if (!activeTeam) return;

    const text = hasText || (attachedFile ? '' : '');
    const fileSnap = attachedFile;
    setInput('');
    setAttachedFile(null);
    setShowEmoji(false);

    const optimistic: Message = {
      _id: `tmp-${Date.now()}`,
      content: text || undefined,
      attachedFile: fileSnap ?? undefined,
      isMe: true,
      senderName: currentUser?.name ?? 'You',
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, optimistic]);

    try {
      await messageService.sendMessage({ content: text || (fileSnap?.name ?? ''), team: activeTeam._id });
    } catch {
      // keep optimistic message
    }
  };


  const getSenderName = (msg: Message) => {
    if (msg.senderName) return msg.senderName;
    if (typeof msg.sender === 'object') return (msg.sender as { name: string }).name;
    return msg.isMe ? (currentUser?.name ?? 'You') : 'Team Member';
  };

  const getSenderInitials = (msg: Message) => {
    const name = getSenderName(msg);
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTime = (msg: Message) =>
    msg.time ?? (msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '');

  return (
    <>
    <div className="flex h-full page-fade-in overflow-hidden" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Teams Sidebar */}
      <div className="w-56 glass-dark border-r border-white/5 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search channels..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/30 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wider">Teams</span>
            {/* + button with dropdown */}
            <div className="relative" ref={addMenuRef}>
              <button
                onClick={() => setShowAddMenu(v => !v)}
                className={`p-0.5 rounded transition-colors ${showAddMenu ? 'text-indigo-400' : 'text-gray-600 hover:text-gray-300'}`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <AnimatePresence>
                {showAddMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    transition={{ duration: 0.13 }}
                    className="absolute right-0 top-6 w-48 glass rounded-xl border border-white/10 shadow-2xl overflow-hidden z-40"
                  >
                    <button
                      onClick={() => { setShowCreateModal(true); setShowAddMenu(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-gray-300 hover:bg-indigo-500/15 hover:text-white transition-all text-left"
                    >
                      <span className="w-5 h-5 rounded-md bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <Plus className="w-3 h-3 text-indigo-400" />
                      </span>
                      Create channel
                    </button>
                    <div className="h-px bg-white/5 mx-2" />
                    <div className="px-3 py-2">
                      <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">Suggested</div>
                      {['Marketing', 'Design Reviews', 'Announcements'].map(ch => (
                        <button
                          key={ch}
                          onClick={() => {
                            const already = teams.find(t => t.name === ch);
                            if (!already) {
                              const t: Team = { _id: `local-${ch}`, name: ch };
                              MOCK_MESSAGES[t._id] = [];
                              setTeams(prev => [...prev, t]);
                              setActiveTeam(t);
                              setMessages([]);
                            } else {
                              setActiveTeam(already);
                              setMessages(MOCK_MESSAGES[already._id] ?? []);
                            }
                            setShowAddMenu(false);
                          }}
                          className="w-full flex items-center gap-2 py-1.5 text-xs text-gray-400 hover:text-white transition-colors text-left"
                        >
                          <Hash className="w-3 h-3 shrink-0" />
                          {ch}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="space-y-0.5">
            {filteredTeams.length === 0 ? (
              <p className="text-xs text-gray-600 px-2 py-2">No channels match</p>
            ) : (
              filteredTeams.map(team => (
                <button
                  key={team._id}
                  onClick={() => { setActiveTeam(team); setMessages([]); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ${activeTeam?._id === team._id ? 'bg-indigo-600/20 text-indigo-300' : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                    }`}
                >
                  <Hash className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 text-left truncate">{team.name}</span>
                </button>
              ))
            )}
          </div>

          {/* Direct Messages section */}
          {dmChannels.length > 0 && (
            <>
              <div className="flex items-center justify-between mt-4 mb-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Direct Messages</span>
              </div>
              <div className="space-y-0.5">
                {dmChannels
                  .filter(dm => dm.name.toLowerCase().includes(search.toLowerCase()) || dm.name.replace('DM: ', '').toLowerCase().includes(search.toLowerCase()))
                  .map(dm => (
                    <button
                      key={dm._id}
                      onClick={() => { setActiveTeam(dm); setMessages(MOCK_MESSAGES[dm._id] ?? []); }}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-all ${
                        activeTeam?._id === dm._id ? 'bg-violet-600/20 text-violet-300' : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                        {dm.name.replace('DM: ', '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span className="flex-1 text-left truncate">{dm.name.replace('DM: ', '')}</span>
                    </button>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="h-14 glass-dark border-b border-white/5 flex items-center px-4 gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1">
            {activeTeam?._id.startsWith('dm-') ? (
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                {(activeTeam?.name ?? '').replace('DM: ', '').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            ) : (
              <Hash className="w-4 h-4 text-gray-400" />
            )}
            <span className="font-bold text-white text-sm">
              {activeTeam ? (activeTeam._id.startsWith('dm-') ? activeTeam.name.replace('DM: ', '') : activeTeam.name) : 'Select a team'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Audio Call */}
            <button
              onClick={() => handleStartCall('audio')}
              disabled={!activeTeam}
              title="Start audio call"
              className="w-8 h-8 rounded-lg hover:bg-emerald-500/15 flex items-center justify-center text-gray-400 hover:text-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Phone className="w-4 h-4" />
            </button>

            {/* Video Call */}
            <button
              onClick={() => handleStartCall('video')}
              disabled={!activeTeam}
              title="Start video call"
              className="w-8 h-8 rounded-lg hover:bg-indigo-500/15 flex items-center justify-center text-gray-400 hover:text-indigo-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Video className="w-4 h-4" />
            </button>

            {/* Three-dots more menu */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(v => !v)}
                disabled={!activeTeam}
                title="More options"
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  showMoreMenu ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showMoreMenu && activeTeam && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    transition={{ duration: 0.13 }}
                    className="absolute right-0 top-10 w-56 glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
                  >
                    <div className="p-1">
                      {/* Channel Members */}
                      <button
                        onClick={() => setShowMoreMenu(false)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center shrink-0">
                          <Users className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white">View Members</div>
                          <div className="text-[10px] text-gray-500">See who's in #{activeTeam.name}</div>
                        </div>
                      </button>

                      {/* Mute / Unmute */}
                      <button
                        onClick={() => {
                          setMutedChannels(prev => {
                            const next = new Set(prev);
                            if (next.has(activeTeam._id)) next.delete(activeTeam._id);
                            else next.add(activeTeam._id);
                            return next;
                          });
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                          {mutedChannels.has(activeTeam._id)
                            ? <Bell className="w-3.5 h-3.5 text-amber-400" />
                            : <BellOff className="w-3.5 h-3.5 text-amber-400" />}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white">
                            {mutedChannels.has(activeTeam._id) ? 'Unmute Channel' : 'Mute Channel'}
                          </div>
                          <div className="text-[10px] text-gray-500">Turn {mutedChannels.has(activeTeam._id) ? 'on' : 'off'} notifications</div>
                        </div>
                      </button>

                      {/* Copy Channel Link */}
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(`${window.location.origin}/#chat/${activeTeam._id}`).catch(() => {});
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center shrink-0">
                          <Link className="w-3.5 h-3.5 text-cyan-400" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white">Copy Channel Link</div>
                          <div className="text-[10px] text-gray-500">Share this channel</div>
                        </div>
                      </button>

                      <div className="my-1 border-t border-white/5" />

                      {/* Leave Channel */}
                      <button
                        onClick={() => {
                          setTeams(prev => prev.filter(t => t._id !== activeTeam._id));
                          setActiveTeam(null);
                          setMessages([]);
                          setShowMoreMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-all text-left"
                      >
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                          <LogOut className="w-3.5 h-3.5 text-red-400" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-red-400">Leave Channel</div>
                          <div className="text-[10px] text-gray-500">Remove #{activeTeam.name}</div>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
                  <div className={`rounded-2xl text-sm leading-relaxed overflow-hidden ${msg.isMe
                      ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm'
                      : 'bg-white/5 text-gray-200 rounded-tl-sm border border-white/5'
                    }`}>
                    {msg.content && <div className="px-4 py-2.5">{msg.content}</div>}
                    {msg.attachedFile && (
                      <div className={`flex items-center gap-2.5 px-3 py-2.5 ${msg.content ? 'border-t border-white/10' : ''
                        }`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.attachedFile.type.startsWith('image/')
                            ? 'bg-emerald-500/20'
                            : 'bg-indigo-500/20'
                          }`}>
                          {msg.attachedFile.type.startsWith('image/')
                            ? <Image className="w-4 h-4 text-emerald-400" />
                            : <FileText className="w-4 h-4 text-indigo-400" />}
                        </div>
                        <div>
                          <div className="text-xs font-semibold truncate max-w-[160px]">{msg.attachedFile.name}</div>
                          <div className="text-[10px] opacity-60">{msg.attachedFile.size}</div>
                        </div>
                      </div>
                    )}
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
          {/* Attachment preview chip */}
          <AnimatePresence>
            {attachedFile && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 w-fit max-w-full"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center shrink-0">
                  {attachedFile.type.startsWith('image/')
                    ? <Image className="w-3.5 h-3.5 text-emerald-400" />
                    : <FileText className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-indigo-300 font-medium truncate block max-w-[200px]">{attachedFile.name}</span>
                  <span className="text-[10px] text-gray-500">{attachedFile.size}</span>
                </div>
                <button onClick={() => setAttachedFile(null)} className="text-gray-500 hover:text-white ml-1 shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={activeTeam ? `Message #${activeTeam.name}...` : 'Select a team to chat'}
                disabled={!activeTeam}
                rows={1}
                className="w-full px-4 py-3 pr-24 rounded-2xl bg-white/5 border border-white/10 focus:border-indigo-500/30 focus:outline-none text-sm text-white placeholder-gray-600 resize-none transition-all leading-relaxed disabled:opacity-40"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-2">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-gray-600 hover:text-gray-300 transition-colors"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Emoji picker trigger */}
                <div className="relative" ref={emojiPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowEmoji(v => !v)}
                    className={`transition-colors ${showEmoji ? 'text-indigo-400' : 'text-gray-600 hover:text-gray-300'}`}
                    title="Emoji"
                  >
                    <Smile className="w-4 h-4" />
                  </button>

                  {/* Emoji panel */}
                  <AnimatePresence>
                    {showEmoji && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-8 right-0 w-72 glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
                      >
                        {/* Category tabs */}
                        <div className="flex gap-0.5 p-2 border-b border-white/5 overflow-x-auto scrollbar-none">
                          {EMOJI_GROUPS.map((g, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveEmojiGroup(idx)}
                              className={`shrink-0 text-base px-1.5 py-1 rounded-lg transition-all ${activeEmojiGroup === idx ? 'bg-indigo-600/30' : 'hover:bg-white/5'
                                }`}
                              title={g.label}
                            >
                              {g.emojis[0]}
                            </button>
                          ))}
                        </div>
                        {/* Emoji grid */}
                        <div className="p-2 grid grid-cols-8 gap-0.5 max-h-48 overflow-y-auto">
                          {EMOJI_GROUPS[activeEmojiGroup].emojis.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => handleEmojiClick(emoji)}
                              className="text-xl p-1.5 rounded-lg hover:bg-white/10 transition-all hover:scale-125 leading-none"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
            <button
              onClick={sendMessage}
              disabled={(!input.trim() && !attachedFile) || !activeTeam}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-100 shrink-0"
            >
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Create Channel Modal */}
    <AnimatePresence>
    {showCreateModal && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.2 }}
          className="glass rounded-2xl border border-white/10 p-6 w-full max-w-md shadow-2xl"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-white text-lg">Create a channel</h3>
              <p className="text-xs text-gray-500 mt-0.5">Channels are where your team communicates</p>
            </div>
            <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Channel Name</label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateChannel(); }}
                  placeholder="e.g. marketing"
                  autoFocus
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/40 focus:outline-none text-sm text-white placeholder-gray-600 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">Description <span className="text-gray-600 normal-case font-normal">(optional)</span></label>
              <textarea
                value={newChannelDesc}
                onChange={e => setNewChannelDesc(e.target.value)}
                placeholder="What's this channel about?"
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/40 focus:outline-none text-sm text-white placeholder-gray-600 resize-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={() => setShowCreateModal(false)}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateChannel}
              disabled={!newChannelName.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-sm font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Create Channel
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>

    {/* Call Connecting Toast */}
    <AnimatePresence>
      {callToast && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100]"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20 }}
            transition={{ duration: 0.25, type: 'spring', damping: 20 }}
            className="flex flex-col items-center gap-5"
          >
            {/* Animated ring */}
            <div className="relative">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center ${callToast.type === 'video' ? 'bg-gradient-to-br from-indigo-500 to-violet-600' : 'bg-gradient-to-br from-emerald-500 to-teal-600'}`}>
                {callToast.type === 'video'
                  ? <Video className="w-9 h-9 text-white" />
                  : <Phone className="w-9 h-9 text-white" />}
              </div>
              <div className={`absolute inset-0 rounded-full border-2 animate-ping opacity-40 ${callToast.type === 'video' ? 'border-indigo-400' : 'border-emerald-400'}`} />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">
                {callToast.type === 'video' ? 'Starting video call' : 'Starting audio call'}
              </p>
              <p className="text-gray-400 text-sm mt-1">Connecting to #{callToast.team}...</p>
            </div>
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${callToast.type === 'video' ? 'bg-indigo-400' : 'bg-emerald-400'} animate-bounce`}
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

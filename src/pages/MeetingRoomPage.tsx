import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, PhoneOff,
  MessageSquare, Users, Brain, MoreHorizontal, Hand, Smile,
  Volume2, Settings, Maximize, Send, X
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { TEAM_MEMBERS, CHAT_MESSAGES } from '../data/mockData';

const participants = TEAM_MEMBERS.slice(0, 6);

const reactions = ['👍', '❤️', '😄', '🎉', '🤔', '👏'];

// Helper to get initials color
const avatarColors = [
  'from-indigo-500 to-violet-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
];

export default function MeetingRoomPage() {
  const { isMuted, isCameraOff, isScreenSharing, isRecording, toggleMute, toggleCamera, toggleScreenShare, toggleRecording, endMeeting } = useAppStore();
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [chatMsg, setChatMsg] = useState('');
  const [messages, setMessages] = useState(CHAT_MESSAGES.slice(0, 5));
  const [elapsed, setElapsed] = useState(0);
  const [handRaised, setHandRaised] = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
      showNotification('Fullscreen mode enabled');
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
        showNotification('Fullscreen mode disabled');
      }
    }
  };
  const [aiTranscript] = useState<string[]>([
    '...discussing the sprint velocity and action items for this cycle.',
    'Key point: Video recording feature deployed successfully.',
    'Action item identified: PR #142 to be reviewed by Mike.',
  ]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const sendMessage = () => {
    if (!chatMsg.trim()) return;
    setMessages(prev => [...prev, {
      id: `c${Date.now()}`,
      sender: 'Alex Johnson',
      avatar: 'AJ',
      message: chatMsg,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      type: 'text'
    }]);
    setChatMsg('');
  };

  const triggerReaction = (emoji: string) => {
    setActiveReaction(emoji);
    setShowReactions(false);
    setTimeout(() => setActiveReaction(null), 2500);
  };

  return (
    <div className="fixed inset-0 bg-[#070b14] flex flex-col z-40">
      {/* Top Bar */}
      <div className="h-14 glass-dark border-b border-white/5 flex items-center px-4 gap-4 shrink-0">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 status-live" />
            <span className="text-sm font-bold text-white">Sprint Review - Q2 2026</span>
          </div>
          <span className="text-xs text-gray-500">·</span>
          <span className="text-xs text-gray-400 font-mono">{formatTime(elapsed)}</span>
          {isRecording && (
            <span className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 rec-dot" />
              Recording
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 flex items-center gap-1.5 mr-2">
            <Users className="w-3.5 h-3.5" /> {participants.length} participants
          </span>
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullScreen}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-4 grid grid-cols-3 gap-3 overflow-hidden relative">
          {participants.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.08 }}
              className={`relative rounded-2xl overflow-hidden border border-white/5 group ${i === 0 ? 'col-span-2 row-span-2' : ''}`}
              style={{ background: 'linear-gradient(135deg, #0d1117 0%, #1a1f2e 100%)', minHeight: i === 0 ? '300px' : '140px' }}
            >
              {/* Video placeholder - gradient avatar */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-xl font-black shadow-lg ${i === 0 ? 'w-24 h-24 text-2xl' : ''}`}>
                  {p.avatar}
                </div>
              </div>

              {/* Animated border for speaker */}
              {i === 0 && (
                <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500/60 pointer-events-none" />
              )}

              {/* Participant info */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{p.name.split(' ')[0]}{i === 0 ? ' (Host)' : ''}</span>
                    {i === 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-live" />}
                  </div>
                  <div className="flex items-center gap-1">
                    {Math.random() > 0.5 && <MicOff className="w-3 h-3 text-red-400" />}
                  </div>
                </div>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all rounded-2xl pointer-events-none" />
            </motion.div>
          ))}

          {/* My video tile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="relative rounded-2xl overflow-hidden border border-indigo-500/30"
            style={{ background: 'linear-gradient(135deg, #1a1520 0%, #2d1b4e 100%)', minHeight: '140px' }}
          >
            {isCameraOff ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg font-black">AJ</div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-lg font-black">AJ</div>
              </div>
            )}
            <div className="absolute inset-0 rounded-2xl border-2 border-indigo-500/40 pointer-events-none" />
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-white">You</span>
              <div className="flex items-center gap-1">
                {isMuted && <MicOff className="w-3 h-3 text-red-400" />}
                {isCameraOff && <VideoOff className="w-3 h-3 text-red-400" />}
              </div>
            </div>
          </motion.div>

          {/* Floating Reaction */}
          <AnimatePresence>
            {activeReaction && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 0 }}
                animate={{ opacity: 1, scale: 1.5, y: -60 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute bottom-24 left-1/2 -translate-x-1/2 text-4xl pointer-events-none z-50"
              >
                {activeReaction}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hand Raised */}
          <AnimatePresence>
            {handRaised && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-xs text-amber-400"
              >
                ✋ You raised your hand
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Side Panels */}
        <AnimatePresence>
          {(showChat || showParticipants || showAIPanel) && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="glass-dark border-l border-white/5 flex flex-col overflow-hidden shrink-0"
            >
              {/* Panel Tabs */}
              <div className="flex items-center border-b border-white/5 shrink-0">
                {[
                  { key: 'chat', label: 'Chat', icon: MessageSquare, action: () => { setShowChat(true); setShowParticipants(false); setShowAIPanel(false); } },
                  { key: 'participants', label: 'People', icon: Users, action: () => { setShowParticipants(true); setShowChat(false); setShowAIPanel(false); } },
                  { key: 'ai', label: 'AI Live', icon: Brain, action: () => { setShowAIPanel(true); setShowChat(false); setShowParticipants(false); } },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={tab.action}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-all ${(tab.key === 'chat' && showChat) || (tab.key === 'participants' && showParticipants) || (tab.key === 'ai' && showAIPanel)
                        ? 'text-indigo-400 border-b-2 border-indigo-500'
                        : 'text-gray-500 hover:text-gray-300'
                      }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
                <button
                  onClick={() => { setShowChat(false); setShowParticipants(false); setShowAIPanel(false); }}
                  className="p-3 text-gray-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Panel */}
              {showChat && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex items-start gap-2 ${msg.isMe ? 'flex-row-reverse' : ''}`}>
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-bold shrink-0">
                          {msg.avatar}
                        </div>
                        <div className={`max-w-[70%] ${msg.isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                          {!msg.isMe && <span className="text-[10px] text-gray-500">{msg.sender}</span>}
                          <div className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${msg.isMe ? 'bg-indigo-600/40 text-indigo-100 rounded-tr-sm' : 'bg-white/5 text-gray-300 rounded-tl-sm'}`}>
                            {msg.message}
                          </div>
                          <span className="text-[10px] text-gray-600">{msg.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-white/5 flex gap-2">
                    <input
                      value={chatMsg}
                      onChange={(e) => setChatMsg(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Message everyone..."
                      className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500/40 focus:outline-none text-xs text-white placeholder-gray-600"
                    />
                    <button onClick={sendMessage} className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all">
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Participants Panel */}
              {showParticipants && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  <p className="text-xs text-gray-500 mb-3">In this meeting ({participants.length + 1})</p>
                  {/* Me first */}
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold shrink-0">AJ</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-white">Alex Johnson (You)</div>
                      <div className="text-xs text-gray-500">Host · Admin</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isMuted ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </div>
                  {participants.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/3 transition-all">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-xs font-bold shrink-0`}>
                        {p.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-white truncate">{p.name}</div>
                        <div className="text-xs text-gray-500">{p.team}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        {i % 3 === 0 ? <MicOff className="w-3 h-3 text-red-400" /> : <Mic className="w-3 h-3 text-emerald-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* AI Live Panel */}
              {showAIPanel && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3 border-b border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(b => (
                          <div key={b} className="w-1 bg-indigo-400 rounded-full ai-wave-bar" style={{ height: '12px' }} />
                        ))}
                      </div>
                      <span className="text-xs text-indigo-300 font-semibold">AI Transcribing Live</span>
                    </div>
                    <p className="text-xs text-gray-500">Real-time transcription with 89% accuracy</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Live Transcript</p>
                    {aiTranscript.map((line, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs text-gray-300 bg-white/3 rounded-lg p-2.5 leading-relaxed border border-white/5"
                      >
                        {line}
                      </motion.div>
                    ))}
                    <div className="flex items-center gap-2 text-xs text-gray-600 italic px-1">
                      <div className="flex gap-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500 typing-dot" />
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500 typing-dot" />
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-500 typing-dot" />
                      </div>
                      Processing...
                    </div>
                  </div>
                  <div className="p-3 border-t border-white/5">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                      <p className="text-xs text-indigo-300 font-semibold mb-1">🤖 AI Insight</p>
                      <p className="text-xs text-gray-400">Action item detected: "Mike will review PR #142 by Thursday"</p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Bar */}
      <div className="h-20 glass-dark border-t border-white/5 flex items-center justify-between px-6 shrink-0">
        {/* Left Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${isMuted ? 'bg-red-500/20 border border-red-500/30 text-red-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px]">{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
          <button
            onClick={toggleCamera}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${isCameraOff ? 'bg-red-500/20 border border-red-500/30 text-red-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            <span className="text-[10px]">{isCameraOff ? 'Start Cam' : 'Stop Cam'}</span>
          </button>
          <button
            onClick={toggleScreenShare}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${isScreenSharing ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
            <span className="text-[10px]">{isScreenSharing ? 'Stop Share' : 'Share'}</span>
          </button>
          <button
            onClick={toggleRecording}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500/20 border border-red-500/30 text-red-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            <Maximize className="w-5 h-5" />
            <span className="text-[10px]">{isRecording ? 'Stop Rec' : 'Record'}</span>
          </button>
        </div>

        {/* Center Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setHandRaised(!handRaised)}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${handRaised ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            <Hand className="w-5 h-5" />
            <span className="text-[10px]">Hand</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 transition-all"
            >
              <Smile className="w-5 h-5" />
              <span className="text-[10px]">React</span>
            </button>
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-2 glass rounded-xl p-2 border border-white/10"
                >
                  {reactions.map(r => (
                    <button key={r} onClick={() => triggerReaction(r)} className="text-xl hover:scale-125 transition-transform cursor-pointer">
                      {r}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              showNotification(audioEnabled ? 'Workspace audio muted' : 'Workspace audio unmuted');
            }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all cursor-pointer ${!audioEnabled ? 'bg-red-500/20 border border-red-500/30 text-red-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            <span className="text-[10px]">Audio</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowChat(!showChat); if (!showChat) { setShowParticipants(false); setShowAIPanel(false); } }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${showChat ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px]">Chat</span>
          </button>
          <button
            onClick={() => { setShowParticipants(!showParticipants); if (!showParticipants) { setShowChat(false); setShowAIPanel(false); } }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${showParticipants ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">People</span>
          </button>
          <button
            onClick={() => { setShowAIPanel(!showAIPanel); if (!showAIPanel) { setShowChat(false); setShowParticipants(false); } }}
            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${showAIPanel ? 'bg-violet-500/20 border border-violet-500/30 text-violet-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
          >
            <Brain className="w-5 h-5" />
            <span className="text-[10px]">AI Live</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all cursor-pointer ${showMoreMenu ? 'bg-indigo-500/20 border border-indigo-500/30 text-indigo-400' : 'bg-white/5 hover:bg-white/10 text-gray-300'}`}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px]">More</span>
            </button>
            <AnimatePresence>
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-2 w-48 glass rounded-xl p-2 border border-white/10 flex flex-col gap-1 z-50"
                >
                  {[
                    { label: 'Change Layout', action: () => showNotification('Spotlight mode layout selected') },
                    { label: 'Blur Background', action: () => showNotification('Virtual background blur applied') },
                    { label: 'Troubleshoot', action: () => setShowSettingsModal(true) },
                    { label: 'Meeting Info', action: () => showNotification('Meeting link copied to clipboard!') },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); setShowMoreMenu(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-xs text-gray-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* End Call */}
          <button
            onClick={endMeeting}
            className="flex flex-col items-center gap-1 p-3 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-white transition-all hover:scale-105"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-[10px]">End</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md glass-dark rounded-2xl border border-white/10 p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 pointer-events-none" />
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-400" />
                  Meeting Settings
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6 relative z-10">
                {/* Audio Device */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Microphone</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/40">
                    <option className="bg-[#0b0f19]">Default Microphone (System Audio)</option>
                    <option className="bg-[#0b0f19]">External Mic (High Definition)</option>
                  </select>
                </div>

                {/* Video Device */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Camera</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/40">
                    <option className="bg-[#0b0f19]">Integrated Webcam (1080p HD)</option>
                    <option className="bg-[#0b0f19]">OBS Virtual Camera</option>
                  </select>
                </div>

                {/* Speaker Output */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Speaker Output</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500/40">
                    <option className="bg-[#0b0f19]">System Speakers (Realtek Audio)</option>
                    <option className="bg-[#0b0f19]">Wireless Headphones (Stereo)</option>
                  </select>
                </div>

                {/* Noise suppression toggle */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                  <div>
                    <h5 className="text-xs font-bold text-white">AI Noise Suppression</h5>
                    <p className="text-[10px] text-gray-500">Filter out background clatter</p>
                  </div>
                  <button className="w-10 h-6 bg-indigo-600 rounded-full flex items-center justify-end px-1.5 transition-all cursor-pointer">
                    <span className="w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 relative z-10">
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-5 py-2 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl bg-indigo-600/90 backdrop-blur-md text-white text-xs font-bold shadow-xl border border-indigo-500/30 z-50 flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

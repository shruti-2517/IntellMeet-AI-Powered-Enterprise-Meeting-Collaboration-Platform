import { motion } from 'framer-motion';
import { Menu, Search, Bell, Plus, Wifi, Clock } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useState, useEffect } from 'react';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  'meeting-lobby': 'Meetings',
  'meeting-room': 'Meeting Room',
  'ai-summary': 'AI Summary',
  'team-workspace': 'Team Workspace',
  kanban: 'Kanban Board',
  analytics: 'Analytics & Insights',
  chat: 'Team Chat',
  profile: 'My Profile',
  settings: 'Settings',
  notifications: 'Notifications',
};

export default function Topbar() {
  const { currentPage, toggleSidebar, unreadCount, setPage, startMeeting } = useAppStore();
  const [time, setTime] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const title = pageTitles[currentPage] || 'IntellMeet';

  return (
    <header className="h-16 glass-dark border-b border-white/5 flex items-center px-4 gap-4 sticky top-0 z-20">
      {/* Menu Toggle */}
      <button
        onClick={toggleSidebar}
        className="w-9 h-9 rounded-xl hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Title */}
      <motion.h1
        key={currentPage}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-bold text-white hidden sm:block"
      >
        {title}
      </motion.h1>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative">
        {searchOpen ? (
          <motion.input
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 200, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            type="text"
            placeholder="Search meetings, people..."
            onBlur={() => setSearchOpen(false)}
            autoFocus
            className="w-48 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/40"
          />
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="w-9 h-9 rounded-xl hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Clock */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl glass border border-white/5 text-xs text-gray-400">
        <Clock className="w-3.5 h-3.5" />
        <span className="font-mono">
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Connection Status */}
      <div className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-400">
        <Wifi className="w-3.5 h-3.5" />
        <span>Connected</span>
      </div>

      {/* Quick New Meeting */}
      <button
        onClick={startMeeting}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600/80 to-violet-600/80 hover:from-indigo-500 hover:to-violet-500 text-sm font-medium transition-all hidden sm:flex"
      >
        <Plus className="w-3.5 h-3.5" />
        Meet
      </button>

      {/* Notifications */}
      <button
        onClick={() => setPage('notifications')}
        className="relative w-9 h-9 rounded-xl hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-all"
      >
        <Bell className="w-4.5 h-4.5" style={{ width: '18px', height: '18px' }} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>
    </header>
  );
}

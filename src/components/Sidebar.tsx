import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Video, Brain, Users, KanbanSquare, BarChart3, MessageSquare,
  Bell, Settings, User, LogOut, ChevronRight, Plus, Video as VideoIcon
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { Page } from '@/services/auth.service';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard' as Page, badge: null },
  { icon: Video, label: 'Meetings', page: 'meeting-lobby' as Page, badge: '3' },
  { icon: Brain, label: 'AI Summary', page: 'ai-summary' as Page, badge: null },
  { icon: MessageSquare, label: 'Team Chat', page: 'chat' as Page, badge: '5' },
  { icon: Users, label: 'Team Space', page: 'team-workspace' as Page, badge: null },
  { icon: KanbanSquare, label: 'Kanban Board', page: 'kanban' as Page, badge: null },
  { icon: BarChart3, label: 'Analytics', page: 'analytics' as Page, badge: null },
];

const bottomItems = [
  { icon: Bell, label: 'Notifications', page: 'notifications' as Page },
  { icon: User, label: 'Profile', page: 'profile' as Page },
  { icon: Settings, label: 'Settings', page: 'settings' as Page },
];

export default function Sidebar() {
  const { currentPage, isSidebarOpen, currentUser, unreadCount, setPage, toggleSidebar, startMeeting, logout } = useAppStore();

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 240 : 64 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-0 bottom-0 z-30 glass-dark border-r border-white/5 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 glow-indigo">
            <VideoIcon className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-black text-lg whitespace-nowrap overflow-hidden"
              >
                <span className="gradient-text">Intell</span>Meet
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* New Meeting Button */}
        <div className="p-3 border-b border-white/5 shrink-0">
          <button
            onClick={startMeeting}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600/80 to-violet-600/80 hover:from-indigo-500 hover:to-violet-500 transition-all group"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-semibold whitespace-nowrap"
                >
                  New Meeting
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.page;
            return (
              <button
                key={item.page}
                onClick={() => setPage(item.page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group relative
                  ${isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'
                  }`}
              >
                <item.icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-indigo-400' : ''}`} style={{ width: '18px', height: '18px' }} />
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium whitespace-nowrap flex-1 text-left"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isSidebarOpen && item.badge && (
                  <span className="text-xs bg-indigo-600/60 text-indigo-200 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                    {item.badge}
                  </span>
                )}
                {isSidebarOpen && item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="text-xs bg-red-500/80 text-white px-1.5 py-0.5 rounded-full font-medium shrink-0">
                    {unreadCount}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-indigo-500 rounded-r-full"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-white/5 space-y-1 shrink-0">
          {bottomItems.map((item) => {
            const isActive = currentPage === item.page;
            const showBadge = item.label === 'Notifications' && unreadCount > 0;
            return (
              <button
                key={item.page}
                onClick={() => setPage(item.page)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all
                  ${isActive ? 'bg-white/8 text-white' : 'text-gray-500 hover:text-gray-200 hover:bg-white/5'}`}
              >
                <div className="relative shrink-0">
                  <item.icon style={{ width: '18px', height: '18px' }} />
                  {showBadge && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium whitespace-nowrap">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            );
          })}

          {/* User Avatar */}
          <div className={`flex items-center gap-3 px-3 py-2.5 mt-2 rounded-xl glass border border-white/5 cursor-pointer hover:border-indigo-500/20 transition-all`}
            onClick={() => setPage('profile')}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold shrink-0">
              {currentUser?.avatar ?? '?'}
            </div>
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{currentUser?.name ?? 'User'}</div>
                  <div className="text-xs text-gray-500 truncate capitalize">{currentUser?.role ?? 'member'}</div>
                </motion.div>
              )}
            </AnimatePresence>
            {isSidebarOpen && (
              <button
                onClick={(e) => { e.stopPropagation(); logout(); }}
                title="Logout"
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                <LogOut style={{ width: '14px', height: '14px' }} />
              </button>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute top-1/2 -right-3 w-6 h-6 rounded-full glass border border-white/10 flex items-center justify-center hover:border-indigo-500/30 transition-all z-10 bg-[#0d1117]"
        >
          <ChevronRight
            className={`w-3 h-3 text-gray-400 transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </motion.aside>
    </>
  );
}

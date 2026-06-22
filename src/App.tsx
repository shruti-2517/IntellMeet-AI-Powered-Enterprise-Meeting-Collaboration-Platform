import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from './store/useAppStore';
import { Page } from './services/auth.service';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import MeetingLobbyPage from './pages/MeetingLobbyPage';
import MeetingRoomPage from './pages/MeetingRoomPage';
import AISummaryPage from './pages/AISummaryPage';
import TeamWorkspacePage from './pages/TeamWorkspacePage';
import KanbanPage from './pages/KanbanPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';

// Layout components
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

const authPages: Page[] = ['landing', 'login', 'register'];
const meetingPages: Page[] = ['meeting-room'];

function PageContent({ page }: { page: Page }) {
  switch (page) {
    case 'dashboard': return <DashboardPage />;
    case 'meeting-lobby': return <MeetingLobbyPage />;
    case 'ai-summary': return <AISummaryPage />;
    case 'team-workspace': return <TeamWorkspacePage />;
    case 'kanban': return <KanbanPage />;
    case 'analytics': return <AnalyticsPage />;
    case 'chat': return <ChatPage />;
    case 'profile': return <ProfilePage />;
    case 'settings': return <SettingsPage />;
    case 'notifications': return <NotificationsPage />;
    default: return <DashboardPage />;
  }
}

export default function App() {
  const { currentPage, isSidebarOpen, isAuthenticated, isAuthLoading, restoreSession, setPage } = useAppStore();

  // Restore session from stored token on mount
  useEffect(() => {
    restoreSession();
  }, []);

  // Auth guard: redirect to login if trying to access app pages without auth
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated && !authPages.includes(currentPage)) {
      setPage('landing');
    }
  }, [isAuthenticated, isAuthLoading, currentPage]);

  // Full-screen loading spinner while restoring session
  if (isAuthLoading && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.845v6.31a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
            </svg>
          </div>
          <div className="w-6 h-6 border-2 border-white/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Restoring session...</p>
        </div>
      </div>
    );
  }

  // Landing / Auth — no sidebar/topbar
  if (authPages.includes(currentPage)) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key={currentPage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {currentPage === 'landing' && <LandingPage />}
          {currentPage === 'login' && <AuthPage mode="login" />}
          {currentPage === 'register' && <AuthPage mode="register" />}
        </motion.div>
      </AnimatePresence>
    );
  }

  // Meeting Room — full screen, no sidebar
  if (meetingPages.includes(currentPage)) {
    return <MeetingRoomPage />;
  }

  // App shell — sidebar + topbar + content
  const sidebarWidth = isSidebarOpen ? 240 : 64;

  return (
    <div className="flex h-screen bg-mesh overflow-hidden">
      <Sidebar />

      {/* Main content shifts based on sidebar width */}
      <motion.div
        animate={{ marginLeft: sidebarWidth }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="flex-1 flex flex-col overflow-hidden min-w-0"
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              <PageContent page={currentPage} />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer */}
        <div className="h-7 glass-dark border-t border-white/5 flex items-center justify-center px-4 shrink-0">
          <p className="text-xs text-gray-700">
            © 2026 <span className="text-gray-500 font-semibold">Zidio Development</span> · IntellMeet v2.0 Industry Edition · MERN Full-Stack Platform
          </p>
        </div>
      </motion.div>
    </div>
  );
}

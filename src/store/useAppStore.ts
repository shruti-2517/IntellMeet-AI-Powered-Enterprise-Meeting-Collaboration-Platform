import { create } from 'zustand';
import { authService } from '../services/auth.service';

export type Page =
  | 'landing'
  | 'login'
  | 'register'
  | 'dashboard'
  | 'meeting-room'
  | 'meeting-lobby'
  | 'ai-summary'
  | 'team-workspace'
  | 'kanban'
  | 'analytics'
  | 'chat'
  | 'profile'
  | 'settings'
  | 'notifications';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'member' | 'guest';
  teams?: string[];
  status: 'online' | 'away' | 'busy' | 'offline';
  bio?: string;
}

export interface Notification {
  id: string;
  type: 'meeting' | 'action' | 'mention' | 'system';
  message: string;
  time: string;
  read: boolean;
}

export interface PendingChatMember {
  id: string;
  name: string;
  avatar: string;
}

interface AppState {
  // ── Navigation ────────────────────────────────────────────────────────────
  currentPage: Page;
  isSidebarOpen: boolean;

  // ── Auth ──────────────────────────────────────────────────────────────────
  currentUser: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authError: string | null;

  // ── Meeting ───────────────────────────────────────────────────────────────
  isMeetingActive: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  isAISummaryGenerating: boolean;

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: Notification[];
  unreadCount: number;

  // ── Chat ──────────────────────────────────────────────────────────────────
  /** Member to open a DM with when navigating to chat page */
  pendingChatMember: PendingChatMember | null;

  // ── Actions ───────────────────────────────────────────────────────────────
  setPage: (page: Page) => void;
  toggleSidebar: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleScreenShare: () => void;
  toggleRecording: () => void;
  startMeeting: (options?: { isMuted?: boolean; isCameraOff?: boolean }) => void;
  endMeeting: () => void;
  setPendingChatMember: (member: PendingChatMember | null) => void;

  // ── Auth Actions ──────────────────────────────────────────────────────────
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;

  // ── Notification Actions ──────────────────────────────────────────────────
  setNotifications: (notifications: Notification[]) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
}

/** Map backend user object → frontend User shape */
function mapUser(backendUser: Record<string, unknown>): User {
  const name = (backendUser.name as string) || 'User';
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return {
    id: (backendUser._id as string) || (backendUser.id as string) || '',
    name,
    email: (backendUser.email as string) || '',
    avatar: initials,
    role: ((backendUser.role as string) || 'member') as User['role'],
    teams: (backendUser.teams as string[]) || [],
    status: 'online',
    bio: (backendUser.bio as string) || '',
  };
}

export const useAppStore = create<AppState>((set) => ({
  // ── Initial State ─────────────────────────────────────────────────────────
  currentPage: 'landing',
  isSidebarOpen: true,
  currentUser: null,
  isAuthenticated: false,
  isAuthLoading: false,
  authError: null,
  isMeetingActive: false,
  isMuted: false,
  isCameraOff: false,
  isScreenSharing: false,
  isRecording: false,
  isAISummaryGenerating: false,
  notifications: [],
  unreadCount: 0,
  pendingChatMember: null,

  // ── Navigation ────────────────────────────────────────────────────────────
  setPage: (page) => set({ currentPage: page }),
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  setPendingChatMember: (member) => set({ pendingChatMember: member }),

  // ── Meeting Controls ──────────────────────────────────────────────────────
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleCamera: () => set((s) => ({ isCameraOff: !s.isCameraOff })),
  toggleScreenShare: () => set((s) => ({ isScreenSharing: !s.isScreenSharing })),
  toggleRecording: () => set((s) => ({ isRecording: !s.isRecording })),
  startMeeting: (options) =>
    set((s) => ({
      isMeetingActive: true,
      currentPage: 'meeting-room',
      isMuted: options?.isMuted !== undefined ? options.isMuted : false,
      isCameraOff: options?.isCameraOff !== undefined ? options.isCameraOff : false,
    })),
  endMeeting: () => set({ isMeetingActive: false, currentPage: 'ai-summary' }),

  // ── Auth Actions ──────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ isAuthLoading: true, authError: null });
    try {
      const result = await authService.login({ email, password });
      const token = result?.accessToken || result?.token;
      if (token) localStorage.setItem('accessToken', token);
      const user = mapUser(result?.user || result);
      set({ currentUser: user, isAuthenticated: true, isAuthLoading: false, currentPage: 'dashboard' });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed. Check your credentials.';
      set({ authError: msg, isAuthLoading: false });
      throw new Error(msg);
    }
  },

  register: async (name, email, password) => {
    set({ isAuthLoading: true, authError: null });
    try {
      const result = await authService.register({ name, email, password });
      const token = result?.accessToken || result?.token;
      if (token) localStorage.setItem('accessToken', token);
      const user = result?.user ? mapUser(result.user) : null;
      if (user) {
        set({ currentUser: user, isAuthenticated: true, isAuthLoading: false, currentPage: 'dashboard' });
      } else {
        // Registration might require email verification
        set({ isAuthLoading: false, currentPage: 'login' });
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed. Please try again.';
      set({ authError: msg, isAuthLoading: false });
      throw new Error(msg);
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('accessToken');
    set({ currentUser: null, isAuthenticated: false, currentPage: 'landing', notifications: [], unreadCount: 0 });
  },

  restoreSession: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    set({ isAuthLoading: true });
    try {
      const user = await authService.getMe();
      set({ currentUser: mapUser(user), isAuthenticated: true, isAuthLoading: false });
    } catch {
      localStorage.removeItem('accessToken');
      set({ isAuthLoading: false, isAuthenticated: false });
    }
  },

  // ── Notification Actions ──────────────────────────────────────────────────
  setNotifications: (notifications) =>
    set({ notifications, unreadCount: notifications.filter((n) => !n.read).length }),

  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),

  markAllRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
}));

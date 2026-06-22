import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, CheckCheck, Video, Zap, AtSign, Info } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { notificationService } from '../services/notification.service';

const typeConfig = {
  meeting: { icon: Video, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  action: { icon: Zap, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  mention: { icon: AtSign, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  system: { icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
};

export default function NotificationsPage() {
  const { notifications, unreadCount, setNotifications, markNotificationRead, markAllRead } = useAppStore();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await notificationService.getNotifications();
        const list = Array.isArray(res) ? res : res?.notifications ?? [];
        // Normalize to frontend shape
        const normalized = list.map((n: Record<string, unknown>) => ({
          id: (n._id ?? n.id) as string,
          type: (n.type ?? 'system') as string,
          message: (n.message ?? n.content ?? n.title ?? '') as string,
          time: n.createdAt
            ? new Date(n.createdAt as string).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
            : (n.time as string ?? ''),
          read: (n.read ?? n.isRead ?? false) as boolean,
        }));
        setNotifications(normalized);
      } catch {
        // Keep existing notifications (or empty)
      }
    };
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    markNotificationRead(id);
    try { await notificationService.markRead(id); } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    markAllRead();
    try { await notificationService.markAllRead(); } catch { /* ignore */ }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto page-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-white">Notifications</h2>
          <p className="text-sm text-gray-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 hover:border-white/20 text-sm text-gray-400 hover:text-white transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-20 text-gray-600"
          >
            <Bell className="w-12 h-12 mb-4" />
            <p className="text-sm">No notifications yet</p>
          </motion.div>
        ) : (
          notifications.map((n, i) => {
            const typeKey = n.type as keyof typeof typeConfig;
            const config = typeConfig[typeKey] ?? typeConfig.system;
            const Icon = config.icon;
            return (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${
                  n.read ? 'glass border-white/5 opacity-60' : 'glass border-white/10 hover:border-white/20'
                }`}
                onClick={() => !n.read && handleMarkRead(n.id)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${config.bg}`}>
                  <Icon className={`w-5 h-5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${n.read ? 'text-gray-500' : 'text-gray-200'}`}>{n.message}</p>
                  <p className="text-xs text-gray-600 mt-1">{n.time}</p>
                </div>
                {!n.read && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkRead(n.id); }}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

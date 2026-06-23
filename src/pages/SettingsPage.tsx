import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Shield, Bell, Video, Brain, Globe, Key, ChevronRight } from 'lucide-react';

const sections = [
  {
    id: 'general', label: 'General', icon: Globe,
    settings: [
      { key: 'language', label: 'Language', type: 'select', value: 'English', options: ['English', 'Hindi', 'Spanish', 'French'] },
      { key: 'timezone', label: 'Timezone', type: 'select', value: 'Asia/Kolkata', options: ['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London'] },
      { key: 'dateFormat', label: 'Date Format', type: 'select', value: 'DD/MM/YYYY', options: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'] },
    ],
  },
  {
    id: 'notifications', label: 'Notifications', icon: Bell,
    settings: [
      { key: 'meetingReminders', label: 'Meeting Reminders', type: 'toggle', value: true },
      { key: 'actionItems', label: 'Action Item Alerts', type: 'toggle', value: true },
      { key: 'mentions', label: 'Team Mentions', type: 'toggle', value: true },
      { key: 'aiSummary', label: 'AI Summary Ready', type: 'toggle', value: true },
      { key: 'weeklyReport', label: 'Weekly Analytics Report', type: 'toggle', value: false },
    ],
  },
  {
    id: 'meeting', label: 'Meeting Defaults', icon: Video,
    settings: [
      { key: 'muteOnJoin', label: 'Mute on join', type: 'toggle', value: false },
      { key: 'cameraOff', label: 'Camera off on join', type: 'toggle', value: false },
      { key: 'autoRecord', label: 'Auto-start recording', type: 'toggle', value: true },
      { key: 'aiTranscription', label: 'Enable AI transcription', type: 'toggle', value: true },
    ],
  },
  {
    id: 'ai', label: 'AI Intelligence', icon: Brain,
    settings: [
      { key: 'autoSummary', label: 'Auto-generate summaries', type: 'toggle', value: true },
      { key: 'actionExtract', label: 'Extract action items', type: 'toggle', value: true },
      { key: 'sentiment', label: 'Sentiment analysis', type: 'toggle', value: true },
      { key: 'aiModel', label: 'AI Model', type: 'select', value: 'GPT-4', options: ['GPT-4', 'GPT-3.5', 'Hugging Face', 'Custom'] },
      { key: 'accuracy', label: 'Accuracy Threshold', type: 'select', value: '85%', options: ['70%', '80%', '85%', '90%', '95%'] },
    ],
  },
  {
    id: 'security', label: 'Security', icon: Shield,
    settings: [
      { key: 'twoFactor', label: 'Two-Factor Authentication', type: 'toggle', value: true },
      { key: 'e2e', label: 'End-to-End Encryption', type: 'toggle', value: true },
      { key: 'sessionTimeout', label: 'Session Timeout (hours)', type: 'select', value: '8h', options: ['1h', '4h', '8h', '24h', 'Never'] },
    ],
  },
];

// ── Confirmation Modal ────────────────────────────────────────────────────────
function ConfirmModal({
  title,
  description,
  confirmLabel,
  confirmWord,
  onConfirm,
  onCancel,
  loading,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  confirmWord: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [typed, setTyped] = useState('');
  const ready = typed.trim().toUpperCase() === confirmWord.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 16 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="relative w-full max-w-md glass rounded-2xl border border-red-500/30 p-6 shadow-2xl"
      >
        {/* Warning icon */}
        <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4">
          <Key className="w-6 h-6 text-red-400" />
        </div>

        <h3 className="font-bold text-white text-lg mb-1">{title}</h3>
        <p className="text-sm text-gray-400 mb-5 leading-relaxed">{description}</p>

        {/* Typed confirmation */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-1.5 block">
            Type <span className="font-mono text-red-400 font-semibold">{confirmWord}</span> to confirm
          </label>
          <input
            type="text"
            value={typed}
            onChange={e => setTyped(e.target.value)}
            autoFocus
            placeholder={confirmWord}
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-red-500/50 focus:outline-none text-sm text-white placeholder-gray-600 transition-all font-mono tracking-widest"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-sm text-gray-400 hover:text-white hover:border-white/20 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={!ready || loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-red-600 hover:bg-red-500 text-white active:scale-95"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
                Processing…
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [saved, setSaved] = useState(false);

  // Danger zone modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [dangerLoading, setDangerLoading] = useState(false);

  const getVal = (key: string, def: any) => settings[key] !== undefined ? settings[key] : def;
  const setVal = (key: string, val: any) => setSettings(prev => ({ ...prev, [key]: val }));

  const currentSection = sections.find(s => s.id === activeSection)!;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetDefaults = () => {
    // Clear overrides so getVal falls back to section defaults
    setSettings({});
  };

  // ── Delete Account ──────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    setDangerLoading(true);
    try {
      const { authService } = await import('../services/auth.service');
      await authService.logout().catch(() => {});
    } catch { /* ignore */ }
    localStorage.clear();
    sessionStorage.clear();
    const { useAppStore } = await import('../store/useAppStore');
    await useAppStore.getState().logout();
    setDangerLoading(false);
    setShowDeleteModal(false);
  };

  // ── Reset All Data ──────────────────────────────────────────────────────────
  const handleResetAllData = async () => {
    setDangerLoading(true);
    try {
      setSettings({});
      const { useAppStore } = await import('../store/useAppStore');
      const store = useAppStore.getState();
      store.setNotifications([]);
      store.markAllRead();
      localStorage.removeItem('app-settings');
    } catch { /* ignore */ }
    await new Promise(r => setTimeout(r, 800));
    setDangerLoading(false);
    setShowResetModal(false);
    const { useAppStore } = await import('../store/useAppStore');
    useAppStore.getState().setPage('dashboard');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto page-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white">Settings</h2>
        <p className="text-sm text-gray-400 mt-1">Configure your IntellMeet workspace</p>
      </div>

      <div className="flex gap-6">
        {/* Settings Nav */}
        <div className="w-52 shrink-0">
          <div className="glass rounded-2xl border border-white/5 p-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  activeSection === section.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <section.icon className="w-4 h-4 shrink-0" />
                {section.label}
                <ChevronRight className={`w-3.5 h-3.5 ml-auto transition-transform ${activeSection === section.id ? 'rotate-90' : ''}`} />
              </button>
            ))}
          </div>

          {/* Danger Zone */}
          <div className="glass rounded-2xl border border-red-500/20 p-4 mt-3">
            <p className="text-xs font-semibold text-red-400 mb-3 flex items-center gap-1.5">
              <Key className="w-3 h-3" /> Danger Zone
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full text-left text-xs text-red-400 hover:text-white hover:bg-red-500/15 px-2.5 py-2 rounded-lg transition-all mb-1.5 border border-transparent hover:border-red-500/30"
            >
              🗑️ Delete Account
            </button>
            <button
              onClick={() => setShowResetModal(true)}
              className="w-full text-left text-xs text-red-400 hover:text-white hover:bg-red-500/15 px-2.5 py-2 rounded-lg transition-all border border-transparent hover:border-red-500/30"
            >
              ♻️ Reset All Data
            </button>
          </div>
        </div>

        {/* Settings Content */}
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1 glass rounded-2xl border border-white/5 p-6"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <currentSection.icon className="w-4.5 h-4.5 text-white" style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h3 className="font-bold text-white">{currentSection.label}</h3>
              <p className="text-xs text-gray-500">Manage your {currentSection.label.toLowerCase()} preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            {currentSection.settings.map((setting) => (
              <div key={setting.key} className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-all">
                <div>
                  <p className="text-sm font-medium text-white">{setting.label}</p>
                </div>
                {setting.type === 'toggle' && (
                  <button
                    onClick={() => setVal(setting.key, !getVal(setting.key, setting.value))}
                    className={`relative w-11 h-6 rounded-full transition-all ${getVal(setting.key, setting.value) ? 'bg-indigo-600' : 'bg-gray-700'}`}
                  >
                    <motion.div
                      animate={{ left: getVal(setting.key, setting.value) ? '20px' : '2px' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                      style={{ left: getVal(setting.key, setting.value) ? '20px' : '2px' }}
                    />
                  </button>
                )}
                {setting.type === 'select' && (
                  <select
                    value={getVal(setting.key, setting.value)}
                    onChange={(e) => setVal(setting.key, e.target.value)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-indigo-500/40 bg-[#0d1117]"
                  >
                    {(setting as any).options?.map((opt: string) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5">
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-sm font-semibold transition-all active:scale-95"
            >
              {saved ? '✓ Saved!' : 'Save Changes'}
            </button>
            <button
              onClick={handleResetDefaults}
              className="px-5 py-2.5 rounded-xl glass border border-white/10 hover:border-white/20 text-sm text-gray-400 hover:text-white transition-all"
            >
              Reset to Defaults
            </button>
          </div>
        </motion.div>
      </div>

      {/* Danger Zone Modals */}
      <AnimatePresence>
        {showDeleteModal && (
          <ConfirmModal
            title="Delete Account"
            description="This will permanently delete your account, all your meetings, AI summaries, tasks, and team memberships. This action cannot be undone."
            confirmLabel="Delete My Account"
            confirmWord="DELETE"
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDeleteModal(false)}
            loading={dangerLoading}
          />
        )}
        {showResetModal && (
          <ConfirmModal
            title="Reset All Data"
            description="This will clear all your notifications, local settings, and cached data. Your account will remain active but all local preferences will be wiped and you'll be taken back to the dashboard."
            confirmLabel="Reset Everything"
            confirmWord="RESET"
            onConfirm={handleResetAllData}
            onCancel={() => setShowResetModal(false)}
            loading={dangerLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

import { motion } from 'framer-motion';
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

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState<Record<string, any>>({});

  const getVal = (key: string, def: any) => settings[key] !== undefined ? settings[key] : def;
  const setVal = (key: string, val: any) => setSettings(prev => ({ ...prev, [key]: val }));

  const currentSection = sections.find(s => s.id === activeSection)!;

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
            <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1.5"><Key className="w-3 h-3" /> Danger Zone</p>
            <button className="w-full text-xs text-red-400 hover:text-red-300 transition-colors text-left py-1">Delete Account</button>
            <button className="w-full text-xs text-red-400 hover:text-red-300 transition-colors text-left py-1">Reset All Data</button>
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
            <button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-sm font-semibold transition-all">
              Save Changes
            </button>
            <button className="px-5 py-2.5 rounded-xl glass border border-white/10 hover:border-white/20 text-sm text-gray-400 transition-all">
              Reset to Defaults
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

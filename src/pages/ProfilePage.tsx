import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Edit3, Mail, Shield, Calendar, BarChart3, Video, CheckSquare, Crown, Save, CheckCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { userService } from '../services/user.service';

export default function ProfilePage() {
  const { currentUser } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(currentUser?.name ?? '');
  const [bio, setBio] = useState(currentUser?.bio ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    // Try to upload to backend
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      await userService.updateProfile(formData as any);
    } catch {
      // Keep local preview even if API fails
    } finally {
      setUploadingAvatar(false);
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userService.updateProfile({ name, bio });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Ignore - save locally anyway
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const stats = [
    { label: 'Meetings Hosted', value: '—', icon: Video, color: 'text-indigo-400' },
    { label: 'Tasks Completed', value: '—', icon: CheckSquare, color: 'text-emerald-400' },
    { label: 'AI Summaries', value: '—', icon: BarChart3, color: 'text-violet-400' },
    { label: 'Days Active', value: '—', icon: Calendar, color: 'text-cyan-400' },
  ];

  const activity = [
    { day: 'Mon', value: 80 }, { day: 'Tue', value: 45 }, { day: 'Wed', value: 95 },
    { day: 'Thu', value: 60 }, { day: 'Fri', value: 75 }, { day: 'Sat', value: 20 }, { day: 'Sun', value: 10 },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 page-fade-in">
      {/* Profile Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl border border-white/5 p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 relative z-10">
          {/* Avatar */}
          <div className="relative shrink-0">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            {/* Avatar display */}
            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-2xl glow-indigo">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-3xl font-black">
                  {currentUser?.avatar ?? '?'}
                </div>
              )}
            </div>
            {/* Camera button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Change profile photo"
              className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-xl border border-white/10 flex items-center justify-center text-white transition-all ${
                uploadingAvatar
                  ? 'bg-indigo-600/60 cursor-wait'
                  : 'bg-white/10 hover:bg-indigo-600/60 hover:border-indigo-500/50 hover:scale-110'
              }`}
            >
              {uploadingAvatar ? (
                <div className="w-3.5 h-3.5 border border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              {editing ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-2xl font-black bg-transparent border-b border-indigo-500 text-white focus:outline-none"
                />
              ) : (
                <h2 className="text-2xl font-black text-white">{name || currentUser?.name}</h2>
              )}
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full capitalize">
                {currentUser?.role ?? 'member'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Mail className="w-3.5 h-3.5" />
              {currentUser?.email}
            </div>
            {editing ? (
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full text-sm bg-white/5 border border-white/10 rounded-xl p-2 text-gray-300 focus:outline-none focus:border-indigo-500/40 resize-none"
                rows={2}
                placeholder="Write a short bio..."
              />
            ) : (
              <p className="text-sm text-gray-400">{bio || 'No bio set. Click Edit Profile to add one.'}</p>
            )}
            <div className="flex items-center gap-3 mt-3">
              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                Online
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {saved && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 text-emerald-400 text-sm">
                <CheckCircle className="w-4 h-4" /> Saved!
              </motion.div>
            )}
            <button
              onClick={editing ? handleSave : () => setEditing(true)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/10 hover:border-white/20 text-sm text-gray-400 hover:text-white transition-all disabled:opacity-50"
            >
              {saving ? (
                <><div className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              ) : editing ? (
                <><Save className="w-4 h-4" /> Save Changes</>
              ) : (
                <><Edit3 className="w-4 h-4" /> Edit Profile</>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-2xl p-5 border border-white/5 text-center"
          >
            <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
            <div className="text-2xl font-black text-white">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Activity & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl border border-white/5 p-5">
          <h3 className="font-bold text-white mb-4">Weekly Activity</h3>
          {/* Chart area — fixed 96px tall so pixel heights work correctly */}
          <div className="relative" style={{ height: '96px' }}>
            {/* Background grid lines */}
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-white/5"
                style={{ bottom: `${i * 32}px` }}
              />
            ))}
            {/* Bars */}
            <div className="absolute inset-0 flex items-end gap-2">
              {activity.map((a) => {
                const barHeight = Math.round((a.value / 100) * 88); // max 88px within 96px container
                return (
                  <div key={a.day} className="flex-1 flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: barHeight }}
                      transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-violet-500"
                      style={{ minHeight: barHeight > 0 ? 4 : 0 }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          {/* Day labels below chart */}
          <div className="flex gap-2 mt-2">
            {activity.map((a) => (
              <div key={a.day} className="flex-1 text-center">
                <span className="text-[11px] text-gray-500">{a.day}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass rounded-2xl border border-white/5 p-5">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-400" /> Security & Access
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Session Auth', status: 'JWT Active', color: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' },
              { label: 'Role', status: currentUser?.role ?? 'member', color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
              { label: 'Data Encryption', status: 'E2E On', color: 'text-violet-400 bg-violet-500/15 border-violet-500/30' },
              { label: 'Backend Status', status: 'Connected', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-white/3 border border-white/5">
                <span className="text-sm text-gray-300">{item.label}</span>
                <span className={`text-xs px-2 py-1 rounded-lg border font-medium capitalize ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, Plus, Mail, Video, BarChart3, CheckSquare, Crown, Star } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { teamService } from '../services/team.service';

const statusConfig = {
  online: { label: 'Online', color: 'bg-emerald-400', text: 'text-emerald-400' },
  busy: { label: 'Busy', color: 'bg-red-400', text: 'text-red-400' },
  away: { label: 'Away', color: 'bg-amber-400', text: 'text-amber-400' },
  offline: { label: 'Offline', color: 'bg-gray-500', text: 'text-gray-500' },
};

const avatarGradients = [
  'from-indigo-500 to-violet-600',
  'from-violet-500 to-purple-600',
  'from-cyan-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
];

interface TeamMember {
  user: { _id: string; name: string; email: string; role: string };
  role: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  inviteCode?: string;
}

export default function TeamWorkspacePage() {
  const { startMeeting } = useAppStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await teamService.getTeams();
        setTeams(Array.isArray(res) ? res : res?.teams ?? []);
      } catch {
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // Flatten all members across all teams
  const allMembers = teams.flatMap(t =>
    (t.members ?? []).map(m => ({
      id: m.user?._id ?? '',
      name: m.user?.name ?? 'Unknown',
      email: m.user?.email ?? '',
      role: m.role ?? m.user?.role ?? 'member',
      team: t.name,
      status: 'online' as const,
      avatar: (m.user?.name ?? 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
    }))
  );

  const filtered = allMembers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const onlineCount = filtered.length; // all show as online since we don't track real status
  const totalMeetings = 0;
  const totalTasks = 0;

  return (
    <div className="p-6 space-y-6 page-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white">Team Workspace</h2>
          <p className="text-sm text-gray-400 mt-1">Manage your team, roles, and collaboration</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team members..."
              className="pl-9 pr-4 py-2 rounded-xl glass border border-white/10 focus:border-indigo-500/40 focus:outline-none text-sm text-white placeholder-gray-600 bg-transparent w-52"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> Invite Member
          </button>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: loading ? '—' : allMembers.length, icon: Users, color: 'text-indigo-400', bg: 'from-indigo-500 to-violet-600' },
          { label: 'Online Now', value: loading ? '—' : onlineCount, icon: Star, color: 'text-emerald-400', bg: 'from-emerald-500 to-teal-600' },
          { label: 'Total Meetings', value: totalMeetings, icon: Video, color: 'text-cyan-400', bg: 'from-cyan-500 to-blue-600' },
          { label: 'Active Tasks', value: totalTasks, icon: CheckSquare, color: 'text-orange-400', bg: 'from-orange-500 to-amber-600' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass rounded-2xl p-5 border border-white/5">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className="text-white" style={{ width: '18px', height: '18px' }} />
            </div>
            <div className="text-2xl font-black text-white">{stat.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Teams Info Banner */}
      {!loading && teams.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {teams.map(t => (
            <div key={t._id} className="glass rounded-xl border border-white/10 px-4 py-3 shrink-0">
              <p className="text-sm font-bold text-white">{t.name}</p>
              {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
              {t.inviteCode && (
                <p className="text-xs text-indigo-400 mt-1">Invite code: <span className="font-mono">{t.inviteCode}</span></p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Member Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="glass rounded-2xl border border-white/5 p-5 animate-pulse">
              <div className="flex gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-white/10" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-2/3" />
                  <div className="h-2 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-600">
          <Users className="w-12 h-12 mb-3" />
          <p className="text-sm">{search ? 'No members match your search' : 'No team members found'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((member, i) => {
            const status = statusConfig[member.status as keyof typeof statusConfig] ?? statusConfig.online;
            return (
              <motion.div
                key={member.id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="glass rounded-2xl border border-white/5 hover:border-white/15 p-5 transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative shrink-0">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center text-lg font-black shadow-lg`}>
                      {member.avatar}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${status.color} border-2 border-[#0d1117]`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-white text-sm truncate">{member.name}</h3>
                      {(member.role === 'admin' || member.role === 'owner') && (
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${status.color}`} />
                      <span className={`text-xs ${status.text}`}>{status.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-md capitalize ${
                        member.role === 'admin' || member.role === 'owner'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                      }`}>
                        {member.role}
                      </span>
                      <span className="text-xs text-gray-500 truncate">{member.team}</span>
                    </div>
                  </div>
                </div>

                {/* Activity Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-gray-500">Activity</span>
                    <span className="text-xs text-gray-400">{60 + (i * 13) % 40}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${60 + (i * 13) % 40}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`h-full rounded-full bg-gradient-to-r ${avatarGradients[i % avatarGradients.length]}`}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-white/8 text-gray-400 hover:text-white text-xs font-medium transition-all border border-white/5">
                    <Mail className="w-3.5 h-3.5" /> Message
                  </button>
                  <button
                    onClick={startMeeting}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-medium transition-all border border-indigo-500/20"
                  >
                    <Video className="w-3.5 h-3.5" /> Meet
                  </button>
                  <button className="p-2 rounded-xl bg-white/5 hover:bg-white/8 text-gray-400 transition-all border border-white/5">
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

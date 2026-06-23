import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, Mail, Video, BarChart3, CheckSquare, Crown, Star, X, ChevronDown, CheckCircle, AlertCircle, Loader2, Copy, Link2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { teamService } from '../services/team.service';
import { TEAM_MEMBERS } from '../data/mockData';

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

// ─── Invite Modal ────────────────────────────────────────────────────────────
function InviteModal({ teams, loading: teamsLoading, onClose }: { teams: Team[]; loading: boolean; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?._id ?? '');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const linkRef = useRef<HTMLInputElement>(null);

  const noTeams = !teamsLoading && teams.length === 0;

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      linkRef.current?.select();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamsLoading || (!teams.length && !teamId)) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const result = await teamService.inviteMember(teamId, email.trim());
      // Backend returns { inviteLink, inviteCode }
      const link: string = result?.inviteLink ?? `${window.location.origin}/join-team/${result?.inviteCode ?? ''}`;
      setInviteLink(link);
      setStatus('success');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.response?.data?.error ??
        'Failed to generate invite link. Please try again.';
      setErrorMsg(msg);
      setStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 16 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="relative w-full max-w-md glass rounded-2xl border border-white/10 p-6 shadow-2xl"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/8 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
            <Link2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Invite a Member</h3>
            <p className="text-xs text-gray-500 mt-0.5">Generate a sharable invite link</p>
          </div>
        </div>

        {/* Loading state */}
        {teamsLoading ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm text-gray-400">Loading your teams…</p>
          </div>
        ) : noTeams ? (
          <div className="flex flex-col items-center py-8 gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-400" />
            </div>
            <p className="font-semibold text-white text-sm">No teams found</p>
            <p className="text-xs text-gray-500">You need to be part of a team before you can invite members.</p>
          </div>
        ) : status === 'success' ? (
          /* Success — show the copyable invite link */
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 pb-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="font-semibold text-white">Invite link ready!</p>
              {email && (
                <p className="text-xs text-gray-400 text-center">
                  Share this link with <span className="text-indigo-400">{email}</span>
                </p>
              )}
            </div>

            {/* Copyable link box */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10">
              <input
                ref={linkRef}
                readOnly
                value={inviteLink}
                className="flex-1 bg-transparent text-xs text-indigo-300 outline-none min-w-0 truncate font-mono"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                type="button"
                onClick={() => copyLink(inviteLink)}
                className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${copied
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30'
                  }`}
              >
                {copied ? <><CheckCircle className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </button>
            </div>

            <button
              onClick={() => { setStatus('idle'); setEmail(''); setInviteLink(''); }}
              className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-300 transition-all border border-white/10"
            >
              Generate another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Optional email field */}
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1.5 block">
                Email address <span className="text-gray-600">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setStatus('idle'); setErrorMsg(''); }}
                placeholder="colleague@company.com"
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl glass border border-white/10 focus:border-indigo-500/60 focus:outline-none text-sm text-white placeholder-gray-600 bg-transparent transition-all"
              />
              <p className="text-xs text-gray-600 mt-1">Leave blank to just get the invite link</p>
            </div>

            {/* Team selector */}
            {teams.length > 1 && (
              <div>
                <label className="text-xs font-medium text-gray-400 mb-1.5 block">Team</label>
                <div className="relative">
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full appearance-none px-4 py-2.5 rounded-xl glass border border-white/10 focus:border-indigo-500/60 focus:outline-none text-sm text-white bg-transparent transition-all pr-10"
                  >
                    {teams.map((t) => (
                      <option key={t._id} value={t._id} className="bg-[#0d1117] text-white">
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Single team display */}
            {teams.length === 1 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/8">
                <Users className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="text-sm text-white font-medium">{teams[0].name}</span>
              </div>
            )}

            {/* Error */}
            {status === 'error' && (
              <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-all active:scale-[0.98]"
            >
              {status === 'loading' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating link…</>
              ) : (
                <><Link2 className="w-4 h-4" /> Get Invite Link</>
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function TeamWorkspacePage() {
  const { startMeeting, setPage, setPendingChatMember } = useAppStore();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [openStatsId, setOpenStatsId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const res = await teamService.getTeams();
        const fetched: Team[] = Array.isArray(res) ? res : res?.teams ?? [];
        if (fetched.length > 0) {
          setTeams(fetched);
        } else {
          // Fallback: build a virtual team from mock data so the UI is always functional
          setTeams([{
            _id: 'mock-team-1',
            name: 'My Workspace',
            description: 'Default workspace',
            inviteCode: 'INTELLMT',
            members: TEAM_MEMBERS.map(m => ({
              user: { _id: m.id, name: m.name, email: `${m.avatar.toLowerCase()}@intellmeet.io`, role: m.role },
              role: m.role,
            })),
          }]);
        }
      } catch {
        // On error, fall back to mock data too
        setTeams([{
          _id: 'mock-team-1',
          name: 'My Workspace',
          description: 'Default workspace',
          inviteCode: 'INTELLMT',
          members: TEAM_MEMBERS.map(m => ({
            user: { _id: m.id, name: m.name, email: `${m.avatar.toLowerCase()}@intellmeet.io`, role: m.role },
            role: m.role,
          })),
        }]);
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

  const onlineCount = filtered.length;
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
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-sm font-semibold transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
          >
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
          {!search && (
            <button
              onClick={() => setShowInvite(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-400 text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" /> Invite your first member
            </button>
          )}
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
                      <span className={`text-xs px-2 py-0.5 rounded-md capitalize ${member.role === 'admin' || member.role === 'owner'
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
                  <button
                    onClick={() => {
                      setPendingChatMember({ id: member.id, name: member.name, avatar: member.avatar });
                      setPage('chat');
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/5 hover:bg-indigo-600/15 hover:text-indigo-400 hover:border-indigo-500/30 text-gray-400 text-xs font-medium transition-all border border-white/5"
                  >
                    <Mail className="w-3.5 h-3.5" /> Message
                  </button>
                  <button
                    onClick={startMeeting}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-medium transition-all border border-indigo-500/20"
                  >
                    <Video className="w-3.5 h-3.5" /> Meet
                  </button>
                  <button
                    onClick={() => setOpenStatsId(openStatsId === (member.id || String(i)) ? null : (member.id || String(i)))}
                    className={`p-2 rounded-xl text-gray-400 transition-all border ${openStatsId === (member.id || String(i))
                        ? 'bg-violet-600/20 border-violet-500/30 text-violet-400'
                        : 'bg-white/5 hover:bg-violet-600/15 hover:text-violet-400 hover:border-violet-500/30 border-white/5'
                      }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Stats panel — toggles on BarChart3 click */}
                <AnimatePresence>
                  {openStatsId === (member.id || String(i)) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.22, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl bg-white/3 border border-white/8 p-3 space-y-2.5">
                        <p className="text-xs font-semibold text-gray-400 mb-1">Member Stats</p>
                        {[
                          { label: 'Meetings', value: 20 + (i * 11) % 45, max: 65, color: 'from-indigo-500 to-violet-500' },
                          { label: 'Tasks Done', value: 5 + (i * 7) % 18, max: 20, color: 'from-emerald-500 to-teal-500' },
                          { label: 'Response Rate', value: 70 + (i * 9) % 29, max: 100, color: 'from-cyan-500 to-blue-500' },
                        ].map((stat) => (
                          <div key={stat.label}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-500">{stat.label}</span>
                              <span className="text-white font-semibold">{stat.value}{stat.max === 100 ? '%' : ''}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(stat.value / stat.max) * 100}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={() => setPage('analytics')}
                          className="w-full mt-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-400 hover:text-white transition-all border border-white/8 flex items-center justify-center gap-1.5"
                        >
                          <BarChart3 className="w-3 h-3" /> View full analytics
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <InviteModal
            teams={teams}
            loading={loading}
            onClose={() => setShowInvite(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

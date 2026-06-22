import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, Brain, CheckSquare, Users, TrendingUp, Clock, ArrowRight, Play, Calendar, Zap, Activity, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { meetingService } from '../services/meeting.service';
import { taskService } from '../services/task.service';
import { ANALYTICS_DATA } from '../data/mockData';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

const statusColors = {
  live: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  scheduled: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  ended: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

interface Meeting {
  _id: string;
  title: string;
  status: string;
  participants: { user: string }[];
  duration?: number;
  summary?: string;
  meetingId: string;
}

interface Task {
  _id: string;
  title: string;
  status: string;
  priority: string;
  assignee?: { name: string };
  dueDate?: string;
}

export default function DashboardPage() {
  const { setPage, startMeeting, currentUser } = useAppStore();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meetingsRes, tasksRes] = await Promise.allSettled([
          meetingService.getMeetings({ limit: 5 }),
          taskService.getTasks(),
        ]);
        if (meetingsRes.status === 'fulfilled') {
          const m = meetingsRes.value;
          setMeetings(Array.isArray(m) ? m : m?.meetings || []);
        }
        if (tasksRes.status === 'fulfilled') {
          const t = tasksRes.value;
          setTasks(Array.isArray(t) ? t : t?.tasks || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const liveMeetings = meetings.filter(m => m.status === 'live');
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'done');
  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'done');

  const stats = [
    { label: 'Live Meetings', value: liveMeetings.length, icon: Activity, color: 'from-emerald-500 to-teal-600', sub: 'Active right now', trend: `${meetings.length} total` },
    { label: 'AI Summaries', value: meetings.filter(m => m.summary).length, icon: Brain, color: 'from-indigo-500 to-violet-600', sub: 'Generated', trend: 'from meetings' },
    { label: 'Action Items', value: pendingTasks.length, icon: CheckSquare, color: 'from-orange-500 to-amber-600', sub: 'Pending tasks', trend: `${completedTasks.length} done` },
    { label: 'Team Members', value: 3, icon: Users, color: 'from-violet-500 to-purple-600', sub: 'Active in workspace', trend: '1 online now' },
  ];

  const priorityColor = (p: string) => p === 'high' || p === 'urgent' ? 'bg-red-400' : p === 'medium' ? 'bg-yellow-400' : 'bg-green-400';

  return (
    <div className="p-6 space-y-6 page-fade-in">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl overflow-hidden p-6 border border-indigo-500/20"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 50%, rgba(6,182,212,0.05) 100%)' }}
      >
        <div className="absolute inset-0 bg-mesh opacity-50 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">👋</span>
              <span className="text-gray-400 text-sm">Good morning,</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-1">{currentUser?.name ?? 'Welcome'}</h2>
            <p className="text-gray-400 text-sm">
              You have {liveMeetings.length} live meeting{liveMeetings.length !== 1 ? 's' : ''} and {pendingTasks.length} pending tasks today.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={startMeeting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-semibold text-sm transition-all glow-indigo hover:scale-105"
            >
              <Video className="w-4 h-4" />
              Start Meeting
            </button>
            <button
              onClick={() => setPage('meeting-lobby')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass border border-white/10 hover:border-white/20 font-semibold text-sm transition-all hover:scale-105"
            >
              <Calendar className="w-4 h-4" />
              Schedule
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="glass rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                {stat.trend}
              </div>
            </div>
            <div className="text-3xl font-black text-white mb-1">
              {loading ? <span className="inline-block w-8 h-7 bg-white/10 rounded animate-pulse" /> : stat.value}
            </div>
            <div className="text-sm font-medium text-gray-300">{stat.label}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meetings List */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div custom={4} variants={cardVariants} initial="hidden" animate="visible" className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-400" />
                <h3 className="font-bold text-white">Meetings</h3>
                {liveMeetings.length > 0 && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    {liveMeetings.length} Live
                  </span>
                )}
              </div>
              <button onClick={() => setPage('meeting-lobby')} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/5 rounded animate-pulse w-2/3" />
                      <div className="h-2 bg-white/5 rounded animate-pulse w-1/3" />
                    </div>
                  </div>
                ))
              ) : meetings.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-gray-600">
                  <Video className="w-8 h-8 mb-2" />
                  <p className="text-sm">No meetings yet. Start or schedule one!</p>
                </div>
              ) : (
                meetings.slice(0, 5).map((meeting) => {
                  const statusKey = meeting.status as keyof typeof statusColors;
                  return (
                    <motion.div
                      key={meeting._id}
                      whileHover={{ backgroundColor: 'rgba(255,255,255,0.02)' }}
                      className="flex items-center gap-4 p-4 cursor-pointer"
                      onClick={() => meeting.status === 'live' ? startMeeting() : setPage('meeting-lobby')}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center shrink-0">
                        <Video className="w-4 h-4 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm text-white truncate">{meeting.title}</span>
                          {meeting.status === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-live shrink-0" />}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" />{meeting.participants?.length ?? 0} participants</span>
                          {meeting.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{meeting.duration}m</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded-lg border font-medium ${statusColors[statusKey] ?? statusColors.completed}`}>
                          {meeting.status === 'live' ? '● LIVE' : meeting.status === 'scheduled' ? 'Upcoming' : 'Done'}
                        </span>
                        {meeting.status === 'live' && (
                          <button onClick={(e) => { e.stopPropagation(); startMeeting(); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium transition-all border border-emerald-500/20">
                            <Play className="w-3 h-3" /> Join
                          </button>
                        )}
                        {meeting.summary && (
                          <button onClick={(e) => { e.stopPropagation(); setPage('ai-summary'); }} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-medium transition-all border border-indigo-500/20">
                            <Brain className="w-3 h-3" /> AI
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Mini Chart */}
          <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible" className="glass rounded-2xl p-5 border border-white/5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white">Weekly Activity</h3>
                <p className="text-xs text-gray-500 mt-0.5">Meetings & participants this week</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                <TrendingUp className="w-3 h-3" /> +18% vs last week
              </div>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={ANALYTICS_DATA.weeklyMeetings}>
                <defs>
                  <linearGradient id="meetGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="meetings" stroke="#6366f1" fill="url(#meetGrad)" strokeWidth={2} />
                <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }} labelStyle={{ color: '#9ca3af' }} itemStyle={{ color: '#6366f1' }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Pending Tasks */}
          <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible" className="glass rounded-2xl border border-white/5 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-400" />
                <h3 className="font-bold text-sm text-white">Pending Tasks</h3>
              </div>
              <span className="text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full">
                {pendingTasks.length} open
              </span>
            </div>
            <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
              {loading ? (
                [...Array(3)].map((_, i) => <div key={i} className="h-12 m-3 bg-white/5 rounded animate-pulse" />)
              ) : pendingTasks.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-gray-600 text-sm">
                  <CheckSquare className="w-5 h-5 mr-2" /> All tasks done!
                </div>
              ) : (
                pendingTasks.slice(0, 6).map((task) => (
                  <div key={task._id} className="flex items-start gap-3 p-3 hover:bg-white/2 transition-all">
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${priorityColor(task.priority)}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed text-gray-300 truncate">{task.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {task.assignee && (
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[8px] font-bold shrink-0">
                            {task.assignee.name?.[0] ?? '?'}
                          </div>
                        )}
                        {task.dueDate && (
                          <span className="text-xs text-gray-600">{new Date(task.dueDate).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-white/5">
              <button onClick={() => setPage('kanban')} className="w-full text-xs text-indigo-400 hover:text-indigo-300 transition-colors text-center">
                View Kanban Board →
              </button>
            </div>
          </motion.div>

          {/* Quick Stats Card */}
          <motion.div custom={7} variants={cardVariants} initial="hidden" animate="visible" className="glass rounded-2xl border border-white/5 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Loader2 className="w-4 h-4 text-violet-400" />
              <h3 className="font-bold text-sm text-white">Quick Stats</h3>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Total Meetings', value: meetings.length, color: 'bg-indigo-500' },
                { label: 'Completed Tasks', value: completedTasks.length, color: 'bg-emerald-500' },
                { label: 'AI Summaries', value: meetings.filter(m => m.summary).length, color: 'bg-violet-500' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{s.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full`} style={{ width: `${Math.min(100, (s.value / Math.max(meetings.length, tasks.length, 1)) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-white w-4 text-right">{s.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

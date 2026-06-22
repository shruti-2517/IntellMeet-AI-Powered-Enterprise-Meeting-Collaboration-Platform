import { motion } from 'framer-motion';
import { TrendingUp, Users, Brain, Clock, Download, BarChart2, Activity } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ANALYTICS_DATA } from '../data/mockData';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl border border-white/10 p-3 text-xs">
        <p className="text-gray-400 mb-1.5">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  const kpis = [
    { label: 'Total Meetings', value: '221', change: '+13%', icon: Activity, color: 'from-indigo-500 to-violet-600' },
    { label: 'AI Summaries', value: '198', change: '+22%', icon: Brain, color: 'from-violet-500 to-purple-600' },
    { label: 'Hours in Meetings', value: '312h', change: '-8%', icon: Clock, color: 'from-cyan-500 to-blue-600' },
    { label: 'Active Members', value: '8', change: '+2', icon: Users, color: 'from-emerald-500 to-teal-600' },
  ];

  return (
    <div className="p-6 space-y-6 page-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white">Analytics & Insights</h2>
          <p className="text-sm text-gray-400 mt-1">Track meeting productivity and team engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 glass rounded-xl border border-white/5 p-1">
            {['Week', 'Month', 'Quarter'].map((t) => (
              <button key={t} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${t === 'Month' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>{t}</button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-white/10 hover:border-white/20 text-sm text-gray-400 hover:text-white transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                <kpi.icon className="w-4 h-4 text-white" />
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-lg ${kpi.change.startsWith('+') ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                {kpi.change}
              </span>
            </div>
            <div className="text-3xl font-black text-white mb-0.5">{kpi.value}</div>
            <div className="text-xs text-gray-400">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" /> Monthly Trend
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Meetings, AI summaries & action items</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ANALYTICS_DATA.monthlyTrend}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="grad3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
              <Area type="monotone" dataKey="meetings" name="Meetings" stroke="#6366f1" fill="url(#grad1)" strokeWidth={2} />
              <Area type="monotone" dataKey="aiSummaries" name="AI Summaries" stroke="#8b5cf6" fill="url(#grad2)" strokeWidth={2} />
              <Area type="monotone" dataKey="actionItems" name="Action Items" stroke="#f59e0b" fill="url(#grad3)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Weekly Activity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" /> Weekly Activity
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Meetings & participants by day</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ANALYTICS_DATA.weeklyMeetings} barSize={14}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
              <Bar dataKey="meetings" name="Meetings" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="hours" name="Hours" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Activity Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl border border-white/5 p-5">
          <h3 className="font-bold text-white mb-1 text-sm">Team Distribution</h3>
          <p className="text-xs text-gray-500 mb-4">Meetings by team</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={ANALYTICS_DATA.teamActivity} dataKey="meetings" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={35}>
                {ANALYTICS_DATA.teamActivity.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {ANALYTICS_DATA.teamActivity.map((t) => (
              <div key={t.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} />
                  <span className="text-gray-400">{t.name}</span>
                </div>
                <span className="font-semibold text-white">{t.meetings}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Productivity Metrics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="lg:col-span-2 glass rounded-2xl border border-white/5 p-5">
          <h3 className="font-bold text-white mb-1">Productivity Metrics</h3>
          <p className="text-xs text-gray-500 mb-5">Key performance indicators for this month</p>
          <div className="space-y-4">
            {ANALYTICS_DATA.productivity.map((metric, i) => (
              <div key={metric.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-300">{metric.name}</span>
                  <span className="text-sm font-bold text-white">{metric.value}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value}%` }}
                    transition={{ duration: 1.2, delay: 0.3 + i * 0.15, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${metric.color}, ${metric.color}aa)` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Impact Summary */}
          <div className="mt-6 grid grid-cols-3 gap-3 pt-5 border-t border-white/5">
            {[
              { label: 'Follow-up Time Saved', value: '52%', sub: 'vs before IntellMeet', color: 'text-indigo-400' },
              { label: 'Tasks Completed', value: '78%', sub: 'of meeting action items', color: 'text-emerald-400' },
              { label: 'Avg Meeting Score', value: '8.7/10', sub: 'team satisfaction', color: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label} className="text-center p-3 rounded-xl bg-white/3">
                <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-300 font-medium mt-0.5">{s.label}</div>
                <div className="text-xs text-gray-600 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

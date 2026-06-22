import { motion } from 'framer-motion';
import { Video, Brain, Zap, Shield, Users, BarChart3, ArrowRight, Play, Star, Globe, Clock, TrendingUp } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const features = [
  { icon: Video, title: 'Real-Time Video', desc: 'WebRTC-powered HD video with 50+ participants, screen sharing & recording', color: 'from-indigo-500 to-violet-600' },
  { icon: Brain, title: 'AI Intelligence', desc: 'Auto transcription, smart summaries & action item extraction with 85%+ accuracy', color: 'from-violet-500 to-purple-600' },
  { icon: Zap, title: 'Instant Summaries', desc: 'Get AI-generated meeting summaries in seconds, reducing follow-up time by 40-60%', color: 'from-cyan-500 to-blue-600' },
  { icon: Users, title: 'Team Collaboration', desc: 'Real-time chat, Kanban boards & task management built into every meeting', color: 'from-emerald-500 to-teal-600' },
  { icon: BarChart3, title: 'Deep Analytics', desc: 'Meeting frequency, engagement scores & productivity metrics at a glance', color: 'from-orange-500 to-amber-600' },
  { icon: Shield, title: 'Enterprise Security', desc: 'End-to-end encryption, JWT auth, OWASP compliance & role-based access', color: 'from-pink-500 to-rose-600' },
];

const stats = [
  { value: '40-60%', label: 'Follow-up Time Reduced', icon: Clock },
  { value: '25-40%', label: 'Team Productivity Boost', icon: TrendingUp },
  { value: '5,000+', label: 'Concurrent Participants', icon: Users },
  { value: '99.95%', label: 'Uptime SLA Guaranteed', icon: Globe },
];

const testimonials = [
  { name: 'Rohit Mehta', role: 'CTO, TechScale India', avatar: 'RM', quote: 'IntellMeet cut our post-meeting chaos by 55%. The AI summaries are incredibly accurate.', stars: 5 },
  { name: 'Anjali Verma', role: 'VP Engineering, Zidio', avatar: 'AV', quote: 'Our teams are 35% more productive. Action items now actually get done!', stars: 5 },
  { name: 'Kevin Osei', role: 'Product Lead, NovaTech', avatar: 'KO', quote: 'Best enterprise meeting tool we\'ve used. The Kanban integration is a game-changer.', stars: 5 },
];

const techStack = [
  'React 19', 'TypeScript', 'Node.js', 'MongoDB', 'Socket.io', 'WebRTC', 'OpenAI', 'Redis', 'Docker', 'Kubernetes',
];

export default function LandingPage() {
  const { setPage } = useAppStore();

  return (
    <div className="min-h-screen bg-mesh text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center glow-indigo">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              <span className="gradient-text">Intell</span>Meet
            </span>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hidden md:flex items-center gap-8">
            {['Features', 'Analytics', 'Security', 'Pricing'].map((item) => (
              <a key={item} href="#" className="text-sm text-gray-400 hover:text-white transition-colors">{item}</a>
            ))}
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <button onClick={() => setPage('login')} className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
              Sign In
            </button>
            <button
              onClick={() => setPage('register')}
              className="text-sm font-medium px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 transition-all glow-indigo"
            >
              Get Started Free
            </button>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-indigo-500/30 text-sm text-indigo-300 mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 status-live" />
            Production-Grade MERN Platform · Zidio Development · April 2026
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight leading-tight mb-6"
          >
            <span className="gradient-text">AI-Powered</span>
            <br />
            <span className="text-white">Enterprise Meetings</span>
            <br />
            <span className="text-gray-400 text-4xl md:text-5xl font-bold">that Actually Work</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            "Meetings are the biggest time killer in enterprises. IntellMeet transforms meetings into 
            productive experiences with real-time video, AI-powered summaries, smart action item extraction,
            and seamless collaboration — <strong className="text-indigo-300">reducing follow-up time by 40-60%.</strong>"
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button
              onClick={() => setPage('register')}
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-semibold text-lg transition-all glow-indigo hover:scale-105 active:scale-100"
            >
              Start Free Enterprise Trial
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setPage('meeting-lobby')}
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl glass border border-white/10 hover:border-indigo-500/40 font-semibold text-lg transition-all hover:scale-105"
            >
              <Play className="w-5 h-5 text-indigo-400" />
              Watch Live Demo
            </button>
          </motion.div>

          {/* Mock Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#030712] z-10 pointer-events-none" />
            <div className="glass rounded-2xl border border-white/10 p-4 text-left overflow-hidden">
              {/* Mock header */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-green-500/70" />
                <div className="flex-1 mx-4 h-7 rounded-lg bg-white/5 flex items-center px-3">
                  <span className="text-xs text-gray-500">app.intellmeet.dev/dashboard</span>
                </div>
              </div>
              {/* Mock dashboard content */}
              <div className="grid grid-cols-12 gap-3 h-64">
                <div className="col-span-3 bg-white/3 rounded-xl p-3 space-y-3">
                  {['Dashboard', 'Meetings', 'AI Summary', 'Team', 'Kanban', 'Analytics'].map((item, i) => (
                    <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs ${i === 0 ? 'bg-indigo-600/40 text-indigo-300' : 'text-gray-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-indigo-400' : 'bg-gray-600'}`} />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="col-span-9 grid grid-cols-3 gap-3">
                  {[
                    { label: 'Live Meetings', val: '3', color: 'text-emerald-400' },
                    { label: 'AI Summaries', val: '12', color: 'text-indigo-400' },
                    { label: 'Action Items', val: '28', color: 'text-violet-400' },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-white/3 rounded-xl p-3">
                      <div className={`text-2xl font-bold ${stat.color}`}>{stat.val}</div>
                      <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                    </div>
                  ))}
                  <div className="col-span-3 bg-white/3 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 status-live" />
                      <span className="text-xs text-emerald-400 font-medium">Sprint Review - Q2 2026 · LIVE</span>
                    </div>
                    <div className="flex gap-2">
                      {['AJ', 'SC', 'MT', 'PS', '+8'].map((av) => (
                        <div key={av} className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-bold">{av}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 text-center border border-white/5 hover:border-indigo-500/20 transition-all"
              >
                <stat.icon className="w-6 h-6 text-indigo-400 mx-auto mb-3" />
                <div className="text-3xl font-black gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Everything your team needs,
              <br />
              <span className="gradient-text">powered by AI</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A complete enterprise collaboration suite built with production-grade MERN stack technology
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="glass rounded-2xl p-6 border border-white/5 hover:border-white/15 transition-all cursor-pointer group"
              >
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feat.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feat.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-500 text-sm mb-6 uppercase tracking-widest">Production Technology Stack</p>
          <div className="flex flex-wrap justify-center gap-3">
            {techStack.map((tech, i) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="px-4 py-2 rounded-full glass border border-white/10 text-sm text-gray-300 hover:border-indigo-500/40 hover:text-indigo-300 transition-all cursor-default"
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Trusted by enterprise teams</h2>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="glass rounded-2xl p-6 border border-white/5"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold">{t.avatar}</div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 border border-indigo-500/20 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 pointer-events-none" />
            <h2 className="text-4xl font-black mb-4 relative z-10">
              Ready to transform your
              <br />
              <span className="gradient-text">meeting culture?</span>
            </h2>
            <p className="text-gray-400 mb-8 relative z-10">Join 500+ enterprise teams already using IntellMeet</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
              <button
                onClick={() => setPage('register')}
                className="group flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-semibold transition-all glow-indigo hover:scale-105"
              >
                Start Building Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => setPage('dashboard')}
                className="px-8 py-4 rounded-xl glass border border-white/10 hover:border-white/20 font-semibold transition-all hover:scale-105"
              >
                Explore Dashboard →
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm"><span className="gradient-text">Intell</span>Meet</span>
          </div>
          <p className="text-xs text-gray-600">© 2026 Zidio Development. Production-Grade MERN Platform · Version 2.0 Industry Edition</p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>Privacy</span>
            <span>Security</span>
            <span>Status</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

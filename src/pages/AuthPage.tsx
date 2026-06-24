import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, Mail, Lock, User, Eye, EyeOff, ArrowRight, Shield, Zap, Brain, ChevronLeft, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export default function AuthPage({ mode }: AuthPageProps) {
  const { setPage, login, register, isAuthLoading, authError } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (mode === 'register') {
      if (!form.name.trim()) return setLocalError('Full name is required.');
      if (form.password.length < 6) return setLocalError('Password must be at least 6 characters.');
      if (form.password !== form.confirmPassword) return setLocalError('Passwords do not match.');
    }

    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
    } catch {
      // Error is handled in store (authError)
    }
  };

  const displayError = localError || authError;

  const benefits = [
    { icon: Zap, text: 'AI-powered meeting summaries in seconds' },
    { icon: Brain, text: 'Smart action item extraction with 85%+ accuracy' },
    { icon: Shield, text: 'Enterprise-grade security & encryption' },
  ];

  return (
    <div className="min-h-screen bg-mesh flex">
      {/* Left Panel */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden lg:flex flex-col justify-between w-[45%] p-12 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-violet-600/10 to-transparent" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-56 h-56 bg-violet-500/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative z-10">
          <button onClick={() => setPage('landing')} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center glow-indigo">
              <Video className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-2xl"><span className="gradient-text">Intell</span>Meet</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-indigo-500/30 text-xs text-indigo-300 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-live" />
              Zidio Development · Industry Edition v2.0
            </div>
            <h1 className="text-4xl font-black leading-tight mb-4">
              Transform your<br />
              <span className="gradient-text">meeting culture</span><br />
              with AI intelligence
            </h1>
            <p className="text-gray-400 leading-relaxed">
              Join 500+ enterprise teams reducing meeting follow-up time by 40-60% with IntellMeet's AI-powered collaboration platform.
            </p>
          </div>
          <div className="space-y-4">
            {benefits.map((b, i) => (
              <motion.div
                key={b.text}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl glass border border-white/10 flex items-center justify-center shrink-0">
                  <b.icon className="w-4 h-4 text-indigo-400" />
                </div>
                <span className="text-sm text-gray-300">{b.text}</span>
              </motion.div>
            ))}
          </div>
          {/* Demo credentials hint */}
          <div className="glass rounded-xl border border-indigo-500/20 p-4">
            <p className="text-xs text-indigo-300 font-semibold mb-2">🔑 Demo Credentials</p>
            <div className="space-y-1 text-xs text-gray-400 font-mono">
              <p>admin@intellmeet.com / Admin@123</p>
              <p>alice@intellmeet.com / Alice@123</p>
              <p>bob@intellmeet.com / Bob@1234</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-600 relative z-10">© 2026 Zidio Development. All rights reserved.</p>
      </motion.div>

      {/* Right Panel - Form */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16"
      >
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Video className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-2xl"><span className="gradient-text">Intell</span>Meet</span>
        </div>

        <div className="w-full max-w-md">
          {/* Back button */}
          <button
            onClick={() => setPage('landing')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8 group"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to home
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h2 className="text-3xl font-black mb-2">
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-gray-400 mb-8">
                {mode === 'login'
                  ? 'Sign in to your IntellMeet workspace'
                  : 'Start your enterprise free trial today'}
              </p>

              {/* Error Banner */}
              {displayError && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-6"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {displayError}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-sm text-gray-400 font-medium">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        placeholder="Alex Johnson"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                        className="w-full pl-10 pr-4 py-3 rounded-xl glass border border-white/10 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 text-white placeholder-gray-600 text-sm transition-all bg-transparent"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-sm text-gray-400 font-medium">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      placeholder="alex@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 rounded-xl glass border border-white/10 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 text-white placeholder-gray-600 text-sm transition-all bg-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm text-gray-400 font-medium">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                      className="w-full pl-10 pr-10 py-3 rounded-xl glass border border-white/10 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 text-white placeholder-gray-600 text-sm transition-all bg-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'register' && (
                  <div className="space-y-1">
                    <label className="text-sm text-gray-400 font-medium">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••"
                        value={form.confirmPassword}
                        onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                        required
                        autoComplete="new-password"
                        className="w-full pl-10 pr-4 py-3 rounded-xl glass border border-white/10 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 text-white placeholder-gray-600 text-sm transition-all bg-transparent"
                      />
                    </div>
                  </div>
                )}

                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300">Forgot password?</button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 font-semibold transition-all glow-indigo disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isAuthLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    <>
                      {mode === 'login' ? 'Sign In to IntellMeet' : 'Start Free Trial'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Quick demo login */}
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, email: 'admin@intellmeet.com', password: 'Admin@123' });
                    }}
                    className="w-full py-3 rounded-xl glass border border-white/10 hover:border-indigo-500/30 text-sm text-gray-400 hover:text-indigo-300 transition-all"
                  >
                    ⚡ Fill Demo Credentials (Admin)
                  </button>
                )}
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => setPage(mode === 'login' ? 'register' : 'login')}
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  {mode === 'login' ? 'Create one free' : 'Sign in'}
                </button>
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

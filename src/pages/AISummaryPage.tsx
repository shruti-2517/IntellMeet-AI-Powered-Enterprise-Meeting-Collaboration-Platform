import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, CheckCircle, Copy, Download, Share2, Clock, Users, TrendingUp, Zap, Star, MessageSquare, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { AI_SUMMARY } from '../data/mockData';

export default function AISummaryPage() {
  const { setPage } = useAppStore();
  const [expandedSection, setExpandedSection] = useState<string | null>('summary');
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'transcript' | 'actions'>('summary');

  const getSummaryText = () => {
    const lines: string[] = [
      `📋 ${AI_SUMMARY.meetingTitle}`,
      `📅 ${AI_SUMMARY.date}  ·  ⏱ ${AI_SUMMARY.duration}  ·  👥 ${AI_SUMMARY.participants.length} participants`,
      '',
      '── SUMMARY ──',
      AI_SUMMARY.summary,
      '',
      '── KEY POINTS ──',
      ...AI_SUMMARY.keyPoints.map((p, i) => `${i + 1}. ${p}`),
      '',
      '── ACTION ITEMS ──',
      ...AI_SUMMARY.actionItems.map(a => `• ${a.task}  →  ${a.assignee} (Due: ${a.due})`),
    ];
    return lines.join('\n');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getSummaryText());
    } catch {
      // fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = getSummaryText();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const shareData = {
      title: AI_SUMMARY.meetingTitle,
      text: `AI Meeting Summary: ${AI_SUMMARY.meetingTitle}\n${AI_SUMMARY.date} · ${AI_SUMMARY.duration}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // user cancelled or unsupported
      }
    } else {
      // fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = window.location.href;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  };

  const handleExportPDF = () => {
    const actionRows = AI_SUMMARY.actionItems
      .map(
        (a, i) =>
          `<tr style="background:${i % 2 === 0 ? '#1e1e2e' : '#16161e'}">
            <td style="padding:10px 14px;color:#c9d1d9">${a.task}</td>
            <td style="padding:10px 14px;color:#c9d1d9;text-align:center">${a.assignee}</td>
            <td style="padding:10px 14px;color:#c9d1d9;text-align:center">${a.due}</td>
          </tr>`,
      )
      .join('');

    const keyPointRows = AI_SUMMARY.keyPoints
      .map(
        (p, i) =>
          `<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px">
            <span style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;min-width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700">${i + 1}</span>
            <span style="color:#c9d1d9;font-size:14px;line-height:1.6">${p}</span>
          </div>`,
      )
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>AI Meeting Summary – ${AI_SUMMARY.meetingTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0d0d17; color: #e6edf3; padding: 40px; }
    h1 { font-size: 24px; font-weight: 900; color: #fff; margin-bottom: 6px; }
    .meta { font-size: 13px; color: #8b949e; margin-bottom: 32px; display:flex; gap: 18px; }
    .badge { background: linear-gradient(135deg, rgba(99,102,241,.18), rgba(139,92,246,.12)); border: 1px solid rgba(99,102,241,.3); color: #a5b4fc; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; display:inline-flex; align-items:center; gap:6px; margin-bottom: 32px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 14px; display:flex; align-items:center; gap:8px; border-bottom: 1px solid rgba(255,255,255,.07); padding-bottom: 10px; }
    .summary-text { font-size: 14px; color: #c9d1d9; line-height: 1.8; white-space: pre-line; background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07); border-radius: 12px; padding: 18px; }
    table { width: 100%; border-collapse: collapse; border-radius: 12px; overflow: hidden; }
    thead tr { background: linear-gradient(135deg, #6366f1, #8b5cf6); }
    thead th { padding: 12px 14px; color: #fff; font-size: 13px; font-weight: 600; text-align: left; }
    .stats { display:flex; gap:16px; margin-bottom: 32px; }
    .stat-card { flex:1; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 12px; padding: 16px; text-align:center; }
    .stat-card .val { font-size: 22px; font-weight: 900; color: #a5b4fc; }
    .stat-card .lbl { font-size: 11px; color: #8b949e; margin-top: 4px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.07); font-size: 11px; color: #8b949e; display:flex; justify-content:space-between; }
    @media print { body { background: #fff !important; color: #111 !important; } }
  </style>
</head>
<body>
  <div class="badge">🤖 Powered by OpenAI Whisper + GPT-4 &nbsp;·&nbsp; AI Analysis Complete</div>
  <h1>${AI_SUMMARY.meetingTitle}</h1>
  <div class="meta">
    <span>📅 ${AI_SUMMARY.date}</span>
    <span>⏱ ${AI_SUMMARY.duration}</span>
    <span>👥 ${AI_SUMMARY.participants.join(', ')}</span>
  </div>

  <div class="stats">
    <div class="stat-card"><div class="val">${AI_SUMMARY.sentiment}</div><div class="lbl">Sentiment</div></div>
    <div class="stat-card"><div class="val">${AI_SUMMARY.engagementScore}%</div><div class="lbl">Engagement</div></div>
    <div class="stat-card"><div class="val">${AI_SUMMARY.followUpReduction}</div><div class="lbl">Follow-up Saved</div></div>
    <div class="stat-card"><div class="val">${AI_SUMMARY.actionItems.length}</div><div class="lbl">Action Items</div></div>
  </div>

  <div class="section">
    <div class="section-title">📝 Meeting Summary</div>
    <div class="summary-text">${AI_SUMMARY.summary}</div>
  </div>

  <div class="section">
    <div class="section-title">⚡ Key Discussion Points</div>
    ${keyPointRows}
  </div>

  <div class="section">
    <div class="section-title">✅ Action Items</div>
    <table>
      <thead><tr><th>Task</th><th style="text-align:center">Assignee</th><th style="text-align:center">Due Date</th></tr></thead>
      <tbody>${actionRows}</tbody>
    </table>
  </div>

  <div class="footer">
    <span>Generated by IntellMeet AI</span>
    <span>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
  </div>

  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); };<\/script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.onunload = () => URL.revokeObjectURL(url);
    }
  };

  const sentimentColors = {
    Positive: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
    Negative: 'text-red-400 bg-red-500/15 border-red-500/30',
    Neutral: 'text-gray-400 bg-gray-500/15 border-gray-500/30',
  };

  return (
    <div className="p-6 space-y-6 page-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-indigo-400" />
            <span className="text-sm font-semibold text-indigo-400">AI Meeting Intelligence</span>
          </div>
          <h2 className="text-2xl font-black text-white">{AI_SUMMARY.meetingTitle}</h2>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{AI_SUMMARY.date}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{AI_SUMMARY.duration}</span>
            <span>·</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" />{AI_SUMMARY.participants.length} participants</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-white/10 hover:border-white/20 text-sm text-gray-400 hover:text-white transition-all">
            {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button onClick={handleShare} className="flex items-center gap-2 px-3 py-2 rounded-xl glass border border-white/10 hover:border-white/20 text-sm text-gray-400 hover:text-white transition-all">
            {shared ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            {shared ? 'Link Copied!' : 'Share'}
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-sm font-semibold transition-all">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </motion.div>

      {/* AI Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative rounded-2xl overflow-hidden p-5 border border-indigo-500/20"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)' }}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center glow-indigo">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <div className="text-sm font-bold text-white">AI Analysis Complete</div>
              <div className="text-xs text-gray-400">Powered by OpenAI Whisper + GPT-4</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:ml-auto">
            {[
              { label: 'Sentiment', value: AI_SUMMARY.sentiment, icon: Star, extra: sentimentColors.Positive },
              { label: 'Engagement', value: `${AI_SUMMARY.engagementScore}%`, icon: TrendingUp, extra: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
              { label: 'Time Saved', value: AI_SUMMARY.followUpReduction, icon: Zap, extra: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' },
            ].map((m) => (
              <div key={m.label} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${m.extra}`}>
                <m.icon className="w-3.5 h-3.5" />
                <div>
                  <div className="text-xs font-bold">{m.value}</div>
                  <div className="text-[10px] opacity-70">{m.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 glass rounded-xl p-1 border border-white/5 w-fit">
        {(['summary', 'transcript', 'actions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              activeTab === tab ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'actions' ? 'Action Items' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-4">
            {/* Summary Text */}
            <div className="glass rounded-2xl border border-white/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" /> Meeting Summary
                </h3>
                <button onClick={() => setExpandedSection(expandedSection === 'summary' ? null : 'summary')}>
                  {expandedSection === 'summary' ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
              </div>
              {expandedSection !== 'summary' ? (
                <p className="text-sm text-gray-400 leading-relaxed line-clamp-3">{AI_SUMMARY.summary}</p>
              ) : (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-gray-300 leading-loose whitespace-pre-line">
                  {AI_SUMMARY.summary}
                </motion.p>
              )}
            </div>

            {/* Key Points */}
            <div className="glass rounded-2xl border border-white/5 p-5">
              <h3 className="font-bold text-white flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-amber-400" /> Key Discussion Points
              </h3>
              <div className="space-y-2.5">
                {AI_SUMMARY.keyPoints.map((point, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/5 transition-all"
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-sm text-gray-300 leading-relaxed">{point}</span>
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
            {/* Participants */}
            <div className="glass rounded-2xl border border-white/5 p-5">
              <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" /> Participants
              </h3>
              <div className="space-y-2">
                {AI_SUMMARY.participants.map((name, i) => (
                  <div key={name} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold shrink-0">
                      {name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-xs text-gray-300">{name}</span>
                    {i === 0 && <span className="ml-auto text-xs text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">Host</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass rounded-2xl border border-white/5 p-5">
              <h3 className="font-bold text-white text-sm mb-3">Meeting Stats</h3>
              <div className="space-y-3">
                {[
                  { label: 'Engagement Score', value: AI_SUMMARY.engagementScore, max: 100, color: 'bg-indigo-500' },
                  { label: 'AI Accuracy', value: 89, max: 100, color: 'bg-emerald-500' },
                  { label: 'Action Items', value: AI_SUMMARY.actionItems.length, max: 10, color: 'bg-orange-500' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{stat.label}</span>
                      <span className="text-xs font-bold text-white">{stat.value}{stat.max === 100 ? '%' : ''}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(stat.value / stat.max) * 100}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className={`h-full ${stat.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Next Steps */}
            <div className="glass rounded-2xl border border-indigo-500/20 p-5" style={{ background: 'rgba(99,102,241,0.05)' }}>
              <h3 className="font-bold text-indigo-300 text-sm mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" /> AI Recommendations
              </h3>
              <div className="space-y-2 text-xs text-gray-400 leading-relaxed">
                <p>• Schedule a follow-up sync by Apr 20 to review PR #142</p>
                <p>• Consider adding Redis caching to the next sprint priority</p>
                <p>• Strong team momentum — maintain sprint velocity</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'transcript' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl border border-white/5 p-6">
          <h3 className="font-bold text-white flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-indigo-400" /> Full Transcript
            <span className="ml-2 text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">89% accuracy</span>
          </h3>
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {[
              { speaker: 'Alex Johnson', time: '00:00', text: 'Good morning everyone! Let\'s kick off the sprint review. We have a lot to cover today — the video recording feature, AI transcription integration, and design system updates.' },
              { speaker: 'Mike Torres', time: '00:45', text: 'I\'m happy to report that the video recording feature is now fully deployed to production. We had a few edge cases with the stream buffer, but those are resolved.' },
              { speaker: 'Sarah Chen', time: '02:10', text: 'The product roadmap alignment is critical before Q3. We need to finalize the AI summary feature scope and ensure it aligns with client expectations.' },
              { speaker: 'Priya Sharma', time: '03:30', text: 'The design system dark mode tokens are completed. All components are now using the new token system, which will make future theme changes much easier.' },
              { speaker: 'Alex Johnson', time: '05:15', text: 'Excellent work team. Our velocity is up 15% this sprint. Let\'s assign the remaining action items — Mike, can you take PR #142, and Alex will handle the API docs.' },
              { speaker: 'James Park', time: '06:40', text: 'I\'ll pick up the Redis caching configuration. Should have a working setup by April 20th.' },
            ].map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-4 p-3 rounded-xl hover:bg-white/3 transition-all"
              >
                <div className="text-xs text-gray-600 font-mono w-10 shrink-0 pt-1">{entry.time}</div>
                <div>
                  <div className="text-xs font-semibold text-indigo-400 mb-1">{entry.speaker}</div>
                  <p className="text-sm text-gray-300 leading-relaxed">{entry.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {activeTab === 'actions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Action Items
              <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                {AI_SUMMARY.actionItems.length} extracted by AI
              </span>
            </h3>
            <button onClick={() => setPage('kanban')} className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              View in Kanban →
            </button>
          </div>
          {AI_SUMMARY.actionItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl border border-white/5 p-5 hover:border-indigo-500/20 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white mb-2">{item.task}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[10px] font-bold">
                        {item.assignee.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-xs text-gray-400">{item.assignee}</span>
                    </div>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">Due: {item.due}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/8 text-gray-400 transition-all border border-white/5">
                    Assign
                  </button>
                  <button className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 transition-all border border-indigo-500/20">
                    Add to Board
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

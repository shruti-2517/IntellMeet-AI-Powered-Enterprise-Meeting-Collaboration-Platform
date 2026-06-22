import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Zap, Clock, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { taskService } from '../services/task.service';

const priorityConfig = {
  high: { label: 'High', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
  urgent: { label: 'Urgent', icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/15 border-red-500/30' },
  medium: { label: 'Medium', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/15 border-amber-500/30' },
  low: { label: 'Low', icon: Circle, color: 'text-green-400', bg: 'bg-green-500/15 border-green-500/30' },
};

const COLUMN_META: Record<string, { title: string; color: string; bg: string; apiStatus: string }> = {
  todo: { title: 'To Do', color: '#6366f1', bg: 'from-indigo-500/10', apiStatus: 'todo' },
  'in-progress': { title: 'In Progress', color: '#f59e0b', bg: 'from-amber-500/10', apiStatus: 'in-progress' },
  review: { title: 'Review', color: '#06b6d4', bg: 'from-cyan-500/10', apiStatus: 'review' },
  completed: { title: 'Done', color: '#10b981', bg: 'from-emerald-500/10', apiStatus: 'completed' },
};

interface Task {
  _id: string;
  title: string;
  priority: string;
  status: string;
  column?: string;
  tags?: string[];
  assignee?: { name: string };
}

type ColumnMap = Record<string, Task[]>;

export default function KanbanPage() {
  const [columns, setColumns] = useState<ColumnMap>({ todo: [], 'in-progress': [], review: [], completed: [] });
  const [draggedCard, setDraggedCard] = useState<{ id: string; col: string } | null>(null);
  const [showNewCard, setShowNewCard] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch tasks from API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await taskService.getTasks();
        const tasks: Task[] = Array.isArray(res) ? res : res?.tasks ?? [];
        // Distribute into columns by status/column field
        const newCols: ColumnMap = { todo: [], 'in-progress': [], review: [], completed: [] };
        tasks.forEach((t) => {
          const col = t.column ?? t.status ?? 'todo';
          const key = col === 'inProgress' ? 'in-progress' : col === 'done' ? 'completed' : col;
          if (newCols[key]) newCols[key].push(t);
          else newCols['todo'].push(t);
        });
        setColumns(newCols);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const handleDragStart = (cardId: string, colKey: string) => setDraggedCard({ id: cardId, col: colKey });

  const handleDrop = async (targetCol: string) => {
    if (!draggedCard || draggedCard.col === targetCol) { setDraggedCard(null); return; }
    const card = columns[draggedCard.col]?.find(c => c._id === draggedCard.id);
    if (!card) { setDraggedCard(null); return; }

    // Optimistic UI update
    setColumns(prev => ({
      ...prev,
      [draggedCard.col]: prev[draggedCard.col].filter(c => c._id !== draggedCard.id),
      [targetCol]: [...prev[targetCol], { ...card, status: COLUMN_META[targetCol].apiStatus, column: targetCol }],
    }));
    setDraggedCard(null);

    // Persist to backend
    try {
      await taskService.updateTask(card._id, { status: COLUMN_META[targetCol].apiStatus, column: targetCol });
    } catch {
      // Revert on failure
      setColumns(prev => ({
        ...prev,
        [targetCol]: prev[targetCol].filter(c => c._id !== card._id),
        [draggedCard.col]: [...prev[draggedCard.col], card],
      }));
    }
  };

  const addCard = async (colKey: string) => {
    if (!newCardTitle.trim()) return;
    try {
      const newTask = await taskService.createTask({
        title: newCardTitle,
        priority: 'medium',
      });
      setColumns(prev => ({
        ...prev,
        [colKey]: [...prev[colKey], newTask],
      }));
    } catch {
      // Fallback: optimistic local-only card
      setColumns(prev => ({
        ...prev,
        [colKey]: [...prev[colKey], { _id: `tmp-${Date.now()}`, title: newCardTitle, priority: 'medium', status: 'todo', tags: [] }],
      }));
    }
    setNewCardTitle('');
    setShowNewCard(null);
  };

  return (
    <div className="p-6 page-fade-in h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-white">Kanban Board</h2>
          <p className="text-sm text-gray-400 mt-1">Drag & drop tasks across workflow stages</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewCard('todo')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
        {Object.entries(COLUMN_META).map(([colKey, meta]) => {
          const items = columns[colKey] ?? [];
          return (
            <motion.div
              key={colKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-shrink-0 w-72 flex flex-col rounded-2xl overflow-hidden"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(colKey)}
            >
              {/* Column Header */}
              <div
                className={`p-4 border-b border-white/5 bg-gradient-to-r ${meta.bg} to-transparent`}
                style={{ borderTop: `3px solid ${meta.color}` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{meta.title}</span>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}40` }}
                    >
                      {items.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setShowNewCard(showNewCard === colKey ? null : colKey)}
                      className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <button className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Column Body */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-white/2">
                {/* New card input */}
                {showNewCard === colKey && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl border border-indigo-500/30 p-3">
                    <input
                      autoFocus
                      value={newCardTitle}
                      onChange={(e) => setNewCardTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addCard(colKey); if (e.key === 'Escape') setShowNewCard(null); }}
                      placeholder="Task title..."
                      className="w-full bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none mb-2"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => addCard(colKey)} className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all">Add</button>
                      <button onClick={() => setShowNewCard(null)} className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-all">Cancel</button>
                    </div>
                  </motion.div>
                )}

                {/* Loading skeletons */}
                {loading && [...Array(2)].map((_, i) => (
                  <div key={i} className="h-24 glass rounded-xl border border-white/5 animate-pulse" />
                ))}

                {/* Cards */}
                {!loading && items.map((card, i) => {
                  const pKey = (card.priority ?? 'medium') as keyof typeof priorityConfig;
                  const priority = priorityConfig[pKey] ?? priorityConfig.medium;
                  const initials = card.assignee?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '??';
                  return (
                    <motion.div
                      key={card._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      draggable
                      onDragStart={() => handleDragStart(card._id, colKey)}
                      className={`kanban-card glass rounded-xl border border-white/5 p-4 cursor-grab active:cursor-grabbing ${draggedCard?.id === card._id ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border ${priority.bg} ${priority.color}`}>
                          <priority.icon className="w-3 h-3" />
                          {priority.label}
                        </div>
                        <button className="text-gray-600 hover:text-gray-400 transition-colors">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-medium text-gray-200 leading-snug mb-3">{card.title}</p>
                      {card.tags && card.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {card.tags.map(tag => (
                            <span key={tag} className="text-xs bg-white/5 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-[9px] font-bold">
                          {initials}
                        </div>
                        {colKey === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                        {colKey === 'in-progress' && (
                          <div className="flex gap-0.5">
                            {[1, 2, 3].map(b => <div key={b} className="w-1 bg-amber-400 rounded-full ai-wave-bar" style={{ height: '10px' }} />)}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}

                {!loading && items.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Zap className="w-8 h-8 text-gray-700 mb-2" />
                    <p className="text-xs text-gray-600">Drop cards here</p>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

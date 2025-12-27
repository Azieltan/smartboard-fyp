'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Task {
  task_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
}

interface PendingTasksWidgetProps {
  userId: string;
}

const priorityColors: Record<string, { bg: string; text: string }> = {
  low: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  medium: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  high: { bg: 'bg-red-500/20', text: 'text-red-400' },
};

const statusColors: Record<string, string> = {
  todo: 'bg-slate-500',
  in_progress: 'bg-blue-500',
  done: 'bg-emerald-500',
};

export function PendingTasksWidget({ userId }: PendingTasksWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchTasks = async () => {
      try {
        const data = await api.get(`/tasks?userId=${userId}`);
        if (Array.isArray(data)) {
          // Filter pending tasks (not done)
          const pending = data
            .filter((t: Task) => t.status !== 'done')
            .slice(0, 5);
          setTasks(pending);
        }
      } catch (error) {
        console.error('Failed to fetch tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [userId]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <div className="glass-panel p-6 animate-pulse">
        <div className="h-6 w-40 bg-white/10 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/5 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl p-6 bg-[#1e293b] border border-white/10 shadow-xl group h-[400px] flex flex-col">
      {/* Background Illustration */}
      <div className="absolute -right-6 -bottom-6 text-emerald-500/5 transform -rotate-12 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
        <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      </div>

      <div className="relative z-10 flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
          📋
        </div>
        <h2 className="text-lg font-bold text-white">My Pending Tasks</h2>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p className="text-4xl mb-2 opacity-30">✅</p>
          <p className="text-sm">All tasks completed!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const priority = task.priority || 'medium';
            const colors = priorityColors[priority];
            const dueDate = formatDate(task.due_date);

            return (
              <div
                key={task.task_id}
                className="relative flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group overflow-hidden"
              >
                {/* Status indicator bar */}
                <div className={`absolute right-0 top-0 bottom-0 w-1 ${statusColors[task.status]}`}></div>

                {/* Content */}
                <div className="flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-violet-400 transition-colors">
                      {task.title}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${colors.bg} ${colors.text}`}>
                      {priority}
                    </span>
                  </div>
                  {dueDate && (
                    <p className="text-xs text-slate-400">
                      Due: {dueDate}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

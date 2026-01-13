'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import TaskDetailModal from './TaskDetailModal';
import EditTaskModal from './EditTaskModal';

interface Task {
  task_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  user_id?: string;
  created_by?: string;
  depends_on?: string;
  dependency?: { title: string; status: string };
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

  // Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Sort Persistence
  const [sortOption, setSortOption] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboard_task_sort') || 'dueDate_asc';
    }
    return 'dueDate_asc';
  });

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setSortOption(newVal);
    localStorage.setItem('dashboard_task_sort', newVal);
  };

  useEffect(() => {
    if (!userId) return;

    const fetchTasks = async () => {
      try {
        const data = await api.get(`/tasks?userId=${userId}`);
        if (Array.isArray(data)) {
          // Filter pending tasks (not done) AND Assigned to me
          let pending = data.filter((t: Task) => t.status !== 'done' && t.user_id === userId);

          // Apply sorting
          pending.sort((a, b) => {
            if (sortOption === 'dueDate_asc') { // Latest to New (Wait, default usually Oldest First for due date, but keeping logic consistent with user request "latest to new" -> maybe desc?)
              // "Latest to New" usually means Future -> Past. 
              // "New to Latest" is ambiguous. 
              // Let's implement standard Time based:
              // Ascending: Oldest due date top (Urgent)
              // Descending: Furthest due date top
              if (!a.due_date) return 1; if (!b.due_date) return -1;
              return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            } else if (sortOption === 'dueDate_desc') {
              if (!a.due_date) return 1; if (!b.due_date) return -1;
              return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
            } else if (sortOption === 'priority_high') { // High to Low
              const pMap = { high: 3, medium: 2, low: 1 };
              const valA = pMap[(a.priority || 'medium') as keyof typeof pMap] || 0;
              const valB = pMap[(b.priority || 'medium') as keyof typeof pMap] || 0;
              return valB - valA;
            } else if (sortOption === 'priority_low') { // Low to High
              const pMap = { high: 3, medium: 2, low: 1 };
              const valA = pMap[(a.priority || 'medium') as keyof typeof pMap] || 0;
              const valB = pMap[(b.priority || 'medium') as keyof typeof pMap] || 0;
              return valA - valB;
            }
            return 0;
          });

          setTasks(pending.slice(0, 5));
        }
      } catch (error: any) {
        // Suppress stale user errors
        if (error?.response?.status !== 500) {
          console.error('Failed to fetch tasks:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [userId, sortOption]);

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

      <div className="relative z-10 flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl">
            📋
          </div>
          <h2 className="text-lg font-bold text-white">My Pending Tasks</h2>
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortOption}
          onChange={handleSortChange}
          className="bg-black/30 text-white text-xs border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-emerald-500"
        >
          <option value="dueDate_asc">Date: Urgent First</option>
          <option value="dueDate_desc">Date: Later First</option>
          <option value="priority_high">Priority: High to Low</option>
          <option value="priority_low">Priority: Low to High</option>
        </select>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p className="text-4xl mb-2 opacity-30">✅</p>
          <p className="text-sm">All tasks completed!</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2">
          {tasks.map((task) => {
            const priority = task.priority || 'medium';
            const colors = priorityColors[priority];
            const dueDate = formatDate(task.due_date);

            return (
              <div
                key={task.task_id}
                onClick={() => setSelectedTask(task)}
                className="relative flex items-center gap-4 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group overflow-hidden cursor-pointer"
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
                  {task.dependency && (
                    <div className="flex items-center gap-1 mt-1">
                      <div className={`w-1 h-1 rounded-full ${task.dependency.status === 'done' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {task.dependency.status === 'done' ? 'Ready' : `Blocked by ${task.dependency.title}`}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {selectedTask && !isEditing && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => setSelectedTask(null)}
          onEdit={() => setIsEditing(true)}
        />
      )}

      {selectedTask && isEditing && (
        <EditTaskModal
          task={selectedTask}
          userId={userId}
          onClose={() => setIsEditing(false)}
          onTaskUpdated={(updatedTask) => {
            setIsEditing(false);
            if (updatedTask) setSelectedTask(updatedTask);
          }}
        />
      )}
    </div>
  );
}

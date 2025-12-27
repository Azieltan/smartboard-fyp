'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Subtask {
  subtask_id: string;
  task_id: string;
  title: string;
  is_completed: boolean;
}

interface TaskDetailModalProps {
  task: any;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TaskDetailModal({ task, onClose, onUpdate }: TaskDetailModalProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (task) {
      // Fetch subtasks (backend usually returns them with task? Or separate endpoint?)
      // If backend TaskService.getAllTasks doesn't include subtasks, we assume we might need to fetch detailed task info.
      // But usually we just fetch them potentially. 
      // Wait, does 'subtasks' table exist? Yes, TaskService has addSubtask.
      // Let's assume we fetch them separately or they are included. 
      // Checking TaskService.getAllTasks: returns `select('*')`. No `subtasks`.
      // We probably need `GET /tasks/:id/subtasks` or similar.
      // Or `select('*, subtasks(*)')`.
      // For now let's implement a fetch logic if needed, or assume we need to update getAllTasks.
      // Better to assume we need to fetch subtasks here.
      // Wait, there is no endpoint for fetching subtasks in index.ts!
      // I should add `GET /tasks/:id` which includes subtasks.

      // Actually, let's add `GET /tasks/:taskId` in backend first?
      // Or just fetches subtasks directly via Supabase client? Frontend doesn't use Supabase client directly usually.
      // I'll add `GET /tasks/:taskId` to index.ts and update TaskService.getTask(taskId).
      fetchTaskDetails();
    }
  }, [task]);

  const fetchTaskDetails = async () => {
    try {
      const data = await api.get(`/tasks/${task.task_id}`);
      if (data && data.subtasks) {
        setSubtasks(data.subtasks);
      }
    } catch (e) {
      console.error("Failed to fetch task details", e);
    } finally {
      setLoading(false);
    }
  };

  const addSubtask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    try {
      const result = await api.post(`/tasks/${task.task_id}/subtasks`, { title: newSubtask });
      setSubtasks([...subtasks, result]);
      setNewSubtask('');
      onUpdate(); // Refresh task status logic if needed
    } catch (e) {
      alert('Failed to add subtask');
    }
  };

  const toggleSubtask = async (subtaskId: string, currentStatus: boolean) => {
    try {
      const updated = await api.put(`/tasks/subtasks/${subtaskId}`, { isCompleted: !currentStatus });
      setSubtasks(subtasks.map(s => s.subtask_id === subtaskId ? updated : s));
      onUpdate();
    } catch (e) {
      alert('Failed to update subtask');
    }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{task.title}</h2>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${task.priority === 'high' ? 'bg-red-100 text-red-600' :
                  task.priority === 'medium' ? 'bg-amber-100 text-amber-600' :
                    'bg-blue-100 text-blue-600'
                }`}>
                {task.priority.toUpperCase()}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Date'}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
          {task.description && (
            <div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Description</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap bg-slate-50 dark:bg-black/20 p-3 rounded-xl">
                {task.description}
              </p>
            </div>
          )}

          {/* Subtasks */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
              <span>Subtasks</span>
              <span className="text-xs font-normal text-slate-500">
                {subtasks.filter(s => s.is_completed).length}/{subtasks.length} Completed
              </span>
            </h3>

            <div className="space-y-2 mb-4">
              {subtasks.map(subtask => (
                <div key={subtask.subtask_id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group">
                  <button
                    onClick={() => toggleSubtask(subtask.subtask_id, subtask.is_completed)}
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${subtask.is_completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-300 dark:border-slate-500 hover:border-emerald-500'
                      }`}
                  >
                    {subtask.is_completed && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                  <span className={`text-sm flex-1 ${subtask.is_completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                    {subtask.title}
                  </span>
                </div>
              ))}
              {subtasks.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-2">No subtasks yet</p>
              )}
            </div>

            <form onSubmit={addSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a subtask..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!newSubtask.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Subtask {
  subtask_id: string;
  task_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  attachments?: string[];
}

interface TaskDetailModalProps {
  task: any;
  onClose: () => void;
  onUpdate: () => void;
  onEdit?: () => void;
}

export default function TaskDetailModal({ task, onClose, onUpdate, onEdit }: TaskDetailModalProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    if (task) {
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
      onUpdate();
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

  const handleSubtaskUpload = async (subtaskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    try {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);

      await api.post(`/tasks/subtasks/${subtaskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchTaskDetails(); // Refresh to get updated attachments
      onUpdate();
    } catch (error) {
      console.error('Failed to upload attachment', error);
      alert('Failed to upload file');
    }
  };

  const startEditingSubtask = (subtask: Subtask) => {
    if (task.status === 'done') return;
    setEditingSubtaskId(subtask.subtask_id);
    setEditTitle(subtask.title);
  };

  const saveSubtaskEdit = async (subtaskId: string) => {
    if (!editTitle.trim()) return;
    try {
      const updated = await api.put(`/tasks/subtasks/${subtaskId}`, { title: editTitle });
      setSubtasks(subtasks.map(s => s.subtask_id === subtaskId ? { ...s, title: updated.title } : s));
      setEditingSubtaskId(null);
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

          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-lg transition-colors"
              >
                Edit
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
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
                <div key={subtask.subtask_id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group">
                  <button
                    onClick={() => toggleSubtask(subtask.subtask_id, subtask.is_completed)}
                    disabled={task.status === 'done'}
                    className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border transition-all ${subtask.is_completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 dark:border-slate-500 hover:border-emerald-500'
                      } ${task.status === 'done' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {subtask.is_completed && (
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                  <div className="flex-1">
                    {editingSubtaskId === subtask.subtask_id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border rounded dark:bg-black/30 dark:border-white/10"
                          autoFocus
                        />
                        <button onClick={() => saveSubtaskEdit(subtask.subtask_id)} className="text-emerald-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></button>
                        <button onClick={() => setEditingSubtaskId(null)} className="text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="group/title flex items-center gap-2">
                          <div>
                            <span className={`text-sm block ${subtask.is_completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
                              {subtask.title}
                            </span>
                            {subtask.description && (
                              <span className="text-xs text-slate-500 block mt-0.5">{subtask.description}</span>
                            )}
                          </div>
                          {task.status !== 'done' && (
                            <button onClick={() => startEditingSubtask(subtask)} className="opacity-0 group-hover/title:opacity-100 text-slate-400 hover:text-blue-500 transition-opacity">
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Attachments */}
                          {subtask.attachments && subtask.attachments.length > 0 && (
                            <div className="flex -space-x-1">
                              {subtask.attachments.map((url, i) => (
                                <a href={url} target="_blank" key={i} className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] border border-white hover:z-10" title="Attachment">
                                  📎
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Upload Button */}
                          {task.status !== 'done' && (
                            <label className="cursor-pointer text-slate-400 hover:text-blue-500 p-1" title="Upload Attachment">
                              <input type="file" className="hidden" onChange={(e) => handleSubtaskUpload(subtask.subtask_id, e)} onClick={(e) => e.stopPropagation()} />
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            </label>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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

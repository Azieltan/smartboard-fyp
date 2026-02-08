'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import TaskDetailModal from './TaskDetailModal';
import EditTaskModal from './EditTaskModal';
import TaskSubmissionModal from './TaskSubmissionModal';

interface Task {
  task_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_review' | 'done';
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  assignee_id?: string;
  created_by?: string;
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
  in_review: 'bg-amber-500',
  done: 'bg-emerald-500',
};

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  in_review: 'In Review',
  done: 'Done',
};

export function PendingTasksWidget({ userId }: PendingTasksWidgetProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const fetchTasks = async () => {
    try {
      const data = await api.get(`/tasks?userId=${userId}`);
      if (Array.isArray(data)) {
        // Filter pending tasks (not done) AND Assigned to me
        let pending = data.filter((t: Task) => t.status !== 'done' && t.assignee_id === userId);

        // Apply sorting
        pending.sort((a, b) => {
          if (sortOption === 'dueDate_asc') {
            if (!a.due_date) return 1; if (!b.due_date) return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          } else if (sortOption === 'dueDate_desc') {
            if (!a.due_date) return 1; if (!b.due_date) return -1;
            return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
          } else if (sortOption === 'priority_high') {
            const pMap = { high: 3, medium: 2, low: 1 };
            const valA = pMap[(a.priority || 'medium') as keyof typeof pMap] || 0;
            const valB = pMap[(b.priority || 'medium') as keyof typeof pMap] || 0;
            return valB - valA;
          } else if (sortOption === 'priority_low') {
            const pMap = { high: 3, medium: 2, low: 1 };
            const valA = pMap[(a.priority || 'medium') as keyof typeof pMap] || 0;
            const valB = pMap[(b.priority || 'medium') as keyof typeof pMap] || 0;
            return valA - valB;
          } else if (sortOption === 'status') {
            const statusOrder: Record<string, number> = { todo: 0, in_review: 1, done: 2 };
            return (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
          }
          return 0;
        });

        setTasks(pending.slice(0, 5));
      }
    } catch (error: any) {
      if (error?.response?.status !== 500) {
        console.error('Failed to fetch tasks:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!userId) return;
    fetchTasks();
  }, [userId, sortOption]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Role-based action helpers
  const canEdit = (task: Task) => userId === task.created_by;
  // Mark as Done: Only if self-assigned (created_by == assignee_id) AND currentUser is the assignee AND not in review.
  const isSelfAssigned = (task: Task) => task.created_by === task.assignee_id;

  const canMarkDone = (task: Task) =>
    task.status !== 'done' &&
    task.status !== 'in_review' &&
    userId === task.assignee_id &&
    isSelfAssigned(task);

  // Submit: Only if assigned to someone else, current user is assignee, and not in review.
  const canSubmit = (task: Task) =>
    task.status !== 'done' &&
    task.status !== 'in_review' &&
    userId === task.assignee_id &&
    !isSelfAssigned(task);

  const handleMarkAsDone = async (task: Task) => {
    try {
      await api.put(`/tasks/${task.task_id}`, { status: 'done' });
      fetchTasks();
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to mark task as done:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    if (canSubmit(task)) {
      setIsSubmitting(true);
    }
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

        {/* Sort Dropdown - Higher z-index */}
        <div className="relative z-50">
          <select
            value={sortOption}
            onChange={handleSortChange}
            className="bg-black/30 text-white text-xs border border-white/10 rounded-lg px-2 py-1 outline-none focus:border-emerald-500"
          >
            <option value="dueDate_asc">Date: Urgent First</option>
            <option value="dueDate_desc">Date: Later First</option>
            <option value="priority_high">Priority: High to Low</option>
            <option value="priority_low">Priority: Low to High</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p className="text-4xl mb-2 opacity-30">✅</p>
          <p className="text-sm">All tasks completed!</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1">
          {tasks.map((task) => {
            const priority = task.priority || 'medium';
            const colors = priorityColors[priority];
            const dueDate = formatDate(task.due_date);
            const isCreator = userId === task.created_by;
            const isAssignee = userId === task.assignee_id;

            return (
              <div
                key={task.task_id}
                className="relative flex flex-col gap-2 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group/item overflow-hidden"
              >
                {/* Status indicator bar */}
                <div className={`absolute right-0 top-0 bottom-0 w-1 ${statusColors[task.status]}`}></div>

                {/* Main Content - Clickable */}
                <div
                  onClick={() => handleTaskClick(task)}
                  className="flex-1 min-w-0 pr-4 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-semibold text-white truncate group-hover/item:text-violet-400 transition-colors flex-1">
                      {task.title}
                    </p>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${colors.bg} ${colors.text} shrink-0`}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </span>
                  </div>

                  {/* Description preview */}
                  {task.description && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-1">
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    {/* Status Badge */}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[task.status]} text-white`}>
                      {statusLabels[task.status]}
                    </span>
                    {dueDate && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {dueDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  {/* Edit Button - Only for creator */}
                  {canEdit(task) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                        setIsEditing(true);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Edit Task"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  )}

                  {canMarkDone(task) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsDone(task);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                      title="Mark as Done"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Done
                    </button>
                  )}

                  {/* Submit for Review Button - Only for assignee who is NOT the creator */}
                  {canSubmit(task) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(task);
                        setIsSubmitting(true);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors"
                      title="Submit for Review"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Submit
                    </button>
                  )}

                  {/* View Details Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskClick(task);
                    }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:bg-white/10 rounded-lg transition-colors ml-auto"
                    title="View Details"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      {selectedTask && !isEditing && !isSubmitting && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={() => {
            fetchTasks();
            setSelectedTask(null);
          }}
          onEdit={() => setIsEditing(true)}
          currentUserId={userId}
        />
      )}

      {/* Edit Task Modal */}
      {selectedTask && isEditing && (
        <EditTaskModal
          task={selectedTask}
          userId={userId}
          onClose={() => setIsEditing(false)}
          onTaskUpdated={(updatedTask) => {
            setIsEditing(false);
            fetchTasks();
            if (updatedTask) setSelectedTask(updatedTask);
          }}
        />
      )}

      {/* Task Submission Modal */}
      {selectedTask && isSubmitting && (
        <TaskSubmissionModal
          taskId={selectedTask.task_id}
          userId={userId}
          taskTitle={selectedTask.title}
          description={selectedTask.description}
          priority={selectedTask.priority}
          dueDate={selectedTask.due_date}
          onClose={() => {
            setIsSubmitting(false);
            setSelectedTask(null);
          }}
          onSubmitSuccess={() => {
            setIsSubmitting(false);
            setSelectedTask(null);
            fetchTasks();
          }}
        />
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import CreateTaskModal from '../../../components/CreateTaskModal';
import TaskSubmissionModal from '../../../components/TaskSubmissionModal';
import TaskReviewModal from '../../../components/TaskReviewModal';

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Modal types
    const [activeModal, setActiveModal] = useState<'detail' | 'submission' | 'review' | null>(null);

    const [userId, setUserId] = useState<string | null>(null);

    // ... (useEffect and specific fetchTasks remain same)

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserId(user.user_id);
            fetchTasks(user.user_id);
        }
    }, []);

    const fetchTasks = async (uid: string) => {
        try {
            const data = await api.get(`/tasks?userId=${uid}`);
            if (Array.isArray(data)) {
                setTasks(data);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        }
    };

    const [activeTab, setActiveTab] = useState<'my_work' | 'delegated'>('my_work');

    const getTasksByStatus = (status: string) => {
        return tasks.filter((t) => {
            const statusMatch = t.status === status;
            if (!statusMatch) return false;

            if (activeTab === 'my_work') {
                // Show tasks assigned to me
                // OR tasks I created but haven't assigned to anyone yet (so I can see them to assign) which naturally fall into todo
                return t.user_id === userId || (t.created_by === userId && !t.user_id);
            } else {
                // Delegated: Created by me, assigned to someone else
                return t.created_by === userId && t.user_id && t.user_id !== userId;
            }
        });
    };

    const handleTaskClick = async (task: any) => {
        console.log('Task Clicked:', task);
        console.log('Current User:', userId);
        console.log('Logic Check:', {
            status: task.status,
            isAssignee: task.user_id === userId,
            isCreator: task.created_by === userId,
            creatorId: task.created_by
        });

        // 1. Todo -> In Progress (Auto-move if assignee)
        if (task.status === 'todo' && task.user_id === userId) {
            try {
                // Optimistic update
                const updatedTask = { ...task, status: 'in_progress' };
                setTasks(prev => prev.map(t => t.task_id === task.task_id ? updatedTask : t));

                // API Call
                await api.put(`/tasks/${task.task_id}`, { status: 'in_progress' });

                // Open Submission Modal (now it's in progress)
                setSelectedTask(updatedTask);
                setActiveModal('submission');
                return;
            } catch (e) {
                console.error("Failed to auto-progress task", e);
                // Revert on fail? For now just simple log
            }
        }

        setSelectedTask(task);

        // 2. Open appropriate modal based on status/role
        if (task.status === 'in_progress' && task.user_id === userId) {
            console.log('Opening Submission Modal');
            setActiveModal('submission');
        } else if (task.status === 'in_review') {
            // If I created it, OR I am the owner of the group it belongs to (complex check not done here yet), OR I am just the original creator
            // For now, checking created_by is the most robust direct check
            if (task.created_by === userId) {
                console.log('Opening Review Modal (Creator)');
                setActiveModal('review');
            } else {
                // Logic hole: What if I am the admin of the group but didn't create the task?
                // For now, let's assume only creator reviews.
                console.log('Opening Detail Modal (Not Creator)', { creator: task.created_by, me: userId });
                setActiveModal('detail');
            }
        } else {
            console.log('Opening Detail Modal (Fallback)');
            setActiveModal('detail');
        }
    };

    if (!userId) return <div className="p-8 text-center text-slate-400">Please login to view tasks.</div>;

    return (
        <div className="h-full flex flex-col">
            <header className="mb-6">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Task Board</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage assignments and track progress.</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-colors"
                    >
                        + New Task
                    </button>
                </div>

                {/* View Toggles */}
                <div className="flex p-1 bg-slate-100 dark:bg-white/5 w-fit rounded-lg">
                    <button
                        onClick={() => setActiveTab('my_work')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'my_work'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                    >
                        My Work
                    </button>
                    <button
                        onClick={() => setActiveTab('delegated')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'delegated'
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                    >
                        Delegated / Reviewed
                    </button>
                </div>
            </header>

            {/* Kanban Board */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 overflow-hidden overflow-x-auto min-w-[1000px] lg:min-w-0">
                {['todo', 'in_progress', 'in_review', 'done'].map((status) => (
                    <div key={status} className="flex flex-col glass-panel h-full bg-slate-50 dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 min-w-[280px]">
                        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex justify-between items-center sticky top-0 bg-inherit z-10 rounded-t-2xl">
                            <h3 className="font-bold text-slate-800 dark:text-white capitalize flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${status === 'todo' ? 'bg-slate-400' :
                                    status === 'in_progress' ? 'bg-blue-500' :
                                        status === 'in_review' ? 'bg-purple-500' : 'bg-emerald-500'
                                    }`}></span>
                                {status.replace('_', ' ')}
                            </h3>
                            <span className="bg-white dark:bg-white/10 px-2 py-0.5 rounded text-xs text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-transparent font-mono">
                                {getTasksByStatus(status).length}
                            </span>
                        </div>
                        <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
                            {getTasksByStatus(status).map((task) => (
                                <div
                                    key={task.task_id}
                                    onClick={() => handleTaskClick(task)}
                                    className="p-4 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 rounded-xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md group shadow-sm active:scale-[0.98]"
                                >
                                    <div className="flex justify-between items-start mb-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${task.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20' :
                                            task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' :
                                                'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-green-400 dark:border-emerald-500/20'
                                            }`}>
                                            {task.priority}
                                        </span>
                                        {task.user_id !== userId && (
                                            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 leading-tight">{task.title}</h4>

                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                                        <div className={`text-[11px] font-medium flex items-center gap-1 ${task.due_date && new Date(task.due_date) < new Date() ? 'text-red-500' : 'text-slate-400'
                                            }`}>
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            {task.due_date ? new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Date'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {showCreateModal && (
                <CreateTaskModal
                    userId={userId}
                    onClose={() => setShowCreateModal(false)}
                    onTaskCreated={() => fetchTasks(userId!)}
                />
            )}

            {/* Submission Modal (For Assignee to submit work) */}
            {selectedTask && activeModal === 'submission' && (
                <TaskSubmissionModal
                    taskId={selectedTask.task_id}
                    userId={userId!}
                    taskTitle={selectedTask.title}
                    description={selectedTask.description}
                    priority={selectedTask.priority}
                    dueDate={selectedTask.due_date}
                    onClose={() => {
                        setActiveModal(null);
                        setSelectedTask(null);
                    }}
                    onSubmitSuccess={() => {
                        setActiveModal(null);
                        setSelectedTask(null);
                        fetchTasks(userId!);
                    }}
                />
            )}

            {/* Review Modal (For Owner to review work) */}
            {selectedTask && activeModal === 'review' && (
                <TaskReviewModal
                    taskId={selectedTask.task_id}
                    taskTitle={selectedTask.title}
                    onClose={() => {
                        setActiveModal(null);
                        setSelectedTask(null);
                    }}
                    onReviewComplete={() => {
                        setActiveModal(null);
                        setSelectedTask(null);
                        fetchTasks(userId!);
                    }}
                />
            )}

            {/* Standard Detail Modal (View Only) */}
            {selectedTask && activeModal === 'detail' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-8 scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{selectedTask.title}</h2>
                            <button onClick={() => { setActiveModal(null); setSelectedTask(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-lg">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="prose dark:prose-invert prose-sm max-w-none mb-8 bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{selectedTask.description || 'No description provided.'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Status</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${selectedTask.status === 'done' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                    selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400' :
                                        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                    }`}>
                                    {selectedTask.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Priority</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${selectedTask.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400' :
                                    selectedTask.priority === 'medium' ? 'bg-amber-100 text-amber-800 dark:bg-yellow-500/20 dark:text-yellow-400' :
                                        'bg-green-100 text-green-800 dark:bg-emerald-500/20 dark:text-emerald-400'
                                    }`}>
                                    {selectedTask.priority}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 col-span-2">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Due Date</p>
                                <p className="text-slate-900 dark:text-white font-medium flex items-center gap-2">
                                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleString(undefined, { dateStyle: 'full', timeStyle: 'short' }) : 'No Deadline'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

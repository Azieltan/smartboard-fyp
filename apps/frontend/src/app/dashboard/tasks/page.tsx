'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import CreateTaskModal from '../../../components/CreateTaskModal';

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

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

    const getTasksByStatus = (status: string) => tasks.filter((t) => t.status === status);

    if (!userId) return <div className="p-8 text-center text-slate-400">Please login to view tasks.</div>;

    return (
        <div className="h-full flex flex-col">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Task Board</h1>
                    <p className="text-slate-400 mt-1">Manage assignments and track progress.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-colors"
                >
                    + New Task
                </button>
            </header>

            {/* Kanban Board */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
                {['todo', 'in_progress', 'done'].map((status) => (
                    <div key={status} className="flex flex-col glass-panel h-full">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h3 className="font-bold text-white capitalize">{status.replace('_', ' ')}</h3>
                            <span className="bg-white/10 px-2 py-0.5 rounded text-xs text-slate-300">
                                {getTasksByStatus(status).length}
                            </span>
                        </div>
                        <div className="flex-1 p-4 space-y-3 overflow-y-auto custom-scrollbar">
                            {getTasksByStatus(status).map((task) => (
                                <div
                                    key={task.task_id}
                                    onClick={() => setSelectedTask(task)}
                                    className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl cursor-pointer transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                            task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-green-500/20 text-green-400'
                                            }`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-white mb-3">{task.title}</h4>

                                    <div className="flex justify-between items-center">
                                        <div className="text-xs text-slate-400">
                                            {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No Date'}
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
                    onTaskCreated={() => fetchTasks(userId)}
                />
            )}

            {/* Task Detail Modal (Simplified for now) */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1e293b] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-bold text-white">{selectedTask.title}</h2>
                            <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-white">✕</button>
                        </div>
                        <p className="text-slate-300 mb-4">{selectedTask.description || 'No description'}</p>
                        <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
                            <div>Status: <span className="text-white capitalize">{selectedTask.status.replace('_', ' ')}</span></div>
                            <div>Priority: <span className="text-white capitalize">{selectedTask.priority}</span></div>
                            <div>Due: <span className="text-white">{selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleString() : 'None'}</span></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

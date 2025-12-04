'use client';

import { useState } from 'react';

// Mock Data
const MOCK_USERS = [
    { id: '1', name: 'Alice', avatar: 'A' },
    { id: '2', name: 'Bob', avatar: 'B' },
    { id: '3', name: 'Charlie', avatar: 'C' },
];

const MOCK_TASKS = [
    {
        id: '1',
        title: 'Design Homepage',
        status: 'todo',
        priority: 'high',
        assignees: ['1'],
        subtasks: [
            { id: 's1', title: 'Hero Section', completed: true },
            { id: 's2', title: 'Footer', completed: false },
        ],
    },
    {
        id: '2',
        title: 'Setup Database',
        status: 'in_progress',
        priority: 'medium',
        assignees: ['2', '3'],
        subtasks: [],
    },
    {
        id: '3',
        title: 'Fix Login Bug',
        status: 'done',
        priority: 'low',
        assignees: ['1'],
        subtasks: [],
    },
];

export default function TasksPage() {
    const [selectedTask, setSelectedTask] = useState<any>(null);

    const getTasksByStatus = (status: string) => MOCK_TASKS.filter((t) => t.status === status);

    return (
        <div className="h-full flex flex-col">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white">Task Board</h1>
                    <p className="text-slate-400 mt-1">Manage assignments and track progress.</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-colors">
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
                        <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                            {getTasksByStatus(status).map((task) => (
                                <div
                                    key={task.id}
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
                                        <button className="text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                            •••
                                        </button>
                                    </div>
                                    <h4 className="font-bold text-white mb-3">{task.title}</h4>

                                    <div className="flex justify-between items-center">
                                        <div className="flex -space-x-2">
                                            {task.assignees.map((uid) => {
                                                const user = MOCK_USERS.find(u => u.id === uid);
                                                return (
                                                    <div key={uid} className="w-6 h-6 rounded-full bg-slate-700 border border-[#0f172a] flex items-center justify-center text-[10px] text-white font-bold" title={user?.name}>
                                                        {user?.avatar}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        {task.subtasks.length > 0 && (
                                            <div className="flex items-center gap-1 text-xs text-slate-400">
                                                <span>✓</span>
                                                <span>{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Task Detail Modal */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1e293b] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-start bg-[#0f172a]">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-sm text-slate-400">TASK-{selectedTask.id}</span>
                                    <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400 font-medium uppercase">
                                        {selectedTask.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-white">{selectedTask.title}</h2>
                            </div>
                            <button
                                onClick={() => setSelectedTask(null)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* Description */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-2">Description</h3>
                                <div className="p-4 bg-white/5 rounded-lg border border-white/5 text-slate-300 text-sm leading-relaxed">
                                    This is a placeholder description for the task. In the real app, this would be editable rich text.
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                {/* Assignees */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Assignees</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTask.assignees.map((uid: string) => {
                                            const user = MOCK_USERS.find(u => u.id === uid);
                                            return (
                                                <div key={uid} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                                                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                                                        {user?.avatar}
                                                    </div>
                                                    <span className="text-sm text-white">{user?.name}</span>
                                                    <button className="text-slate-500 hover:text-red-400 ml-1">×</button>
                                                </div>
                                            );
                                        })}
                                        <button className="px-3 py-1.5 border border-dashed border-slate-600 rounded-full text-sm text-slate-400 hover:text-white hover:border-slate-400 transition-colors">
                                            + Add
                                        </button>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-1">Due Date</h3>
                                        <p className="text-white">Oct 24, 2025</p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-1">Priority</h3>
                                        <p className="text-yellow-400 font-medium capitalize">{selectedTask.priority}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Subtasks */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Subtasks</h3>
                                    <span className="text-xs text-slate-500">1 of 2 completed</span>
                                </div>
                                <div className="space-y-2">
                                    {selectedTask.subtasks.map((sub: any) => (
                                        <div key={sub.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer group">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${sub.completed ? 'bg-blue-500 border-blue-500' : 'border-slate-500 group-hover:border-blue-400'
                                                }`}>
                                                {sub.completed && <span className="text-white text-xs">✓</span>}
                                            </div>
                                            <span className={`text-sm ${sub.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                                                {sub.title}
                                            </span>
                                        </div>
                                    ))}
                                    <button className="w-full py-2 text-sm text-slate-400 hover:text-blue-400 text-left pl-2 transition-colors">
                                        + Add subtask
                                    </button>
                                </div>
                            </div>

                            {/* Activity Log */}
                            <div>
                                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Activity</h3>
                                <div className="space-y-4 pl-4 border-l border-white/10">
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-600 border-2 border-[#1e293b]"></div>
                                        <p className="text-sm text-slate-400">
                                            <span className="font-bold text-white">Alice</span> changed status to <span className="text-blue-400">In Progress</span>
                                        </p>
                                        <p className="text-xs text-slate-600 mt-0.5">2 hours ago</p>
                                    </div>
                                    <div className="relative">
                                        <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-600 border-2 border-[#1e293b]"></div>
                                        <p className="text-sm text-slate-400">
                                            <span className="font-bold text-white">Bob</span> created this task
                                        </p>
                                        <p className="text-xs text-slate-600 mt-0.5">Yesterday</p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 border-t border-white/10 bg-[#0f172a] flex justify-end gap-3">
                            <button className="px-4 py-2 text-slate-300 hover:text-white font-medium transition-colors">
                                Archive
                            </button>
                            <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg shadow-blue-500/20 transition-colors">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

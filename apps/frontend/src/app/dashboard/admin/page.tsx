'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { CreateUserModal } from '@/components/CreateUserModal';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface Stats {
    totalUsers: number;
    totalTasks: number;
    activeTasks: number;
    completedTasks: number;
}

interface User {
    user_id: string;
    user_name: string;
    username?: string;
    name?: string;
    email: string;
    role: string;
    is_active: boolean; // New Field from merged backend logic
    created_at: string;
}

interface Task {
    task_id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    user_id: string;
    created_by: string;
    created_at?: string;
    due_date: string;
    owner?: { user_name: string };
    assignee?: { user_name: string };
}

interface Event {
    event_id: string;
    title: string;
    description: string;
    start_time: string;
    end_time: string;
    user_id: string;
    creator?: { user_name: string };
}

export default function AdminPage() {
    const router = useRouter();
    const [stats, setStats] = useState<Stats | null>(null);
    const [activeTab, setActiveTab] = useState<'users' | 'tasks' | 'events'>('users');
    const [isLoading, setIsLoading] = useState(true);

    const [tasksForCharts, setTasksForCharts] = useState<Task[]>([]);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [statsData, tasksData] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/tasks')
            ]);
            setStats(statsData);
            setTasksForCharts(tasksData);
        } catch (error) {
            console.error('Failed to fetch stats', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Prepare Chart Data
    const pieData = {
        labels: ['Active (Todo/In Progress)', 'In Review', 'Completed'],
        datasets: [
            {
                data: [
                    tasksForCharts.filter(t => ['todo', 'in_progress'].includes(t.status)).length,
                    tasksForCharts.filter(t => t.status === 'in_review').length,
                    tasksForCharts.filter(t => t.status === 'done').length
                ],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)', // Blue
                    'rgba(168, 85, 247, 0.8)', // Purple
                    'rgba(16, 185, 129, 0.8)'  // Emerald
                ],
                borderColor: [
                    'rgba(59, 130, 246, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(16, 185, 129, 1)'
                ],
                borderWidth: 1,
            },
        ],
    };

    const tasksByPriority = {
        high: tasksForCharts.filter(t => t.priority === 'high').length,
        medium: tasksForCharts.filter(t => t.priority === 'medium').length,
        low: tasksForCharts.filter(t => t.priority === 'low').length,
    };

    const barData = {
        labels: ['High Priority', 'Medium Priority', 'Low Priority'],
        datasets: [
            {
                label: 'Tasks by Priority',
                data: [tasksByPriority.high, tasksByPriority.medium, tasksByPriority.low],
                backgroundColor: 'rgba(249, 115, 22, 0.8)', // Orange
            },
        ],
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 h-screen overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Admin Portal</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">System Overview & Management</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                    gradient="from-blue-500 to-indigo-500"
                />
                <StatCard
                    title="Total Tasks"
                    value={stats?.totalTasks || 0}
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />}
                    gradient="from-violet-500 to-purple-500"
                />
                <StatCard
                    title="Active Tasks"
                    value={stats?.activeTasks || 0}
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    gradient="from-orange-500 to-pink-500"
                />
                <StatCard
                    title="Completed Tasks"
                    value={stats?.completedTasks || 0}
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    gradient="from-emerald-500 to-teal-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-white/5">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Task Status Distribution</h3>
                    <div className="h-64 flex justify-center">
                        <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl shadow-xl border border-slate-200 dark:border-white/5">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Tasks by Priority</h3>
                    <div className="h-64">
                        <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl overflow-hidden min-h-[500px] flex flex-col">
                <div className="flex border-b border-slate-200 dark:border-white/10">
                    <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="User Management" />
                    <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} label="Task Management" />
                    <TabButton active={activeTab === 'events'} onClick={() => setActiveTab('events')} label="Event Management" />
                </div>

                <div className="p-6 flex-1 overflow-auto">
                    {activeTab === 'users' && <UserList />}
                    {activeTab === 'tasks' && <TaskList />}
                    {activeTab === 'events' && <EventList />}
                </div>
            </div>
        </div>
    );
}

// --- Components ---

function TabButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
    return (
        <button
            onClick={onClick}
            className={`px-8 py-4 font-semibold text-sm transition-all relative ${active
                ? 'text-blue-500 bg-blue-50/50 dark:bg-blue-500/10'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
        >
            {label}
            {active && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />}
        </button>
    );
}

function StatCard({ title, value, icon, gradient }: { title: string, value: number, icon: React.ReactNode, gradient: string }) {
    return (
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-bl-full transition-transform group-hover:scale-110`} />
            <div className="relative z-10">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg mb-4`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {icon}
                    </svg>
                </div>
                <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
                <p className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{value.toLocaleString()}</p>
            </div>
        </div>
    );
}

// --- User List Component ---
function UserList() {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    useEffect(() => {
        api.get('/admin/users').then(setUsers);
    }, []);

    const toggleStatus = async (user: User) => {
        const action = user.is_active ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} ${user.user_name}?`)) return;

        try {
            await api.put(`/admin/users/${user.user_id}/status`, { isActive: !user.is_active });
            setUsers(users.map(u => u.user_id === user.user_id ? { ...u, is_active: !u.is_active } : u));
        } catch (e) {
            alert('Failed to update status');
        }
    };

    const deleteUser = async (user: User) => {
        if (!confirm(`PERMANENTLY DELETE ${user.user_name}? This cannot be undone.`)) return;
        try {
            await api.delete(`/admin/users/${user.user_id}`);
            setUsers(users.filter(u => u.user_id !== user.user_id));
        } catch (e) {
            alert('Failed to delete user');
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const data = await api.get('/admin/export');
            const headers = Object.keys(data[0] || {}).join(',');
            const rows = data.map((row: any) => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
            const csv = `data:text/csv;charset=utf-8,${headers}\n${rows}`;
            const link = document.createElement("a");
            link.href = encodeURI(csv);
            link.download = `users_report_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
        } catch (e) {
            alert('Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const filtered = users.filter(u =>
        (u.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <input
                    type="text"
                    placeholder="Search users..."
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 dark:bg-white/5"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <button onClick={handleExport} disabled={isExporting} className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 disabled:opacity-50">
                    {isExporting ? 'Exporting...' : 'Export CSV'}
                </button>
                <button onClick={() => setIsCreateModalOpen(true)} className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-500/30">
                    + New User
                </button>
            </div>

            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => api.get('/admin/users').then(setUsers)}
            />
            <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-white/5 text-slate-500">
                    <tr>
                        <th className="p-4">User</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {filtered.map(u => (
                        <tr key={u.user_id}>
                            <td className="p-4">
                                <div className="font-semibold dark:text-white">{u.user_name || u.username}</div>
                                <div className="text-xs text-slate-500">{u.email}</div>
                            </td>
                            <td className="p-4"><span className="px-2 py-1 bg-slate-100 dark:bg-white/10 rounded text-xs">{u.role}</span></td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs text-white ${u.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                                    {u.is_active ? 'Active' : 'Deactivated'}
                                </span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                                <button onClick={() => toggleStatus(u)} className={`text-sm ${u.is_active ? 'text-orange-500' : 'text-green-500'}`}>
                                    {u.is_active ? 'Deactivate' : 'Activate'}
                                </button>
                                <button onClick={() => deleteUser(u)} className="text-sm text-red-500 hover:underline">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// --- Task List Component ---
function TaskList() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [sort, setSort] = useState<'date' | 'priority' | 'status'>('date');
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    useEffect(() => {
        api.get('/admin/tasks').then(setTasks);
    }, []);

    const processTasks = () => {
        return [...tasks].sort((a, b) => {
            if (sort === 'date') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
            if (sort === 'priority') {
                const map = { high: 3, medium: 2, low: 1 };
                return (map[b.priority as keyof typeof map] || 0) - (map[a.priority as keyof typeof map] || 0);
            }
            return a.status.localeCompare(b.status);
        });
    };

    const handleSave = async (updated: Partial<Task>) => {
        if (!editingTask) return;
        try {
            await api.put(`/admin/tasks/${editingTask.task_id}`, updated);
            setTasks(tasks.map(t => t.task_id === editingTask.task_id ? { ...t, ...updated } : t));
            setEditingTask(null);
        } catch (e) {
            alert('Failed to save');
        }
    };

    const handleDelete = async (taskId: string) => {
        if (!confirm('Delete this task?')) return;
        try {
            await api.delete(`/admin/tasks/${taskId}`);
            setTasks(tasks.filter(t => t.task_id !== taskId));
        } catch (e) {
            alert('Failed to delete');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end gap-2">
                <span className="text-sm text-slate-500 self-center">Sort by:</span>
                <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as any)}
                    className="p-2 rounded-lg border dark:bg-white/5 dark:border-white/10 dark:text-white"
                >
                    <option value="date">Date Created</option>
                    <option value="priority">Priority</option>
                    <option value="status">Status</option>
                </select>
            </div>

            <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-white/5 text-slate-500">
                    <tr>
                        <th className="p-4">Title</th>
                        <th className="p-4">Owner / Assignee</th>
                        <th className="p-4">Status & Priority</th>
                        <th className="p-4">Date</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {processTasks().map(t => (
                        <tr key={t.task_id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                            <td className="p-4">
                                <div className="font-medium dark:text-white">{t.title}</div>
                                <div className="text-xs text-slate-400 truncate max-w-[200px]">{t.description}</div>
                            </td>
                            <td className="p-4 text-sm dark:text-slate-300">
                                <div className="text-xs text-slate-400">Owner: <span className="text-slate-700 dark:text-slate-200">{t.owner?.user_name}</span></div>
                                <div className="text-xs text-slate-400">Assignee: <span className="text-slate-700 dark:text-slate-200">{t.assignee?.user_name}</span></div>
                            </td>
                            <td className="p-4">
                                <div className="flex gap-2">
                                    <span className={`px-2 py-0.5 rounded text-xs ${t.status === 'done' ? 'bg-green-100 text-green-700' :
                                        t.status === 'in_review' ? 'bg-purple-100 text-purple-700' :
                                            t.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                        {t.status.replace('_', ' ')}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded text-xs ${t.priority === 'high' ? 'bg-red-100 text-red-700' :
                                        t.priority === 'medium' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
                                        }`}>
                                        {t.priority}
                                    </span>
                                </div>
                            </td>
                            <td className="p-4 text-sm text-slate-500">{new Date(t.created_at || Date.now()).toLocaleDateString()}</td>
                            <td className="p-4 text-right space-x-2">
                                <button onClick={() => setEditingTask(t)} className="text-blue-500 hover:underline">Edit</button>
                                <button onClick={() => handleDelete(t.task_id)} className="text-red-500 hover:underline">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {editingTask && (
                <EditModal
                    title="Edit Task"
                    data={editingTask}
                    onClose={() => setEditingTask(null)}
                    onSave={handleSave}
                    fields={[
                        { name: 'title', label: 'Title', type: 'text' },
                        { name: 'description', label: 'Description', type: 'textarea' },
                        { name: 'priority', label: 'Priority', type: 'select', options: ['low', 'medium', 'high'] },
                        { name: 'status', label: 'Status', type: 'select', options: ['todo', 'in_progress', 'in_review', 'done'] }
                    ]}
                />
            )}
        </div>
    );
}

// --- Event List Component ---
function EventList() {
    const [events, setEvents] = useState<Event[]>([]);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    useEffect(() => {
        api.get('/admin/events').then(setEvents);
    }, []);

    const handleSave = async (updated: Partial<Event>) => {
        if (!editingEvent) return;
        try {
            await api.put(`/admin/events/${editingEvent.event_id}`, updated);
            setEvents(events.map(e => e.event_id === editingEvent.event_id ? { ...e, ...updated } : e));
            setEditingEvent(null);
        } catch (e) {
            alert('Failed to save');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete event?')) return;
        try {
            await api.delete(`/admin/events/${id}`);
            setEvents(events.filter(e => e.event_id !== id));
        } catch (e) {
            alert('Failed to delete');
        }
    };

    return (
        <div className="space-y-4">
            <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-white/5 text-slate-500">
                    <tr>
                        <th className="p-4">Title</th>
                        <th className="p-4">Creator</th>
                        <th className="p-4">Time</th>
                        <th className="p-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {events.map(e => (
                        <tr key={e.event_id}>
                            <td className="p-4 font-medium dark:text-white">{e.title}</td>
                            <td className="p-4 text-sm text-slate-500">{e.creator?.user_name}</td>
                            <td className="p-4 text-sm text-slate-500">
                                {new Date(e.start_time).toLocaleString()}
                            </td>
                            <td className="p-4 text-right space-x-2">
                                <button onClick={() => setEditingEvent(e)} className="text-blue-500 hover:underline">Edit</button>
                                <button onClick={() => handleDelete(e.event_id)} className="text-red-500 hover:underline">Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {editingEvent && (
                <EditModal
                    title="Edit Event"
                    data={editingEvent}
                    onClose={() => setEditingEvent(null)}
                    onSave={handleSave}
                    fields={[
                        { name: 'title', label: 'Title', type: 'text' },
                        { name: 'description', label: 'Description', type: 'textarea' },
                        { name: 'start_time', label: 'Start Time', type: 'datetime-local' },
                        { name: 'end_time', label: 'End Time', type: 'datetime-local' }
                    ]}
                />
            )}
        </div>
    );
}

// --- Generic Edit Modal ---
function EditModal({ title, data, onClose, onSave, fields }: any) {
    const [formData, setFormData] = useState({ ...data });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
                <h3 className="text-xl font-bold dark:text-white">{title}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {fields.map((f: any) => (
                        <div key={f.name}>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                {f.label}
                            </label>
                            {f.type === 'textarea' ? (
                                <textarea
                                    value={formData[f.name] || ''}
                                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-white/5 dark:border-white/10 dark:text-white"
                                    rows={3}
                                />
                            ) : f.type === 'select' ? (
                                <select
                                    value={formData[f.name] || ''}
                                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-white/5 dark:border-white/10 dark:text-white"
                                >
                                    {f.options.map((opt: string) => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : (
                                <input
                                    type={f.type}
                                    value={f.type === 'datetime-local' && formData[f.name] ? new Date(formData[f.name]).toISOString().slice(0, 16) : formData[f.name] || ''}
                                    onChange={e => setFormData({ ...formData, [f.name]: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-white/5 dark:border-white/10 dark:text-white"
                                />
                            )}
                        </div>
                    ))}
                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

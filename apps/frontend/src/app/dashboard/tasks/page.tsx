'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import { api } from '../../../lib/api';
import CreateTaskModal from '../../../components/CreateTaskModal';
import EditTaskModal from '../../../components/EditTaskModal';
import TaskSubmissionModal from '../../../components/TaskSubmissionModal';
import TaskReviewModal from '../../../components/TaskReviewModal';
import SubmissionHistory from '../../../components/SubmissionHistory';

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Modal types
    const [activeModal, setActiveModal] = useState<'detail' | 'submission' | 'review' | 'edit' | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('my_all');

    // Filter & Sort States
    const [searchQuery, setSearchQuery] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('tasks_priority') as any || 'all';
        return 'all';
    });
    const [statusFilter, setStatusFilter] = useState<'all' | 'todo' | 'in_review' | 'done'>(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('tasks_status_filter') as any || 'all';
        return 'all';
    });
    const [sortBy, setSortBy] = useState<'dueDate_asc' | 'dueDate_desc' | 'status_asc' | 'status_desc'>(() => {
        if (typeof window !== 'undefined') return localStorage.getItem('tasks_sort') as any || 'dueDate_asc';
        return 'dueDate_asc';
    });

    // Save persistence
    useEffect(() => {
        localStorage.setItem('tasks_priority', priorityFilter);
    }, [priorityFilter]);

    useEffect(() => {
        localStorage.setItem('tasks_status_filter', statusFilter);
    }, [statusFilter]);

    useEffect(() => {
        localStorage.setItem('tasks_sort', sortBy);
    }, [sortBy]);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [showSortMenu, setShowSortMenu] = useState(false);
    const filterMenuRef = useRef<HTMLDivElement>(null);
    const sortMenuRef = useRef<HTMLDivElement>(null);

    const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

    const toggleExpand = (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newExpanded = new Set(expandedTasks);
        if (newExpanded.has(taskId)) {
            newExpanded.delete(taskId);
        } else {
            newExpanded.add(taskId);
        }
        setExpandedTasks(newExpanded);
    };

    const handleSubtaskToggle = async (subtaskId: string, currentStatus: boolean, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await api.put(`/tasks/subtasks/${subtaskId}`, { isCompleted: !currentStatus });
            // Refresh tasks to show updated status
            if (userId) fetchTasks(userId);
        } catch (error) {
            console.error('Failed to toggle subtask', error);
        }
    };

    // Stats for sidebar
    const [stats, setStats] = useState({
        my_all: 0,
        my_todo: 0,
        my_in_review: 0,
        my_done: 0,
        assigned_all: 0,
        assigned_review: 0
    });

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserId(user.user_id);
            fetchTasks(user.user_id);
        }

        const handleClickOutside = (event: MouseEvent) => {
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
                setShowFilterMenu(false);
            }
            if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
                setShowSortMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!userId) return;
        filterTasks();
        updateStats();
    }, [tasks, activeTab, userId, searchQuery, priorityFilter, sortBy, statusFilter]);

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

    const updateStats = () => {
        if (!userId) return;
        setStats({
            my_all: tasks.filter(t => t.assignee_id === userId).length,
            my_todo: tasks.filter(t => t.assignee_id === userId && t.status === 'todo').length,
            my_in_review: tasks.filter(t => t.assignee_id === userId && t.status === 'in_review').length,
            my_done: tasks.filter(t => t.assignee_id === userId && t.status === 'done').length,
            assigned_all: tasks.filter(t => t.created_by === userId && t.assignee_id !== userId).length,
            assigned_review: tasks.filter(t => t.created_by === userId && t.status === 'in_review').length
        });
    }

    const filterTasks = () => {
        if (!userId) return;
        let result: any[] = [];

        switch (activeTab) {
            case 'my_all':
                result = tasks.filter(t => t.assignee_id === userId);
                break;
            case 'my_todo':
                result = tasks.filter(t => t.assignee_id === userId && t.status === 'todo');
                break;
            case 'my_in_review':
                result = tasks.filter(t => t.assignee_id === userId && t.status === 'in_review');
                break;
            case 'my_done':
                result = tasks.filter(t => t.assignee_id === userId && t.status === 'done');
                break;
            case 'assigned_all':
                result = tasks.filter(t => t.created_by === userId && t.assignee_id !== userId);
                break;
            case 'assigned_review':
                result = tasks.filter(t => t.created_by === userId && t.status === 'in_review');
                break;
            default:
                result = tasks;
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.title.toLowerCase().includes(query) ||
                (t.description && t.description.toLowerCase().includes(query))
            );
        }

        if (priorityFilter !== 'all') {
            result = result.filter(t => t.priority === priorityFilter);
        }

        if (statusFilter !== 'all') {
            result = result.filter(t => t.status === statusFilter);
        }

        result.sort((a, b) => {
            if (sortBy === 'status_asc' || sortBy === 'status_desc') {
                const statusWeight: Record<string, number> = {
                    'todo': 1,
                    'in_review': 2,
                    'done': 3
                };
                const weightA = statusWeight[a.status] || 0;
                const weightB = statusWeight[b.status] || 0;

                if (sortBy === 'status_asc') {
                    return weightA - weightB;
                } else {
                    return weightB - weightA;
                }
            } else if (sortBy === 'dueDate_desc') {
                // Latest first (Newer dates first)
                if (!a.due_date && b.due_date) return 1;
                if (!b.due_date && a.due_date) return -1;
                if (!a.due_date && !b.due_date) return 0;
                return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
            } else {
                // First to Latest (Oldest dates first)
                if (!a.due_date && b.due_date) return 1;
                if (!b.due_date && a.due_date) return -1;
                if (!a.due_date && !b.due_date) return 0;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            }
        });

        setFilteredTasks(result);
    };

    const handleTaskClick = async (task: any) => {
        setSelectedTask(task);
        if (task.status === 'in_review' && task.created_by === userId) {
            setActiveModal('review');
        } else if (task.status !== 'done' && task.status !== 'in_review' && task.assignee_id === userId && task.created_by !== userId) {
            // Open submission modal directly for tasks that can be submitted (like Dashboard's PendingTasksWidget)
            setActiveModal('submission');
        } else {
            setActiveModal('detail');
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
            if (userId) fetchTasks(userId);
        } catch (error) {
            console.error('Failed to upload attachment', error);
            alert('Failed to upload file');
        }
    };

    const handleMarkDone = async (task: any) => {
        try {
            await api.put(`/tasks/${task.task_id}`, { status: 'done' });
            if (userId) fetchTasks(userId);
            setActiveModal(null);
            setSelectedTask(null);
        } catch (error) {
            console.error('Failed to mark task as done', error);
            alert('Failed to mark task as done');
        }
    };

    const getInitials = (name: string) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return <span className="text-slate-400">-</span>;
        const date = new Date(dateString);
        const isOverdue = date < new Date() && selectedTask?.status !== 'done';
        return (
            <span className={isOverdue ? "text-red-500 font-medium" : "text-slate-600 dark:text-slate-400"}>
                {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
        );
    };

    if (!userId) return <div className="p-8 text-center text-slate-400">Please login to view tasks.</div>;

    return (
        <div className="h-full flex flex-col md:flex-row bg-slate-50 dark:bg-[#0f172a] rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-white dark:bg-[#1e293b] border-r border-slate-200 dark:border-white/5 flex flex-col shrink-0">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                        </span>
                        Tasks
                    </h1>
                </div>

                <nav className="flex-1 px-4 space-y-6 overflow-y-auto pb-6">
                    {/* My Workspace Section */}
                    <div>
                        <p className="px-2 text-xs font-bold text-blue-400 dark:text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            My Workspace
                        </p>
                        <ul className="space-y-1">
                            <li>
                                <button
                                    onClick={() => setActiveTab('my_all')}
                                    className={`w-full flex justify-between items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'my_all' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <span>All My Tasks</span>
                                    {stats.my_all > 0 && <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded text-xs">{stats.my_all}</span>}
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab('my_todo')}
                                    className={`w-full flex justify-between items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'my_todo' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                                        <span>To Do</span>
                                    </div>
                                    {stats.my_todo > 0 && <span className="text-xs text-slate-400">{stats.my_todo}</span>}
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab('my_in_review')}
                                    className={`w-full flex justify-between items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'my_in_review' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                        <span>In Review</span>
                                    </div>
                                    {stats.my_in_review > 0 && <span className="text-xs text-slate-400">{stats.my_in_review}</span>}
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab('my_done')}
                                    className={`w-full flex justify-between items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'my_done' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span>Completed</span>
                                    </div>
                                    {stats.my_done > 0 && <span className="text-xs text-slate-400">{stats.my_done}</span>}
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Management Section */}
                    <div>
                        <p className="px-2 text-xs font-bold text-purple-400 dark:text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                            Management
                        </p>
                        <ul className="space-y-1">
                            <li>
                                <button
                                    onClick={() => setActiveTab('assigned_review')}
                                    className={`w-full flex justify-between items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'assigned_review' ? 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                                        <span>Review Needed</span>
                                    </div>
                                    {stats.assigned_review > 0 && <span className="bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 px-2 py-0.5 rounded-full text-xs font-bold">{stats.assigned_review}</span>}
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => setActiveTab('assigned_all')}
                                    className={`w-full flex justify-between items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'assigned_all' ? 'bg-slate-100 dark:bg-white/10 text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <span>Assigned by Me</span>
                                    {stats.assigned_all > 0 && <span className="text-xs text-slate-400">{stats.assigned_all}</span>}
                                </button>
                            </li>
                        </ul>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-200 dark:border-white/5">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Create New Task
                    </button>
                </div>
            </div>

            {/* Main Content Area - Table */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50 dark:bg-[#0f172a]/50">
                {/* Header with Filters */}
                <div className="px-8 py-6 border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-end gap-4 bg-white/50 dark:bg-[#1e293b]/50 backdrop-blur-sm sticky top-0 z-30">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                            {activeTab.replace('my_', 'My ').replace('assigned_', 'Assigned ').replace('_', ' ')}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} found
                        </p>
                    </div>

                    {/* Filter Controls */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 ring-blue-500/20 text-slate-900 dark:text-white w-40 transition-all focus:w-56"
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative" ref={filterMenuRef}>
                            <button
                                onClick={() => {
                                    setShowFilterMenu(!showFilterMenu);
                                    setShowSortMenu(false);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium transition-all ${showFilterMenu || priorityFilter !== 'all' || statusFilter !== 'all'
                                    ? 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                                    }`}
                            >
                                <div className="relative">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                    {(priorityFilter !== 'all' || statusFilter !== 'all') && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white dark:border-slate-900" />
                                    )}
                                </div>
                                <span>Filter</span>
                                <svg className={`w-4 h-4 transition-transform duration-200 ${showFilterMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            {showFilterMenu && (
                                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1e293b] rounded-xl shadow-xl border border-slate-200 dark:border-white/10 z-50 p-4 transform origin-top-right animate-in fade-in zoom-in-95 duration-100">
                                    <div className="space-y-4">
                                        {/* Status Filter */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Status</label>
                                                {statusFilter !== 'all' && (
                                                    <button onClick={() => setStatusFilter('all')} className="text-[10px] text-blue-500 hover:underline">Clear</button>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {['all', 'todo', 'in_review', 'done'].map((status) => (
                                                    <button
                                                        key={status}
                                                        onClick={() => {
                                                            setStatusFilter(status as any);
                                                            setShowFilterMenu(false);
                                                        }}
                                                        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all ${statusFilter === status
                                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${statusFilter === status
                                                                ? 'bg-white'
                                                                : status === 'done' ? 'bg-emerald-500'
                                                                    : status === 'in_review' ? 'bg-indigo-500'
                                                                        : 'bg-slate-400'
                                                                }`} />
                                                            <span className="capitalize">{status === 'all' ? 'All Statuses' : status.replace('_', ' ')}</span>
                                                        </div>
                                                        {statusFilter === status && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100 dark:bg-white/5" />

                                        {/* Priority Filter */}
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Priority</label>
                                                {priorityFilter !== 'all' && (
                                                    <button onClick={() => setPriorityFilter('all')} className="text-[10px] text-blue-500 hover:underline">Clear</button>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                {['all', 'high', 'medium', 'low'].map((prio) => (
                                                    <button
                                                        key={prio}
                                                        onClick={() => {
                                                            setPriorityFilter(prio as any);
                                                            setShowFilterMenu(false);
                                                        }}
                                                        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all ${priorityFilter === prio
                                                            ? (prio === 'high' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' :
                                                                prio === 'medium' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' :
                                                                    prio === 'low' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' :
                                                                        'bg-blue-600 text-white shadow-md shadow-blue-500/20')
                                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${priorityFilter === prio
                                                                ? 'bg-white'
                                                                : prio === 'high' ? 'bg-red-500'
                                                                    : prio === 'medium' ? 'bg-amber-500'
                                                                        : prio === 'low' ? 'bg-emerald-500'
                                                                            : 'bg-slate-400'
                                                                }`} />
                                                            <span className="capitalize">{prio === 'all' ? 'All Priorities' : prio}</span>
                                                        </div>
                                                        {priorityFilter === prio && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sort Dropdown */}
                        <div className="relative" ref={sortMenuRef}>
                            <button
                                onClick={() => {
                                    setShowSortMenu(!showSortMenu);
                                    setShowFilterMenu(false);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium transition-all ${showSortMenu || sortBy !== 'dueDate_asc'
                                    ? 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 shadow-sm'
                                    : 'text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                                    }`}
                            >
                                <div className="relative">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>
                                    {sortBy !== 'dueDate_asc' && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white dark:border-slate-900" />
                                    )}
                                </div>
                                <span>Sort</span>
                                <svg className={`w-4 h-4 transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>

                            {showSortMenu && (
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#1e293b] rounded-xl shadow-xl border border-slate-200 dark:border-white/10 z-50 p-4 transform origin-top-right animate-in fade-in zoom-in-95 duration-100">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">By Date</label>
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={() => {
                                                        setSortBy('dueDate_asc');
                                                        setShowSortMenu(false);
                                                    }}
                                                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-all ${sortBy === 'dueDate_asc'
                                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        <span>First to Latest</span>
                                                    </div>
                                                    {sortBy === 'dueDate_asc' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSortBy('dueDate_desc');
                                                        setShowSortMenu(false);
                                                    }}
                                                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-all ${sortBy === 'dueDate_desc'
                                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        <span>Latest to First</span>
                                                    </div>
                                                    {sortBy === 'dueDate_desc' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100 dark:bg-white/5" />

                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">By Status</label>
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={() => {
                                                        setSortBy('status_asc');
                                                        setShowSortMenu(false);
                                                    }}
                                                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-all ${sortBy === 'status_asc'
                                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                                        <span>To Do → Done</span>
                                                    </div>
                                                    {sortBy === 'status_asc' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSortBy('status_desc');
                                                        setShowSortMenu(false);
                                                    }}
                                                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm transition-all ${sortBy === 'status_desc'
                                                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                                        <span>Done → To Do</span>
                                                    </div>
                                                    {sortBy === 'status_desc' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto custom-scrollbar p-0">
                    {filteredTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8">
                            <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">No tasks found</h3>
                            <p className="max-w-xs text-center mt-2 opacity-80">
                                {searchQuery || priorityFilter !== 'all' || statusFilter !== 'all'
                                    ? "Try adjusting your search or filters to find what you're looking for."
                                    : "There are no tasks in this view. Create a new task to get started."}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-white/5 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 w-12">Prio</th>
                                    <th className="px-6 py-4 w-1/3">Task Name</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Assigned To</th>
                                    <th className="px-6 py-4">Assigned By</th>
                                    <th className="px-6 py-4 text-right">Due Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {filteredTasks.map((task) => (
                                    <Fragment key={task.task_id}>
                                        <tr
                                            onClick={() => handleTaskClick(task)}
                                            className="group bg-white dark:bg-[#1e293b] hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
                                        >
                                            {/* Priority */}
                                            <td className="px-6 py-4">
                                                <div className={`w-3 h-3 rounded-full ${task.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                    task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                                    }`} title={`Priority: ${task.priority}`}></div>
                                            </td>

                                            {/* Task Name with Expand */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-3">
                                                    {task.subtasks && task.subtasks.length > 0 && (
                                                        <button
                                                            onClick={(e) => toggleExpand(task.task_id, e)}
                                                            className="mt-0.5 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 transition-colors"
                                                        >
                                                            <svg className={`w-4 h-4 transition-transform ${expandedTasks.has(task.task_id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{task.title}</p>
                                                            {task.subtasks && task.subtasks.length > 0 && (
                                                                <span className="text-[10px] bg-slate-100 dark:bg-white/5 text-slate-500 px-1.5 py-0.5 rounded-full">
                                                                    {task.subtasks.filter((s: any) => s.is_completed).length}/{task.subtasks.length}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {task.description && (
                                                            <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{task.description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${task.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                                    task.status === 'in_review' ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' :
                                                        'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-white/10'
                                                    }`}>
                                                    {task.status === 'todo' ? 'To Do' : task.status.replace('_', ' ')}
                                                </span>
                                            </td>

                                            {/* Assignee */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-[#1e293b] ${task.assignee_id === userId ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                        }`}>
                                                        {task.assignee_id === userId ? 'Me' : getInitials(task.assignee?.user_name)}
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                        {task.assignee_id === userId ? 'Me' : (task.assignee?.user_name || 'Unassigned')}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Owner */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 opacity-80">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${task.created_by === userId ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                        }`}>
                                                        {task.created_by === userId ? 'Me' : getInitials(task.owner?.user_name)}
                                                    </div>
                                                    <span className="text-xs text-slate-600 dark:text-slate-400">
                                                        {task.created_by === userId ? 'Me' : (task.owner?.user_name || 'Unknown')}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Due Date */}
                                            <td className="px-6 py-4 text-right text-sm">
                                                {formatDate(task.due_date)}
                                            </td>
                                        </tr>
                                        {/* Subtasks Expansion Row */}
                                        {expandedTasks.has(task.task_id) && task.subtasks && (
                                            <tr className="bg-slate-50/50 dark:bg-black/20 animate-in slide-in-from-top-2 duration-200">
                                                <td colSpan={6} className="px-6 py-4 pl-16">
                                                    <div className="bg-white dark:bg-[#1e293b] rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
                                                        <div className="px-4 py-2 bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5 flex justify-between items-center">
                                                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subtasks</span>
                                                            {/* Optional: Add Subtask Button could go here */}
                                                        </div>
                                                        <div className="divide-y divide-slate-100 dark:divide-white/5">
                                                            {task.subtasks.map((subtask: any) => (
                                                                <div key={subtask.subtask_id} className="flex items-start gap-4 p-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                                                                    <button
                                                                        onClick={(e) => handleSubtaskToggle(subtask.subtask_id, subtask.is_completed, e)}
                                                                        disabled={task.status === 'done'}
                                                                        className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all ${subtask.is_completed
                                                                            ? 'bg-blue-500 border-blue-500 text-white'
                                                                            : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                                                                            } ${task.status === 'done' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                    >
                                                                        {subtask.is_completed && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                                    </button>
                                                                    <div className="flex-1 flex justify-between items-start">
                                                                        <div>
                                                                            <p className={`text-sm ${subtask.is_completed ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-slate-200 font-medium'}`}>
                                                                                {subtask.title}
                                                                            </p>
                                                                            {subtask.description && (
                                                                                <p className={`text-xs ${subtask.is_completed ? 'text-slate-300' : 'text-slate-500'}`}>
                                                                                    {subtask.description}
                                                                                </p>
                                                                            )}
                                                                        </div>

                                                                        {/* Attachments Section */}
                                                                        {task.status !== 'done' && (
                                                                            <div className="flex items-center gap-3">
                                                                                {/* Edit Button */}
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setSelectedTask(task); // Open modal for full editing
                                                                                    }}
                                                                                    className="text-slate-300 hover:text-blue-500 transition-colors p-1"
                                                                                    title="Edit Subtask"
                                                                                >
                                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                                                </button>

                                                                                {subtask.attachments && subtask.attachments.length > 0 && (
                                                                                    <div className="flex -space-x-2">
                                                                                        {subtask.attachments.map((url: string, idx: number) => (
                                                                                            <a
                                                                                                key={idx}
                                                                                                href={url}
                                                                                                target="_blank"
                                                                                                rel="noopener noreferrer"
                                                                                                className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/20 border border-blue-100 dark:border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform shadow-sm"
                                                                                                title="View Attachment"
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                            >
                                                                                                <span className="text-[10px] font-bold">PDF</span>
                                                                                            </a>
                                                                                        ))}
                                                                                    </div>
                                                                                )}

                                                                                <label className="cursor-pointer text-slate-300 hover:text-blue-500 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5" title="Attach file">
                                                                                    <input
                                                                                        type="file"
                                                                                        className="hidden"
                                                                                        onChange={(e) => handleSubtaskUpload(subtask.subtask_id, e)}
                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                    />
                                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                                                </label>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {task.subtasks.length === 0 && (
                                                                <div className="p-4 text-center text-xs text-slate-400 italic">No subtasks</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {selectedTask && activeModal === 'edit' && (
                <EditTaskModal
                    task={selectedTask}
                    userId={userId!}
                    onClose={() => setActiveModal('detail')}
                    onTaskUpdated={(updatedTask) => {
                        fetchTasks(userId!);
                        if (updatedTask) {
                            setSelectedTask(updatedTask);
                        }
                        setActiveModal('detail');
                    }}
                />
            )}

            {showCreateModal && (
                <CreateTaskModal
                    userId={userId!}
                    onClose={() => setShowCreateModal(false)}
                    onTaskCreated={() => fetchTasks(userId!)}
                />
            )}

            {selectedTask && activeModal === 'submission' && (
                <TaskSubmissionModal
                    taskId={selectedTask.task_id}
                    userId={userId!}
                    taskTitle={selectedTask.title}
                    description={selectedTask.description}
                    priority={selectedTask.priority}
                    dueDate={selectedTask.due_date}
                    onClose={() => { setActiveModal(null); setSelectedTask(null); }}
                    onSubmitSuccess={() => { setActiveModal(null); setSelectedTask(null); fetchTasks(userId!); }}
                />
            )}

            {selectedTask && activeModal === 'review' && (
                <TaskReviewModal
                    taskId={selectedTask.task_id}
                    taskTitle={selectedTask.title}
                    onClose={() => { setActiveModal(null); setSelectedTask(null); }}
                    onReviewComplete={() => { setActiveModal(null); setSelectedTask(null); fetchTasks(userId!); }}
                />
            )}

            {selectedTask && activeModal === 'detail' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1e293b] w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl p-8 scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{selectedTask.title}</h2>
                            <div className="flex gap-2">
                                {selectedTask.created_by === userId && (
                                    <button onClick={() => setActiveModal('edit')} className="text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                        Edit
                                    </button>
                                )}
                                <button onClick={() => { setActiveModal(null); setSelectedTask(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/5 p-2 rounded-lg">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="prose dark:prose-invert prose-sm max-w-none mb-8 bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                            <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{selectedTask.description || 'No description provided.'}</p>
                        </div>

                        {/* Action Bar based on Status */}
                        <div className="flex gap-3 mb-6">
                            {/* Mark as Done - Only for self-assigned tasks (creator === assignee) */}
                            {(selectedTask.status !== 'done' && selectedTask.status !== 'in_review' && selectedTask.assignee_id === userId && selectedTask.created_by === userId) && (
                                <button
                                    onClick={() => handleMarkDone(selectedTask)}
                                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                                >
                                    Mark as Done
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Status</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${selectedTask.status === 'done' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                    selectedTask.status === 'in_review' ? 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400' :
                                        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>
                                    {selectedTask.status === 'todo' ? 'To Do' : selectedTask.status.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Due Date</p>
                                <p className="text-slate-900 dark:text-white font-medium">
                                    {selectedTask.due_date ? new Date(selectedTask.due_date).toLocaleDateString() : 'None'}
                                </p>
                            </div>
                        </div>

                        <SubmissionHistory taskId={selectedTask.task_id} />
                    </div>
                </div>
            )}
        </div>
    );
}

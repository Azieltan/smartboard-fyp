'use client';

import { useState, useEffect, useRef } from 'react';
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
    const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [sortBy, setSortBy] = useState<'dueDate_asc' | 'dueDate_desc'>('dueDate_asc');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const filterMenuRef = useRef<HTMLDivElement>(null);

    // Stats for sidebar
    const [stats, setStats] = useState({
        my_all: 0,
        my_todo: 0,
        my_inprogress: 0,
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
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!userId) return;
        filterTasks();
        updateStats();
    }, [tasks, activeTab, userId, searchQuery, priorityFilter, sortBy]);

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
            my_all: tasks.filter(t => t.user_id === userId).length,
            my_todo: tasks.filter(t => t.user_id === userId && t.status === 'todo').length,
            my_inprogress: tasks.filter(t => t.user_id === userId && t.status === 'in_progress').length,
            my_done: tasks.filter(t => t.user_id === userId && t.status === 'done').length,
            assigned_all: tasks.filter(t => t.created_by === userId && t.user_id !== userId).length,
            assigned_review: tasks.filter(t => t.created_by === userId && t.status === 'in_review').length
        });
    }

    const filterTasks = () => {
        if (!userId) return;
        let result: any[] = [];

        switch (activeTab) {
            case 'my_all':
                result = tasks.filter(t => t.user_id === userId);
                break;
            case 'my_todo':
                result = tasks.filter(t => t.user_id === userId && t.status === 'todo');
                break;
            case 'my_inprogress':
                result = tasks.filter(t => t.user_id === userId && t.status === 'in_progress');
                break;
            case 'my_done':
                result = tasks.filter(t => t.user_id === userId && t.status === 'done');
                break;
            case 'assigned_all':
                result = tasks.filter(t => t.created_by === userId && t.user_id !== userId);
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

        result.sort((a, b) => {
            if (sortBy === 'dueDate_desc') {
                // Latest first (Newer dates first)
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
            } else {
                // First to Latest (Oldest dates first)
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            }
        });

        setFilteredTasks(result);
    };

    const handleTaskClick = async (task: any) => {
        setSelectedTask(task);
        if (task.status === 'in_progress' && task.user_id === userId) {
            setActiveModal('submission');
        } else if (task.status === 'in_review' && task.created_by === userId) {
            setActiveModal('review');
        } else {
            setActiveModal('detail');
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
                        <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">My Workspace</p>
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
                                    onClick={() => setActiveTab('my_inprogress')}
                                    className={`w-full flex justify-between items-center px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${activeTab === 'my_inprogress' ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                        <span>In Progress</span>
                                    </div>
                                    {stats.my_inprogress > 0 && <span className="text-xs text-slate-400">{stats.my_inprogress}</span>}
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
                        <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Management</p>
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
                <div className="px-8 py-6 border-b border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-end gap-4 bg-white/50 dark:bg-[#1e293b]/50 backdrop-blur-sm sticky top-0 z-10">
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

                        {/* Sort & Filter Dropdown */}
                        <div className="relative" ref={filterMenuRef}>
                            <button
                                onClick={() => setShowFilterMenu(!showFilterMenu)}
                                className={`flex items-center gap-2 px-4 py-2 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium transition-all ${showFilterMenu || priorityFilter !== 'all' || sortBy !== 'dueDate_asc'
                                        ? 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10'
                                        : 'text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                                    }`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                                <span>Sort</span>
                                {(priorityFilter !== 'all' || sortBy !== 'dueDate_asc') && (
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                )}
                            </button>

                            {/* Dropdown Menu */}
                            {showFilterMenu && (
                                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-[#1e293b] rounded-xl shadow-xl border border-slate-200 dark:border-white/10 z-50 p-4 transform origin-top-right animate-in fade-in zoom-in-95 duration-100">
                                    <div className="space-y-4">
                                        {/* Sort Section */}
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Sort By Date</label>
                                            <div className="flex flex-col gap-1">
                                                <button
                                                    onClick={() => setSortBy('dueDate_asc')}
                                                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all ${sortBy === 'dueDate_asc'
                                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    <span>First to Latest</span>
                                                    {sortBy === 'dueDate_asc' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                </button>
                                                <button
                                                    onClick={() => setSortBy('dueDate_desc')}
                                                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all ${sortBy === 'dueDate_desc'
                                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    <span>Latest to First</span>
                                                    {sortBy === 'dueDate_desc' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="h-px bg-slate-100 dark:bg-white/5"></div>

                                        {/* Priority Filter */}
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Priority</label>
                                            <div className="flex flex-col gap-1">
                                                {/* All */}
                                                <button
                                                    onClick={() => setPriorityFilter('all')}
                                                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all ${priorityFilter === 'all'
                                                            ? 'bg-slate-800 text-white shadow-md shadow-slate-500/20 dark:bg-white dark:text-slate-900'
                                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${priorityFilter === 'all' ? 'bg-white dark:bg-slate-900' : 'bg-slate-400'}`}></div>
                                                        <span>All Priorities</span>
                                                    </div>
                                                    {priorityFilter === 'all' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                </button>

                                                {/* High */}
                                                <button
                                                    onClick={() => setPriorityFilter('high')}
                                                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all ${priorityFilter === 'high'
                                                            ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${priorityFilter === 'high' ? 'bg-white' : 'bg-red-500'}`}></div>
                                                        <span>High</span>
                                                    </div>
                                                    {priorityFilter === 'high' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                </button>

                                                {/* Medium */}
                                                <button
                                                    onClick={() => setPriorityFilter('medium')}
                                                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all ${priorityFilter === 'medium'
                                                            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${priorityFilter === 'medium' ? 'bg-white' : 'bg-amber-500'}`}></div>
                                                        <span>Medium</span>
                                                    </div>
                                                    {priorityFilter === 'medium' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                                </button>

                                                {/* Low */}
                                                <button
                                                    onClick={() => setPriorityFilter('low')}
                                                    className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-all ${priorityFilter === 'low'
                                                            ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${priorityFilter === 'low' ? 'bg-white' : 'bg-emerald-500'}`}></div>
                                                        <span>Low</span>
                                                    </div>
                                                    {priorityFilter === 'low' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
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
                                {searchQuery || priorityFilter !== 'all'
                                    ? "Try adjusting your search or filters to find what you're looking for."
                                    : "There are no tasks in this view. Create a new task to get started."}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 dark:bg-white/5 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                                <tr>
                                    <th className="px-6 py-4 w-12">Pri</th>
                                    <th className="px-6 py-4 w-1/3">Task Name</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Assignee</th>
                                    <th className="px-6 py-4">Assigned By</th>
                                    <th className="px-6 py-4 text-right">Due Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                {filteredTasks.map((task) => (
                                    <tr
                                        key={task.task_id}
                                        onClick={() => handleTaskClick(task)}
                                        className="group bg-white dark:bg-[#1e293b] hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer"
                                    >
                                        {/* Priority */}
                                        <td className="px-6 py-4">
                                            <div className={`w-3 h-3 rounded-full ${task.priority === 'high' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                                    task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`} title={`Priority: ${task.priority}`}></div>
                                        </td>

                                        {/* Task Name */}
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{task.title}</p>
                                                {task.description && (
                                                    <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{task.description}</p>
                                                )}
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${task.status === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                                    task.status === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                                                        task.status === 'in_review' ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' :
                                                            'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-white/10'
                                                }`}>
                                                {task.status.replace('_', ' ')}
                                            </span>
                                        </td>

                                        {/* Assignee */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white dark:ring-[#1e293b] ${task.user_id === userId ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                    }`}>
                                                    {task.user_id === userId ? 'Me' : getInitials(task.assignee?.user_name)}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    {task.user_id === userId ? 'Me' : (task.assignee?.user_name || 'Unassigned')}
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
                    onTaskUpdated={() => {
                        fetchTasks(userId!);
                        setActiveModal('detail'); // Go back to detail, or close? Let's go back to detail.
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
                            {(selectedTask.status === 'todo' && selectedTask.user_id === userId) && (
                                <button
                                    onClick={async () => {
                                        try {
                                            await api.put(`/tasks/${selectedTask.task_id}`, { status: 'in_progress' });
                                            fetchTasks(userId!);
                                            setActiveModal(null);
                                        } catch (e) { console.error(e); }
                                    }}
                                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex justify-center items-center gap-2"
                                >
                                    Start Task
                                </button>
                            )}
                            {(selectedTask.status === 'in_progress' && selectedTask.user_id === userId) && (
                                <button
                                    onClick={() => { setActiveModal(null); setActiveModal('submission'); }}
                                    className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors"
                                >
                                    Submit Work
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                            <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Status</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${selectedTask.status === 'done' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                    selectedTask.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400' :
                                        'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'}`}>
                                    {selectedTask.status.replace('_', ' ')}
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

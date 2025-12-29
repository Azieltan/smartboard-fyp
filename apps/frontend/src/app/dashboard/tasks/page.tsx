'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import CreateTaskModal from '../../../components/CreateTaskModal';
import TaskSubmissionModal from '../../../components/TaskSubmissionModal';
import TaskReviewModal from '../../../components/TaskReviewModal';

export default function TasksPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [activeModal, setActiveModal] = useState<'detail' | 'submission' | 'review' | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [userMap, setUserMap] = useState<Record<string, string>>({});

    // Sidebar Navigation
    type NavTab = 'overall' | 'ongoing' | 'in_review' | 'completed' | 'assigned';
    const [activeTab, setActiveTab] = useState<NavTab>('overall');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserId(user.user_id);
            fetchTasks(user.user_id);
            fetchUserMap(user.user_id);

            // Real-time listener
            import('../../../lib/socket').then(({ socket }) => {
                const onNotification = (data: any) => {
                    // If we receive a notification related to tasks, refresh.
                    // Start simple: refresh on ANY notification to catch task submissions/reviews
                    console.log('Received notification, refreshing tasks...', data);
                    fetchTasks(user.user_id);
                };

                socket.on('notification:new', onNotification);
                return () => {
                    socket.off('notification:new', onNotification);
                }
            });
        }
    }, []);

    useEffect(() => {
        filterTasks();
    }, [tasks, activeTab]);

    const fetchTasks = async (uid: string) => {
        try {
            const timestamp = new Date().getTime();
            console.log('Fetching tasks for user:', uid, 'timestamp:', timestamp);
            const data = await api.get(`/tasks?userId=${uid}&t=${timestamp}`);
            if (Array.isArray(data)) {
                console.log('Fetched tasks count:', data.length);
                setTasks(data);
            } else {
                console.warn('Fetched data is not an array:', data);
            }
        } catch (error) {
            console.error('Failed to fetch tasks:', error);
        }
    };

    const fetchUserMap = async (uid: string) => {
        try {
            // Fetch friends and group members to build a name map
            // This is a "best effort" to resolve names without a dedicated /users endpoints
            const friends = await api.get(`/friends/${uid}`);
            const map: Record<string, string> = { [uid]: 'Me' };

            if (Array.isArray(friends)) {
                friends.forEach((f: any) => {
                    const details = f.friend_details;
                    if (details) {
                        map[f.friend_id] = details.user_name || details.email;
                    }
                });
            }
            setUserMap(map);
        } catch (e) {
            console.error('Failed to fetch user map', e);
        }
    }

    const getUserName = (id: string) => {
        if (!id) return 'Unassigned';
        if (id === userId) return 'Me';
        return userMap[id] || `User (${id.substring(0, 4)}...)`;
    };

    const filterTasks = () => {
        let result = [];
        switch (activeTab) {
            case 'overall':
                result = tasks;
                break;
            case 'ongoing':
                result = tasks.filter(t => t.status === 'todo' || t.status === 'in_progress');
                break;
            case 'in_review':
                result = tasks.filter(t => t.status === 'in_review');
                break;
            case 'completed':
                result = tasks.filter(t => t.status === 'done');
                break;
            case 'assigned':
                result = tasks.filter(t => t.created_by === userId && t.user_id !== userId);
                break;
            default:
                result = tasks;
        }
        // Sort by due date (nearest first) or created_at
        result.sort((a, b) => {
            if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            if (!a.due_date && b.due_date) return 1;
            if (a.due_date && !b.due_date) return -1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setFilteredTasks(result);
    };

    const handleTaskClick = async (task: any) => {
        // Logic similar to before but adapted for list view actions
        // 1. If I am assignee and status is Todo, waiting for start? 
        // Or if clicked row, just view detail unless action button clicked.
        // For simpler UX, clicking row opens Detail. specific buttons for actions.
        setSelectedTask(task);
        setActiveModal('detail');
    };

    const handleAction = (e: React.MouseEvent, task: any, action: 'submit' | 'review' | 'start') => {
        e.stopPropagation();
        setSelectedTask(task);
        if (action === 'submit') setActiveModal('submission');
        if (action === 'review') setActiveModal('review');
        if (action === 'start') {
            // Auto start logic
            startTask(task);
        }
    };

    const startTask = async (task: any) => {
        try {
            await api.put(`/tasks/${task.task_id}`, { status: 'in_progress' });
            // Update local state
            const updated = { ...task, status: 'in_progress' };
            setTasks(prev => prev.map(t => t.task_id === task.task_id ? updated : t));
            // Show submission modal immediately? Maybe optional.
        } catch (e) {
            console.error('Failed to start task', e);
        }
    };

    if (!userId) return <div className="p-8 text-center text-slate-400">Please login to view tasks.</div>;

    const navItems: { id: NavTab; label: string; count: number }[] = [
        { id: 'overall', label: 'All Tasks', count: tasks.length },
        { id: 'ongoing', label: 'On Going', count: tasks.filter(t => t.status === 'todo' || t.status === 'in_progress').length },
        { id: 'in_review', label: 'In Review', count: tasks.filter(t => t.status === 'in_review').length },
        { id: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'done').length },
        { id: 'assigned', label: 'Assigned by Me', count: tasks.filter(t => t.created_by === userId && t.user_id !== userId).length },
    ];

    return (
        <div className="h-full flex flex-col md:flex-row bg-slate-50 dark:bg-[#0f172a] overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5">
            {/* Sidebar */}
            <div className="w-full md:w-64 bg-white dark:bg-[#1e293b] border-r border-slate-200 dark:border-white/5 flex flex-col">
                <div className="p-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        New Task
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex justify-between items-center px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === item.id
                                ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                                }`}
                        >
                            <span>{item.label}</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${activeTab === item.id
                                ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300'
                                : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                                }`}>
                                {item.count}
                            </span>
                        </button>
                    ))}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 dark:bg-[#0f172a]">
                {/* Mobile Header (optional if needed, hidden on desktop) */}

                {/* List Header */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-200 dark:border-white/5 text-xs font-bold text-slate-500 uppercase tracking-wider bg-white dark:bg-[#1e293b]/50">
                    <div className="col-span-4">Task Name</div>
                    <div className="col-span-2">Owner</div>
                    <div className="col-span-2">Assignee</div>
                    <div className="col-span-2">Due Date</div>
                    <div className="col-span-2 text-right">Status</div>
                </div>

                {/* List Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 md:p-2 space-y-2 md:space-y-0">
                    {filteredTasks.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <svg className="w-16 h-16 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                            <p>No tasks found in this view</p>
                        </div>
                    ) : (
                        filteredTasks.map((task) => (
                            <div
                                key={task.task_id}
                                onClick={() => handleTaskClick(task)}
                                className="group md:grid md:grid-cols-12 md:gap-4 p-4 md:px-6 md:py-3 bg-white dark:bg-[#1e293b] md:bg-transparent md:hover:bg-white md:dark:hover:bg-[#1e293b] border-b border-slate-200 dark:border-white/5 items-center cursor-pointer transition-colors relative"
                            >
                                {/* Title & Priority */}
                                <div className="col-span-4 flex items-center gap-3 mb-2 md:mb-0">
                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.priority === 'high' ? 'bg-red-500' :
                                        task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                                        }`} title={`Priority: ${task.priority}`} />
                                    <span className="font-medium text-slate-900 dark:text-white truncate pr-4">{task.title}</span>
                                </div>

                                {/* Owner */}
                                <div className="col-span-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1 md:mb-0">
                                    <span className="md:hidden text-xs font-bold w-20">Owner:</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                            {(task.created_by === userId ? 'Me' : (task.owner?.user_name || 'U')).charAt(0)}
                                        </div>
                                        <span className="truncate max-w-[100px]">{task.created_by === userId ? 'Me' : (task.owner?.user_name || getUserName(task.created_by))}</span>
                                    </div>
                                </div>

                                {/* Assignee */}
                                <div className="col-span-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-1 md:mb-0">
                                    <span className="md:hidden text-xs font-bold w-20">Assignee:</span>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                                            {(task.user_id === userId ? 'Me' : (task.assignee?.user_name || 'U')).charAt(0)}
                                        </div>
                                        <span className="truncate max-w-[100px]">{task.user_id === userId ? 'Me' : (task.assignee?.user_name || getUserName(task.user_id))}</span>
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div className="col-span-2 text-sm text-slate-500 dark:text-slate-400 mb-2 md:mb-0">
                                    <span className="md:hidden text-xs font-bold w-20 inline-block">Due:</span>
                                    <span className={`${task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-500 font-medium' : ''}`}>
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                                    </span>
                                </div>

                                {/* Status & Actions */}
                                <div className="col-span-2 flex items-center justify-end gap-2">
                                    {/* Action Buttons based on state */}


                                    {(task.status === 'in_progress' || task.status === 'todo') && task.user_id === userId && (
                                        <button
                                            onClick={(e) => handleAction(e, task, 'submit')}
                                            className="hidden group-hover:block px-2 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-all"
                                        >
                                            Submit
                                        </button>
                                    )}

                                    {task.status === 'in_review' && task.created_by === userId && (
                                        <button
                                            onClick={(e) => handleAction(e, task, 'review')}
                                            className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold rounded shadow-lg shadow-purple-500/30 transition-all animate-pulse"
                                        >
                                            Review
                                        </button>
                                    )}

                                    {/* Status Badge */}
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize border ${task.status === 'done' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' :
                                        task.status === 'in_progress' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20' :
                                            task.status === 'in_review' ? 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20' :
                                                'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-white/10'
                                        }`}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modals */}
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
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg">
                                <span className="text-xs text-slate-500 uppercase font-bold">Owner</span>
                                <p className="font-medium text-slate-900 dark:text-white">{selectedTask.created_by === userId ? 'Me' : (selectedTask.owner?.user_name || getUserName(selectedTask.created_by))}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-lg">
                                <span className="text-xs text-slate-500 uppercase font-bold">Assignee</span>
                                <p className="font-medium text-slate-900 dark:text-white">{selectedTask.user_id === userId ? 'Me' : (selectedTask.assignee?.user_name || getUserName(selectedTask.user_id))}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

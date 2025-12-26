'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import GroupList from '../../components/GroupList';
import Chat from '../../components/Chat';
import TaskAssignment from '../../components/TaskAssignment';
import CreateTaskModal from '../../components/CreateTaskModal';
import AddFriendModal from '../../components/AddFriendModal';
import CalendarWidget from '../../components/CalendarWidget';
import FriendList from '../../components/FriendList';

export default function DashboardPage() {
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [userId, setUserId] = useState<string>('');
    const [tasks, setTasks] = useState<any[]>([]);

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

    return (
        <div className="max-w-7xl mx-auto w-full p-8">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">My Calendar</h1>
                    <p className="text-slate-400 mt-1">Manage your schedule and upcoming deadlines.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowAddFriend(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        Add Friend
                    </button>
                    <button
                        onClick={() => setShowCreateTask(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + New Task
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Calendar Area */}
                <div className="lg:col-span-2 space-y-6">
                    <CalendarWidget userId={userId} />
                </div>

                {/* Side Widgets */}
                <div className="space-y-6">
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Upcoming Tasks</h3>
                        <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                            {tasks.length > 0 ? (
                                tasks.map((task) => (
                                    <div key={task.task_id} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3 hover:bg-white/10 transition-colors">
                                        <div className={`w-2 h-2 rounded-full ${task.priority === 'high' ? 'bg-red-500' :
                                            task.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                            }`}></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{task.title}</p>
                                            <p className="text-xs text-slate-400">
                                                {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 text-sm text-center py-4">No upcoming tasks</p>
                            )}
                        </div>
                    </div>

                    <GroupList userId={userId} onSelectGroup={setSelectedGroupId} />

                    {selectedGroupId && (
                        <Chat groupId={selectedGroupId} userId={userId} />
                    )}

                    <TaskAssignment userId={userId} onAssign={(type, id) => console.log('Assigned to', type, id)} />

                    <FriendList userId={userId} />
                </div>
            </div>

            {showCreateTask && (
                <CreateTaskModal
                    userId={userId}
                    onClose={() => setShowCreateTask(false)}
                    onTaskCreated={() => fetchTasks(userId)}
                />
            )}

            {showAddFriend && (
                <AddFriendModal
                    userId={userId}
                    onClose={() => setShowAddFriend(false)}
                />
            )}
        </div>
    );
}

'use client';

import { useState } from 'react';
import GroupList from '../../components/GroupList';
import Chat from '../../components/Chat';
import TaskAssignment from '../../components/TaskAssignment';
import CreateTaskModal from '../../components/CreateTaskModal';
import AddFriendModal from '../../components/AddFriendModal';
import CalendarWidget from '../../components/CalendarWidget';
import FileUpload from '../../components/FileUpload';

export default function DashboardPage() {
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [showCreateTask, setShowCreateTask] = useState(false);
    const [showAddFriend, setShowAddFriend] = useState(false);
    const userId = 'test-user-id'; // TODO: Replace with real auth

    return (
        <div>
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

                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Files</h3>
                        <FileUpload />
                    </div>
                </div>

                {/* Side Widgets */}
                <div className="space-y-6">
                    <div className="glass-panel p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Upcoming Tasks</h3>
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/5 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Project Review</p>
                                        <p className="text-xs text-slate-400">Today, 2:00 PM</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <GroupList userId={userId} onSelectGroup={setSelectedGroupId} />

                    {selectedGroupId && (
                        <Chat groupId={selectedGroupId} userId={userId} />
                    )}

                    <TaskAssignment userId={userId} onAssign={(type, id) => console.log('Assigned to', type, id)} />
                </div>
            </div>

            {showCreateTask && (
                <CreateTaskModal
                    userId={userId}
                    onClose={() => setShowCreateTask(false)}
                    onTaskCreated={() => console.log('Task created')}
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

'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import Chat from './Chat';
import CreateTaskModal from './CreateTaskModal';

interface GroupMember {
    group_id: string;
    user_id: string;
    role: 'owner' | 'admin' | 'member';
    can_manage_members?: boolean;
    user_name?: string;
    email?: string;
}

interface Group {
    group_id: string;
    name: string;
    user_id: string;
    join_code?: string;
    role?: string;
    can_manage_members?: boolean;
}

interface Task {
    task_id: string;
    title: string;
    description?: string;
    due_date?: string;
    status: string;
    priority: string;
    owner_id?: string;
}

interface GroupDetailViewProps {
    groupId: string;
    userId: string;
    onBack: () => void;
}

type ViewTab = 'chat' | 'members' | 'tasks';

export default function GroupDetailView({ groupId, userId, onBack }: GroupDetailViewProps) {
    const [activeTab, setActiveTab] = useState<ViewTab>('chat');
    const [group, setGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [myRole, setMyRole] = useState<GroupMember | null>(null);
    const [loading, setLoading] = useState(true);
    const [codeCopied, setCodeCopied] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchGroupDetails();
        fetchMembers();
        fetchTasks();
    }, [groupId]);

    const fetchGroupDetails = async () => {
        try {
            const data = await api.get(`/groups/detail/${groupId}`);
            setGroup(data);
        } catch (e) {
            console.error("Failed to fetch group details", e);
        }
    };

    const fetchMembers = async () => {
        try {
            const data = await api.get(`/groups/${groupId}/members`);
            if (Array.isArray(data)) {
                setMembers(data);
                const me = data.find((m: GroupMember) => m.user_id === userId);
                setMyRole(me || null);
            }
            setLoading(false);
        } catch (e) {
            console.error("Failed to fetch members", e);
            setLoading(false);
        }
    };

    const fetchTasks = async () => {
        try {
            const data = await api.get(`/tasks?userId=${userId}`);
            // Filter tasks for this group
            if (Array.isArray(data)) {
                const groupTasks = data.filter((t: any) => t.group_id === groupId);
                setTasks(groupTasks);
            }
        } catch (e) {
            console.error("Failed to fetch tasks", e);
        }
    };

    const copyCode = () => {
        if (group?.join_code) {
            navigator.clipboard.writeText(group.join_code);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        }
    };

    const regenerateCode = async () => {
        try {
            setActionLoading('regen');
            const result = await api.post(`/groups/${groupId}/regenerate-code`, { requesterId: userId });
            setGroup(prev => prev ? { ...prev, join_code: result.join_code } : null);
        } catch (e: any) {
            alert(e.message || 'Failed to regenerate code');
        } finally {
            setActionLoading(null);
        }
    };

    const removeMember = async (targetUserId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            setActionLoading(targetUserId);
            await api.delete(`/groups/${groupId}/members/${targetUserId}`, { requesterId: userId });
            fetchMembers();
        } catch (e: any) {
            alert(e.message || 'Failed to remove member');
        } finally {
            setActionLoading(null);
        }
    };

    const updateRole = async (targetUserId: string, newRole: 'admin' | 'member') => {
        try {
            setActionLoading(targetUserId);
            await api.put(`/groups/${groupId}/members/${targetUserId}/role`, { newRole, requesterId: userId });
            fetchMembers();
        } catch (e: any) {
            alert(e.message || 'Failed to update role');
        } finally {
            setActionLoading(null);
        }
    };

    const togglePermission = async (adminUserId: string, currentPermission: boolean) => {
        try {
            setActionLoading(adminUserId);
            await api.put(`/groups/${groupId}/members/${adminUserId}/permission`, {
                canManage: !currentPermission,
                ownerId: userId
            });
            fetchMembers();
        } catch (e: any) {
            alert(e.message || 'Failed to toggle permission');
        } finally {
            setActionLoading(null);
        }
    };

    const canManage = myRole?.role === 'owner' || (myRole?.role === 'admin' && myRole?.can_manage_members);
    const isOwner = myRole?.role === 'owner';

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'owner':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white">OWNER</span>;
            case 'admin':
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">ADMIN</span>;
            default:
                return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-700 text-slate-400">MEMBER</span>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="glass-panel p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-white">{group?.name}</h2>
                            <p className="text-xs text-slate-400">{members.length} members</p>
                        </div>
                    </div>

                    {/* Join Code (visible to owner/admin) */}
                    {group?.join_code && (myRole?.role === 'owner' || myRole?.role === 'admin') && (
                        <div className="flex items-center gap-2">
                            <div className="bg-black/30 rounded-lg px-3 py-2 border border-white/10 flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 uppercase">Code:</span>
                                <span className="font-mono font-bold text-white">{group.join_code}</span>
                                <button
                                    onClick={copyCode}
                                    className={`p-1 rounded transition-all ${codeCopied ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                                >
                                    {codeCopied ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    )}
                                </button>
                            </div>
                            {isOwner && (
                                <button
                                    onClick={regenerateCode}
                                    disabled={actionLoading === 'regen'}
                                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                                    title="Regenerate Code"
                                >
                                    <svg className={`w-4 h-4 ${actionLoading === 'regen' ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-black/20 rounded-xl">
                    {(['chat', 'members', 'tasks'] as ViewTab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all capitalize ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            {tab}
                            {tab === 'members' && <span className="ml-1 text-xs opacity-70">({members.length})</span>}
                            {tab === 'tasks' && tasks.length > 0 && <span className="ml-1 text-xs opacity-70">({tasks.length})</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {/* Chat Tab */}
                {activeTab === 'chat' && (
                    <Chat
                        groupId={groupId}
                        userId={userId}
                        title={group?.name || 'Group Chat'}
                        type="group"
                        role={myRole?.role}
                    />
                )}

                {/* Members Tab */}
                {activeTab === 'members' && (
                    <div className="glass-panel p-4 h-full overflow-y-auto custom-scrollbar">
                        <div className="space-y-3">
                            {members.map(member => (
                                <div key={member.user_id} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${member.role === 'owner' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                                                    member.role === 'admin' ? 'bg-blue-500' : 'bg-slate-600'
                                                }`}>
                                                {member.user_name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-white">{member.user_name}</p>
                                                    {getRoleBadge(member.role)}
                                                    {member.role === 'admin' && member.can_manage_members && (
                                                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-400">CAN MANAGE</span>
                                                    )}
                                                    {member.user_id === userId && (
                                                        <span className="text-[10px] text-slate-500">(you)</span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500">{member.email}</p>
                                            </div>
                                        </div>

                                        {/* Actions - only if can manage and not self */}
                                        {member.user_id !== userId && member.role !== 'owner' && (
                                            <div className="flex items-center gap-1">
                                                {/* Role change - owner only */}
                                                {isOwner && (
                                                    <select
                                                        value={member.role}
                                                        onChange={(e) => updateRole(member.user_id, e.target.value as 'admin' | 'member')}
                                                        disabled={actionLoading === member.user_id}
                                                        className="text-xs bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-blue-500"
                                                    >
                                                        <option value="member">Member</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                )}

                                                {/* Toggle admin permission - owner only for admins */}
                                                {isOwner && member.role === 'admin' && (
                                                    <button
                                                        onClick={() => togglePermission(member.user_id, !!member.can_manage_members)}
                                                        disabled={actionLoading === member.user_id}
                                                        className={`p-1.5 rounded-lg text-xs transition-all ${member.can_manage_members ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                                                        title={member.can_manage_members ? "Revoke manage permission" : "Grant manage permission"}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                        </svg>
                                                    </button>
                                                )}

                                                {/* Remove member */}
                                                {canManage && (
                                                    <button
                                                        onClick={() => removeMember(member.user_id)}
                                                        disabled={actionLoading === member.user_id}
                                                        className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                                                        title="Remove member"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tasks Tab */}
                {activeTab === 'tasks' && (
                    <div className="glass-panel p-4 h-full overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-white">Group Tasks</h3>
                            {(isOwner || myRole?.role === 'admin') && (
                                <button
                                    onClick={() => setShowTaskModal(true)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium flex items-center gap-1 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    Assign Task
                                </button>
                            )}
                        </div>

                        {tasks.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-3">
                                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <p className="text-slate-400 text-sm">No tasks assigned to this group</p>
                                {(isOwner || myRole?.role === 'admin') && (
                                    <button
                                        onClick={() => setShowTaskModal(true)}
                                        className="mt-3 text-blue-400 hover:text-blue-300 text-sm"
                                    >
                                        Create the first task
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tasks.map(task => (
                                    <div key={task.task_id} className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-white">{task.title}</p>
                                                {task.description && <p className="text-xs text-slate-400 mt-1">{task.description}</p>}
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${task.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' :
                                                        task.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                                                            'bg-slate-500/20 text-slate-400'
                                                    }`}>
                                                    {task.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                                {task.due_date && (
                                                    <span className="text-[10px] text-slate-500">
                                                        Due: {new Date(task.due_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Task Modal */}
            {showTaskModal && (
                <CreateTaskModal
                    userId={userId}
                    groupId={groupId}
                    onClose={() => setShowTaskModal(false)}
                    onTaskCreated={() => {
                        setShowTaskModal(false);
                        fetchTasks();
                    }}
                />
            )}
        </div>
    );
}

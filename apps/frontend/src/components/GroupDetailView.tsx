'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import Chat from './Chat';
import TaskSubmissionModal from './TaskSubmissionModal';
import TaskReviewModal from './TaskReviewModal';
import CreateTaskModal from './CreateTaskModal';
import InviteToGroupModal from './InviteToGroupModal';
import TaskDetailModal from './TaskDetailModal';

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
    created_by: string;
    user_id?: string;
    group_id?: string;
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
    const [pendingMembers, setPendingMembers] = useState<any[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [myRole, setMyRole] = useState<GroupMember | null>(null);
    const [loading, setLoading] = useState(true);
    const [codeCopied, setCodeCopied] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    // Task Modals
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
    const router = useRouter();

    // Filters & Sorting
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'date' | 'priority'>('date');

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

            // Also fetch pending members if you have update permissions
            const me = (Array.isArray(data) ? data : []).find((m: GroupMember) => m.user_id === userId);
            const canManage = me?.role === 'owner' || (me?.role === 'admin' && me?.can_manage_members);

            if (canManage) {
                try {
                    const pending = await api.get(`/groups/${groupId}/pending-members`);
                    setPendingMembers(Array.isArray(pending) ? pending : []);
                } catch (err) {
                    // Could fail if endpoint doesn't exist yet/permission issues, ignore silently or log
                    console.log('No pending members or permission denied');
                }
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

    const handleMemberApproval = async (targetUserId: string, status: 'active' | 'rejected') => {
        try {
            setActionLoading(targetUserId);
            await api.put(`/groups/${groupId}/members/${targetUserId}/status`, { status });
            fetchMembers();
        } catch (e: any) {
            alert(e.message || 'Failed to update status');
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
            <div className="glass-panel p-4 mb-4 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{group?.name}</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{members.length} members</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Join Code (visible to owner/admin) */}
                        {group?.join_code && (myRole?.role === 'owner' || myRole?.role === 'admin') && (
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="bg-slate-100 dark:bg-black/30 rounded-lg px-3 py-2 border border-slate-200 dark:border-white/10 flex items-center gap-2">
                                    <span className="text-[10px] text-slate-500 uppercase">Code:</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">{group.join_code}</span>
                                    <button
                                        onClick={copyCode}
                                        className={`p-1 rounded transition-all ${codeCopied ? 'text-emerald-500 dark:text-emerald-400' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
                                    >
                                        {codeCopied ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 3-Dot Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowInviteModal(true)}
                                className="mr-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-lg shadow-blue-500/20"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                Invite
                            </button>
                            <button
                                onClick={() => setShowMenu(!showMenu)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-600 dark:text-slate-200 transition-all shadow-sm"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="12" cy="6" r="2" />
                                    <circle cx="12" cy="12" r="2" />
                                    <circle cx="12" cy="18" r="2" />
                                </svg>
                            </button>

                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1e293b] rounded-xl shadow-xl border border-slate-200 dark:border-white/10 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                        {(isOwner || myRole?.role === 'admin') && (
                                            <>
                                                <button
                                                    onClick={() => { setShowMenu(false); setShowSettingsModal(true); }}
                                                    className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    Group Settings
                                                </button>
                                                <div className="h-px bg-slate-100 dark:bg-white/5 mx-2"></div>
                                            </>
                                        )}
                                        <button
                                            onClick={() => { setShowMenu(false); setActiveTab('members'); }}
                                            className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                            View Members
                                        </button>
                                    </div>
                                    {/* Leave Group Option (For Non-Owners) */}
                                    {!isOwner && (
                                        <>
                                            <div className="h-px bg-slate-100 dark:bg-white/5 mx-2"></div>
                                            <button
                                                onClick={async () => {
                                                    if (confirm("Are you sure you want to leave this group?")) {
                                                        try {
                                                            await api.post(`/groups/${groupId}/leave`, { userId });
                                                            alert("You have left the group.");
                                                            router.push('/dashboard');
                                                        } catch (e: any) {
                                                            alert(e.message || "Failed to leave group");
                                                        }
                                                    }
                                                }}
                                                className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                                Leave Group
                                            </button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-1 p-1 bg-slate-100 dark:bg-black/20 rounded-xl mt-4">
                        {(['chat', 'members', 'tasks'] as ViewTab[]).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all capitalize ${activeTab === tab
                                    ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-sm dark:shadow-lg'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'}`}
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
                        <div className="glass-panel p-4 h-full overflow-y-auto custom-scrollbar bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10">

                            {/* Pending Approvals Section */}
                            {pendingMembers.length > 0 && (
                                <div className="mb-6">
                                    <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Pending Requests</h3>
                                    <div className="space-y-3">
                                        {pendingMembers.map(member => (
                                            <div key={member.user_id} className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-800/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold">
                                                            {member.users?.username?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-white">{member.users?.username || 'Unknown User'}</p>
                                                            <p className="text-xs text-slate-500">{member.users?.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleMemberApproval(member.user_id, 'active')}
                                                            disabled={actionLoading === member.user_id}
                                                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleMemberApproval(member.user_id, 'rejected')}
                                                            disabled={actionLoading === member.user_id}
                                                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-lg transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="my-6 border-b border-slate-200 dark:border-white/10"></div>
                                </div>
                            )}

                            <div className="space-y-3">
                                {members.map(member => (
                                    <div key={member.user_id} className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${member.role === 'owner' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                                                    member.role === 'admin' ? 'bg-blue-500' : 'bg-slate-500'
                                                    }`}>
                                                    {member.user_name?.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-slate-900 dark:text-white">{member.user_name}</p>
                                                        {getRoleBadge(member.role)}
                                                        {member.role === 'admin' && member.can_manage_members && (
                                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">CAN MANAGE</span>
                                                        )}
                                                        {member.user_id === userId && (
                                                            <span className="text-[10px] text-slate-500">(you)</span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
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
                                                            className="text-xs bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 text-slate-700 dark:text-white focus:outline-none focus:border-blue-500"
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
                                                            className={`p-1.5 rounded-lg text-xs transition-all ${member.can_manage_members ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-white'}`}
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
                                                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
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
                        <div className="glass-panel p-4 h-full overflow-y-auto custom-scrollbar bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10">
                            <div className="flex flex-col gap-4 mb-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-slate-900 dark:text-white">Group Tasks</h3>
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

                                {/* Filters & Sort Controls */}
                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs px-2 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="in_review">In Review</option>
                                        <option value="done">Done</option>
                                    </select>

                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs px-2 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="date">Sort by Date</option>
                                        <option value="priority">Sort by Priority</option>
                                    </select>
                                </div>
                            </div>

                            {/* Filtered List Logic */}
                            {(() => {
                                let filteredTasks = tasks.filter(t => filterStatus === 'all' || t.status === filterStatus);
                                filteredTasks.sort((a, b) => {
                                    if (sortBy === 'date') {
                                        if (!a.due_date) return 1;
                                        if (!b.due_date) return -1;
                                        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                                    } else {
                                        // Priority: High > Medium > Low
                                        const pMap: any = { high: 3, medium: 2, low: 1 };
                                        return (pMap[b.priority] || 0) - (pMap[a.priority] || 0);
                                    }
                                });

                                if (filteredTasks.length === 0) {
                                    return (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                                                <svg className="w-8 h-8 text-slate-400 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                                </svg>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm">No tasks found</p>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="space-y-2">
                                        {filteredTasks.map(task => (
                                            <div
                                                key={task.task_id}
                                                className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10 transition-all cursor-pointer group"
                                                onClick={() => { setSelectedTask(task); setShowTaskDetailModal(true); }}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">{task.title}</p>
                                                            {task.priority === 'high' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                                                        </div>
                                                        {task.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{task.description}</p>}

                                                        {/* Task Actions */}
                                                        <div className="flex items-center gap-2 mt-3" onClick={e => e.stopPropagation()}>
                                                            {/* Submit Button */}
                                                            {task.status !== 'done' && task.status !== 'in_review' && (
                                                                <button
                                                                    onClick={() => { setSelectedTask(task); setShowSubmitModal(true); }}
                                                                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all"
                                                                >
                                                                    Submit Work
                                                                </button>
                                                            )}

                                                            {/* Review Button */}
                                                            {task.status === 'in_review' && (isOwner || myRole?.role === 'admin' || task.created_by === userId) && (
                                                                <button
                                                                    onClick={() => { setSelectedTask(task); setShowReviewModal(true); }}
                                                                    className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all"
                                                                >
                                                                    Review Submission
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${task.status === 'done' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' :
                                                            task.status === 'in_progress' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                                                                task.status === 'in_review' ? 'bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' :
                                                                    'bg-slate-100 dark:bg-slate-500/20 text-slate-600 dark:text-slate-400'
                                                            }`}>
                                                            {task.status.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                                            Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                                                        </span>
                                                        {task.user_id && (
                                                            <span className="text-[10px] bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                                                                👤 {members.find(m => m.user_id === task.user_id)?.user_name || 'Member'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
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

            {/* Group Settings Modal */}
            {showSettingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-[#1e293b] rounded-2xl w-full max-w-md p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Group Settings</h3>
                            <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Option: Join Code */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Join Code</label>
                                <div className="flex gap-2">
                                    <div className="flex-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-mono font-bold text-slate-900 dark:text-white text-center tracking-widest">
                                        {group?.join_code}
                                    </div>
                                    <button
                                        onClick={regenerateCode}
                                        className="px-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl font-medium transition-colors"
                                    >
                                        Regenerate
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Share this code with people you want to add to the group.</p>
                            </div>

                            <div className="border-t border-slate-100 dark:border-white/5"></div>

                            {/* Option: Danger Zone */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Danger Zone</label>

                                {myRole?.role === 'owner' ? (
                                    <button className="w-full py-3 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors">
                                        Delete Group
                                    </button>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to leave this group?")) {
                                                try {
                                                    await api.post(`/groups/${groupId}/leave`, { userId });
                                                    alert("You have left the group.");
                                                    router.push('/dashboard');
                                                } catch (e: any) {
                                                    alert(e.message || "Failed to leave group");
                                                }
                                            }
                                        }}
                                        className="w-full py-3 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        Leave Group
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Task Modals */}
            {showSubmitModal && selectedTask && (
                <TaskSubmissionModal
                    taskId={selectedTask.task_id}
                    userId={userId}
                    taskTitle={selectedTask.title}
                    onClose={() => setShowSubmitModal(false)}
                    onSubmitSuccess={() => {
                        setShowSubmitModal(false);
                        fetchTasks();
                    }}
                />
            )}

            {showReviewModal && selectedTask && (
                <TaskReviewModal
                    taskId={selectedTask.task_id}
                    taskTitle={selectedTask.title}
                    onClose={() => setShowReviewModal(false)}
                    onReviewComplete={() => {
                        setShowReviewModal(false);
                        fetchTasks();
                    }}
                />
            )}
            {(showInviteModal) && (
                <InviteToGroupModal
                    groupId={groupId}
                    userId={userId}
                    onClose={() => setShowInviteModal(false)}
                />
            )}
            {showTaskDetailModal && selectedTask && (
                <TaskDetailModal
                    task={selectedTask}
                    onClose={() => setShowTaskDetailModal(false)}
                    onUpdate={fetchTasks}
                />
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import AddMemberModal from './AddMemberModal';

interface GroupMember {
    user_id: string;
    user_name: string;
    email: string;
    role: 'owner' | 'admin' | 'member';
}

interface GroupInfo {
    group_id: string;
    name: string;
    description: string;
    join_code: string;
    created_at: string;
}

interface GroupInfoModalProps {
    groupId: string;
    userId: string;
    onClose: () => void;
}

export default function GroupInfoModal({ groupId, userId, onClose }: GroupInfoModalProps) {
    const [group, setGroup] = useState<GroupInfo | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'members'>('members');
    const [isLoading, setIsLoading] = useState(true);
    const [myRole, setMyRole] = useState<'owner' | 'admin' | 'member' | null>(null);
    const [showAddMember, setShowAddMember] = useState(false);

    // Edit States
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');

    useEffect(() => {
        fetchData();
    }, [groupId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [groupRes, membersRes] = await Promise.all([
                api.get(`/groups/detail/${groupId}`),
                api.get(`/groups/${groupId}/members`)
            ]);

            setGroup(groupRes);
            setEditName(groupRes.name);
            setEditDesc(groupRes.description || ''); // Handle null description

            if (Array.isArray(membersRes)) {
                setMembers(membersRes);
                const me = membersRes.find((m: GroupMember) => m.user_id === userId);
                setMyRole(me?.role || null);
            }
        } catch (error) {
            console.error("Failed to fetch group info", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveInfo = async () => {
        try {
            await api.put(`/groups/${groupId}`, {
                name: editName,
                description: editDesc
            });
            setIsEditing(false);
            fetchData(); // Refresh
        } catch (error) {
            console.error("Failed to update group", error);
            alert("Failed to update group info");
        }
    };

    const handlePromote = async (targetId: string) => {
        if (!confirm("Promote this member to Admin?")) return;
        try {
            await api.put(`/groups/${groupId}/members/${targetId}/role`, { newRole: 'admin', requesterId: userId });
            fetchData();
        } catch (error) {
            alert("Failed to promote user");
        }
    };

    const handleDemote = async (targetId: string) => {
        if (!confirm("Demote this admin to Member?")) return;
        try {
            await api.put(`/groups/${groupId}/members/${targetId}/role`, { newRole: 'member', requesterId: userId });
            fetchData();
        } catch (error) {
            alert("Failed to demote user");
        }
    };

    const handleRemove = async (targetId: string) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
            await api.delete(`/groups/${groupId}/members/${targetId}`, { requesterId: userId });
            fetchData();
        } catch (error) {
            alert("Failed to remove member");
        }
    };

    // const handleTransfer = async (targetId: string) => {
    //    if (!confirm("Transfer ownership to this member? You will become an Admin. This cannot be undone.")) return;
    //    // Implementation depends on backend support for ownership transfer
    //    // Assuming similar endpoint or specific one
    //    alert("Transfer ownership not yet implemented in backend demo");
    // };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'owner': return <span className="bg-amber-500/20 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">OWNER</span>;
            case 'admin': return <span className="bg-blue-500/20 text-blue-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">ADMIN</span>;
            default: return <span className="bg-slate-500/20 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">MEMBER</span>;
        }
    };

    if (!group) return null;

    const canEdit = myRole === 'owner' || myRole === 'admin';
    const isOwner = myRole === 'owner';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Group Info</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{group.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-colors text-slate-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 dark:border-white/10 px-6">
                    <button
                        onClick={() => setActiveTab('members')}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'members' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Members ({members.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Details & Settings
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {/* INFO TAB */}
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Group Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="w-full px-4 py-2 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl"
                                        />
                                    ) : (
                                        <div className="text-slate-900 dark:text-white font-medium">{group.name}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                    {isEditing ? (
                                        <textarea
                                            value={editDesc}
                                            onChange={e => setEditDesc(e.target.value)}
                                            className="w-full px-4 py-2 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl h-24 resize-none"
                                            placeholder="Add a description..."
                                        />
                                    ) : (
                                        <div className="text-slate-600 dark:text-slate-400 text-sm whitespace-pre-wrap">{group.description || 'No description provided.'}</div>
                                    )}
                                </div>

                                {canEdit && (
                                    <div className="pt-2">
                                        {isEditing ? (
                                            <div className="flex gap-2">
                                                <button onClick={handleSaveInfo} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors">Save Changes</button>
                                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-lg text-sm font-medium transition-colors border border-slate-200 dark:border-white/10">
                                                Edit Details
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-slate-200 dark:border-white/10 pt-6">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Invite Members</h3>
                                <div className="flex gap-2 items-center bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/10">
                                    <code className="flex-1 font-mono text-center font-bold text-slate-800 dark:text-slate-200 text-lg tracking-widest">{group.join_code}</code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(group.join_code)}
                                        className="p-2 text-slate-500 hover:text-blue-500 transition-colors"
                                        title="Copy Code"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Share this code with friends to let them join automatically.</p>
                            </div>
                        </div>
                    )}

                    {/* MEMBERS TAB */}
                    {activeTab === 'members' && (
                        <div className="space-y-4">
                            {canEdit && (
                                <button
                                    onClick={() => setShowAddMember(true)}
                                    className="w-full py-3 border border-dashed border-slate-300 dark:border-white/20 rounded-xl text-slate-500 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Add Member
                                </button>
                            )}

                            <div className="space-y-2">
                                {members.map(member => (
                                    <div key={member.user_id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${member.role === 'owner' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                                                    member.role === 'admin' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                                                        'bg-gradient-to-br from-slate-400 to-slate-500'
                                                }`}>
                                                {member.user_name?.[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-900 dark:text-white">{member.user_name}</span>
                                                    {getRoleBadge(member.role)}
                                                </div>
                                                <span className="text-xs text-slate-500">{member.email}</span>
                                            </div>
                                        </div>

                                        {/* Actions Menu */}
                                        <div className="relative group">
                                            {/* Only show menu if current user has power over this member */}
                                            {/* Rules: 
                                                1. User must be Owner or Admin
                                                2. Cannot edit yourself
                                                3. Admin cannot edit Owner or other Admins
                                            */}
                                            {(
                                                isOwner && member.user_id !== userId ||
                                                (myRole === 'admin' && member.role === 'member')
                                            ) && (
                                                    <div className="flex items-center gap-2">
                                                        {/* Promote/Demote (Owner Only) */}
                                                        {isOwner && (
                                                            <>
                                                                {member.role === 'member' && (
                                                                    <button onClick={() => handlePromote(member.user_id)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors" title="Make Admin">
                                                                        Make Admin
                                                                    </button>
                                                                )}
                                                                {member.role === 'admin' && (
                                                                    <button onClick={() => handleDemote(member.user_id)} className="p-1.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/20 rounded-lg text-xs font-medium transition-colors" title="Remove Admin Status">
                                                                        Demote
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Kick Member */}
                                                        <button onClick={() => handleRemove(member.user_id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-colors" title="Remove from Group">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Add Member Modal */}
            {showAddMember && (
                <AddMemberModal
                    groupId={groupId}
                    userId={userId}
                    onClose={() => {
                        setShowAddMember(false);
                        fetchData(); // Refresh members after adding
                    }}
                />
            )}
        </div>
    );
}

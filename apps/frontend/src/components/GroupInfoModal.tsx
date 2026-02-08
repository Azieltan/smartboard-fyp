import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import AddMemberModal from './AddMemberModal';
import Image from 'next/image';

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
    requires_approval: boolean;
    user_id: string; // owner
}

interface GroupInfoModalProps {
    groupId: string;
    userId: string;
    onClose: () => void;
}

interface Attachment {
    type: 'image' | 'file';
    url: string;
    name: string;
    date: string;
    sender: string;
    messageId: string;
}

export default function GroupInfoModal({ groupId, userId, onClose }: GroupInfoModalProps) {
    const router = useRouter();
    const [group, setGroup] = useState<GroupInfo | null>(null);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [pendingMembers, setPendingMembers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'members' | 'files'>('members');
    const [isLoading, setIsLoading] = useState(true);
    const [myRole, setMyRole] = useState<'owner' | 'admin' | 'member' | null>(null);
    const [showAddMember, setShowAddMember] = useState(false);

    // File Tab State
    const [files, setFiles] = useState<Attachment[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);

    // Edit States
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [editDesc, setEditDesc] = useState('');
    const [editRequiresApproval, setEditRequiresApproval] = useState(false);

    useEffect(() => {
        fetchData();
    }, [groupId]);

    useEffect(() => {
        if (activeTab === 'files') {
            fetchFiles();
        }
    }, [activeTab, groupId]);

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
            setEditRequiresApproval(groupRes.requires_approval || false);

            if (Array.isArray(membersRes)) {
                setMembers(membersRes);
                const me = membersRes.find((m: GroupMember) => m.user_id === userId);
                setMyRole(me?.role || null);

                // Fetch Pending
                const isGroupOwner = groupRes.user_id === userId;
                const isMemberOwner = me?.role === 'owner';
                const isAdminWithPerms = me?.role === 'admin'; // Assume admins see requests

                if (isGroupOwner || isMemberOwner || isAdminWithPerms) {
                    try {
                        const pending = await api.get(`/groups/${groupId}/pending`);
                        setPendingMembers(Array.isArray(pending) ? pending : []);
                    } catch (err) {
                        console.error('Failed to load pending requests within modal:', err);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch group info", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFiles = async () => {
        setIsLoadingFiles(true);
        try {
            // Re-using the chat messages endpoint to extract files
            const messages = await api.get(`/chats/${groupId}/messages`);
            const extractedFiles: Attachment[] = [];

            if (Array.isArray(messages)) {
                messages.forEach((msg: any) => {
                    // Extract Images: ![Image](url)
                    // Updated Regex to be more robust
                    const imageMatch = msg.content.match(/!\[Image\]\((.*?)\)/);
                    if (imageMatch) {
                        extractedFiles.push({
                            type: 'image',
                            url: imageMatch[1],
                            name: 'Image',
                            date: msg.send_time,
                            sender: msg.user_name || 'Unknown',
                            messageId: msg.message_id
                        });
                        return; // Prioritize image if both (unlikely but safe)
                    }

                    // Extract Files: [filename](url)
                    // Updated Regex to create fewer false positives (needs [text](url))
                    const fileMatch = msg.content.match(/\[(.*?)\]\((.*?)\)/);
                    if (fileMatch && !msg.content.startsWith('![')) { // Avoid matching image markdown as file
                        // Simple check: if it's not an image markdown
                        extractedFiles.push({
                            type: 'file',
                            url: fileMatch[2],
                            name: fileMatch[1],
                            date: msg.send_time,
                            sender: msg.user_name || 'Unknown',
                            messageId: msg.message_id
                        });
                    }
                });
            }
            // Dedup by URL just in case
            const uniqueFiles = Array.from(new Map(extractedFiles.map(item => [item.url, item])).values());

            setFiles(uniqueFiles.reverse()); // Newest first
        } catch (error) {
            console.error("Failed to fetch files", error);
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const handleSaveInfo = async () => {
        try {
            await api.put(`/groups/${groupId}`, {
                name: editName,
                description: editDesc,
                requires_approval: editRequiresApproval,
                requesterId: userId // Ensure backend checks ownership
            });
            setIsEditing(false);
            fetchData(); // Refresh
        } catch (error: any) {
            console.error("Failed to update group", error);
            // Show the actual error message from backend if available
            const msg = error.response?.data?.error || error.message || "Failed to update group info";
            alert(`Error: ${msg}`);
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
                        onClick={() => setActiveTab('files')}
                        className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'files' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Files
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
                                {isEditing ? (
                                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-black/20 p-3 rounded-xl border border-slate-200 dark:border-white/10">
                                        <input
                                            type="checkbox"
                                            id="reqApproval"
                                            checked={editRequiresApproval}
                                            onChange={e => setEditRequiresApproval(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <label htmlFor="reqApproval" className="flex-1 cursor-pointer">
                                            <span className="block text-sm font-medium text-slate-900 dark:text-white">Require Approval to Join</span>
                                            <span className="block text-xs text-slate-500 dark:text-slate-400">If checked, new members must be approved by an admin.</span>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className={`w-2 h-2 rounded-full ${group.requires_approval ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            {group.requires_approval ? 'Approval Required to Join' : 'Auto-Join Enabled (Instant)'}
                                        </span>
                                    </div>
                                )}

                                {canEdit && (
                                    <div className="pt-2 flex justify-end">
                                        {isEditing ? (
                                            <div className="flex gap-2">
                                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                                                <button onClick={handleSaveInfo} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-blue-500/30">Save Changes</button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsEditing(true)}
                                                className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl text-sm font-medium transition-all border border-transparent hover:border-slate-300 dark:hover:border-white/20 flex items-center justify-center gap-2 group"
                                            >
                                                <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                Edit Group Details
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

                            <div className="border-t border-slate-200 dark:border-white/10 pt-6 mt-2">
                                {isOwner ? (
                                    <>
                                        <h3 className="text-sm font-bold text-red-600 dark:text-red-400 mb-3">Danger Zone</h3>
                                        <button
                                            onClick={async () => {
                                                if (confirm("Are you sure you want to delete this group? This action cannot be undone.")) {
                                                    try {
                                                        await api.delete(`/groups/${groupId}`);
                                                        alert("Group deleted successfully");
                                                        router.push('/dashboard');
                                                        onClose();
                                                    } catch (e) {
                                                        alert("Failed to delete group");
                                                    }
                                                }
                                            }}
                                            className="w-full py-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-900/30 font-medium transition-colors text-sm flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Delete Group
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to leave this group?")) {
                                                try {
                                                    await api.post(`/groups/${groupId}/leave`, { userId });
                                                    alert("You have left the group.");
                                                    router.push('/dashboard');
                                                    onClose();
                                                } catch (e: any) {
                                                    alert(e.message || "Failed to leave group");
                                                }
                                            }
                                        }}
                                        className="w-full py-3 bg-slate-100 hover:bg-red-50 dark:bg-white/5 dark:hover:bg-red-900/20 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-xl border border-slate-200 hover:border-red-200 dark:border-white/10 dark:hover:border-red-900/30 font-medium transition-colors text-sm flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                        Leave Group
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MEMBERS TAB */}
                    {activeTab === 'members' && (
                        <div className="space-y-4">
                            {/* Pending Requests Section */}
                            {pendingMembers.length > 0 && (canEdit) && (
                                <div className="mb-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pending Requests ({pendingMembers.length})</h3>
                                    <div className="space-y-2">
                                        {pendingMembers.map(request => (
                                            <div key={request.user_id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-100 dark:border-orange-900/20">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-800/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xs">
                                                        {request.users?.username?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{request.users?.username || 'Unknown'}</div>
                                                        <div className="text-xs text-slate-500">{request.users?.email}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await api.put(`/groups/${groupId}/members/${request.user_id}/status`, { status: 'active' });
                                                                fetchData();
                                                            } catch (e) { alert("Failed to approve"); }
                                                        }}
                                                        className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                await api.put(`/groups/${groupId}/members/${request.user_id}/status`, { status: 'rejected' });
                                                                fetchData();
                                                            } catch (e) { alert("Failed to reject"); }
                                                        }}
                                                        className="px-3 py-1 bg-white dark:bg-transparent text-red-500 border border-slate-200 dark:border-red-900/30 text-xs font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-red-900/20 transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-px bg-slate-200 dark:bg-white/10 my-4"></div>
                                </div>
                            )}

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

                    {/* FILES TAB */}
                    {activeTab === 'files' && (
                        <div>
                            {isLoadingFiles ? (
                                <div className="flex items-center justify-center h-40">
                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : files.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <svg className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p>No files shared yet</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {/* Images Grid */}
                                    {files.some(f => f.type === 'image') && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Images</h3>
                                            <div className="grid grid-cols-3 gap-3">
                                                {files.filter(f => f.type === 'image').map((file, i) => (
                                                    <a
                                                        key={`${file.messageId}-${i}`}
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                                                    >
                                                        <Image
                                                            src={file.url}
                                                            alt={file.name}
                                                            fill
                                                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                                                        />
                                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </div>
                                                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <p className="font-bold truncate">{file.sender}</p>
                                                            <p className="opacity-75">{new Date(file.date).toLocaleDateString()}</p>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Files List */}
                                    {files.some(f => f.type === 'file') && (
                                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
                                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Documents</h3>
                                            <div className="grid gap-2">
                                                {files.filter(f => f.type === 'file').map((file, i) => (
                                                    <a
                                                        key={`${file.messageId}-${i}`}
                                                        href={file.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-md transition-all group"
                                                    >
                                                        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/30 transition-colors">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm font-medium text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                {file.name}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                                <span className="font-medium text-slate-600 dark:text-slate-400">{file.sender}</span>
                                                                <span>•</span>
                                                                <span>{new Date(file.date).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <div className="p-2 text-slate-300 group-hover:text-blue-500 transition-colors">
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                            </svg>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Add Member Modal */}
            {
                showAddMember && (
                    <AddMemberModal
                        groupId={groupId}
                        userId={userId}
                        onClose={() => {
                            setShowAddMember(false);
                            fetchData(); // Refresh members after adding
                        }}
                    />
                )
            }
        </div >
    );
}

'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface Friend {
    id: string;
    friend_id: string;
    friend_details: {
        user_id: string;
        user_name: string;
        email: string;
    };
}

interface CreateGroupModalProps {
    userId: string;
    onClose: () => void;
    onGroupCreated: () => void;
}

type Step = 1 | 2 | 3;
type Role = 'admin' | 'member';

export default function CreateGroupModal({ userId, onClose, onGroupCreated }: CreateGroupModalProps) {
    const [step, setStep] = useState<Step>(1);
    const [name, setName] = useState('');
    const [friends, setFriends] = useState<Friend[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<Record<string, Role>>({});
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const [createdGroup, setCreatedGroup] = useState<any>(null);
    const [codeCopied, setCodeCopied] = useState(false);

    useEffect(() => {
        fetchFriends();
    }, []);

    const fetchFriends = async () => {
        try {
            const data = await api.get(`/friends/${userId}`);
            if (Array.isArray(data)) {
                setFriends(data.filter((f: Friend) => f.friend_details));
            }
        } catch (e) {
            console.error("Failed to fetch friends", e);
        }
    };

    const toggleMember = (friendId: string) => {
        setSelectedMembers(prev => {
            if (prev[friendId]) {
                const { [friendId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [friendId]: 'member' };
        });
    };

    const setMemberRole = (friendId: string, role: Role) => {
        setSelectedMembers(prev => ({ ...prev, [friendId]: role }));
    };

    const handleSubmit = async () => {
        if (!name.trim()) return;

        setStatus('loading');
        setErrorMsg('');

        try {
            const friendIds = Object.keys(selectedMembers);
            const friendRoles = selectedMembers;

            const group = await api.post('/groups', {
                name: name.trim(),
                ownerId: userId,
                requiresApproval: false,
                friendIds,
                friendRoles
            });

            setCreatedGroup(group);
            setStatus('success');
            setStep(3);
            onGroupCreated();
        } catch (error: any) {
            setStatus('error');
            setErrorMsg(error.response?.data?.error || 'Failed to create group');
        }
    };

    const copyCode = () => {
        if (createdGroup?.join_code) {
            navigator.clipboard.writeText(createdGroup.join_code);
            setCodeCopied(true);
            setTimeout(() => setCodeCopied(false), 2000);
        }
    };

    const canProceed = () => {
        if (step === 1) return name.trim().length > 0;
        if (step === 2) return true; // Members are optional
        return true;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="glass-panel-glow bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-2xl shadow-2xl w-full max-w-lg border border-white/10 animate-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {step === 1 && 'Create New Group'}
                                    {step === 2 && 'Add Members'}
                                    {step === 3 && 'Group Created!'}
                                </h2>
                                <p className="text-sm text-slate-400">
                                    {step === 1 && 'Step 1 of 2 - Name your group'}
                                    {step === 2 && 'Step 2 of 2 - Invite friends'}
                                    {step === 3 && 'Share the code to invite others'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Progress Indicator */}
                    {step < 3 && (
                        <div className="flex gap-2 mt-4">
                            <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-slate-700'}`} />
                            <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-slate-700'}`} />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {/* Step 1: Group Name */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-300 mb-2">Group Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-lg"
                                    placeholder="e.g. Project Alpha Team"
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-slate-500">Choose a memorable name for your group. You can change it later.</p>
                        </div>
                    )}

                    {/* Step 2: Add Members */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4">
                            <p className="text-sm text-slate-400">Select friends to add to your group. You can assign them as Admin or leave as Member.</p>

                            {friends.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 mx-auto rounded-full bg-slate-800 flex items-center justify-center mb-3">
                                        <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-400 text-sm">No friends yet</p>
                                    <p className="text-slate-500 text-xs">You can add members after creating the group using the invite code</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {friends.map(f => {
                                        const isSelected = !!selectedMembers[f.friend_details.user_id];
                                        const role = selectedMembers[f.friend_details.user_id];

                                        return (
                                            <div
                                                key={f.id}
                                                className={`p-3 rounded-xl border transition-all ${isSelected ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div
                                                        className="flex items-center gap-3 cursor-pointer flex-1"
                                                        onClick={() => toggleMember(f.friend_details.user_id)}
                                                    >
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isSelected ? 'bg-blue-500' : 'bg-slate-700'}`}>
                                                            {f.friend_details.user_name?.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-white">{f.friend_details.user_name}</p>
                                                            <p className="text-xs text-slate-500">{f.friend_details.email}</p>
                                                        </div>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={() => setMemberRole(f.friend_details.user_id, 'member')}
                                                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${role === 'member' ? 'bg-slate-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                                            >
                                                                Member
                                                            </button>
                                                            <button
                                                                onClick={() => setMemberRole(f.friend_details.user_id, 'admin')}
                                                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${role === 'admin' ? 'bg-amber-500 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                                                            >
                                                                Admin
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {Object.keys(selectedMembers).length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    <span className="text-xs text-slate-500">Selected ({Object.keys(selectedMembers).length}):</span>
                                    {Object.entries(selectedMembers).map(([id, role]) => {
                                        const friend = friends.find(f => f.friend_details.user_id === id);
                                        return (
                                            <span key={id} className={`px-2 py-1 rounded-full text-xs font-medium ${role === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                {friend?.friend_details.user_name} ({role})
                                            </span>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Success */}
                    {step === 3 && createdGroup && (
                        <div className="space-y-6 text-center animate-in fade-in-0 zoom-in-95">
                            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">{createdGroup.name}</h3>
                                <p className="text-slate-400">Your group has been created successfully!</p>
                            </div>

                            <div className="bg-black/30 rounded-xl p-4 border border-white/10">
                                <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">Invite Code</p>
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-3xl font-mono font-bold text-white tracking-widest">{createdGroup.join_code}</span>
                                    <button
                                        onClick={copyCode}
                                        className={`p-2 rounded-lg transition-all ${codeCopied ? 'bg-emerald-500 text-white' : 'bg-white/10 text-slate-400 hover:text-white hover:bg-white/20'}`}
                                    >
                                        {codeCopied ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                        )}
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">Share this code with others to let them join</p>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-medium mt-4">
                            {errorMsg}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-between gap-3">
                    {step === 1 && (
                        <>
                            <button onClick={onClose} className="px-6 py-3 text-slate-400 hover:text-white rounded-xl font-medium transition-all">
                                Cancel
                            </button>
                            <button
                                onClick={() => setStep(2)}
                                disabled={!canProceed()}
                                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center gap-2"
                            >
                                Next
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <button onClick={() => setStep(1)} className="px-6 py-3 text-slate-400 hover:text-white rounded-xl font-medium transition-all flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                Back
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={status === 'loading'}
                                className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg flex items-center gap-2"
                            >
                                {status === 'loading' ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        Create Group
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </>
                                )}
                            </button>
                        </>
                    )}

                    {step === 3 && (
                        <button
                            onClick={onClose}
                            className="w-full px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg"
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

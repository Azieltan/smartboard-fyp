'use client';

import { useState } from 'react';
import { api } from '../lib/api';

interface AddFriendModalProps {
    userId: string;
    onClose: () => void;
}

export default function AddFriendModal({ userId, onClose }: AddFriendModalProps) {
    const [identifier, setIdentifier] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        try {
            await api.post('/friends', {
                userId,
                friendIdentifier: identifier
            });
            setStatus('success');
            setTimeout(onClose, 1500);
        } catch (error) {
            setStatus('error');
            setErrorMsg('Failed to add friend. User might not exist.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add Friend</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Friend's Email or User ID</label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>

                    {status === 'success' && (
                        <p className="text-green-600 text-sm">Friend request sent!</p>
                    )}
                    {status === 'error' && (
                        <p className="text-red-600 text-sm">{errorMsg}</p>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                        >
                            {status === 'loading' ? 'Adding...' : 'Add Friend'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

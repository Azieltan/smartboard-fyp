'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface TaskSubmissionModalProps {
    taskId: string;
    userId: string;
    taskTitle: string;
    description?: string;
    priority?: string;
    dueDate?: string;
    onClose: () => void;
    onSubmitSuccess: () => void;
}

export default function TaskSubmissionModal({ taskId, userId, taskTitle, description, priority, dueDate, onClose, onSubmitSuccess }: TaskSubmissionModalProps) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [previousFeedback, setPreviousFeedback] = useState<string | null>(null);

    useEffect(() => {
        // Check for previous rejected submission to show feedback
        const fetchPrevious = async () => {
            try {
                const prev = await api.get(`/tasks/${taskId}/submission`);
                if (prev && prev.status === 'rejected') {
                    setPreviousFeedback(prev.feedback);
                    setContent(prev.content); // Pre-fill with previous work
                }
            } catch (e) {
                // Ignore 404 or other errors
            }
        };
        fetchPrevious();
    }, [taskId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Upload files first if any
            const attachments: string[] = [];
            if (files.length > 0) {
                setUploading(true);
                const token = localStorage.getItem('token');

                for (const file of files) {
                    const formData = new FormData();
                    formData.append('file', file);

                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/upload`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });

                    if (!res.ok) {
                        throw new Error('File upload failed');
                    }

                    const data = await res.json();
                    attachments.push(data.url);
                }
                setUploading(false);
            }

            await api.post(`/tasks/${taskId}/submit`, {
                userId,
                content,
                attachments
            });

            onSubmitSuccess();
        } catch (error: any) {
            console.error('Submission failed', error);
            alert(error.message || 'Failed to submit task');
            setUploading(false);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl w-full max-w-lg p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">{taskTitle}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${priority === 'high' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                                priority === 'medium' ? 'bg-amber-100 dark:bg-yellow-500/20 text-amber-600 dark:text-yellow-400' :
                                    'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-green-400'
                                }`}>
                                {priority || 'Medium'}
                            </span>
                            {dueDate && (
                                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    Due {new Date(dueDate).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-50 dark:bg-white/5 p-2 rounded-lg transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="mb-6 p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-100 dark:border-white/5">
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {description || 'No description provided.'}
                    </p>
                </div>

                {previousFeedback && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-xl">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-red-600 dark:text-red-400 mb-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Changes Requested
                        </h4>
                        <p className="text-sm text-red-600/80 dark:text-red-400/80 pl-6">
                            {previousFeedback}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Completion Notes
                        </label>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:border-blue-500 outline-none transition-all resize-none h-32"
                            placeholder="Describe what you did..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Attachments (Optional)
                        </label>
                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 dark:border-white/10 border-dashed rounded-xl cursor-pointer bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Any file up to 10MB</p>
                                </div>
                                <input type="file" className="hidden" multiple onChange={handleFileChange} />
                            </label>
                        </div>
                        {files.length > 0 && (
                            <div className="mt-2 space-y-1">
                                {files.map((file, i) => (
                                    <div key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                        {file.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                                    {uploading ? 'Uploading Files...' : 'Submitting...'}
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Submit for Review
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

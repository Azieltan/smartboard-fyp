'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface TaskReviewModalProps {
    taskId: string;
    taskTitle: string;
    onClose: () => void;
    onReviewComplete: () => void;
}

interface Submission {
    submission_id: string;
    user_id: string;
    content: string;
    attachments: string[]; // Use attachment URLs actually
    submitted_at: string;
    status: string;
    file_names?: string[]; // Optional if we want to parse it
}

export default function TaskReviewModal({ taskId, taskTitle, onClose, onReviewComplete }: TaskReviewModalProps) {
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        const fetchSubmission = async () => {
            try {
                const data = await api.get(`/tasks/${taskId}/submission`);
                setSubmission(data);
            } catch (error) {
                console.error('Failed to fetch submission', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmission();
    }, [taskId]);

    const handleReview = async (status: 'approved' | 'rejected') => {
        if (!submission) return;
        setProcessing(true);
        try {
            await api.put(`/tasks/submissions/${submission.submission_id}/review`, {
                status,
                feedback
            });
            onReviewComplete();
        } catch (error: any) {
            alert(error.message || 'Review failed');
            setProcessing(false); // Only unset if failed, otherwise modal closes
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-[#1e293b] p-8 rounded-2xl shadow-xl">
                    <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">Loading submission...</p>
                </div>
            </div>
        );
    }

    if (!submission) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 max-w-sm w-full text-center">
                    <p className="text-slate-500 mb-4">No submission found for this task.</p>
                    <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm">Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1e293b] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Review Submission</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">For task: "{taskTitle}"</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Submission Content */}
                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Submission Notes</h4>
                            <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap text-sm leading-relaxed">
                                {submission.content}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-4 text-right">
                                Submitted on {new Date(submission.submitted_at).toLocaleString()}
                            </p>
                        </div>

                        {submission.attachments && submission.attachments.length > 0 && (
                            <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-xl border border-slate-200 dark:border-white/10">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Attachments</h4>
                                <ul className="space-y-2">
                                    {submission.attachments.map((url, i) => (
                                        <li key={i}>
                                            <a
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 p-2 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-blue-400 transition-all group"
                                            >
                                                <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                                </div>
                                                <span className="text-sm text-slate-600 dark:text-slate-300 truncate flex-1 group-hover:text-blue-500 transition-colors">
                                                    Attachment {i + 1}
                                                </span>
                                                <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Review Actions */}
                    <div className="flex flex-col h-full bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <h4 className="font-bold text-slate-900 dark:text-white mb-4">Feedback & Decision</h4>

                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Add feedback for the assignee..."
                            className="flex-1 w-full p-3 mb-4 bg-white dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:ring-2 ring-blue-500/20 outline-none resize-none text-sm"
                        />

                        <div className="space-y-2 mt-auto">
                            <button
                                onClick={() => handleReview('approved')}
                                disabled={processing}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        Approve & Close Task
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => handleReview('rejected')}
                                disabled={processing}
                                className="w-full py-3 bg-white dark:bg-white/10 border border-red-200 dark:border-white/10 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                Reject & Request Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

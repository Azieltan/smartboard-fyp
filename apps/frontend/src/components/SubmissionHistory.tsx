'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function SubmissionHistory({ taskId }: { taskId: string }) {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const data = await api.get(`/tasks/${taskId}/submissions`);
                if (Array.isArray(data)) setSubmissions(data);
            } catch (error) {
                console.error("Failed to fetch submissions", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubmissions();
    }, [taskId]);

    if (loading) return <div className="text-xs text-slate-400">Loading history...</div>;
    if (submissions.length === 0) return null;

    return (
        <div className="mt-6 border-t border-slate-200 dark:border-white/10 pt-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Submission History</h4>
            <div className="space-y-3">
                {submissions.map((sub, idx) => (
                    <div key={sub.submission_id} className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-100 dark:border-white/5 text-sm">
                        <div className="flex justify-between items-start mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${sub.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                    sub.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                        'bg-amber-100 text-amber-700'
                                }`}>
                                {sub.status}
                            </span>
                            <span className="text-xs text-slate-400">{new Date(sub.submitted_at).toLocaleString()}</span>
                        </div>
                        {sub.feedback && (
                            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-black/20 p-2 rounded border border-slate-200 dark:border-white/5">
                                <span className="font-bold text-slate-400 mr-1">Feedback:</span>
                                {sub.feedback}
                            </div>
                        )}
                        {sub.content && (
                            <p className="mt-1 text-slate-500 line-clamp-2 italic opacity-80">"{sub.content}"</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

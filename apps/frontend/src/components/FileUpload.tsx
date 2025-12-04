'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for storage (using public anon key is fine for client-side if policies are set)
// Ideally this should come from env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Fallback or error if missing
const supabase = (supabaseUrl && supabaseKey)
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export default function FileUpload() {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        if (!supabase) {
            setMessage('Supabase client not configured');
            return;
        }

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        setUploading(true);
        setMessage('');

        try {
            const { error } = await supabase.storage
                .from('uploads')
                .upload(filePath, file);

            if (error) {
                throw error;
            }

            setMessage('Upload successful!');
        } catch (error: any) {
            setMessage(`Error: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-4">File Upload</h3>
            <div className="flex flex-col gap-2">
                <input
                    type="file"
                    onChange={handleUpload}
                    disabled={uploading}
                    className="text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 text-white hover:file:bg-blue-100"
                />
                {uploading && <p className="text-sm text-blue-400">Uploading...</p>}
                {message && <p className={`text-sm ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>{message}</p>}
            </div>
        </div>
    );
}

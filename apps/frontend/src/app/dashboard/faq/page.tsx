'use client';
import { useState, useMemo } from 'react';
import { FAQ_DATA } from '@/config/faq';

export default function Page() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_DATA;
    return FAQ_DATA.filter(item => item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-sm text-slate-500 mb-6">Find answers to common questions about SmartBoard.</p>

        <div className="mb-6">
          <input
            type="search"
            placeholder="Search questions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-3 rounded-lg border border-white/10 bg-white/5 focus:outline-none"
          />
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="p-4 bg-white/5 rounded-md text-slate-400">No results found.</div>
          )}

          {filtered.map((item) => (
            <details
              key={item.id}
              id={item.id}
              className="scroll-mt-24 bg-white/3 p-4 rounded-lg border border-white/5"
            >
              <summary className="cursor-pointer font-medium text-white">{item.q}</summary>
              <div className="mt-2 text-slate-300">{item.a}</div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';

const FAQS = [
    {
        question: "How to create a group?",
        answer: "Navigate to the Groups section in the right sidebar and click the '+' button to create a new group."
    },
    {
        question: "How to add friends?",
        answer: "Go to the Friends section and click the '+' button, then search for your friend by username or email."
    },
    {
        question: "Managing tasks?",
        answer: "You can create personal tasks from the calendar page or assign group tasks within a group's detail view."
    }
];

export default function FAQWidget() {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    return (
        <div className="glass-panel p-6 bg-[var(--card-bg)] border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[var(--text-primary)]">Frequently Asked Questions (FAQ)</h3>
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
            </div>

            <div className="space-y-3">
                {FAQS.map((faq, index) => (
                    <div
                        key={index}
                        className={`rounded-xl border transition-all duration-300 overflow-hidden ${expandedIndex === index
                            ? 'bg-indigo-500/10 border-indigo-500/30'
                            : 'bg-[var(--card-bg)] border-[var(--border-color)] hover:bg-[var(--border-color)]'
                            }`}
                    >
                        <button
                            onClick={() => toggleFAQ(index)}
                            className="w-full p-3 flex items-center justify-between text-left"
                        >
                            <span className={`text-sm font-medium transition-colors ${expandedIndex === index ? 'text-indigo-300' : 'text-[var(--text-primary)]'
                                }`}>
                                {faq.question}
                            </span>
                            <svg
                                className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${expandedIndex === index ? 'rotate-180 text-indigo-400' : ''
                                    }`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        <div
                            className={`grid transition-all duration-300 ease-in-out ${expandedIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                                }`}
                        >
                            <div className="overflow-hidden">
                                <div className="p-3 pt-0 text-xs text-slate-400 leading-relaxed border-t border-indigo-500/10">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10">
                <Link
                    href="/dashboard/faq"
                    className="flex justify-end items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider transition-colors"
                >
                    View All FAQs
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}

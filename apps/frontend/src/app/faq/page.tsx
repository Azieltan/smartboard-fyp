'use client';

import { FAQ_DATA } from '../../config/faq';
import Link from 'next/link';

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col items-center py-20 px-4 sm:px-6 lg:px-8 bg-[#0f172a] text-white">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Everything you need to know about SmartBoard. Can't find the answer you're looking for? Feel free to contact our support.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {FAQ_DATA.map((item) => (
            <div
              key={item.id}
              className="bg-white/5 border border-white/5 rounded-2xl overflow-hidden hover:bg-white/10 transition-colors duration-300"
            >
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer p-6 list-none [&::-webkit-details-marker]:hidden">
                  <span className="text-lg font-semibold text-slate-100 group-open:text-blue-400 transition-colors">
                    {item.q}
                  </span>
                  <span className="ml-6 flex-shrink-0 transition-transform duration-300 group-open:rotate-180">
                    <svg className="w-5 h-5 text-slate-500 group-open:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-slate-400 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                  {item.a}
                </div>
              </details>
            </div>
          ))}
        </div>

        {/* Footer/Contact */}
        <div className="mt-16 text-center pt-8 border-t border-white/10">
          <p className="text-slate-400 mb-6">
            Still have questions? We're here to help.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/"
              className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium transition-all"
            >
              Back to Home
            </Link>
            <Link
              href="/dashboard/chat"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-all shadow-lg shadow-blue-600/20"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFAQs() {
      try {
        const { data, error } = await supabase
          .from('faq')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching FAQs:', error);
        } else {
          setFaqs(data || []);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFAQs();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text">
          Frequently Asked Questions
        </h1>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid gap-6">
            {faqs.length === 0 ? (
              <p className="text-center text-slate-400">No questions found.</p>
            ) : (
              faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/80 transition-all duration-300 shadow-lg hover:shadow-blue-500/10"
                >
                  <h3 className="text-xl font-semibold mb-3 text-blue-300">
                    {faq.question}
                  </h3>
                  <p className="text-slate-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
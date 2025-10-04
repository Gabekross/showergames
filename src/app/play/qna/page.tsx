'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase client initialization using public env variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function QnAPage() {
  const [question, setQuestion] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Submitting...');

    const { error } = await supabase
      .from('displayQuestions')
      .insert({ content: question });

    if (error) {
      console.error(error);
      setStatus('❌ There was an error submitting your fun fact.');
    } else {
      setStatus('✅ Fun fact submitted successfully!');
      setQuestion('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffce8] px-4 py-12">
      <div className="w-full max-w-xl bg-white border border-green-200 rounded-lg shadow-xl p-6">
        <h2 className="text-xl font-bold text-green-800 mb-4 leading-snug text-center">
          Write one <span className="italic">"scandalous"</span> or fun fact about the celebrant —
          <br />
          <span className="text-sm text-green-700 font-medium">
            (Make it playful, mysterious, or silly... just for laughs!)
          </span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your fun fact here..."
            required
            className="w-full p-4 rounded-lg border border-green-300 bg-[#fffce8] text-green-900 placeholder-green-700 focus:outline-none focus:ring-2 focus:ring-green-400"
          />

          <button
            type="submit"
            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow transition duration-200"
          >
            Submit
          </button>
        </form>

        {status && (
          <p className="mt-4 text-center text-sm text-green-900 font-medium">
            {status}
          </p>
        )}
      </div>
    </div>
  );
}

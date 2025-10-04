'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Memory = {
  id: string;
  display_name: string | null;
  memory: string;
  love_from: string | null;
  created_at: string;
};

export default function GuessWhoWallPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [showFrom, setShowFrom] = useState(true);
  

  useEffect(() => {
    const loadMemories = async () => {
      

      const { data, error } = await supabase
        .from('guess_who_responses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        
        return;
      }

      console.log('✅ Supabase data received:', data);
     
      setMemories(data || []);
    };

    loadMemories();
  }, []);

return (
  <div style={{ backgroundColor: '#fffce8', padding: '2rem' }}>
    <h1 style={{ fontSize: '2rem', color: '#ff6347' }}>Guess Who Wall</h1>
    <p style={{ color: '#008080' }}>Live feed funny memories</p>

    <button
      style={{
        marginTop: '1rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#008080',
        color: '#fff',
        border: 'none',
        borderRadius: '5px'
      }}
      onClick={() => setShowFrom((prev) => !prev)}
    >
      {showFrom ? 'Hide Names' : 'Show Names'}
    </button>

    <div style={{ marginTop: '2rem' }}>
      {memories.length === 0 ? (
        <p>No memories found.</p>
      ) : (
        memories.map((entry) => (
          <div
            key={entry.id}
            style={{
              backgroundColor: '#fffbe6',
              border: '1px solid #ccc',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}
          >
            <p style={{ fontSize: '1rem', color: '#000', whiteSpace: 'pre-wrap' }}>
              “{entry.memory || 'No memory provided'}”
            </p>
            {showFrom && (
              <p
                style={{
                  fontSize: '0.9rem',
                  fontStyle: 'italic',
                  color: '#008080',
                  textAlign: 'right'
                }}
              >
                — {entry.love_from || 'Anonymous'}
              </p>
            )}
          </div>
        ))
      )}
    </div>
  </div>
);

}

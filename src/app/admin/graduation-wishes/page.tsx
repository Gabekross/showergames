'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import '@/styles/graduationWishes.scss';

type WishRow = {
  id: string;
  created_at: string;
  display_name: string | null;
  advice: string | null;
  love_from: string | null;
  event_key: string;
};

type QuestionRow = {
  id: string;
  category_id: string;
  session_id: string | null;
  text: string;
  question_order: number;
  created_at: string;
};

const CATEGORY_TITLE = 'Graduation Wishes';

export default function GraduationWishesAdmin() {
  const [activeTab, setActiveTab] = useState<'responses' | 'prompts'>('responses');

  // RESPONSES
  const [rows, setRows] = useState<WishRow[]>([]);
  const loadResponses = async () => {
    const { data, error } = await supabase
      .from('graduation_wish_responses')
      .select('*')
      .eq('event_key', 'default')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error.message);
      return;
    }
    setRows(data || []);
  };

  const deleteResponse = async (id: string) => {
    const { error } = await supabase
      .from('graduation_wish_responses')
      .delete()
      .eq('id', id);
    if (error) {
      alert(`Delete failed: ${error.message}`);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // PROMPTS
  const [catId, setCatId] = useState<string | null>(null);
  const [prompts, setPrompts] = useState<QuestionRow[]>([]);
  const [newPrompt, setNewPrompt] = useState('');

  const loadCategoryId = async () => {
    // Grab the category id by title
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .eq('title', CATEGORY_TITLE)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(error.message);
      return;
    }
    setCatId(data?.id ?? null);
  };

  const loadPrompts = async () => {
    if (!catId) return;
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('category_id', catId)
      .order('question_order', { ascending: true });

    if (error) {
      console.error(error.message);
      return;
    }
    setPrompts(data || []);
  };

  const nextOrder = useMemo(() => {
    if (!prompts.length) return 1;
    return Math.max(...prompts.map((p) => p.question_order)) + 1;
  }, [prompts]);

  const addPrompt = async () => {
    if (!catId) return;
    const text = newPrompt.trim();
    if (!text) return;

    const { data, error } = await supabase
      .from('questions')
      .insert({
        category_id: catId,
        session_id: null,
        text,
        question_order: nextOrder
      })
      .select('*')
      .single();

    if (error) {
      alert(`Add failed: ${error.message}`);
      return;
    }
    setPrompts((prev) => [...prev, data as QuestionRow].sort((a, b) => a.question_order - b.question_order));
    setNewPrompt('');
  };

  const deletePrompt = async (id: string) => {
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) {
      alert(`Delete failed: ${error.message}`);
      return;
    }
    setPrompts((prev) => prev.filter((p) => p.id !== id));
  };

  // Simple reorder: swap with neighbor and persist both rows’ question_order
  const movePrompt = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= prompts.length) return;

    const a = prompts[idx];
    const b = prompts[target];

    // swap orders locally first for snappy UI
    const updated = [...prompts];
    updated[idx] = { ...b, question_order: a.question_order };
    updated[target] = { ...a, question_order: b.question_order };
    setPrompts(updated);

    // persist both
    const { error } = await supabase.rpc('swap_question_orders', {
      a_id: a.id,
      a_order: a.question_order,
      b_id: b.id,
      b_order: b.question_order
    });

    if (error) {
      // revert on error
      setPrompts(prompts);
      alert(`Reorder failed: ${error.message}`);
    }
  };

  useEffect(() => {
    // RESPONSES live feed
    loadResponses();

    const channel = supabase
      .channel('gwishes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'graduation_wish_responses' },
        (payload) => {
          const r = payload.new as WishRow;
          if (r.event_key === 'default') setRows((prev) => [r, ...prev]);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // PROMPTS initial load
    (async () => {
      await loadCategoryId();
    })();
  }, []);

  useEffect(() => {
    // load prompts when category id is known, and refresh when tab switches to prompts
    if (activeTab === 'prompts' && catId) {
      loadPrompts();
    }
  }, [activeTab, catId]);

  return (
    <div style={{ maxWidth: 980, margin: '0 auto', padding: 16 }}>
      <h1>Graduation Wishes — Admin</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button
          onClick={() => setActiveTab('responses')}
          style={{ fontWeight: activeTab === 'responses' ? 700 : 400 }}
        >
          Responses
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          style={{ fontWeight: activeTab === 'prompts' ? 700 : 400 }}
        >
          Prompts
        </button>
      </div>

      {activeTab === 'responses' && (
        <>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
            <button onClick={loadResponses}>🔄 Refresh</button>
            <ExportPdfButton rows={rows} />
          </div>

          <ul className="admin-feed">
            {rows.map((r) => (
              <li key={r.id} className="admin-feed-item">
                <div><strong>Dear:</strong> {r.display_name || '—'}</div>
                <div><strong>Advice/Wishes:</strong> {r.advice || '—'}</div>
                <div><strong>From,</strong> {r.love_from || '—'}</div>
                <small>{new Date(r.created_at).toLocaleString()}</small>
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => deleteResponse(r.id)}>🗑️ Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {activeTab === 'prompts' && (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <input
              type="text"
              placeholder="New prompt text…"
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              style={{ flex: 1 }}
            />
            <button onClick={addPrompt} disabled={!newPrompt.trim() || !catId}>➕ Add</button>
          </div>

          <ul className="admin-feed">
            {prompts.map((p, i) => (
              <li key={p.id} className="admin-feed-item" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                <div>
                  <strong>Order {p.question_order}:</strong> {p.text}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => movePrompt(i, -1)} disabled={i === 0}>⬆️</button>
                  <button onClick={() => movePrompt(i, +1)} disabled={i === prompts.length - 1}>⬇️</button>
                  <button onClick={() => deletePrompt(p.id)}>🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Extracted so tree-shaking can keep the main component light */
function ExportPdfButton({ rows }: { rows: WishRow[] }) {
  const exportPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    let y = 64;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Graduation Wishes — Responses', 72, y); y += 22;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);

    rows.forEach((r, i) => {
      const block = [
        `Dear: ${r.display_name || '—'}`,
        `Advice & Well Wishes: ${r.advice || '—'}`,
        `From, ${r.love_from || '—'}`,
        `Date: ${new Date(r.created_at).toLocaleString()}`
      ].join('\n');

      const lines = doc.splitTextToSize(block, 468);
      if (y + lines.length * 14 > 760) { doc.addPage(); y = 64; }
      doc.text(lines, 72, y);
      y += lines.length * 14 + 16;
      if (i < rows.length - 1) {
        doc.setDrawColor(190);
        doc.line(72, y, 540, y); y += 12;
      }
    });

    doc.save('graduation-wishes.pdf');
  };

  return <button onClick={exportPDF}>⬇️ Export PDF</button>;
}

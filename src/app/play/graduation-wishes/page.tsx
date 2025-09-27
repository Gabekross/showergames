'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/graduationWishes.scss'

type Question = {
  id: string
  text: string
  question_order: number | null
}
type Category = { id: string; title: string; theme_color: string | null }

const CATEGORY_TITLE = 'Graduation Wishes'

// function GraduationSilhouette() {
//   return (
//     <svg
//       className="grad-silhouette-svg"
//       viewBox="0 0 400 400"
//       aria-hidden="true"
//       focusable="false"
//     >
//       {/* Mortarboard (pronounced cap) */}
//       <polygon points="200,40 60,90 200,140 340,90" />
//       {/* Cap band */}
//       <rect x="150" y="135" width="100" height="22" rx="6" />
//       {/* Tassel */}
//       <line x1="290" y1="95" x2="290" y2="165" strokeWidth="10" strokeLinecap="round" />
//       <circle cx="290" cy="170" r="8" />
//       {/* Head */}
//       <circle cx="200" cy="200" r="48" />
//       {/* Shoulders / torso (simple stylized) */}
//       <path d="
//         M100 320
//         C120 260, 280 260, 300 320
//         L300 360
//         L100 360
//         Z
//       " />
//     </svg>
//   );
// }


export default function GraduationWishesPage() {
  const [category, setCategory] = useState<Category | null>(null)
  const [items, setItems] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  // form
  const [displayName, setDisplayName] = useState('')
  const [advice, setAdvice] = useState('')
  const [loveFrom, setLoveFrom] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const { data: cat, error: catErr } = await supabase
        .from('categories')
        .select('id, title, theme_color')
        .eq('title', CATEGORY_TITLE)
        .limit(1)
        .single()

      if (catErr || !cat) {
        console.error('Category not found:', catErr?.message)
        setLoading(false)
        return
      }
      setCategory(cat)

      const { data: qs, error: qErr } = await supabase
        .from('questions')
        .select('id, text, question_order')
        .eq('category_id', cat.id)
        .order('question_order', { ascending: true })

      if (qErr) console.error('Error loading questions:', qErr.message)
      setItems(qs || [])
      setLoading(false)
    }
    load()
  }, [])

    useEffect(() => {
    if (!category?.id) return;

    // initial (re)load for this category
    const reload = async () => {
        const { data, error } = await supabase
        .from('questions')
        .select('id, text, question_order')
        .eq('category_id', category.id)
        .order('question_order', { ascending: true });

        if (error) {
        console.error('Error reloading questions:', error.message);
        return;
        }
        setItems((data || []).sort((a, b) => (a.question_order ?? 0) - (b.question_order ?? 0)));
    };

    reload();

    // realtime subscription for add/update/delete within this category
    const channel = supabase
        .channel('gwishes-prompts')
        .on(
        'postgres_changes',
        {
            event: '*', // INSERT | UPDATE | DELETE
            schema: 'public',
            table: 'questions',
            filter: `category_id=eq.${category.id}`,
        },
        (payload) => {
            if (payload.eventType === 'INSERT') {
            const row = payload.new as Question;
            setItems((prev) =>
                [...prev, row].sort((a, b) => (a.question_order ?? 0) - (b.question_order ?? 0))
            );
            } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as Question;
            setItems((prev) =>
                prev
                .map((p) => (p.id === row.id ? row : p))
                .sort((a, b) => (a.question_order ?? 0) - (b.question_order ?? 0))
            );
            } else if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as Question; // contains deleted row
            setItems((prev) => prev.filter((p) => p.id !== oldRow.id));
            }
        }
        )
        .subscribe();

    return () => {
        // cleanup must be sync; don't return a Promise
        void supabase.removeChannel(channel);
    };
    }, [category?.id]);


  const handleSubmit = async () => {
    if (!advice.trim() && !loveFrom.trim()) return
    setSaving(true)
    const { error } = await supabase.from('graduation_wish_responses').insert({
      display_name: displayName || null,
      advice: advice.trim() || null,
      love_from: loveFrom.trim() || null,
      event_key: 'default',
    })
    setSaving(false)
    if (error) {
      alert('Could not save response. Please try again.')
      return
    }
    setSubmitted(true)
    setAdvice('')
    setLoveFrom('')
  }

  return (
    <div className="grad-wish-container" >
      {/* <div className="watermark">Congrats!</div> */}

      <header className="grad-header">
        <h1 className="grad-title">Birthday Wishes</h1>
        <p className="grad-subtitle">Well Wishes for the Celebrant</p>
        {/* <p className="grad-subtitle">Advice &amp; Well Wishes for the Graduant</p> */}
      </header>
      {/* Decorative silhouette */}
        {/* <div className="grad-silhouette">
        <GraduationSilhouette />
        </div>

      {loading && <p className="loading">Loading…</p>} */}

      {!loading && category && (
        <>
          {/* <section className="wish-list">
            {items.map((q) => (
              <div key={q.id} className="wish-card">
                <span className="prompt">{q.text}</span>
                <span className="line"></span>
              </div>
            ))}
          </section> */}

          <section className="response-panel">
            <h2 className="panel-title">Leave Your Wishes</h2>

            <label className="field">
              <span>Dear (optional)</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Segun"
              />
            </label>

            <label className="field">
              <span>Well Wishes</span>
               {/* <span>Advice &amp; Well Wishes</span> */}
              <textarea
                value={advice}
                onChange={(e) => setAdvice(e.target.value)}
                rows={4}
                placeholder="Share your words of wisdom, wishes and encouragement…"
              />
            </label>

            <label className="field">
              <span>From,</span>
              <input
                type="text"
                value={loveFrom}
                onChange={(e) => setLoveFrom(e.target.value)}
                placeholder="Your Name"
              />
            </label>

            {!submitted ? (
              <button className="submit-btn" onClick={handleSubmit} disabled={saving}>
                {saving ? 'Submitting…' : 'Submit Wishes'}
              </button>
            ) : (
              <p className="thanks-note">Thank you! Your wishes have been recorded. 💛</p>
            )}
          </section>
        </>
      )}

      {!loading && !category && (
        <p className="empty">No “Graduation Wishes” category found.</p>
      )}
    </div>
  )
}

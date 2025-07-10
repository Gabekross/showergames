'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/index.scss'

// Type definitions
type Question = {
  id: string
  text: string
  question_order: number
}

type Category = {
  title: string
  theme_color: string
  type: string
}

type SessionWithCategory = {
  id: string
  category: Category | null
}

export default function PlayListPage() {
  const [category, setCategory] = useState<Category | null>(null)
  const [items, setItems] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadList = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          category:category_id (
            title,
            theme_color,
            type
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !data) {
        console.error('Error fetching session:', error?.message)
        setLoading(false)
        return
      }

      // ✅ Type assertion to fix category type error
      const session = data as unknown as SessionWithCategory

      if (!session.category || session.category.type !== 'list') {
        console.warn('No active list-mode session found.')
        setLoading(false)
        return
      }

      setCategory(session.category)

      const { data: questions, error: qError } = await supabase
        .from('questions')
        .select('id, text, question_order')
        .eq('session_id', session.id)
        .order('question_order', { ascending: true })

      if (qError) {
        console.error('Error loading questions:', qError.message)
      }

      setItems(questions || [])
      setLoading(false)
    }

    loadList()
  }, [])

  return (
    <div
      className="list-container"
      style={{ backgroundColor: category?.theme_color || '#f9fafb' }}
    >

        {Array.from({ length: 20 }).map((_, i) => (
  <div
    key={i}
    className="baby-bg-text"
    style={{
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
    }}
  >
    BABY
  </div>
))}

      {loading && <p>Loading...</p>}

      {!loading && category && (
        <>
          <h1 className="list-title">{category.title}</h1>
          {items.map((q) => (
            <div key={q.id} className="item">{q.text}</div>
          ))}
        </>
      )}

      {!loading && !category && <p>No active list-mode session found.</p>}
    </div>
  )
}

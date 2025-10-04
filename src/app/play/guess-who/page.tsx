'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/guessWho.scss' // Create this file for bright custom theme

export default function GuessWhoPage() {
  const [displayName, setDisplayName] = useState('')
  const [funnyMemory, setFunnyMemory] = useState('')
  const [loveFrom, setLoveFrom] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!funnyMemory.trim() && !loveFrom.trim()) return
    setSaving(true)

    const { error } = await supabase.from('guess_who_responses').insert({
      display_name: displayName || null,
      memory: funnyMemory.trim() || null,
      love_from: loveFrom.trim() || null,
      event_key: 'default',
    })

    setSaving(false)

    if (error) {
      alert('Could not save memory. Please try again.')
      return
    }

    setSubmitted(true)
    setFunnyMemory('')
    setLoveFrom('')
  }

  return (
    <div className="guess-who-container">
      <header className="guess-header">
        <h1 className="guess-title">Guess Who!</h1>
        <p className="guess-subtitle">
          Write one funny memory you have with the celebrant — make it hilarious, heartfelt, or anyhow 😄
        </p>
      </header>

      <section className="response-panel">
        <h2 className="panel-title">Share Your Memory</h2>

        <label className="field">
          <span>Dear (optional)</span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g., Femi"
          />
        </label>

        <label className="field">
          <span>Funny Memory</span>
          <textarea
            value={funnyMemory}
            onChange={(e) => setFunnyMemory(e.target.value)}
            rows={4}
            placeholder="That one time when they..."
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
            {saving ? 'Submitting…' : 'Submit Memory'}
          </button>
        ) : (
          <p className="thanks-note">🎉 Thanks! Your memory has been saved!</p>
        )}
      </section>
    </div>
    
  )
  
}

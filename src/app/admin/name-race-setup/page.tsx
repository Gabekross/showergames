'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/nameRaceAdmin.scss'

type Session = {
  id: string
  created_at: string
}

type Slot = {
  isFastest: boolean
  time_taken_seconds: string
  completed_at: string
  code: string
  assigned_letters: string[]
  time_taken_ms?: number
}

export default function NameRaceSetupPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState('')
  const [numPlayers, setNumPlayers] = useState(2)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [hasTimer, setHasTimer] = useState(true)
  const [duration, setDuration] = useState(60)

  useEffect(() => {
    const loadSessions = async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('id, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading sessions:', error.message)
        return
      }

      setSessions(data)
    }

    loadSessions()
  }, [])

  const handleCreateSession = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        category_id: null, // optional or dynamic in your setup
        is_active: true,
        type: 'name_race',
        duration_seconds: duration,
        has_timer: hasTimer,
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating session:', error.message)
      alert('Failed to create session')
      return
    }

    setSelectedSessionId(data.id)
    setSessions((prev) => [data, ...prev])
    alert('✅ Session created!')
  }

  const handleGenerate = async () => {
    if (!selectedSessionId || numPlayers < 1) return

    setLoading(true)

    const {
      data: { session },
    } = await supabase.auth.getSession()

    const res = await fetch('/api/admin/create-name-race', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({
        session_id: selectedSessionId,
        number_of_players: numPlayers,
      }),
    })

    const json = await res.json()
    setLoading(false)

    if (res.ok && json.slots) {
      setSlots(json.slots)
    } else {
      console.error('Error creating slots:', json.error)
      alert('Failed to generate slots. Check console.')
    }

      // ✅ Fetch results view immediately
    fetchResults()
  }

const fetchResults = async () => {
  if (!selectedSessionId) return

  const { data, error } = await supabase
    .from('name_race_slots')
    .select('code, assigned_letters, completed_at, time_taken_seconds')
    .eq('session_id', selectedSessionId)

  if (error) {
    console.error('Error loading results:', error.message)
    return
  }

  if (!data) return

  // Sort by time_taken_seconds
  const completed = data.filter((s) => s.time_taken_seconds != null)
  const minTime = Math.min(...completed.map((s) => s.time_taken_seconds))

  // Add isFastest flag
  const updated = data.map((slot) => ({
    ...slot,
    isFastest: slot.time_taken_seconds === minTime,
  }))

  setSlots(updated)
}

  return (
    <div className="name-race-admin">
      <h1>Name Race Setup</h1>

      <div className="form-section">
        <label htmlFor="duration">Timer Duration (seconds):</label>
        <input
          id="duration"
          type="number"
          min="10"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={hasTimer}
            onChange={(e) => setHasTimer(e.target.checked)}
          />
          Enable Countdown Timer
        </label>
      </div>

      <button onClick={handleCreateSession}>Create Session</button>

      <div className="form-section">
        <label htmlFor="session">Select Session:</label>
        <select
          id="session"
          value={selectedSessionId}
          onChange={(e) => setSelectedSessionId(e.target.value)}
        >
          <option value="">-- Choose --</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {new Date(s.created_at).toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      <div className="form-section">
        <label htmlFor="numPlayers">Number of Players:</label>
        <input
          id="numPlayers"
          type="number"
          min="1"
          max="26"
          value={numPlayers}
          onChange={(e) => setNumPlayers(Number(e.target.value))}
        />
      </div>

      <button onClick={handleGenerate} disabled={loading || !selectedSessionId}>
        {loading ? 'Generating...' : 'Generate Player Codes'}
      </button>

{slots.length > 0 && (
  <div className="results">
    <h3>Player Results</h3>
    <ul>
      <ul>
  {[...slots] // Clone array to avoid mutating original state
    .sort((a, b) => {
    const aSec = typeof a.time_taken_seconds === 'number' ? a.time_taken_seconds : Infinity
    const bSec = typeof b.time_taken_seconds === 'number' ? b.time_taken_seconds : Infinity

    if (aSec === bSec) {
      const aMs = typeof a.time_taken_ms === 'number' ? a.time_taken_ms : Infinity
      const bMs = typeof b.time_taken_ms === 'number' ? b.time_taken_ms : Infinity
      return aMs - bMs
    }

    return aSec - bSec
    })
    .map((slot) => (
      <li
        key={slot.code}
        className={slot.isFastest ? 'fastest' : ''}
        style={{
          background: slot.isFastest ? 'linear-gradient(to right, #fff7b3, #ffe066)' : undefined,
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '10px',
        }}
      >
        <div>
          <strong>Code:</strong> {slot.code} <br />
          <strong>Letters:</strong> {slot.assigned_letters.join(', ')}
        </div>
        <div>
          {slot.completed_at ? (
            <>
              ✅ <em>Finished</em><br />
              <strong>Time:</strong> {slot.time_taken_seconds || 'n/a'}s {slot.time_taken_ms ? `(${slot.time_taken_ms}ms)` : ''}{' '}
              {slot.isFastest && <strong>🥇 Fastest!</strong>}
            </>
          ) : (
            <span style={{ color: '#d32f2f' }}>⏳ Not finished</span>
          )}
        </div>
      </li>
    ))}
</ul>

    </ul>
  </div>
)}
<button onClick={fetchResults} style={{ marginTop: '1rem' }}>
  🔄 Refresh Results
</button>


    </div>
  )
}

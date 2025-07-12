'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import '@/styles/nameRace.scss'
import { RealtimeChannel } from '@supabase/supabase-js'

type Slot = {
  code: string
  assigned_letters: string[]
  completed_at?: string
  time_taken_seconds?: number
  time_taken_ms?: number
  is_active?: boolean
}

export default function NameRacePage() {
  const [role, setRole] = useState<'player' | 'viewer' | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [letters, setLetters] = useState<string[]>([])
  const [validCode, setValidCode] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [timer, setTimer] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [timeUp, setTimeUp] = useState(false)
  const [hasFinished, setHasFinished] = useState(false)

  // ⏳ Countdown before showing letters
  useEffect(() => {
    if (countdown === null) return
    if (countdown < 0) return

    if (countdown === 0) {
      setCountdown(null)
      setTimeLeft(timer)
      return
    }

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => (prev !== null ? prev - 1 : null))
    }, 1000)

    return () => clearInterval(countdownInterval)
  }, [countdown])

  // ⏱ Main game timer
  useEffect(() => {
    if (role === 'player' && validCode && countdown === null && timer) {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (!prev) return 0
          if (prev === 1) {
            clearInterval(interval)
            setTimeUp(true)
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [role, validCode, countdown, timer])

  const handleCodeSubmit = async () => {
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!session) return

    const { data: slot } = await supabase
      .from('name_race_slots')
      .select('code, assigned_letters')
      .eq('session_id', session.id)
      .eq('code', codeInput)
      .single()

    if (slot) {
      await supabase
        .from('name_race_slots')
        .update({ is_active: false })
        .eq('session_id', session.id)

      const { error: updateError } = await supabase
        .from('name_race_slots')
        .update({ is_active: true })
        .eq('session_id', session.id)
        .eq('code', codeInput)

      if (updateError) {
        alert('Could not activate your game slot.')
        return
      }

      setValidCode(true)
      setLetters(slot.assigned_letters)
      setTimer(15)
      setCountdown(5)
    } else {
      alert('Invalid code. Please check and try again.')
    }
  }

  const handleFinish = async () => {
    if (!codeInput) return
    setHasFinished(true)

    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!session) return

    await supabase
      .from('name_race_slots')
      .update({
        completed_at: new Date().toISOString(),
        time_taken_seconds: timer! - timeLeft!,
        time_taken_ms: (timer! - timeLeft!) * 1000 + (1000 - (Date.now() % 1000)),
      })
      .eq('session_id', session.id)
      .eq('code', codeInput)

    setTimeUp(true)
  }

  // Viewer mode auto-subscription
  useEffect(() => {
    if (role !== 'viewer') return
    let channel: RealtimeChannel

    const subscribeToActiveSlot = async () => {
      const { data: session } = await supabase
        .from('sessions')
        .select('id')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (!session) return

      const loadLetters = async () => {
        const { data: activeSlot } = await supabase
          .from('name_race_slots')
          .select('assigned_letters')
          .eq('session_id', session.id)
          .eq('is_active', true)
          .single()

        if (activeSlot) {
          setLetters(activeSlot.assigned_letters)
          setValidCode(true)
        } else {
          setLetters([])
          setValidCode(false)
        }
      }

      await loadLetters()

      channel = supabase
        .channel(`active-slot-${session.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'name_race_slots',
            filter: `session_id=eq.${session.id}`,
          },
          async (payload) => {
            const newData = payload.new as Slot
            if (newData.is_active) {
              setLetters(newData.assigned_letters)
            }
          }
        )
        .subscribe()
    }

    subscribeToActiveSlot()
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [role])

  return (
    <div className="name-race-container">
      <h1 className="title">Name Race</h1>

      {!role && (
        <div className="role-buttons">
          <button onClick={() => setRole('player')}>I&apos;m a Player</button>
          <button onClick={() => setRole('viewer')}>I&apos;m a Viewer</button>
        </div>
      )}

      {role === 'player' && !validCode && (
        <div>
          <input
            className="code-input"
            type="text"
            placeholder="4-digit code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            maxLength={4}
          />
          <br />
          <button onClick={handleCodeSubmit}>Enter Game</button>
        </div>
      )}

      {/* Countdown */}
   {countdown !== null && (
  <div className="countdown-overlay">
    <div className={`countdown-number countdown-${countdown}`}>
      {countdown === 0 ? 'Start!' : countdown}
    </div>
  </div>
)}


      {role === 'player' && validCode && countdown === null && (
        <>
          <p>
            <strong>Time Left:</strong>{' '}
            {timeUp ? "⏰ Time's Up!" : `${timeLeft}s`}
          </p>

          <div className="letter-grid">
            {letters.map((l, i) => (
              <div key={i} className={`letter-block ${timeUp ? 'fade-out' : ''}`}>{l}</div>
            ))}
          </div>

          {!timeUp && !hasFinished && (
            <button className="finish-button" onClick={handleFinish}>
              ✅ I&apos;m Done
            </button>
          )}
        </>
      )}

      {role === 'viewer' && validCode && (
        <>
          <p style={{ fontStyle: 'italic', opacity: 0.8 }}>You&apos;re watching the player</p>
          <div className="letter-grid">
            {letters.map((l, i) => (
              <div key={i} className="letter-block">{l}</div>
            ))}
          </div>
        </>
      )}

      {role === 'viewer' && !validCode && (
        <p style={{ fontStyle: 'italic', opacity: 0.5 }}>Waiting for player to start...</p>
      )}
    </div>
  )
}

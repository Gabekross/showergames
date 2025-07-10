import { NextRequest, NextResponse } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString()


export async function POST(req: NextRequest) {

    const res = NextResponse.next()

     const supabase = createMiddlewareClient({ req, res })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('👤 Authenticated user ID:', user?.id)

  const body = await req.json()
  const { session_id, number_of_players } = body

  console.log('📦 Payload received:', body)

  if (!session_id || !number_of_players) {
    return NextResponse.json({ error: 'Missing session_id or number_of_players' }, { status: 400 })
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  const shuffled = alphabet.sort(() => 0.5 - Math.random())
  const lettersPerPlayer = Math.floor(alphabet.length / number_of_players)

  const slotData = []

  for (let i = 0; i < number_of_players; i++) {
    const code = generateCode()
    const letters = shuffled.slice(i * lettersPerPlayer, (i + 1) * lettersPerPlayer)

    slotData.push({
      session_id,
      code,
      assigned_letters: letters,
    })
  }

  console.log('📤 Attempting insert:', slotData)

  const { data, error } = await supabase.from('name_race_slots').insert(slotData).select()

  if (error) {
    console.error('❌ Supabase insert error:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  console.log('✅ Inserted slots:', data)

  return NextResponse.json({ message: 'Slots created', slots: data })
}

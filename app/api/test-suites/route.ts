import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET all test suites
export async function GET() {
  const { data, error } = await supabase
    .from('test_suites')
    .select(`
      *,
      prompts (id, name),
      test_cases (id)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST create a new test suite
export async function POST(req: NextRequest) {
  try {
    const { prompt_id, name } = await req.json()

    if (!prompt_id || !name) {
      return NextResponse.json(
        { error: 'prompt_id and name are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('test_suites')
      .insert({ prompt_id, name })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    )
  }
}
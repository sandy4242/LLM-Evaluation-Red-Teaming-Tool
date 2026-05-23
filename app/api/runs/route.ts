import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET all runs with suite and prompt info
export async function GET() {
  const { data, error } = await supabase
    .from('runs')
    .select(`
      *,
      test_suites (id, name),
      prompt_versions (id, version_no)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
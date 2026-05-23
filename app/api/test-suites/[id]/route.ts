import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET a single test suite with all its test cases
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data: suite, error: suiteError } = await supabase
    .from('test_suites')
    .select(`
      *,
      prompts (id, name, system_prompt),
      test_cases (*)
    `)
    .eq('id', id)
    .single()

  if (suiteError || !suite) {
    return NextResponse.json({ error: 'Test suite not found' }, { status: 404 })
  }

  return NextResponse.json(suite)
}
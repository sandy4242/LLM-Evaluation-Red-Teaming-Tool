import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST create a new test case
export async function POST(req: NextRequest) {
  try {
    const { suite_id, input, expected_output, scoring_method, scoring_config } = await req.json()

    if (!suite_id || !input || !scoring_method) {
      return NextResponse.json(
        { error: 'suite_id, input and scoring_method are required' },
        { status: 400 }
      )
    }

    const { data: testCase, error } = await supabase
      .from('test_cases')
      .insert({
        suite_id,
        input,
        expected_output,
        scoring_method,
        scoring_config
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(testCase, { status: 201 })
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    )
  }
}

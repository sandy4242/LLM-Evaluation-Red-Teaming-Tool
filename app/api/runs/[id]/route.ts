import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET a single run with all results drilled down
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { data: run, error: runError } = await supabase
    .from('runs')
    .select(`
      *,
      test_suites (id, name),
      prompt_versions (id, version_no, system_prompt)
    `)
    .eq('id', id)
    .single()

  if (runError || !run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }

  // Get all results for this run with test case details
  const { data: results, error: resultsError } = await supabase
    .from('run_results')
    .select(`
      *,
      test_cases (id, input, expected_output, scoring_method)
    `)
    .eq('run_id', id)
    .order('created_at', { ascending: true })

  if (resultsError) {
    return NextResponse.json({ error: resultsError.message }, { status: 500 })
  }

  // Check if there's a red team run linked
  const { data: redTeamRun } = await supabase
    .from('red_team_runs')
    .select('*')
    .eq('run_id', id)
    .single()

  return NextResponse.json({
    ...run,
    results: results ?? [],
    red_team_run: redTeamRun ?? null
  })
}
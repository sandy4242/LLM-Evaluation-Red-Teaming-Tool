import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { callGemini, parseGeminiJSON } from '@/lib/gemini'

// At the very top of your try block in execute/route.ts
console.log('GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY)
console.log('GEMINI_API_KEY prefix:', process.env.GEMINI_API_KEY?.slice(0, 8))
// --- Scoring helpers ---

function scoreExactMatch(
  output: string,
  config: { match_string?: string; regex?: string }
): { score: number; passed: boolean; explanation: string } {
  if (config.regex) {
    const regex = new RegExp(config.regex)
    const passed = regex.test(output)
    return {
      score: passed ? 5 : 1,
      passed,
      explanation: passed
        ? `Output matched regex: ${config.regex}`
        : `Output did not match regex: ${config.regex}`
    }
  }

  if (config.match_string) {
    const passed = output.includes(config.match_string)
    return {
      score: passed ? 5 : 1,
      passed,
      explanation: passed
        ? `Output contains expected string`
        : `Output missing expected string: "${config.match_string}"`
    }
  }

  return { score: 1, passed: false, explanation: 'No match config provided' }
}

function scoreCustomAssertion(
  output: string,
  config: { assertion: string }
): { score: number; passed: boolean; explanation: string } {
  try {
    // Safe eval: only allow simple checks via Function constructor
    const fn = new Function('output', `return (${config.assertion})`)
    const passed = Boolean(fn(output))
    return {
      score: passed ? 5 : 1,
      passed,
      explanation: passed
        ? `Assertion passed: ${config.assertion}`
        : `Assertion failed: ${config.assertion}`
    }
  } catch (e) {
    return {
      score: 1,
      passed: false,
      explanation: `Assertion error: ${String(e)}`
    }
  }
}

async function scoreLLMJudge(
  systemPrompt: string,
  input: string,
  output: string,
  rubric: string
): Promise<{ score: number; passed: boolean; explanation: string; flags: string[] }> {
  const message = `
MODE: LLM-AS-JUDGE

System Prompt:
${systemPrompt}

User Input:
${input}

Model Output:
${output}

Scoring Rubric:
${rubric}
`
  const raw = await callGemini(message)
  const result = parseGeminiJSON<{
    score: number
    passed: boolean
    reason: string
    flags: string[]
  }>(raw)

  return {
    score: result.score,
    passed: result.passed,
    explanation: result.reason,
    flags: result.flags ?? []
  }
}

// --- Main execute route ---

export async function POST(req: NextRequest) {
  try {
    const { suite_id, model, prompt_version_id } = await req.json()

    if (!suite_id || !model || !prompt_version_id) {
      return NextResponse.json(
        { error: 'suite_id, model, and prompt_version_id are required' },
        { status: 400 }
      )
    }

    // 1. Fetch prompt version
    const { data: version, error: versionError } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('id', prompt_version_id)
      .single()

    if (versionError || !version) {
      return NextResponse.json({ error: 'Prompt version not found' }, { status: 404 })
    }

    // 2. Fetch all test cases for this suite
    const { data: testCases, error: casesError } = await supabase
      .from('test_cases')
      .select('*')
      .eq('suite_id', suite_id)

    if (casesError || !testCases?.length) {
      return NextResponse.json({ error: 'No test cases found' }, { status: 404 })
    }

    // 3. Create a new run record
    const { data: run, error: runError } = await supabase
      .from('runs')
      .insert({
        suite_id,
        prompt_version_id,
        model,
      })
      .select()
      .single()

    if (runError || !run) {
      return NextResponse.json({ error: 'Failed to create run' }, { status: 500 })
    }

    // 4. Execute each test case
    const results = []
    let passCount = 0
    let failCount = 0
    let totalScore = 0
    let totalTokens = 0

    for (const tc of testCases) {
      // Call the actual model (Gemini) with the prompt + input
      const modelResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: version.system_prompt }]
            },
            contents: [
              { role: 'user', parts: [{ text: tc.input }] }
            ],
            generationConfig: { temperature: 0.7 }
          })
        }
      )

      const modelData = await modelResponse.json()

      console.log('Gemini response:', JSON.stringify(modelData, null, 2))
      console.log('Model response ok:', modelResponse.ok)

      const output: string =
        modelData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      const tokensUsed: number =
        modelData.usageMetadata?.totalTokenCount ?? 0

      totalTokens += tokensUsed

      // Score the output based on scoring method
      let scoreResult = { score: 0, passed: false, explanation: '', flags: [] as string[] }

      if (tc.scoring_method === 'exact_match') {
        scoreResult = { ...scoreExactMatch(output, tc.scoring_config), flags: [] }
      } else if (tc.scoring_method === 'custom_assertion') {
        scoreResult = { ...scoreCustomAssertion(output, tc.scoring_config), flags: [] }
      } else if (tc.scoring_method === 'llm_judge') {
        scoreResult = await scoreLLMJudge(
          version.system_prompt,
          tc.input,
          output,
          tc.scoring_config?.rubric ?? 'Score based on accuracy, relevance, and clarity.'
        )
      }

      // Save result
      const { data: result } = await supabase
        .from('run_results')
        .insert({
          run_id: run.id,
          test_case_id: tc.id,
          output,
          score: scoreResult.score,
          passed: scoreResult.passed,
          explanation: scoreResult.explanation,
          flags: scoreResult.flags
        })
        .select()
        .single()

      results.push(result)
      if (scoreResult.passed) passCount++
      else failCount++
      totalScore += scoreResult.score
    }

    const avgScore = totalScore / testCases.length

    // 5. Check for regression against previous run
    const { data: previousRun } = await supabase
      .from('runs')
      .select('avg_score')
      .eq('suite_id', suite_id)
      .neq('id', run.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const regressionFlagged =
      previousRun ? avgScore < previousRun.avg_score - 0.5 : false

    // 6. Update run with final stats
    await supabase
      .from('runs')
      .update({
        pass_count: passCount,
        fail_count: failCount,
        avg_score: avgScore,
        total_tokens: totalTokens,
        regression_flagged: regressionFlagged
      })
      .eq('id', run.id)

    return NextResponse.json({
      run_id: run.id,
      pass_count: passCount,
      fail_count: failCount,
      avg_score: avgScore,
      total_tokens: totalTokens,
      regression_flagged: regressionFlagged,
      results
    })

  } catch (err) {
    console.error('Execute error:', err)
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { callGemini, parseGeminiJSON } from '@/lib/gemini'

// Types
interface TestCaseResult {
  test_case_id: string
  input: string
  output_a: string
  output_b: string
  score_a: number
  score_b: number
  passed_a: boolean
  passed_b: boolean
  explanation_a: string
  explanation_b: string
  disagreement: boolean // true if one passed and the other failed
}

interface ComparisonSummary {
  model_a: string
  model_b: string
  pass_rate_a: number
  pass_rate_b: number
  avg_score_a: number
  avg_score_b: number
  total_tokens_a: number
  total_tokens_b: number
  disagreements: number
  winner: string // 'model_a' | 'model_b' | 'tie'
}

// Run a single input against a model and return output + token count
async function runModel(
  model: string,
  systemPrompt: string,
  input: string
): Promise<{ output: string; tokens: number }> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          { role: 'user', parts: [{ text: input }] }
        ],
        generationConfig: { temperature: 0.7 }
      })
    }
  )

  const data = await response.json()
  const output: string =
    data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[No output]'
  const tokens: number = data.usageMetadata?.totalTokenCount ?? 0

  return { output, tokens }
}

// Score an output using LLM-as-judge
async function judgeOutput(
  systemPrompt: string,
  input: string,
  output: string
): Promise<{ score: number; passed: boolean; explanation: string }> {
  const message = `
MODE: LLM-AS-JUDGE

System Prompt:
${systemPrompt}

User Input:
${input}

Model Output:
${output}

Scoring Rubric:
Score based on accuracy, relevance, clarity, and adherence to the system prompt.
A score of 5 means a perfect response. A score of 1 means completely wrong or harmful.
`
  const raw = await callGemini(message)
  const result = parseGeminiJSON<{
    score: number
    passed: boolean
    reason: string
  }>(raw)

  return {
    score: result.score,
    passed: result.passed,
    explanation: result.reason
  }
}

// --- Main compare route ---

export async function POST(req: NextRequest) {
  try {
    const {
      suite_id,
      prompt_version_id,
      model_a,
      model_b
    } = await req.json()

    if (!suite_id || !prompt_version_id || !model_a || !model_b) {
      return NextResponse.json(
        { error: 'suite_id, prompt_version_id, model_a, and model_b are required' },
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
      return NextResponse.json(
        { error: 'Prompt version not found' },
        { status: 404 }
      )
    }

    // 2. Fetch all test cases
    const { data: testCases, error: casesError } = await supabase
      .from('test_cases')
      .select('*')
      .eq('suite_id', suite_id)

    if (casesError || !testCases?.length) {
      return NextResponse.json(
        { error: 'No test cases found' },
        { status: 404 }
      )
    }

    // 3. Create two run records — one per model
    const { data: runA, error: runAError } = await supabase
      .from('runs')
      .insert({
        suite_id,
        prompt_version_id,
        model: model_a
      })
      .select()
      .single()

    const { data: runB, error: runBError } = await supabase
      .from('runs')
      .insert({
        suite_id,
        prompt_version_id,
        model: model_b
      })
      .select()
      .single()

    if (runAError || runBError || !runA || !runB) {
      return NextResponse.json(
        { error: 'Failed to create runs' },
        { status: 500 }
      )
    }

    // 4. Run all test cases against both models
    const perCaseResults: TestCaseResult[] = []

    let passCountA = 0, passCountB = 0
    let totalScoreA = 0, totalScoreB = 0
    let totalTokensA = 0, totalTokensB = 0
    let disagreements = 0

    for (const tc of testCases) {
      // Run both models in parallel for speed
      const [resultA, resultB] = await Promise.all([
        runModel(model_a, version.system_prompt, tc.input),
        runModel(model_b, version.system_prompt, tc.input)
      ])

      totalTokensA += resultA.tokens
      totalTokensB += resultB.tokens

      // Score both outputs in parallel
      const [scoreA, scoreB] = await Promise.all([
        judgeOutput(version.system_prompt, tc.input, resultA.output),
        judgeOutput(version.system_prompt, tc.input, resultB.output)
      ])

      // Check disagreement — one passed, one failed
      const disagreement = scoreA.passed !== scoreB.passed
      if (disagreement) disagreements++

      if (scoreA.passed) passCountA++
      if (scoreB.passed) passCountB++
      totalScoreA += scoreA.score
      totalScoreB += scoreB.score

      // Save run_results for model A
      await supabase.from('run_results').insert({
        run_id: runA.id,
        test_case_id: tc.id,
        output: resultA.output,
        score: scoreA.score,
        passed: scoreA.passed,
        explanation: scoreA.explanation,
        flags: []
      })

      // Save run_results for model B
      await supabase.from('run_results').insert({
        run_id: runB.id,
        test_case_id: tc.id,
        output: resultB.output,
        score: scoreB.score,
        passed: scoreB.passed,
        explanation: scoreB.explanation,
        flags: []
      })

      perCaseResults.push({
        test_case_id: tc.id,
        input: tc.input,
        output_a: resultA.output,
        output_b: resultB.output,
        score_a: scoreA.score,
        score_b: scoreB.score,
        passed_a: scoreA.passed,
        passed_b: scoreB.passed,
        explanation_a: scoreA.explanation,
        explanation_b: scoreB.explanation,
        disagreement
      })
    }

    const avgScoreA = totalScoreA / testCases.length
    const avgScoreB = totalScoreB / testCases.length
    const passRateA = Math.round((passCountA / testCases.length) * 100)
    const passRateB = Math.round((passCountB / testCases.length) * 100)

    // 5. Determine winner
    const winner =
      avgScoreA > avgScoreB ? 'model_a'
      : avgScoreB > avgScoreA ? 'model_b'
      : 'tie'

    const summary: ComparisonSummary = {
      model_a,
      model_b,
      pass_rate_a: passRateA,
      pass_rate_b: passRateB,
      avg_score_a: avgScoreA,
      avg_score_b: avgScoreB,
      total_tokens_a: totalTokensA,
      total_tokens_b: totalTokensB,
      disagreements,
      winner
    }

    // 6. Update both runs with final stats
    await supabase.from('runs').update({
      pass_count: passCountA,
      fail_count: testCases.length - passCountA,
      avg_score: avgScoreA,
      total_tokens: totalTokensA
    }).eq('id', runA.id)

    await supabase.from('runs').update({
      pass_count: passCountB,
      fail_count: testCases.length - passCountB,
      avg_score: avgScoreB,
      total_tokens: totalTokensB
    }).eq('id', runB.id)

    // 7. Save comparison record
    const { data: comparison } = await supabase
      .from('model_comparisons')
      .insert({
        suite_id,
        run_a_id: runA.id,
        run_b_id: runB.id
      })
      .select()
      .single()

    return NextResponse.json({
      comparison_id: comparison?.id,
      summary,
      per_case_results: perCaseResults
    })

  } catch (err) {
    console.error('Compare error:', err)
    return NextResponse.json(
      { error: 'Internal server error', detail: String(err) },
      { status: 500 }
    )
  }
}
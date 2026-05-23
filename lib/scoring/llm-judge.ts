import { LLMJudgeConfig } from '@/types'
import { callGemini, parseGeminiJSON } from '@/lib/gemini'

interface ScoreResult {
  score: number
  passed: boolean
  explanation: string
  flags: string[]
}

interface JudgeResponse {
  score: number
  passed: boolean
  reason: string
  flags: string[]
}

export async function scoreLLMJudge(
  systemPrompt: string,
  input: string,
  output: string,
  config: LLMJudgeConfig
): Promise<ScoreResult> {
  if (!config.rubric) {
    return {
      score: 1,
      passed: false,
      explanation: 'No rubric provided in scoring config',
      flags: ['missing_config']
    }
  }

  const message = `
MODE: LLM-AS-JUDGE

System Prompt:
${systemPrompt}

User Input:
${input}

Model Output:
${output}

Scoring Rubric:
${config.rubric}
`

  try {
    const raw = await callGemini(message)
    const result = parseGeminiJSON<JudgeResponse>(raw)

    // Validate score is within range
    const score = Math.min(5, Math.max(1, Math.round(result.score)))
    const passed = score >= 3

    return {
      score,
      passed,
      explanation: result.reason ?? 'No explanation provided',
      flags: result.flags ?? []
    }
  } catch (e) {
    return {
      score: 1,
      passed: false,
      explanation: `LLM judge failed: ${String(e)}`,
      flags: ['judge_error']
    }
  }
}
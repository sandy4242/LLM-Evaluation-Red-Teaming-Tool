export interface Prompt {
  id: string
  name: string
  system_prompt: string
  variables: string[]
  created_at: string
}

export interface PromptVersion {
  id: string
  prompt_id: string
  version_no: number
  system_prompt: string
  created_at: string
}

export interface TestSuite {
  id: string
  prompt_id: string
  name: string
  created_at: string
}

export interface TestCase {
  id: string
  suite_id: string
  input: string
  expected_output: string
  scoring_method: 'exact_match' | 'llm_judge' | 'custom_assertion'
  scoring_config: ExactMatchConfig | LLMJudgeConfig | CustomAssertionConfig
  created_at: string
}

export interface ExactMatchConfig {
  match_string?: string
  regex?: string
}

export interface LLMJudgeConfig {
  rubric: string
}

export interface CustomAssertionConfig {
  assertion: string
}

export interface Run {
  id: string
  suite_id: string
  prompt_version_id: string
  model: string
  pass_count: number
  fail_count: number
  avg_score: number
  total_tokens: number
  regression_flagged: boolean
  created_at: string
}

export interface RunResult {
  id: string
  run_id: string
  test_case_id: string
  output: string
  score: number
  passed: boolean
  explanation: string
  flags: string[]
  created_at: string
}

export interface RedTeamRun {
  id: string
  run_id: string
  original_input: string
  variations: RedTeamVariationResult[]
  pass_rate: number
  summary: string
  created_at: string
}

export interface RedTeamVariationResult {
  type: string
  input: string
  intent: string
  output: string
  score: number
  passed: boolean
  explanation: string
  flags: string[]
}

export interface ModelComparison {
  id: string
  suite_id: string
  run_a_id: string
  run_b_id: string
  created_at: string
}

export interface ComparisonSummary {
  model_a: string
  model_b: string
  pass_rate_a: number
  pass_rate_b: number
  avg_score_a: number
  avg_score_b: number
  total_tokens_a: number
  total_tokens_b: number
  disagreements: number
  winner: 'model_a' | 'model_b' | 'tie'
}

export interface PerCaseComparisonResult {
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
  disagreement: boolean
}
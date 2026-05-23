import { ExactMatchConfig } from '@/types'

interface ScoreResult {
  score: number
  passed: boolean
  explanation: string
  flags: string[]
}

export function scoreExactMatch(
  output: string,
  config: ExactMatchConfig
): ScoreResult {
  // Regex match
  if (config.regex) {
    try {
      const regex = new RegExp(config.regex)
      const passed = regex.test(output)
      return {
        score: passed ? 5 : 1,
        passed,
        explanation: passed
          ? `Output matched regex: ${config.regex}`
          : `Output did not match regex: ${config.regex}`,
        flags: []
      }
    } catch (e) {
      return {
        score: 1,
        passed: false,
        explanation: `Invalid regex pattern: ${config.regex}`,
        flags: ['invalid_regex']
      }
    }
  }

  // Exact string match
  if (config.match_string) {
    const passed = output
      .toLowerCase()
      .includes(config.match_string.toLowerCase())
    return {
      score: passed ? 5 : 1,
      passed,
      explanation: passed
        ? `Output contains expected string: "${config.match_string}"`
        : `Output missing expected string: "${config.match_string}"`,
      flags: []
    }
  }

  return {
    score: 1,
    passed: false,
    explanation: 'No match_string or regex provided in scoring config',
    flags: ['missing_config']
  }
}
import { CustomAssertionConfig } from '@/types'

interface ScoreResult {
  score: number
  passed: boolean
  explanation: string
  flags: string[]
}

// Built-in assertion helpers available inside assertion strings
const builtInHelpers = {
  isValidJSON: (output: string): boolean => {
    try {
      JSON.parse(output)
      return true
    } catch {
      return false
    }
  },
  wordCount: (output: string): number => {
    return output.trim().split(/\s+/).filter(Boolean).length
  },
  charCount: (output: string): number => {
    return output.length
  },
  containsURL: (output: string): boolean => {
    return /https?:\/\/[^\s]+/.test(output)
  },
  isAllCaps: (output: string): boolean => {
    return output === output.toUpperCase()
  },
  startsWithUppercase: (output: string): boolean => {
    return /^[A-Z]/.test(output.trim())
  }
}

export function scoreCustomAssertion(
  output: string,
  config: CustomAssertionConfig
): ScoreResult {
  if (!config.assertion) {
    return {
      score: 1,
      passed: false,
      explanation: 'No assertion provided in scoring config',
      flags: ['missing_config']
    }
  }

  try {
    // Inject output + helpers into the assertion function
    const fn = new Function(
      'output',
      'isValidJSON',
      'wordCount',
      'charCount',
      'containsURL',
      'isAllCaps',
      'startsWithUppercase',
      `return (${config.assertion})`
    )

    const passed = Boolean(
      fn(
        output,
        builtInHelpers.isValidJSON,
        builtInHelpers.wordCount,
        builtInHelpers.charCount,
        builtInHelpers.containsURL,
        builtInHelpers.isAllCaps,
        builtInHelpers.startsWithUppercase
      )
    )

    return {
      score: passed ? 5 : 1,
      passed,
      explanation: passed
        ? `Assertion passed: ${config.assertion}`
        : `Assertion failed: ${config.assertion}`,
      flags: []
    }
  } catch (e) {
    return {
      score: 1,
      passed: false,
      explanation: `Assertion threw an error: ${String(e)}`,
      flags: ['assertion_error']
    }
  }
}
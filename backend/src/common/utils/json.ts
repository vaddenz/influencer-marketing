import { Logger } from '@nestjs/common'
import { ErrorUtil } from './error'

/**
 * Utility class for safe JSON handling
 */
export class JSONUtil {
  /**
   * Parse JSON string and return object if valid, otherwise return null or default value.
   * Catches exceptions to prevent crashes.
   *
   * @param str - JSON string to parse
   * @param options - Options for parsing
   * @param options.preprocess - Whether to try and extract JSON from markdown/text (default: false)
   * @param options.default - Default value to return on failure
   * @returns Parsed object, null, or default value
   */
  static parseOrNull<T>(
    str: string,
    options: { preprocess?: boolean; default?: T } = {}
  ): T | null {
    try {
      if (options.preprocess) {
        str = JSONUtil.preprocess(str)
      }
      return JSON.parse(str)
    } catch (e) {
      Logger.error(
        `[JSONUtil.parseOrNull] Found invalid JSON string: ${str}`,
        ErrorUtil.message(e)
      )
      return options.default || null
    }
  }

  /**
   * Parse JSON string and return object.
   * This is a wrapper around JSON.parse for consistency.
   *
   * @param str - JSON string to parse
   * @throws SyntaxError if string is not valid JSON
   * @returns Parsed object
   */
  static parse<T>(str: string): T {
    return JSON.parse(str)
  }

  /**
   * Stringify object to JSON string.
   * This is a wrapper around JSON.stringify for consistency.
   *
   * @param obj - Object to stringify
   * @returns JSON string
   */
  static stringify<T>(obj: T): string {
    return JSON.stringify(obj)
  }

  /**
   * Check if a string is valid JSON
   * @param str - String to check
   * @returns true if valid JSON, false otherwise
   */
  static isValid(str: string): boolean {
    try {
      JSON.parse(str)
      return true
    } catch (e) {
      return false
    }
  }

  /**
   * Preprocess a string to extract valid JSON if present.
   * Useful for extracting JSON from Markdown code blocks or mixed content (e.g., LLM responses).
   *
   * @param str - Raw string
   * @returns String containing only the JSON part
   */
  static preprocess(str: string): string {
    str = str.trim()
    // 1. Remove markdown code blocks if present
    const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i
    const match = str.match(codeBlockRegex)
    if (match) {
      str = match[1]
    }

    // 2. Find first { or [
    const firstOpenBrace = str.indexOf('{')
    const firstOpenBracket = str.indexOf('[')

    if (firstOpenBrace === -1 && firstOpenBracket === -1) {
      return str
    }

    if (
      firstOpenBrace !== -1 &&
      (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)
    ) {
      // Starts with {
      const lastCloseBrace = str.lastIndexOf('}')
      if (lastCloseBrace > firstOpenBrace) {
        return str.substring(firstOpenBrace, lastCloseBrace + 1)
      }
    } else {
      // Starts with [
      const lastCloseBracket = str.lastIndexOf(']')
      if (lastCloseBracket > firstOpenBracket) {
        return str.substring(firstOpenBracket, lastCloseBracket + 1)
      }
    }

    return str
  }
}

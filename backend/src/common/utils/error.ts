/**
 * Utility class for handling and formatting errors
 */
export class ErrorUtil {
  /**
   * Extract a readable message from any error object
   * @param error - The error object (Error, string, or object)
   * @returns Formatted error message with simplified stack trace if available
   */
  public static message(error: any): string {
    if (!error) {
      return ''
    }
    if (error instanceof Error) {
      // Get first 5 lines of stack trace (error message + 2 stack frames)
      const stack = (error.stack?.split('\n') || [])
        .slice(0, 5)
        .map((item) => item.trim())
        .join(' >> ')
      return `${error.message} [stack: ${stack}]`
    }
    if (error && typeof error === 'string') {
      return error
    }
    if (error && typeof error === 'object') {
      return JSON.stringify(error)
    }
    return String(error)
  }

  /**
   * Extract the error name/type
   * @param error - The error object
   * @returns Error name or string representation
   */
  public static name(error: any): string {
    if (error instanceof Error) {
      return error.name
    }
    if (error && typeof error === 'object') {
      return error.name
    }
    return String(error)
  }

  /**
   * Extract the error code if available
   * @param error - The error object
   * @returns Error code or string representation
   */
  public static code(error: any): string {
    if (error && typeof error === 'object') {
      return error.code
    }
    return String(error)
  }
}

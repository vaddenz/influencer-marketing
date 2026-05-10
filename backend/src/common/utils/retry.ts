/**
 * Utility class for retrying operations
 */
export class RetryUtil {
  /**
   * Static retry method to wrap function calls with retry logic.
   * Uses exponential backoff strategy by default.
   *
   * @param fn - The function to retry (must return a Promise)
   * @param maxAttempts - Maximum number of attempts (default: 3)
   * @param delayMs - Base delay between retries in milliseconds (default: 100)
   * @param backoffMultiplier - Exponential backoff multiplier (default: 2)
   * @param shouldRetry - Optional predicate to determine if error should be retried. If returns false, retry loop stops.
   * @returns Promise<T> - The result of the successful function call
   * @throws The last error encountered if all retries fail
   */
  static async retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 100,
    backoffMultiplier: number = 2,
    shouldRetry?: (error: Error) => boolean
  ): Promise<T> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // 1. Execute the function
        return await fn()
      } catch (error) {
        // 2. Handle error and determine retry behavior
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        lastError = error instanceof Error ? error : new Error(errorMessage)

        // 3. Check if this is the last attempt
        if (attempt === maxAttempts) {
          break
        }

        // 4. Check if error should be retried (if predicate provided)
        if (shouldRetry && !shouldRetry(lastError)) {
          throw lastError
        }

        // 5. Calculate exponential backoff delay
        const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1)

        // 6. Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    // 7. All attempts failed, throw the last error
    throw lastError || new Error('Unexpected error in retry operation')
  }

  /**
   * Static retry method with fixed delay (no exponential backoff)
   * @param fn - The function to retry (must return a Promise)
   * @param maxAttempts - Maximum number of attempts (default: 3)
   * @param delayMs - Fixed delay between retries in milliseconds (default: 100)
   * @param shouldRetry - Optional predicate to determine if error should be retried
   * @returns Promise<T> - The result of the successful function call
   */
  static async retryWithFixedDelay<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 100,
    shouldRetry?: (error: Error) => boolean
  ): Promise<T> {
    return this.retry(fn, maxAttempts, delayMs, 1, shouldRetry)
  }

  /**
   * Static retry method for network-related errors only
   * @param fn - The function to retry (must return a Promise)
   * @param maxAttempts - Maximum number of attempts (default: 3)
   * @param delayMs - Base delay between retries in milliseconds (default: 100)
   * @returns Promise<T> - The result of the successful function call
   */
  static async retryNetworkErrors<T>(
    fn: () => Promise<T>,
    maxAttempts: number = 3,
    delayMs: number = 100
  ): Promise<T> {
    return this.retry(fn, maxAttempts, delayMs, 2, (error) => {
      // Retry for network-related errors
      const networkErrorMessages = [
        'network',
        'timeout',
        'connection',
        'ENOTFOUND',
        'ECONNREFUSED',
        'ETIMEDOUT',
        'fetch failed',
      ]

      return networkErrorMessages.some((msg) =>
        error.message.toLowerCase().includes(msg.toLowerCase())
      )
    })
  }
}

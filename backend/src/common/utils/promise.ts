/**
 * Utility class for Promise operations
 */
export class PromiseUtil {
  /**
   * Execute all promises with limited concurrency.
   * Useful for processing large arrays of items without overwhelming resources.
   *
   * @param items - Array of items to process
   * @param executor - Function to execute for each item
   * @param concurrency - Maximum number of concurrent executions
   * @returns Array of results in the same order as input items
   */
  public static async all<T, U>(
    items: T[],
    executor: (item: T, index: number) => Promise<U>,
    concurrency: number
  ): Promise<U[]> {
    const results: U[] = new Array(items.length)
    let index = 0

    const worker = async (): Promise<void> => {
      while (index < items.length) {
        const currentIndex = index++
        const item = items[currentIndex]
        if (item !== undefined) {
          results[currentIndex] = await executor(item, currentIndex)
        }
      }
    }

    const workers = Array(Math.min(concurrency, items.length))
      .fill(null)
      .map(() => worker())

    await Promise.all(workers)
    return results
  }
}

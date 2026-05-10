/**
 * Safely access nested object properties using a string path.
 * Similar to Lodash's `get` function but with depth protection.
 *
 * @param obj - The object to access
 * @param path - The path string (e.g., "user.profile.name" or "items[0].id")
 * @param defaultValue - Value to return if property is undefined (default: undefined)
 * @param maxDepth - Maximum recursion depth to prevent infinite loops or stack overflow (default: 5)
 * @throws Error if max depth is exceeded
 * @returns The value at the path or the default value
 */
export function safeAccess(
  obj: any,
  path: string,
  defaultValue: any = undefined,
  maxDepth: number = 5
): any {
  if (!obj || typeof obj !== 'object') return defaultValue

  // Convert path string to path array
  const pathArray = path
    .replace(/\[(\w+)\]/g, '.$1') // Handle array indices
    .replace(/^\./, '') // Remove leading dots
    .split('.')

  // Recursively access properties
  let current = obj
  let depth = 0
  for (const segment of pathArray) {
    if (current === null || current === undefined) return defaultValue
    if (typeof current !== 'object') return defaultValue

    // Try to access the property
    current = current[segment]

    // If current value is undefined, return default value
    if (current === undefined) return defaultValue

    // Depth check
    depth++
    if (depth > maxDepth) {
      throw new Error(
        `Max depth reached while calling safeAccess, path array: ${JSON.stringify(pathArray)}`
      )
    }
  }

  return current === undefined ? defaultValue : current
}

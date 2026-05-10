import { getApiUrl } from './config'
import type { Category, ApiResponse } from './types'

export async function fetchCategories(): Promise<Category[]> {
  try {
    const response = await fetch(getApiUrl('/categories'))

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ApiResponse<Category[]> = await response.json()

    if (!result.success) {
      const message =
        typeof result.error === 'string'
          ? result.error
          : result.error?.message || 'Failed to fetch categories'
      throw new Error(message)
    }

    return result.data
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw error
  }
}

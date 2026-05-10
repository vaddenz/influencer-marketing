import { getApiUrl } from './config'
import { getAccessToken, clearTokens } from './auth'
import type { Category, ApiResponse } from './types'

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessToken()
  const response = await fetch(getApiUrl(path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 401) {
    clearTokens()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  const result = await response.json()

  // Unwrap TransformInterceptor envelope
  if (!result.success) {
    throw new Error(
      typeof result.error === 'string'
        ? result.error
        : result.error?.message || 'API error'
    )
  }

  return result.data as T
}

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

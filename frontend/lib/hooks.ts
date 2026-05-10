import { useState, useEffect } from 'react'
import { fetchCategories } from './api'
import type { Category } from './types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchCategories()
        setCategories(data)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load categories'
        )
        console.error('Failed to load categories:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadCategories()
  }, [])

  return { categories, isLoading, error }
}

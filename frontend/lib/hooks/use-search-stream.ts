'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAccessToken } from '@/lib/auth'
import { getApiUrl } from '@/lib/config'

export interface SearchFilters {
  q?: string
  niche?: string
  location?: string
  followersMin?: string
  followersMax?: string
  scope?: string
}

export interface StreamedResult {
  id?: string
  userId?: string
  displayName?: string
  handle?: string
  bio?: string
  niche?: string
  followerCount?: number
  engagementRate?: number
  platforms?: Record<string, string>
  locationCountry?: string
  locationRegion?: string
  profileImageUrl?: string
  sourceName?: string
  sourceUrl?: string
  fans?: number
  isExternal: boolean
}

export function useSearchStream(filters: SearchFilters) {
  const [results, setResults] = useState<StreamedResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearchingExternal, setIsSearchingExternal] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const disconnect = useCallback(() => {
    setIsLoading(false)
    setIsSearchingExternal(false)
  }, [])

  useEffect(() => {
    setResults([])
    setIsLoading(true)
    setIsSearchingExternal(false)
    setWarning(null)
    setError(null)

    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v)
    })

    const token = getAccessToken()
    if (!token) {
      setError('Not authenticated')
      setIsLoading(false)
      return
    }

    params.append('token', token)

    const url = `${getApiUrl('/influencers/search-stream')}?${params.toString()}`
    const es = new EventSource(url)

    es.addEventListener('internal', (e) => {
      try {
        const profiles = JSON.parse(e.data) as StreamedResult[]
        setResults(profiles.map((p) => ({ ...p, isExternal: false })))
        setIsLoading(false)
        setIsSearchingExternal(true)
      } catch {
        setIsLoading(false)
      }
    })

    es.addEventListener('external', (e) => {
      try {
        const profile = JSON.parse(e.data) as StreamedResult
        setResults((prev) => [...prev, { ...profile, isExternal: true }])
      } catch {
        // ignore malformed event
      }
    })

    es.addEventListener('warning', (e) => {
      try {
        const { message } = JSON.parse(e.data)
        setWarning(message)
      } catch {
        // ignore
      }
    })

    es.addEventListener('done', () => {
      setIsSearchingExternal(false)
      es.close()
    })

    es.addEventListener('error', () => {
      setError('Connection error')
      setIsLoading(false)
      setIsSearchingExternal(false)
      es.close()
    })

    return () => {
      es.close()
    }
  }, [filters.q, filters.niche, filters.location, filters.followersMin, filters.followersMax, filters.scope])

  return { results, isLoading, isSearchingExternal, warning, error }
}

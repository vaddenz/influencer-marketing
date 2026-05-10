'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'
import type { User, AuthTokens } from '@/lib/types'
import { getApiUrl } from '@/lib/config'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isBrand: boolean
  isInfluencer: boolean
  login: (tokens: AuthTokens, rememberMe?: boolean) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize auth state from storage
    const initAuth = async () => {
      const currentUser = await fetchCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (tokens: AuthTokens, rememberMe = true) => {
    setTokens(tokens, rememberMe)
    const currentUser = await fetchCurrentUser()
    if (currentUser) {
      setUser(currentUser)
    }
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
    }
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isBrand: user?.role === 'brand',
        isInfluencer: user?.role === 'influencer',
        login,
        logout,
        loading,
      }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Token management
export function getTokens(): AuthTokens | null {
  if (typeof window === 'undefined') return null
  // Check sessionStorage first (non-remembered sessions), then localStorage
  let accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY)
  let refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY)
  if (!accessToken || !refreshToken) {
    accessToken = localStorage.getItem(ACCESS_TOKEN_KEY)
    refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY)
  }
  if (!accessToken || !refreshToken) return null
  return { accessToken, refreshToken }
}

export function setTokens(tokens: AuthTokens, rememberMe = true): void {
  if (typeof window === 'undefined') return
  const storage = rememberMe ? localStorage : sessionStorage
  storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken)
  storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    sessionStorage.getItem(ACCESS_TOKEN_KEY) ||
    localStorage.getItem(ACCESS_TOKEN_KEY)
  )
}

// Fetch current user info
export async function fetchCurrentUser(): Promise<User | null> {
  const token = getAccessToken()
  if (!token) return null

  try {
    const response = await fetch(getApiUrl('auth/me'), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          return fetchCurrentUser()
        }
      }
      return null
    }

    const result = await response.json()
    return result.data || null
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return null
  }
}

// Refresh access token
export async function refreshAccessToken(): Promise<boolean> {
  const tokens = getTokens()
  if (!tokens) return false

  try {
    const response = await fetch(getApiUrl('auth/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    })

    if (!response.ok) {
      clearTokens()
      return false
    }

    const result = await response.json()
    if (result.data) {
      setTokens({
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
      })
      return true
    }
    return false
  } catch (error) {
    console.error('Failed to refresh token:', error)
    clearTokens()
    return false
  }
}

'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { useTranslations } from 'next-intl'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const t = useTranslations('Auth')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')

      if (!accessToken || !refreshToken) {
        setError(t('error.missingTokens'))
        setLoading(false)
        return
      }

      try {
        await login({ accessToken, refreshToken })

        // Redirect to home or original page
        const redirectTo = sessionStorage.getItem('auth_redirect') || '/'
        sessionStorage.removeItem('auth_redirect')
        router.push(redirectTo)
      } catch (err) {
        console.error('OAuth callback error:', err)
        setError(t('error.default'))
        setLoading(false)
      }
    }

    handleCallback()
  }, [searchParams, login, router, t])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--c-bg-secondary)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--c-accent)] mx-auto mb-4"></div>
          <p className="text-[var(--c-text-secondary)]">
            {t('callback.completing')}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--c-bg-secondary)]">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-xl p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[var(--c-text)] mb-2">
              {t('error.failed')}
            </h1>
            <p className="text-[var(--c-text-secondary)] mb-6">{error}</p>
            <Link href="/" className="btn-primary inline-flex">
              {t('error.backHome')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export default function AuthCallbackPage() {
  const t = useTranslations('Common')
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--c-bg-secondary)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--c-accent)] mx-auto mb-4"></div>
            <p className="text-[var(--c-text-secondary)]">{t('loading')}</p>
          </div>
        </div>
      }>
      <AuthCallbackContent />
    </Suspense>
  )
}

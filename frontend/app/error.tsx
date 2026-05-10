'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations('Common.error')

  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--c-bg-secondary)]">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          {/* Error Icon */}
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1
            className="text-2xl font-bold text-[var(--c-text)] mb-2"
            style={{ fontFamily: 'var(--font-heading)' }}>
            {t('title')}
          </h1>
          <p className="text-[var(--c-text-secondary)] mb-6">{t('message')}</p>

          {error.message && (
            <div className="mb-6 p-4 bg-[var(--c-bg-secondary)] rounded-lg text-left">
              <p className="text-xs text-[var(--c-text-muted)] font-mono break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={reset} className="btn-primary">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {t('retry')}
            </button>
            <Link href="/" className="btn-secondary">
              {t('backHome')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

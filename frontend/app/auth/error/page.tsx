'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const t = useTranslations('Auth.error')
  const [provider, setProvider] = useState('')
  const [error, setError] = useState(t('default'))

  useEffect(() => {
    const providerParam = searchParams.get('provider') || ''
    const errorMsg = searchParams.get('message')

    const id = requestAnimationFrame(() => {
      setProvider(providerParam)
      if (errorMsg) {
        setError(decodeURIComponent(errorMsg))
      }
    })
    return () => cancelAnimationFrame(id)
  }, [searchParams])

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
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[var(--c-text)] mb-2">
            {t('failed')}
          </h1>
          {provider && (
            <p className="text-sm text-[var(--c-text-secondary)] mb-2">
              {t('providerError', { provider })}
            </p>
          )}
          <p className="text-[var(--c-text-secondary)] mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <Link href="/" className="btn-primary">
              {t('backHome')}
            </Link>
            <Link href="/templates" className="btn-secondary">
              {t('browseTemplates')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  const t = useTranslations('Common')
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--c-bg-secondary)]">
          <div className="text-[var(--c-text-secondary)]">{t('loading')}</div>
        </div>
      }>
      <AuthErrorContent />
    </Suspense>
  )
}

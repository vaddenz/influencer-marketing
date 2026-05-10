import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function NotFoundPage() {
  const t = useTranslations('Common.notFound')

  return (
    <main className="min-h-screen flex items-center justify-center bg-[var(--c-bg-secondary)]">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          {/* 404 Icon */}
          <div className="w-20 h-20 bg-[var(--c-accent-light)] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-[var(--c-accent)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1
            className="text-6xl font-bold text-[var(--c-text)] mb-2"
            style={{ fontFamily: 'var(--font-heading)' }}>
            404
          </h1>
          <h2 className="text-xl font-semibold text-[var(--c-text)] mb-4">
            {t('title')}
          </h2>
          <p className="text-[var(--c-text-secondary)] mb-8">{t('message')}</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-primary">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              {t('backHome')}
            </Link>
            <Link href="/templates" className="btn-secondary">
              {t('browseTemplates')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

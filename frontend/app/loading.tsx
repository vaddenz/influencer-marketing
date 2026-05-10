import { useTranslations } from 'next-intl'

export default function LoadingPage() {
  const t = useTranslations('Common')

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--c-bg-secondary)]">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-[var(--c-accent-light)] rounded-full"></div>
          <div className="absolute inset-0 border-4 border-[var(--c-accent)] rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-[var(--c-text-secondary)]">{t('loading')}</p>
      </div>
    </div>
  )
}

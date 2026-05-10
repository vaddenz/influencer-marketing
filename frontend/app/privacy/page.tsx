import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Privacy')
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_ADVERTISED_HOST}/privacy`,
    },
  }
}

export default async function PrivacyPage() {
  const t = await getTranslations('Privacy')

  return (
    <main className="pt-24 pb-20 min-h-screen bg-white">
      <div className="max-w-[800px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--c-text)] mb-3 sm:mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}>
            {t('header')}
          </h1>
          <p className="text-sm sm:text-base text-[var(--c-text-secondary)]">
            {t('lastUpdated')}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-base sm:prose-lg max-w-none">
          <section className="mb-8 sm:mb-10">
            <h2
              className="text-xl sm:text-2xl font-semibold text-[var(--c-text)] mb-3 sm:mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('overview')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--c-text-secondary)] leading-relaxed mb-4">
              {t('overviewDesc')}
            </p>
          </section>

          <section className="mb-8 sm:mb-10">
            <h2
              className="text-xl sm:text-2xl font-semibold text-[var(--c-text)] mb-3 sm:mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('collect')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--c-text-secondary)] leading-relaxed mb-4">
              {t('collectDesc')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-[var(--c-text-secondary)] mb-4">
              <li>{t('collectItem1')}</li>
              <li>{t('collectItem2')}</li>
              <li>{t('collectItem3')}</li>
              <li>{t('collectItem4')}</li>
            </ul>
          </section>

          <section className="mb-8 sm:mb-10">
            <h2
              className="text-xl sm:text-2xl font-semibold text-[var(--c-text)] mb-3 sm:mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('use')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--c-text-secondary)] leading-relaxed mb-4">
              {t('useDesc')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-[var(--c-text-secondary)] mb-4">
              <li>{t('useItem1')}</li>
              <li>{t('useItem2')}</li>
              <li>{t('useItem3')}</li>
              <li>{t('useItem4')}</li>
              <li>{t('useItem5')}</li>
              <li>{t('useItem6')}</li>
            </ul>
          </section>

          <section className="mb-8 sm:mb-10">
            <h2
              className="text-xl sm:text-2xl font-semibold text-[var(--c-text)] mb-3 sm:mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('security')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--c-text-secondary)] leading-relaxed mb-4">
              {t('securityDesc')}
            </p>
          </section>

          <section className="mb-8 sm:mb-10">
            <h2
              className="text-xl sm:text-2xl font-semibold text-[var(--c-text)] mb-3 sm:mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('thirdParty')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--c-text-secondary)] leading-relaxed mb-4">
              {t('thirdPartyDesc')}
            </p>
          </section>

          <section className="mb-8 sm:mb-10">
            <h2
              className="text-xl sm:text-2xl font-semibold text-[var(--c-text)] mb-3 sm:mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('rights')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--c-text-secondary)] leading-relaxed mb-4">
              {t('rightsDesc')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm sm:text-base text-[var(--c-text-secondary)] mb-4">
              <li>{t('rightsItem1')}</li>
              <li>{t('rightsItem2')}</li>
              <li>{t('rightsItem3')}</li>
              <li>{t('rightsItem4')}</li>
              <li>{t('rightsItem5')}</li>
            </ul>
          </section>

          <section className="mb-8 sm:mb-10">
            <h2
              className="text-xl sm:text-2xl font-semibold text-[var(--c-text)] mb-3 sm:mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('updates')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--c-text-secondary)] leading-relaxed mb-4">
              {t('updatesDesc')}
            </p>
          </section>

          <section className="mb-8 sm:mb-10">
            <h2
              className="text-xl sm:text-2xl font-semibold text-[var(--c-text)] mb-3 sm:mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('contact')}
            </h2>
            <p className="text-sm sm:text-base text-[var(--c-text-secondary)] leading-relaxed mb-4">
              {t('contactDesc')}
            </p>
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm sm:text-base text-[var(--c-accent)] hover:text-[var(--c-accent-hover)] font-medium">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {process.env.NEXT_PUBLIC_CONTACT_EMAIL}
            </a>
          </section>
        </div>
      </div>
    </main>
  )
}

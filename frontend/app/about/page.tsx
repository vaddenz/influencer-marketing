import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('About')
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_ADVERTISED_HOST}/about`,
    },
  }
}

export default async function AboutPage() {
  const t = await getTranslations('About')

  return (
    <main className="pt-24 pb-20 min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-10 sm:mb-16">
            <h1
              className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--c-text)] mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('header')}
            </h1>
            <div className="w-10 h-1 bg-[var(--c-accent)] rounded-full mx-auto"></div>
          </div>

          {/* Content */}
          <div className="space-y-8 sm:space-y-12">
            <section>
              <p className="text-base sm:text-lg text-[var(--c-text-secondary)] leading-relaxed">
                {t('intro')}
              </p>
            </section>

            <section>
              <h2
                className="text-xl sm:text-2xl font-semibold text-[var(--c-text)] mb-3 sm:mb-4"
                style={{ fontFamily: 'var(--font-heading)' }}>
                {t('vision')}
              </h2>
              <p className="text-sm sm:text-base text-[var(--c-text-secondary)] leading-relaxed">
                {t('visionDesc')}
              </p>
            </section>

            <section>
              <h2
                className="text-xl sm:text-2xl font-semibold text-[var(--c-text)] mb-3 sm:mb-4"
                style={{ fontFamily: 'var(--font-heading)' }}>
                {t('features')}
              </h2>
              <ul className="space-y-2 sm:space-y-3">
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-[var(--c-accent-light)] text-[var(--c-accent)] flex-shrink-0 mt-0.5 rounded">
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span className="text-sm sm:text-base text-[var(--c-text-secondary)]">
                    {t('feature1')}
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-[var(--c-accent-light)] text-[var(--c-accent)] flex-shrink-0 mt-0.5 rounded">
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span className="text-sm sm:text-base text-[var(--c-text-secondary)]">
                    {t('feature2')}
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-[var(--c-accent-light)] text-[var(--c-accent)] flex-shrink-0 mt-0.5 rounded">
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span className="text-sm sm:text-base text-[var(--c-text-secondary)]">
                    {t('feature3')}
                  </span>
                </li>
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-[var(--c-accent-light)] text-[var(--c-accent)] flex-shrink-0 mt-0.5 rounded">
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </span>
                  <span className="text-sm sm:text-base text-[var(--c-text-secondary)]">
                    {t('feature4')}
                  </span>
                </li>
              </ul>
            </section>

            <section>
              <h2
                className="text-xl sm:text-2xl font-semibold text-[var(--c-text)] mb-3 sm:mb-4"
                style={{ fontFamily: 'var(--font-heading)' }}>
                {t('contact')}
              </h2>
              <p className="text-sm sm:text-base text-[var(--c-text-secondary)] mb-4 sm:mb-6">
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
      </div>
    </main>
  )
}

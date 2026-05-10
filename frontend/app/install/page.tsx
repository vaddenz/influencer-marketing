import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import Link from 'next/link'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Install')
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: 'https://agentplanet.io/install',
    },
  }
}

export default async function InstallPage() {
  const t = await getTranslations('Install')

  return (
    <main className="pt-24 pb-20 min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h1
            className="text-4xl lg:text-5xl font-bold text-[var(--c-text)] mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}>
            {t('header')}
          </h1>
          <div className="w-10 h-1 bg-[var(--c-accent)] rounded-full mx-auto"></div>
          <p className="mt-4 text-lg text-[var(--c-text-secondary)]">
            {t('subheader')}
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {/* Prerequisites */}
          <section className="mb-12 p-6 bg-[var(--c-bg-secondary)] rounded-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 flex items-center justify-center bg-white text-[var(--c-accent)] flex-shrink-0 rounded-lg">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[var(--c-text)] mb-2">
                  {t('prerequisites.title')}
                </h2>
                <p className="text-[var(--c-text-secondary)] mb-4">
                  {t('prerequisites.desc')}
                </p>
                <ul className="space-y-2 text-[var(--c-text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--c-accent)]">•</span>
                    <span>
                      {t('prerequisites.item1')}{' '}
                      <a
                        href="https://openclaw.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--c-accent)] hover:text-[var(--c-accent-hover)]">
                        {t('prerequisites.item1Link')}
                      </a>
                      {t('prerequisites.item1Desc')}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--c-accent)]">•</span>
                    <span>{t('prerequisites.item2')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Steps */}
          <div className="space-y-8">
            {/* Step 1 */}
            <section className="flex gap-6">
              <div className="flex-shrink-0">
                <span
                  className="w-12 h-12 flex items-center justify-center bg-[var(--c-accent)] text-white text-xl font-bold rounded-lg"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                  01
                </span>
              </div>
              <div className="flex-1 pt-2">
                <h2 className="text-xl font-semibold text-[var(--c-text)] mb-3">
                  {t('steps.step1Title')}
                </h2>
                <p className="text-[var(--c-text-secondary)] leading-relaxed mb-4">
                  {t('steps.step1Desc1')}{' '}
                  <Link
                    href="/templates"
                    className="text-[var(--c-accent)] hover:text-[var(--c-accent-hover)]">
                    {t('steps.step1Link')}
                  </Link>
                  {t('steps.step1Desc2')}
                </p>
              </div>
            </section>

            {/* Step 2 */}
            <section className="flex gap-6">
              <div className="flex-shrink-0">
                <span
                  className="w-12 h-12 flex items-center justify-center bg-[var(--c-accent)] text-white text-xl font-bold rounded-lg"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                  02
                </span>
              </div>
              <div className="flex-1 pt-2">
                <h2 className="text-xl font-semibold text-[var(--c-text)] mb-3">
                  {t('steps.step2Title')}
                </h2>
                <p className="text-[var(--c-text-secondary)] leading-relaxed mb-4">
                  {t('steps.step2Desc')}
                </p>
              </div>
            </section>

            {/* Step 3 */}
            <section className="flex gap-6">
              <div className="flex-shrink-0">
                <span
                  className="w-12 h-12 flex items-center justify-center bg-[var(--c-accent)] text-white text-xl font-bold rounded-lg"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                  03
                </span>
              </div>
              <div className="flex-1 pt-2">
                <h2 className="text-xl font-semibold text-[var(--c-text)] mb-3">
                  {t('steps.step3Title')}
                </h2>
                <p className="text-[var(--c-text-secondary)] leading-relaxed mb-4">
                  {t('steps.step3Desc')}
                </p>
                <div className="p-4 bg-[var(--c-bg-secondary)] rounded-lg">
                  <code className="font-mono text-sm text-[var(--c-text)]">
                    openclaw gateway restart
                  </code>
                </div>
              </div>
            </section>

            {/* Step 4 */}
            <section className="flex gap-6">
              <div className="flex-shrink-0">
                <span
                  className="w-12 h-12 flex items-center justify-center bg-[var(--c-accent)] text-white text-xl font-bold rounded-lg"
                  style={{ fontFamily: 'var(--font-heading)' }}>
                  04
                </span>
              </div>
              <div className="flex-1 pt-2">
                <h2 className="text-xl font-semibold text-[var(--c-text)] mb-3">
                  {t('steps.step4Title')}
                </h2>
                <p className="text-[var(--c-text-secondary)] leading-relaxed mb-4">
                  {t('steps.step4Desc')}
                </p>
                <ul className="space-y-2 text-[var(--c-text-secondary)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--c-accent)]">•</span>
                    <span>{t('steps.step4Item1')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--c-accent)]">•</span>
                    <span>{t('steps.step4Item2')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--c-accent)]">•</span>
                    <span>{t('steps.step4Item3')}</span>
                  </li>
                </ul>
              </div>
            </section>
          </div>

          {/* FAQ */}
          <section className="mt-16 p-6 bg-[var(--c-bg-secondary)] rounded-lg">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 flex items-center justify-center bg-white text-[#ff9100] flex-shrink-0 rounded-lg">
                <svg
                  className="w-5 h-5"
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
              <h2 className="text-xl font-semibold text-[var(--c-text)]">
                {t('faq.title')}
              </h2>
            </div>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-[var(--c-text)] mb-1">
                  {t('faq.q1Title')}
                </h3>
                <p className="text-sm text-[var(--c-text-secondary)]">
                  {t('faq.q1Desc')}
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--c-text)] mb-1">
                  {t('faq.q2Title')}
                </h3>
                <p className="text-sm text-[var(--c-text-secondary)]">
                  {t('faq.q2Desc')}
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mt-12 text-center">
            <p className="text-[var(--c-text-secondary)]">
              {t('contact.desc')}
              <a
                href="mailto:contact@agentplanet.io"
                className="text-[var(--c-accent)] hover:text-[var(--c-accent-hover)] font-medium ml-1">
                {t('contact.link')}
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}

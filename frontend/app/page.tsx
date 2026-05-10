import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { TemplatesShowcase } from '../components/TemplatesShowcase'
import { getApiUrl } from '@/lib/config'
import type { Template } from '@/lib/types'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('HomePage')
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: process.env.NEXT_PUBLIC_ADVERTISED_HOST,
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: process.env.NEXT_PUBLIC_ADVERTISED_HOST,
    },
  }
}

async function getTemplates(): Promise<Template[]> {
  try {
    const res = await fetch(getApiUrl('templates'), {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    })
    if (!res.ok) throw new Error('Failed to fetch templates')
    const data = await res.json()
    return data.data || []
  } catch (error) {
    console.error('Error fetching templates:', error)
    return []
  }
}

export default async function HomePage() {
  const templates = await getTemplates()
  const t = await getTranslations('HomePage')

  return (
    <main>
      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 bg-white overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="lg:flex lg:items-center lg:gap-16">
            <div className="max-w-3xl lg:w-2/3 relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--c-accent-light)] text-[var(--c-accent)] rounded-full text-sm font-medium mb-8">
                <span className="w-2 h-2 rounded-full bg-[var(--c-accent)]"></span>
                {t('badge')}
              </div>

              {/* Title */}
              <h1
                className="text-4xl sm:text-5xl lg:text-7xl font-bold text-[var(--c-text)] leading-tight mb-6"
                style={{ fontFamily: 'var(--font-heading)' }}>
                {t('heroTitle1')}&nbsp;
                <span className="text-[var(--c-accent)]">
                  {t('heroTitle2')}
                </span>
              </h1>

              {/* Description */}
              <p className="text-xl text-[var(--c-text-secondary)] leading-relaxed mb-10 max-w-2xl">
                {t('description')}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-16">
                <Link href="/templates" className="btn-primary justify-center">
                  {t('cta')}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </Link>
                <Link href="/about" className="btn-secondary justify-center">
                  {t('secondaryCta')}
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 sm:gap-8 lg:gap-12 pt-8 border-t border-[var(--c-border-light)]">
                <div>
                  <div
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--c-text)]"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                    15+
                  </div>
                  <div className="text-xs sm:text-sm text-[var(--c-text-secondary)] mt-1">
                    {t('stats.scenarios')}
                  </div>
                </div>
                <div className="w-px h-10 bg-[var(--c-border)] hidden sm:block"></div>
                <div>
                  <div
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--c-text)]"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                    30+
                  </div>
                  <div className="text-xs sm:text-sm text-[var(--c-text-secondary)] mt-1">
                    {t('stats.roles')}
                  </div>
                </div>
                <div className="w-px h-10 bg-[var(--c-border)] hidden sm:block"></div>
                <div>
                  <div
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--c-text)]"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                    100%
                  </div>
                  <div className="text-xs sm:text-sm text-[var(--c-text-secondary)] mt-1">
                    {t('stats.openSource')}
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="hidden lg:block lg:w-1/3 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl transform rotate-6 hover:rotate-0 transition-transform duration-500">
                <Image
                  src="/homepage.jpeg"
                  alt={process.env.NEXT_PUBLIC_BRAND_NAME || ''}
                  width={1200}
                  height={1223}
                  className="w-full h-auto object-cover"
                  priority
                  quality={75}
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAADAAQDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-tr from-[var(--c-accent)]/5 to-transparent pointer-events-none"></div>
              </div>

              {/* Decorative Background Elements */}
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-[var(--c-accent)]/10 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-[var(--c-bg-secondary)]">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2
              className="text-3xl lg:text-4xl font-bold text-[var(--c-text)] mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('howItWorks.title')}
            </h2>
            <p className="text-lg text-[var(--c-text-secondary)]">
              {t('howItWorks.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="text-center">
              <div
                className="text-5xl sm:text-6xl font-bold text-[var(--c-border)] mb-4 sm:mb-6"
                style={{ fontFamily: 'var(--font-heading)' }}>
                01
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[var(--c-text)] mb-2 sm:mb-3">
                {t('howItWorks.step1Title')}
              </h3>
              <p className="text-sm sm:text-base text-[var(--c-text-secondary)] leading-relaxed">
                {t('howItWorks.step1Desc')}
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div
                className="text-5xl sm:text-6xl font-bold text-[var(--c-border)] mb-4 sm:mb-6"
                style={{ fontFamily: 'var(--font-heading)' }}>
                02
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[var(--c-text)] mb-2 sm:mb-3">
                {t('howItWorks.step2Title')}
              </h3>
              <p className="text-sm sm:text-base text-[var(--c-text-secondary)] leading-relaxed">
                {t('howItWorks.step2Desc')}
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div
                className="text-5xl sm:text-6xl font-bold text-[var(--c-border)] mb-4 sm:mb-6"
                style={{ fontFamily: 'var(--font-heading)' }}>
                03
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-[var(--c-text)] mb-2 sm:mb-3">
                {t('howItWorks.step3Title')}
              </h3>
              <p className="text-sm sm:text-base text-[var(--c-text-secondary)] leading-relaxed">
                {t('howItWorks.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Templates Showcase Section */}
      <TemplatesShowcase templates={templates} />

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2
              className="text-3xl lg:text-4xl font-bold text-[var(--c-text)] mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('features.title')}
            </h2>
            <p className="text-lg text-[var(--c-text-secondary)]">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Feature 1 */}
            <div className="card group">
              <div className="w-12 h-12 flex items-center justify-center text-[var(--c-accent)] mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--c-text)] mb-3">
                {t('features.feature1Title')}
              </h3>
              <p className="text-[var(--c-text-secondary)] text-sm leading-relaxed">
                {t('features.feature1Desc')}
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card group">
              <div className="w-12 h-12 flex items-center justify-center text-[var(--c-accent)] mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--c-text)] mb-3">
                {t('features.feature2Title')}
              </h3>
              <p className="text-[var(--c-text-secondary)] text-sm leading-relaxed">
                {t('features.feature2Desc')}
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card group">
              <div className="w-12 h-12 flex items-center justify-center text-[var(--c-accent)] mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08.402-2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--c-text)] mb-3">
                {t('features.feature3Title')}
              </h3>
              <p className="text-[var(--c-text-secondary)] text-sm leading-relaxed">
                {t('features.feature3Desc')}
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card group">
              <div className="w-12 h-12 flex items-center justify-center text-[var(--c-accent)] mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--c-text)] mb-3">
                {t('features.feature4Title')}
              </h3>
              <p className="text-[var(--c-text-secondary)] text-sm leading-relaxed">
                {t('features.feature4Desc')}
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card group">
              <div className="w-12 h-12 flex items-center justify-center text-[var(--c-accent)] mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--c-text)] mb-3">
                {t('features.feature5Title')}
              </h3>
              <p className="text-[var(--c-text-secondary)] text-sm leading-relaxed">
                {t('features.feature5Desc')}
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card group">
              <div className="w-12 h-12 flex items-center justify-center text-[var(--c-accent)] mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--c-text)] mb-3">
                {t('features.feature6Title')}
              </h3>
              <p className="text-[var(--c-text-secondary)] text-sm leading-relaxed">
                {t('features.feature6Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-[var(--c-accent-light)]">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className="text-3xl lg:text-4xl font-bold text-[var(--c-text)] mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('bottomCta.title')}
            </h2>
            <p className="text-lg text-[var(--c-text-secondary)] mb-10">
              {t('bottomCta.subtitle')}
            </p>
            <Link href="/templates" className="btn-primary">
              {t('bottomCta.button')}
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

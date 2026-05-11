import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

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

export default async function HomePage() {
  const t = await getTranslations('HomePage')

  return (
    <main>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 bg-white overflow-hidden">
        {/* Gradient orbs */}
        <div className="gradient-orb landing-orb-1 -top-20 -right-20"></div>
        <div className="gradient-orb landing-orb-2 top-40 -left-20"></div>
        <div className="gradient-orb landing-orb-3 bottom-0 right-1/4"></div>

        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="lg:flex lg:items-center lg:gap-16">
            <div className="max-w-3xl lg:w-2/3">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-light-gray text-ink rounded-full text-sm font-medium mb-8 animate-fade-up">
                <span className="w-2 h-2 rounded-full bg-ink"></span>
                {t('badge')}
              </div>

              {/* Title */}
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-tight tracking-tight mb-6 animate-fade-up delay-1"
                style={{ fontFamily: 'var(--font-heading)' }}>
                {t('heroTitle1')}
                <span className="text-ink">{t('heroTitle2')}</span>
              </h1>

              {/* Description */}
              <p className="text-lg text-gray leading-relaxed mb-10 max-w-2xl animate-fade-up delay-2">
                {t('description')}
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-16 animate-fade-up delay-3">
                <Link
                  href="/brand/discover"
                  className="btn-primary justify-center">
                  {t('cta')}
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
                <Link
                  href="/influencer/profile"
                  className="btn-secondary justify-center">
                  {t('secondaryCta')}
                </Link>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 sm:gap-8 lg:gap-12 pt-8 border-t border-border-gray animate-fade-up delay-4">
                <div>
                  <div
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink tracking-tight"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                    10K+
                  </div>
                  <div className="text-xs sm:text-sm text-gray mt-1">
                    {t('stats.creators')}
                  </div>
                </div>
                <div className="w-px h-10 bg-border-gray hidden sm:block"></div>
                <div>
                  <div
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink tracking-tight"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                    500+
                  </div>
                  <div className="text-xs sm:text-sm text-gray mt-1">
                    {t('stats.brands')}
                  </div>
                </div>
                <div className="w-px h-10 bg-border-gray hidden sm:block"></div>
                <div>
                  <div
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold text-ink tracking-tight"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                    50K+
                  </div>
                  <div className="text-xs sm:text-sm text-gray mt-1">
                    {t('stats.contentPieces')}
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="hidden lg:block lg:w-1/3 relative mt-12 lg:mt-0 animate-fade-up delay-4">
              <div className="relative w-[420px] h-[340px] rounded-3xl overflow-hidden bg-gradient-to-br from-sky-50 to-emerald-50 shadow-soft flex items-center justify-center hover-lift">
                <Image
                  src="/homepage.jpeg"
                  alt={process.env.NEXT_PUBLIC_BRAND_NAME || ''}
                  width={420}
                  height={340}
                  className="w-full h-full object-cover"
                  priority
                  quality={75}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-10 bg-light-gray border-y border-border-gray">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <p className="text-center text-sm font-medium text-gray uppercase tracking-wider mb-6">
            {t('trust.title')}
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-16 opacity-60">
            <span
              className="text-xl font-bold text-gray"
              style={{ fontFamily: 'var(--font-heading)' }}>
              GlowSkincare
            </span>
            <span
              className="text-xl font-bold text-gray"
              style={{ fontFamily: 'var(--font-heading)' }}>
              FitFuel
            </span>
            <span
              className="text-xl font-bold text-gray"
              style={{ fontFamily: 'var(--font-heading)' }}>
              TechWear
            </span>
            <span
              className="text-xl font-bold text-gray"
              style={{ fontFamily: 'var(--font-heading)' }}>
              HomeNest
            </span>
            <span
              className="text-xl font-bold text-gray"
              style={{ fontFamily: 'var(--font-heading)' }}>
              PurePet
            </span>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2
              className="text-3xl lg:text-4xl font-bold text-ink mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('howItWorks.title')}
            </h2>
            <p className="text-lg text-gray">{t('howItWorks.subtitle')}</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* For Brands */}
            <div>
              <h3 className="text-xl font-semibold text-ink mb-8 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                {t('howItWorks.forBrands')}
              </h3>
              <div className="space-y-8">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-light-gray text-ink flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink mb-1">
                      {t('howItWorks.brandStep1Title')}
                    </h4>
                    <p className="text-sm text-gray leading-relaxed">
                      {t('howItWorks.brandStep1Desc')}
                    </p>
                  </div>
                </div>
                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-light-gray text-ink flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink mb-1">
                      {t('howItWorks.brandStep2Title')}
                    </h4>
                    <p className="text-sm text-gray leading-relaxed">
                      {t('howItWorks.brandStep2Desc')}
                    </p>
                  </div>
                </div>
                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-light-gray text-ink flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink mb-1">
                      {t('howItWorks.brandStep3Title')}
                    </h4>
                    <p className="text-sm text-gray leading-relaxed">
                      {t('howItWorks.brandStep3Desc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Creators */}
            <div>
              <h3 className="text-xl font-semibold text-ink mb-8 flex items-center gap-2">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                {t('howItWorks.forCreators')}
              </h3>
              <div className="space-y-8">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-light-gray text-ink flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink mb-1">
                      {t('howItWorks.creatorStep1Title')}
                    </h4>
                    <p className="text-sm text-gray leading-relaxed">
                      {t('howItWorks.creatorStep1Desc')}
                    </p>
                  </div>
                </div>
                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-light-gray text-ink flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink mb-1">
                      {t('howItWorks.creatorStep2Title')}
                    </h4>
                    <p className="text-sm text-gray leading-relaxed">
                      {t('howItWorks.creatorStep2Desc')}
                    </p>
                  </div>
                </div>
                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-light-gray text-ink flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink mb-1">
                      {t('howItWorks.creatorStep3Title')}
                    </h4>
                    <p className="text-sm text-gray leading-relaxed">
                      {t('howItWorks.creatorStep3Desc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-light-gray">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2
              className="text-3xl lg:text-4xl font-bold text-ink mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('features.title')}
            </h2>
            <p className="text-lg text-gray">{t('features.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Feature 1: Smart Matching */}
            <div className="card group bg-white">
              <div className="w-12 h-12 flex items-center justify-center text-ink mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-ink mb-3">
                {t('features.feature1Title')}
              </h3>
              <p className="text-gray text-sm leading-relaxed">
                {t('features.feature1Desc')}
              </p>
            </div>

            {/* Feature 2: Campaign Management */}
            <div className="card group bg-white">
              <div className="w-12 h-12 flex items-center justify-center text-ink mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-ink mb-3">
                {t('features.feature2Title')}
              </h3>
              <p className="text-gray text-sm leading-relaxed">
                {t('features.feature2Desc')}
              </p>
            </div>

            {/* Feature 3: Content Library */}
            <div className="card group bg-white">
              <div className="w-12 h-12 flex items-center justify-center text-ink mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-ink mb-3">
                {t('features.feature3Title')}
              </h3>
              <p className="text-gray text-sm leading-relaxed">
                {t('features.feature3Desc')}
              </p>
            </div>

            {/* Feature 4: Performance Analytics */}
            <div className="card group bg-white">
              <div className="w-12 h-12 flex items-center justify-center text-ink mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-ink mb-3">
                {t('features.feature4Title')}
              </h3>
              <p className="text-gray text-sm leading-relaxed">
                {t('features.feature4Desc')}
              </p>
            </div>

            {/* Feature 5: Secure Payments */}
            <div className="card group bg-white">
              <div className="w-12 h-12 flex items-center justify-center text-ink mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-ink mb-3">
                {t('features.feature5Title')}
              </h3>
              <p className="text-gray text-sm leading-relaxed">
                {t('features.feature5Desc')}
              </p>
            </div>

            {/* Feature 6: Multi-Platform */}
            <div className="card group bg-white">
              <div className="w-12 h-12 flex items-center justify-center text-ink mb-6">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-ink mb-3">
                {t('features.feature6Title')}
              </h3>
              <p className="text-gray text-sm leading-relaxed">
                {t('features.feature6Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 lg:py-32 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2
              className="text-3xl lg:text-4xl font-bold text-ink mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('testimonials.title')}
            </h2>
            <p className="text-lg text-gray">{t('testimonials.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="card bg-light-gray border-0">
              <div className="text-ink mb-4">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <p className="text-gray text-sm leading-relaxed mb-6">
                {t('testimonials.quote1')}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-light-gray flex items-center justify-center text-ink font-bold text-sm">
                  SC
                </div>
                <div>
                  <div className="font-semibold text-ink text-sm">
                    {t('testimonials.author1')}
                  </div>
                  <div className="text-xs text-gray">
                    {t('testimonials.role1')}
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="card bg-light-gray border-0">
              <div className="text-ink mb-4">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <p className="text-gray text-sm leading-relaxed mb-6">
                {t('testimonials.quote2')}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-light-gray flex items-center justify-center text-ink font-bold text-sm">
                  MJ
                </div>
                <div>
                  <div className="font-semibold text-ink text-sm">
                    {t('testimonials.author2')}
                  </div>
                  <div className="text-xs text-gray">
                    {t('testimonials.role2')}
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="card bg-light-gray border-0">
              <div className="text-ink mb-4">
                <svg
                  className="w-8 h-8"
                  fill="currentColor"
                  viewBox="0 0 24 24">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>
              <p className="text-gray text-sm leading-relaxed mb-6">
                {t('testimonials.quote3')}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-light-gray flex items-center justify-center text-ink font-bold text-sm">
                  EZ
                </div>
                <div>
                  <div className="font-semibold text-ink text-sm">
                    {t('testimonials.author3')}
                  </div>
                  <div className="text-xs text-gray">
                    {t('testimonials.role3')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-light-gray">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2
              className="text-3xl lg:text-4xl font-bold text-ink mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {t('bottomCta.title')}
            </h2>
            <p className="text-lg text-gray mb-10">{t('bottomCta.subtitle')}</p>
            <Link href="/brand/discover" className="btn-primary">
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

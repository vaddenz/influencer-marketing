import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import Script from 'next/script'
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { PublicLayout } from '@/components/PublicLayout'
import { AuthProvider } from '@/lib/auth'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Layout.metadata')

  return {
    title: t('title'),
    description: t('description'),
    keywords: ['KEYWORDS'],
    authors: [{ name: process.env.NEXT_PUBLIC_BRAND_NAME }],
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
      url: process.env.NEXT_PUBLIC_ADVERTISED_HOST,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_ADVERTISED_HOST}/og-image.png`,
          width: 1200,
          height: 630,
          alt: process.env.NEXT_PUBLIC_BRAND_NAME,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [`${process.env.NEXT_PUBLIC_ADVERTISED_HOST}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: '/favicon.png',
    },
  }
}

import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { getUserLocale } from '@/lib/locale'

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getUserLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
      <body className="flex min-h-screen flex-col">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <PublicLayout>
              <div className="flex-1">{children}</div>
            </PublicLayout>
          </AuthProvider>
        </NextIntlClientProvider>
        <Script
          src="https://cloud.umami.is/script.js"
          data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}

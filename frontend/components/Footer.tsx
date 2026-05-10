import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export function Footer() {
  const currentYear = new Date().getFullYear()
  const t = useTranslations('Footer')

  return (
    <footer className="border-t border-[var(--c-border-light)] bg-white">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-8">
          {/* Logo & Copyright */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/favicon.png"
                alt={process.env.NEXT_PUBLIC_BRAND_NAME || ''}
                width={24}
                height={24}
                className="h-6 w-6 rounded"
              />
              <span
                className="text-lg font-semibold text-[var(--c-text)]"
                style={{ fontFamily: 'var(--font-heading)' }}>
                {process.env.NEXT_PUBLIC_BRAND_NAME}
              </span>
            </Link>
            <p className="text-sm text-[var(--c-text-muted)]">
              © {currentYear} {process.env.NEXT_PUBLIC_BRAND_NAME}.{' '}
              {t('allRightsReserved')}
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link
              href="/discover"
              className="text-sm text-[var(--c-text-secondary)] hover:text-[var(--c-accent)] transition-colors">
              {t('discover')}
            </Link>
            <Link
              href="/about"
              className="text-sm text-[var(--c-text-secondary)] hover:text-[var(--c-accent)] transition-colors">
              {t('about')}
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-[var(--c-text-secondary)] hover:text-[var(--c-accent)] transition-colors">
              {t('privacy')}
            </Link>
            <Link
              href="/terms"
              className="text-sm text-[var(--c-text-secondary)] hover:text-[var(--c-accent)] transition-colors">
              {t('terms')}
            </Link>
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}
              className="text-sm text-[var(--c-text-secondary)] hover:text-[var(--c-accent)] transition-colors">
              {t('contact')}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AuthButton } from './AuthButton'
import LanguageSwitcher from './LanguageSwitcher'

function getLinkClass(isActive: boolean): string {
  const baseClass = 'text-sm font-medium transition-colors'
  const activeClass = 'text-[var(--c-accent)]'
  const inactiveClass =
    'text-[var(--c-text-secondary)] hover:text-[var(--c-text)]'

  return `${baseClass} ${isActive ? activeClass : inactiveClass}`
}

function getMobileLinkClass(isActive: boolean): string {
  const baseClass =
    'block rounded-lg px-4 py-3 text-base font-medium transition-colors'
  const activeClass = 'bg-[var(--c-accent-light)] text-[var(--c-accent)]'
  const inactiveClass =
    'text-[var(--c-text-secondary)] hover:bg-[var(--c-bg-secondary)] hover:text-[var(--c-text)]'

  return `${baseClass} ${isActive ? activeClass : inactiveClass}`
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations('Navbar')

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/templates', label: t('templates') },
    { href: '/install', label: t('install') },
    {
      href: 'https://github.com',
      label: 'GitHub',
      external: true,
    },
  ]

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsMenuOpen(false))
    return () => cancelAnimationFrame(id)
  }, [pathname])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[var(--c-border-light)]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/favicon.png"
              alt={process.env.NEXT_PUBLIC_BRAND_NAME || ''}
              width={24}
              height={24}
              className="h-6 w-6 rounded"
            />
            <span
              className="text-xl font-bold text-[var(--c-text)]"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {process.env.NEXT_PUBLIC_BRAND_NAME}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-8">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : !link.external &&
                    (pathname === link.href ||
                      pathname.startsWith(link.href + '/'))

              if (link.external) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={getLinkClass(false)}>
                    {link.label}
                  </a>
                )
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={getLinkClass(isActive)}
                  style={{ color: isActive ? 'var(--c-accent)' : undefined }}>
                  {link.label}
                </Link>
              )
            })}
            <LanguageSwitcher />
            <AuthButton />
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded p-2 text-[var(--c-text-secondary)] hover:bg-[var(--c-bg-tertiary)] hover:text-[var(--c-text)] md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}>
            <span className="sr-only">{t('openMenu')}</span>
            {isMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-[var(--c-border-light)] bg-white">
          <div className="max-w-[1200px] mx-auto px-6 py-4 space-y-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : !link.external &&
                    (pathname === link.href ||
                      pathname.startsWith(link.href + '/'))

              if (link.external) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={getMobileLinkClass(false)}>
                    {link.label}
                  </a>
                )
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={getMobileLinkClass(isActive)}
                  style={{ color: isActive ? 'var(--c-accent)' : undefined }}>
                  {link.label}
                </Link>
              )
            })}
            <div className="py-2 px-4">
              <LanguageSwitcher />
            </div>
            <div className="pt-2">
              <Link
                href="/templates"
                className="btn-primary w-full justify-center">
                {t('start')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

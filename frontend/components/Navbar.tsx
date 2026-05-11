'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { AuthButton } from './AuthButton'
import LanguageSwitcher from './LanguageSwitcher'

function getLinkClass(isActive: boolean): string {
  const baseClass = 'px-4 py-2 rounded-xl text-sm font-medium transition-colors'
  const activeClass = 'bg-light-gray text-ink'
  const inactiveClass = 'text-gray hover:bg-light-gray'

  return `${baseClass} ${isActive ? activeClass : inactiveClass}`
}

function getMobileLinkClass(isActive: boolean): string {
  const baseClass =
    'block rounded-xl px-4 py-3 text-base font-medium transition-colors'
  const activeClass = 'bg-light-gray text-ink'
  const inactiveClass = 'text-gray hover:bg-light-gray'

  return `${baseClass} ${isActive ? activeClass : inactiveClass}`
}

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const t = useTranslations('Navbar')

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/brand/discover', label: t('discover') },
    { href: '/about', label: t('howItWorks') },
  ]

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsMenuOpen(false))
    return () => cancelAnimationFrame(id)
  }, [pathname])

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border-gray">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
            </div>
            <span
              className="text-xl font-bold text-ink"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {process.env.NEXT_PUBLIC_BRAND_NAME}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname === link.href ||
                    pathname.startsWith(link.href + '/')

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={getLinkClass(isActive)}>
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <LanguageSwitcher />
            <AuthButton />
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg p-2 text-gray hover:bg-light-gray md:hidden"
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
        <div className="md:hidden border-t border-border-gray bg-white">
          <div className="max-w-[1200px] mx-auto px-6 py-4 space-y-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname === link.href ||
                    pathname.startsWith(link.href + '/')

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={getMobileLinkClass(isActive)}>
                  {link.label}
                </Link>
              )
            })}
            <div className="py-2 px-4">
              <LanguageSwitcher />
            </div>
            <div className="pt-2">
              <Link
                href="/brand/discover"
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

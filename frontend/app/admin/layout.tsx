'use client'

// TODO: /admin is the brand dashboard. Rename this route to (brand)/ in Task 13.

import Image from 'next/image'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/lib/auth'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isBrand, loading, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('Admin')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !isBrand) {
      router.replace('/')
    }
  }, [loading, isBrand, router])

  useEffect(() => {
    const id = requestAnimationFrame(() => setIsSidebarOpen(false))
    return () => cancelAnimationFrame(id)
  }, [pathname])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--c-bg)]">
        <div className="animate-spin h-8 w-8 border-2 border-[var(--c-accent)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!isBrand) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--c-bg)]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--c-text)] mb-2">
            {t('unauthorizedTitle')}
          </h1>
          <p className="text-[var(--c-text-secondary)] mb-6">
            {t('unauthorizedMessage')}
          </p>
          <Link href="/" className="btn-primary">
            {t('backHome')}
          </Link>
        </div>
      </div>
    )
  }

  const navItems = [
    // { href: '/admin', label: t('dashboard') }
  ]

  return (
    <div className="flex h-screen bg-[var(--c-bg)]">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-60 border-r border-[var(--c-border-light)] bg-white
          transform transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
        <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--c-border-light)]">
          {/* <span
            className="text-lg font-bold text-[var(--c-text)]"
            style={{ fontFamily: 'var(--font-heading)' }}>
            {t('adminPanel')}
          </span> */}
          <button
            type="button"
            className="rounded p-1 text-[var(--c-text-secondary)] hover:bg-[var(--c-bg-tertiary)] md:hidden"
            onClick={() => setIsSidebarOpen(false)}>
            <svg
              className="h-5 w-5"
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
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  block rounded-lg px-3 py-2 text-sm font-medium transition-colors
                  ${
                    isActive
                      ? 'bg-[var(--c-accent-light)] text-[var(--c-accent)]'
                      : 'text-[var(--c-text-secondary)] hover:bg-[var(--c-bg-secondary)] hover:text-[var(--c-text)]'
                  }
                `}>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-[var(--c-border-light)] bg-white px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded p-2 text-[var(--c-text-secondary)] hover:bg-[var(--c-bg-tertiary)] md:hidden"
              onClick={() => setIsSidebarOpen(true)}>
              <svg
                className="h-5 w-5"
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
            </button>
            {/* <h1 className="text-base font-semibold text-[var(--c-text)]">
              {t('adminPanel')}
            </h1> */}
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hidden text-sm font-medium text-[var(--c-text-secondary)] hover:text-[var(--c-text)] sm:block">
              {t('backToSite')}
            </Link>
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt={user.name}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full"
                unoptimized={true}
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--c-accent-light)] text-sm font-medium text-[var(--c-accent)]">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <button
              type="button"
              onClick={logout}
              className="text-sm font-medium text-[var(--c-text-secondary)] hover:text-[var(--c-error)] transition-colors">
              {t('logout')}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

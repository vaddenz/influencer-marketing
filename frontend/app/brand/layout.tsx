'use client'

import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const navItems = [
  {
    href: '/brand/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    href: '/brand/discover',
    label: 'Discover',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
]

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  const { user, isBrand, loading } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && (!user || !isBrand)) {
      window.location.href = '/login'
    }
  }, [user, isBrand, loading])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--d-content-bg)' }}>
        <div className="animate-spin w-8 h-8 border-4 rounded-full" style={{ borderColor: 'var(--d-accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }
  if (!user || !isBrand) return null

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className="w-64 hidden md:flex flex-col fixed inset-y-0 left-0 z-30 animate-slide-in-left"
        style={{
          backgroundColor: 'var(--d-sidebar-bg)',
          borderRight: '1px solid var(--d-sidebar-border)',
        }}
      >
        <div className="p-6">
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: 'var(--d-accent)' }}
            >
              B
            </div>
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--d-text)', fontFamily: 'var(--font-heading)' }}
            >
              Brand Studio
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`d-sidebar-link ${isActive ? 'd-sidebar-link-active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-4">
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: 'var(--d-content-bg-warm)' }}
          >
            <p className="text-xs font-medium mb-1" style={{ color: 'var(--d-text-secondary)' }}>
              Logged in as
            </p>
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--d-text)' }}>
              {user.email}
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-around items-center h-16 border-t" style={{ backgroundColor: 'var(--d-sidebar-bg)', borderColor: 'var(--d-sidebar-border)' }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-2 px-4"
            >
              <span style={{ color: isActive ? 'var(--d-accent)' : 'var(--d-sidebar-text)' }}>
                {item.icon}
              </span>
              <span className="text-[10px] font-medium" style={{ color: isActive ? 'var(--d-accent)' : 'var(--d-sidebar-text)' }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Main content */}
      <main
        className="flex-1 md:ml-64 pb-20 md:pb-0"
        style={{ backgroundColor: 'var(--d-content-bg)' }}
      >
        <div className="max-w-6xl mx-auto p-6 lg:p-8 stagger-children">
          {children}
        </div>
      </main>
    </div>
  )
}

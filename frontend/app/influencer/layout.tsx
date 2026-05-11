'use client'

import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const navItems = [
  {
    href: '/influencer/invitations',
    label: 'Invitations',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
  },
  {
    href: '/influencer/campaigns',
    label: 'Campaigns',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.43.816 1.035.816 1.73 0 .695-.321 1.3-.816 1.73m0-3.46a24.347 24.347 0 010 3.46" />
      </svg>
    ),
  },
  {
    href: '/influencer/profile',
    label: 'My Profile',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
]

export default function InfluencerLayout({ children }: { children: React.ReactNode }) {
  const { user, isInfluencer, loading } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && (!user || !isInfluencer)) {
      window.location.href = '/login'
    }
  }, [user, isInfluencer, loading])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: 'var(--d-content-bg)' }}>
        <div className="animate-spin w-8 h-8 border-4 rounded-full" style={{ borderColor: 'var(--d-accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }
  if (!user || !isInfluencer) return null

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
              C
            </div>
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--d-text)', fontFamily: 'var(--font-heading)' }}
            >
              Creator Hub
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

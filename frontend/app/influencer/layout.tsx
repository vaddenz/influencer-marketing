'use client'

import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const navItems = [
  {
    href: '/influencer/invitations',
    label: 'Invitations',
  },
  {
    href: '/influencer/campaigns',
    label: 'Campaigns',
  },
  {
    href: '/influencer/profile',
    label: 'My Profile',
  },
]

export default function InfluencerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isInfluencer, loading } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && (!user || !isInfluencer)) {
      window.location.href = '/login'
    }
  }, [user, isInfluencer, loading])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-light-gray">
        <div
          className="animate-spin w-8 h-8 border-4 rounded-full"
          style={{
            borderColor: '#0c0c0c',
            borderTopColor: 'transparent',
          }}
        />
      </div>
    )
  }
  if (!user || !isInfluencer) return null

  return (
    <div className="min-h-screen bg-light-gray text-ink">
      {/* Top Navbar */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-border-gray z-50 px-32">
        <div className="h-full flex items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div
              className="w-8 h-8 bg-ink rounded-lg flex items-center justify-center text-white font-bold text-sm"
              style={{ fontFamily: 'var(--font-heading)' }}>
              C
            </div>
            <span
              className="text-lg font-semibold"
              style={{ fontFamily: 'var(--font-heading)' }}>
              Creator Hub
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-light-gray text-ink'
                      : 'text-gray hover:bg-light-gray'
                  }`}>
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* User dropdown */}
          <div className="flex items-center gap-3 pl-4 pr-3 py-2 rounded-xl hover:bg-light-gray transition-colors">
            <div className="w-8 h-8 bg-ink rounded-full flex items-center justify-center text-white text-xs font-semibold">
              {(user.name || user.email)?.charAt(0).toUpperCase() || 'C'}
            </div>
            <span className="text-xs font-medium hidden sm:inline">
              {user.name || user.email}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-around items-center h-16 border-t bg-white border-border-gray">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 px-4 text-xs font-medium ${
                isActive ? 'text-ink' : 'text-gray'
              }`}>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Main content */}
      <main className="pt-24 lg:px-64 sm:px-32 px-6 pb-32 relative overflow-hidden">
        {/* Gradient orbs */}
        <div className="gradient-orb orb-1 -top-20 -left-20" />
        <div className="gradient-orb orb-2 top-40 -right-20" />
        <div className="gradient-orb orb-3 bottom-40 left-1/3" />

        <div className="relative z-10">{children}</div>
      </main>
    </div>
  )
}

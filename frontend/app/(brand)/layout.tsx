'use client'

import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { useEffect } from 'react'

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  const { user, isBrand, loading } = useAuth()

  useEffect(() => {
    if (!loading && (!user || !isBrand)) {
      window.location.href = '/login'
    }
  }, [user, isBrand, loading])

  if (loading) return <div className="p-8">Loading...</div>
  if (!user || !isBrand) return null

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white p-6">
        <div className="text-xl font-bold mb-8">Brand Dashboard</div>
        <nav className="space-y-4">
          <Link href="/dashboard" className="block hover:text-blue-400">Dashboard</Link>
          <Link href="/discover" className="block hover:text-blue-400">Discover</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8 bg-[var(--c-bg-secondary)]">{children}</main>
    </div>
  )
}

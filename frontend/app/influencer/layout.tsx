'use client'

import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { useEffect } from 'react'

export default function InfluencerLayout({ children }: { children: React.ReactNode }) {
  const { user, isInfluencer, loading } = useAuth()

  useEffect(() => {
    if (!loading && (!user || !isInfluencer)) {
      window.location.href = '/login'
    }
  }, [user, isInfluencer, loading])

  if (loading) return <div className="p-8">Loading...</div>
  if (!user || !isInfluencer) return null

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white p-6">
        <div className="text-xl font-bold mb-8">Influencer Portal</div>
        <nav className="space-y-4">
          <Link href="/influencer/invitations" className="block hover:text-blue-400">Invitations</Link>
          <Link href="/influencer/profile" className="block hover:text-blue-400">My Profile</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8 bg-[var(--c-bg-secondary)]">{children}</main>
    </div>
  )
}

'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'

interface Campaign {
  id: string
  title: string
  description: string
  status: string
}

export default function BrandDashboard() {
  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => apiFetch<Campaign[]>('/campaigns'),
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="section-title">My Campaigns</h1>
        <Link href="/campaigns/new" className="btn-primary">+ New Campaign</Link>
      </div>
      {isLoading && <p>Loading campaigns…</p>}
      {error && <p className="text-red-600">Failed to load campaigns.</p>}
      {!isLoading && !error && campaigns?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--c-text-secondary)] mb-4">No campaigns yet</p>
          <Link href="/campaigns/new" className="btn-primary">Create your first campaign</Link>
        </div>
      )}
      <div className="grid gap-4">
        {campaigns?.map((c) => (
          <div key={c.id} className="card">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{c.title}</h3>
                <p className="text-[var(--c-text-secondary)] text-sm mt-1">{c.description}</p>
                <span className="inline-block mt-2 text-xs px-2 py-1 rounded bg-[var(--c-accent-light)] text-[var(--c-accent)]">{c.status}</span>
              </div>
              <Link href={`/campaigns/${c.id}`} className="btn-text">View →</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

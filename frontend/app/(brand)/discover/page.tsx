'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'

interface InfluencerProfile {
  id: string
  displayName: string
  handle: string
  niche: string
  followerCount: number
  engagementRate: number
  locationCountry: string
  locationRegion: string
}

export default function DiscoverPage() {
  const [filters, setFilters] = useState({ q: '', niche: '', location: '', followersMin: '', followersMax: '', scope: '' })

  const { data: influencers, isLoading, isError } = useQuery({
    queryKey: ['influencers', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v) })
      return apiFetch<InfluencerProfile[]>(`/influencers?${params.toString()}`)
    },
  })

  return (
    <div>
      <h1 className="section-title mb-6">Discover Influencers</h1>
      <div className="flex gap-6">
        <div className="w-64 card h-fit">
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="space-y-3">
            <input placeholder="Keywords" className="input text-sm" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
            <select className="input text-sm" value={filters.niche} onChange={(e) => setFilters({ ...filters, niche: e.target.value })}>
              <option value="">All Niches</option>
              <option value="travel">Travel</option>
              <option value="fashion">Fashion</option>
              <option value="fitness">Fitness</option>
              <option value="food">Food</option>
              <option value="tech">Tech</option>
              <option value="beauty">Beauty</option>
            </select>
            <select className="input text-sm" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}>
              <option value="">All Countries</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="CN">China</option>
            </select>
            <div className="flex gap-2">
              <input placeholder="Min" className="input text-sm w-1/2" value={filters.followersMin} onChange={(e) => setFilters({ ...filters, followersMin: e.target.value })} />
              <input placeholder="Max" className="input text-sm w-1/2" value={filters.followersMax} onChange={(e) => setFilters({ ...filters, followersMax: e.target.value })} />
            </div>
            <select className="input text-sm" value={filters.scope} onChange={(e) => setFilters({ ...filters, scope: e.target.value })}>
              <option value="">All Scopes</option>
              <option value="nano">Nano (1K-10K)</option>
              <option value="micro">Micro (10K-100K)</option>
              <option value="macro">Macro (100K-1M)</option>
              <option value="mega">Mega (1M+)</option>
            </select>
          </div>
        </div>
        <div className="flex-1 space-y-4">
          {isLoading && <div>Loading...</div>}
          {isError && <div>Failed to load influencers.</div>}
          {!isLoading && !isError && influencers?.length === 0 && <div>No influencers found.</div>}
          {influencers?.map((i) => (
            <div key={i.id} className="card flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{i.handle}</h3>
                <p className="text-sm text-[var(--c-text-secondary)]">{i.niche} • {i.followerCount.toLocaleString()} followers • {i.engagementRate}% engagement • {i.locationCountry} {i.locationRegion}</p>
              </div>
              <Link href={`/influencers/${i.id}`} className="btn-text">View Profile →</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

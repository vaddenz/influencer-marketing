'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'

interface InfluencerProfile {
  id: string
  userId: string
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

  const getScopeLabel = (count: number) => {
    if (count < 10000) return 'Nano'
    if (count < 100000) return 'Micro'
    if (count < 1000000) return 'Macro'
    return 'Mega'
  }

  return (
    <div>
      {/* Page Header */}
      <div className="d-page-header">
        <div>
          <h1 className="d-section-title">Discover Creators</h1>
          <p style={{ color: 'var(--d-text-secondary)' }} className="mt-1">
            Find the perfect influencer for your brand
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="d-card lg:sticky lg:top-8">
            <div className="flex items-center gap-2 mb-5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: 'var(--d-text-secondary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
              </svg>
              <h3 className="font-semibold" style={{ color: 'var(--d-text)' }}>Filters</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--d-text-muted)' }}>Search</label>
                <input
                  placeholder="Keywords"
                  className="d-input text-sm"
                  value={filters.q}
                  onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--d-text-muted)' }}>Niche</label>
                <select className="d-select text-sm" value={filters.niche} onChange={(e) => setFilters({ ...filters, niche: e.target.value })}>
                  <option value="">All Niches</option>
                  <option value="travel">Travel</option>
                  <option value="fashion">Fashion</option>
                  <option value="fitness">Fitness</option>
                  <option value="food">Food</option>
                  <option value="tech">Tech</option>
                  <option value="beauty">Beauty</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--d-text-muted)' }}>Location</label>
                <select className="d-select text-sm" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })}>
                  <option value="">All Countries</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CN">China</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--d-text-muted)' }}>Followers</label>
                <div className="flex gap-2">
                  <input placeholder="Min" className="d-input text-sm w-1/2" value={filters.followersMin} onChange={(e) => setFilters({ ...filters, followersMin: e.target.value })} />
                  <input placeholder="Max" className="d-input text-sm w-1/2" value={filters.followersMax} onChange={(e) => setFilters({ ...filters, followersMax: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--d-text-muted)' }}>Scope</label>
                <select className="d-select text-sm" value={filters.scope} onChange={(e) => setFilters({ ...filters, scope: e.target.value })}>
                  <option value="">All Scopes</option>
                  <option value="nano">Nano (1K-10K)</option>
                  <option value="micro">Micro (10K-100K)</option>
                  <option value="macro">Macro (100K-1M)</option>
                  <option value="mega">Mega (1M+)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 rounded-full" style={{ borderColor: 'var(--d-accent)', borderTopColor: 'transparent' }} />
            </div>
          )}

          {isError && (
            <div className="d-card" style={{ borderColor: 'var(--d-accent-light)', backgroundColor: 'var(--d-accent-light)' }}>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--d-accent)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p style={{ color: 'var(--d-accent)' }} className="font-medium">Failed to load influencers.</p>
              </div>
            </div>
          )}

          {!isLoading && !isError && influencers?.length === 0 && (
            <div className="d-card">
              <div className="d-empty">
                <div className="d-empty-icon">🔍</div>
                <p className="d-empty-title">No creators found</p>
                <p className="d-empty-desc">Try adjusting your filters to find more results.</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {influencers?.map((i) => (
              <div key={i.id} className="d-card group">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ backgroundColor: 'var(--d-content-bg-warm)', color: 'var(--d-accent)' }}>
                    {i.handle.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-base" style={{ color: 'var(--d-text)' }}>{i.handle}</h3>
                      <span className="d-tag text-[10px] py-1 px-2">{i.niche}</span>
                      <span className="d-tag d-tag-neutral text-[10px] py-1 px-2">{getScopeLabel(i.followerCount)}</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--d-text-secondary)' }}>
                      {i.followerCount.toLocaleString()} followers · {i.engagementRate}% engagement · {i.locationCountry} {i.locationRegion}
                    </p>
                  </div>

                  {/* CTA */}
                  <Link href={`/brand/influencers/${i.userId}`} className="d-btn-primary flex-shrink-0 text-sm">
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

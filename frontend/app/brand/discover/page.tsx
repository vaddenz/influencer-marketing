'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslations } from 'next-intl'

interface InfluencerProfile {
  id: string
  userId: string
  displayName: string
  handle: string
  bio?: string
  niche: string
  followerCount: number
  engagementRate: number
  platforms?: Record<string, string>
  locationCountry: string
  locationRegion: string
  profileImageUrl?: string
}

export default function DiscoverPage() {
  const t = useTranslations('DiscoverPage')
  const [filters, setFilters] = useState({
    q: '',
    niche: '',
    location: '',
    followersMin: '',
    followersMax: '',
    scope: '',
  })

  const {
    data: influencers,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['influencers', filters],
    queryFn: () => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, v)
      })
      return apiFetch<InfluencerProfile[]>(`/influencers?${params.toString()}`)
    },
  })

  const getScopeLabel = (count: number) => {
    if (count < 10000) return 'Nano'
    if (count < 100000) return 'Micro'
    if (count < 1000000) return 'Macro'
    return 'Mega'
  }

  const getAvatarBg = (name: string) => {
    const colors = [
      'bg-orange-100',
      'bg-blue-100',
      'bg-pink-100',
      'bg-green-100',
      'bg-purple-100',
    ]
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8 animate-fade-up relative z-10">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-heading)' }}>
          Discover Creators
        </h1>
        <p className="text-gray mt-1 text-sm">
          Find the perfect influencer for your brand
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-72 flex-shrink-0 animate-fade-up delay-2 relative z-10">
          <div className="d-card lg:sticky lg:top-8 hover-lift">
            <div className="flex items-center gap-2 mb-5">
              <svg
                className="w-5 h-5 text-gray"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <h3
                className="font-semibold text-base"
                style={{ fontFamily: 'var(--font-heading)' }}>
                Filters
              </h3>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-gray uppercase tracking-wider block mb-2">
                  Search
                </label>
                <input
                  placeholder="Keywords"
                  className="w-full px-4 py-3 rounded-xl border border-border-gray text-sm focus:outline-none focus:border-ink transition-colors"
                  value={filters.q}
                  onChange={(e) =>
                    setFilters({ ...filters, q: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray uppercase tracking-wider block mb-2">
                  Niche
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-border-gray text-sm appearance-none bg-white focus:outline-none focus:border-ink transition-colors"
                    value={filters.niche}
                    onChange={(e) =>
                      setFilters({ ...filters, niche: e.target.value })
                    }>
                    <option value="">All Niches</option>
                    <option value="travel">Travel</option>
                    <option value="fashion">Fashion</option>
                    <option value="fitness">Fitness</option>
                    <option value="food">Food</option>
                    <option value="tech">Tech</option>
                    <option value="beauty">Beauty</option>
                  </select>
                  <svg
                    className="w-4 h-4 text-gray absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray uppercase tracking-wider block mb-2">
                  Location
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-border-gray text-sm appearance-none bg-white focus:outline-none focus:border-ink transition-colors"
                    value={filters.location}
                    onChange={(e) =>
                      setFilters({ ...filters, location: e.target.value })
                    }>
                    <option value="">All Countries</option>
                    <option value="US">United States</option>
                    <option value="GB">United Kingdom</option>
                    <option value="CN">China</option>
                  </select>
                  <svg
                    className="w-4 h-4 text-gray absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray uppercase tracking-wider block mb-2">
                  Followers
                </label>
                <div className="flex gap-3">
                  <input
                    placeholder="Min"
                    className="w-1/2 px-4 py-3 rounded-xl border border-border-gray text-sm focus:outline-none focus:border-ink transition-colors"
                    value={filters.followersMin}
                    onChange={(e) =>
                      setFilters({ ...filters, followersMin: e.target.value })
                    }
                  />
                  <input
                    placeholder="Max"
                    className="w-1/2 px-4 py-3 rounded-xl border border-border-gray text-sm focus:outline-none focus:border-ink transition-colors"
                    value={filters.followersMax}
                    onChange={(e) =>
                      setFilters({ ...filters, followersMax: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-gray uppercase tracking-wider block mb-2">
                  Scope
                </label>
                <div className="relative">
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-border-gray text-sm appearance-none bg-white focus:outline-none focus:border-ink transition-colors"
                    value={filters.scope}
                    onChange={(e) =>
                      setFilters({ ...filters, scope: e.target.value })
                    }>
                    <option value="">All Scopes</option>
                    <option value="nano">Nano (1K-10K)</option>
                    <option value="micro">Micro (10K-100K)</option>
                    <option value="macro">Macro (100K-1M)</option>
                    <option value="mega">Mega (1M+)</option>
                  </select>
                  <svg
                    className="w-4 h-4 text-gray absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 relative z-10">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div
                className="animate-spin w-8 h-8 border-4 rounded-full"
                style={{
                  borderColor: '#0c0c0c',
                  borderTopColor: 'transparent',
                }}
              />
            </div>
          )}

          {isError && (
            <div className="d-card">
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
                <p className="font-medium text-ink">
                  Failed to load influencers.
                </p>
              </div>
            </div>
          )}

          {!isLoading && !isError && influencers && influencers.length > 0 && (
            <p className="text-sm text-gray mb-4">
              {t('resultCount', { count: influencers.length })}
            </p>
          )}

          {!isLoading && !isError && influencers?.length === 0 && (
            <div className="d-card">
              <div className="d-empty">
                <div className="d-empty-icon">🔍</div>
                <p className="d-empty-title">No creators found</p>
                <p className="d-empty-desc">
                  Try adjusting your filters to find more results.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {influencers?.map((influencer, index) => (
              <div
                key={influencer.id}
                className={`d-card flex items-center gap-5 hover-lift animate-fade-up delay-${Math.min(index + 3, 6)}`}>
                {/* Avatar */}
                {influencer.profileImageUrl ? (
                  <Image
                    src={influencer.profileImageUrl}
                    alt={influencer.displayName}
                    width={56}
                    height={56}
                    unoptimized
                    className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${getAvatarBg(influencer.displayName)}`}>
                    {influencer.handle.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3
                      className="font-semibold text-base truncate max-w-full"
                      style={{ fontFamily: 'var(--font-heading)' }}
                      title={influencer.displayName}>
                      {influencer.displayName}
                    </h3>
                    <span
                      className="text-gray text-sm truncate max-w-[200px]"
                      title={influencer.handle}>
                      {influencer.handle.length > 24
                        ? `${influencer.handle.substring(0, 24)}...`
                        : influencer.handle}
                    </span>
                    <span className="px-2.5 py-0.5 bg-ink/10 text-ink text-xs font-medium rounded-full whitespace-nowrap">
                      {influencer.niche}
                    </span>
                    <span className="px-2.5 py-0.5 bg-light-gray text-gray text-xs font-medium rounded-full whitespace-nowrap">
                      {getScopeLabel(influencer.followerCount)}
                    </span>
                  </div>
                  <p
                    className="text-gray text-sm mb-2 truncate"
                    title={`${influencer.followerCount.toLocaleString()} followers · ${influencer.engagementRate}% engagement · ${influencer.locationCountry} ${influencer.locationRegion}`}>
                    {influencer.followerCount.toLocaleString()} followers ·{' '}
                    {influencer.engagementRate}% engagement ·{' '}
                    {influencer.locationCountry} {influencer.locationRegion}
                  </p>
                  {influencer.bio && (
                    <p
                      className="text-gray text-sm mb-2 line-clamp-2"
                      title={influencer.bio}>
                      {influencer.bio}
                    </p>
                  )}
                  {influencer.platforms &&
                    Object.keys(influencer.platforms).length > 0 && (
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {Object.entries(influencer.platforms).map(
                          ([platform, handle]) => (
                            <span
                              key={platform}
                              className="px-3 py-1 bg-light-gray text-gray text-xs rounded-full capitalize inline-block max-w-full truncate"
                              title={`${platform} | ${handle}`}>
                              {platform} |{' '}
                              {typeof handle === 'string' && handle.length > 24
                                ? `${handle.substring(0, 24)}...`
                                : (handle as React.ReactNode)}
                            </span>
                          )
                        )}
                      </div>
                    )}
                </div>

                {/* CTA */}
                <Link
                  href={`/brand/influencers/${influencer.userId}`}
                  className="d-btn-primary flex-shrink-0 text-sm">
                  View Profile
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

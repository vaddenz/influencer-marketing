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
  const {
    data: campaigns,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => apiFetch<Campaign[]>('/campaigns'),
  })

  const getStatusTag = (status: string) => {
    return (
      <span className="px-3 py-1 bg-light-gray text-gray text-xs font-medium rounded-full">
        {status}
      </span>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-start justify-between mb-10 animate-fade-up relative z-10">
        <div>
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Campaigns
          </h1>
          <p className="text-gray mt-1 text-sm">
            Manage your influencer marketing campaigns
          </p>
        </div>
        <Link
          href="/brand/campaigns/new"
          className="d-btn-primary"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          New Campaign
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8 relative z-10">
        <div className="d-card hover-lift animate-fade-up delay-1">
          <div className="d-stat-value">{campaigns?.length ?? 0}</div>
          <div className="d-stat-label">Total Campaigns</div>
        </div>
        <div className="d-card hover-lift animate-fade-up delay-2">
          <div className="d-stat-value">
            {campaigns?.filter((c) => c.status.toLowerCase() === 'active')
              .length ?? 0}
          </div>
          <div className="d-stat-label">Active</div>
        </div>
        <div className="d-card hover-lift animate-fade-up delay-3">
          <div className="d-stat-value">
            {campaigns?.filter((c) => c.status.toLowerCase() === 'completed')
              .length ?? 0}
          </div>
          <div className="d-stat-label">Completed</div>
        </div>
      </div>

      {/* Campaigns List */}
      {isLoading && (
        <div className="flex items-center justify-center h-64 relative z-10">
          <div
            className="animate-spin w-8 h-8 border-4 rounded-full"
            style={{
              borderColor: '#0c0c0c',
              borderTopColor: 'transparent',
            }}
          />
        </div>
      )}

      {error && (
        <div className="d-card animate-fade-up relative z-10">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
              />
            </svg>
            <p className="font-medium text-ink">Failed to load campaigns.</p>
          </div>
        </div>
      )}

      {!isLoading && !error && campaigns?.length === 0 && (
        <div className="d-card animate-fade-up relative z-10">
          <div className="d-empty">
            <div className="d-empty-icon">📋</div>
            <p className="d-empty-title">No campaigns yet</p>
            <p className="d-empty-desc">
              Create your first campaign to start collaborating with
              influencers.
            </p>
            <Link href="/brand/campaigns/new" className="d-btn-primary">
              Create your first campaign
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-4 relative z-10">
        {campaigns?.map((c, index) => (
          <div
            key={c.id}
            className={`d-card flex items-center justify-between group hover:shadow-soft transition-shadow hover-lift animate-fade-up delay-${Math.min(index + 4, 6)}`}
          >
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3
                  className="font-semibold text-base"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {c.title}
                </h3>
                {getStatusTag(c.status)}
              </div>
              <p className="text-gray text-sm">{c.description}</p>
            </div>
            <Link
              href={`/brand/campaigns/${c.id}`}
              className="text-ink font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all flex-shrink-0"
            >
              View details <span>→</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

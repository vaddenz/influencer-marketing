'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import type { Invitation } from '@/lib/types'

export default function InfluencerCampaignsPage() {
  const {
    data: invitations,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => apiFetch<Invitation[]>('/invitations'),
  })

  const accepted = invitations?.filter((i) => i.status === 'accepted') ?? []

  const campaigns = accepted.reduce<Invitation['campaign'][]>((acc, i) => {
    if (!acc.find((c) => c.id === i.campaign.id)) {
      acc.push(i.campaign)
    }
    return acc
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 relative z-10">
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

  if (isError) {
    return (
      <div className="d-card animate-fade-up relative z-10">
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
          <p className="font-medium text-ink">Failed to load campaigns</p>
        </div>
        <p className="text-sm mt-1 text-gray">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-10 animate-fade-up relative z-10">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-heading)' }}>
          My Campaigns
        </h1>
        <p className="text-gray mt-1 text-sm">
          View and manage your active collaborations
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10 relative z-10">
        <div className="d-card text-center hover-lift animate-fade-up delay-1">
          <div className="d-stat-value">{campaigns.length}</div>
          <div className="d-stat-label">Total</div>
        </div>
        <div className="d-card text-center hover-lift animate-fade-up delay-2">
          <div className="d-stat-value">
            {accepted.filter((i) => i.status === 'accepted').length}
          </div>
          <div className="d-stat-label">Active</div>
        </div>
        <div className="d-card text-center hover-lift animate-fade-up delay-3">
          <div className="d-stat-value">
            {accepted.filter((i) => i.status === 'completed').length}
          </div>
          <div className="d-stat-label">Completed</div>
        </div>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <div className="d-card animate-fade-up delay-4 relative z-10">
          <div className="d-empty py-8">
            <div className="d-empty-icon">📋</div>
            <p className="d-empty-title">No campaigns yet</p>
            <p className="d-empty-desc">
              Accepted invitations will appear here as active campaigns.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4 relative z-10">
          {campaigns.map((c, index) => (
            <Link
              key={c.id}
              href={`/influencer/campaigns/${c.id}`}
              className={`d-card block group hover:shadow-soft transition-shadow hover-lift animate-fade-up delay-${Math.min(index + 4, 6)}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-semibold text-base"
                    style={{ fontFamily: 'var(--font-heading)' }}>
                    {c.title}
                  </h3>
                  <p className="text-gray text-sm mt-0.5">
                    {c.brand.brandProfile.companyName}
                  </p>
                </div>
                <span className="text-ink font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all flex-shrink-0">
                  View details <span>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

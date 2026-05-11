'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import type { Invitation } from '@/lib/types'

export default function InfluencerCampaignsPage() {
  const { data: invitations, isLoading, isError, error } = useQuery({
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 rounded-full" style={{ borderColor: 'var(--d-accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="d-card" style={{ borderColor: 'var(--d-accent-light)', backgroundColor: 'var(--d-accent-light)' }}>
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--d-accent)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p style={{ color: 'var(--d-accent)' }} className="font-medium">Failed to load campaigns</p>
        </div>
        <p className="text-sm mt-1" style={{ color: 'var(--d-text-secondary)' }}>{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="d-page-header">
        <div>
          <h1 className="d-section-title">My Campaigns</h1>
          <p style={{ color: 'var(--d-text-secondary)' }} className="mt-1">
            View and manage your active collaborations
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="d-card text-center">
          <div className="d-stat-value">{campaigns.length}</div>
          <div className="d-stat-label">Total</div>
        </div>
        <div className="d-card text-center">
          <div className="d-stat-value">{accepted.filter((i) => i.status === 'accepted').length}</div>
          <div className="d-stat-label">Active</div>
        </div>
        <div className="d-card text-center">
          <div className="d-stat-value">{accepted.filter((i) => i.status === 'completed').length}</div>
          <div className="d-stat-label">Completed</div>
        </div>
      </div>

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <div className="d-card">
          <div className="d-empty py-8">
            <div className="d-empty-icon">📋</div>
            <p className="d-empty-title">No campaigns yet</p>
            <p className="d-empty-desc">Accepted invitations will appear here as active campaigns.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/influencer/campaigns/${c.id}`}
              className="d-card block group"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate" style={{ color: 'var(--d-text)' }}>
                    {c.title}
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--d-text-secondary)' }}>
                    {c.brand.brandProfile.companyName}
                  </p>
                </div>
                <span className="d-btn-text flex-shrink-0">
                  View details
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

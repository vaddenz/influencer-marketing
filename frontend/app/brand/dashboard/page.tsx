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

  const getStatusTag = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <span className="d-tag d-tag-success">{status}</span>
      case 'draft':
        return <span className="d-tag d-tag-neutral">{status}</span>
      case 'completed':
        return <span className="d-tag d-tag-success">{status}</span>
      default:
        return <span className="d-tag d-tag-neutral">{status}</span>
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="d-page-header">
        <div>
          <h1 className="d-section-title">Campaigns</h1>
          <p style={{ color: 'var(--d-text-secondary)' }} className="mt-1">
            Manage your influencer marketing campaigns
          </p>
        </div>
        <Link href="/brand/campaigns/new" className="d-btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Campaign
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="d-card">
          <div className="d-stat-value">{campaigns?.length ?? 0}</div>
          <div className="d-stat-label">Total Campaigns</div>
        </div>
        <div className="d-card">
          <div className="d-stat-value">
            {campaigns?.filter((c) => c.status.toLowerCase() === 'active').length ?? 0}
          </div>
          <div className="d-stat-label">Active</div>
        </div>
        <div className="d-card">
          <div className="d-stat-value">
            {campaigns?.filter((c) => c.status.toLowerCase() === 'completed').length ?? 0}
          </div>
          <div className="d-stat-label">Completed</div>
        </div>
      </div>

      {/* Campaigns List */}
      {isLoading && (
        <div className="flex items-center justify-center h-64">
          <div
            className="animate-spin w-8 h-8 border-4 rounded-full"
            style={{ borderColor: 'var(--d-accent)', borderTopColor: 'transparent' }}
          />
        </div>
      )}

      {error && (
        <div className="d-card" style={{ borderColor: 'var(--d-accent-light)', backgroundColor: 'var(--d-accent-light)' }}>
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--d-accent)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p style={{ color: 'var(--d-accent)' }} className="font-medium">Failed to load campaigns.</p>
          </div>
        </div>
      )}

      {!isLoading && !error && campaigns?.length === 0 && (
        <div className="d-card">
          <div className="d-empty">
            <div className="d-empty-icon">📋</div>
            <p className="d-empty-title">No campaigns yet</p>
            <p className="d-empty-desc">Create your first campaign to start collaborating with influencers.</p>
            <Link href="/brand/campaigns/new" className="d-btn-primary">
              Create your first campaign
            </Link>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {campaigns?.map((c) => (
          <div key={c.id} className="d-card group">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg truncate" style={{ color: 'var(--d-text)' }}>
                    {c.title}
                  </h3>
                  {getStatusTag(c.status)}
                </div>
                <p className="text-sm line-clamp-2" style={{ color: 'var(--d-text-secondary)' }}>
                  {c.description}
                </p>
              </div>
              <Link
                href={`/brand/campaigns/${c.id}`}
                className="d-btn-text flex-shrink-0"
              >
                View details
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

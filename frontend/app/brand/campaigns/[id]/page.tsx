'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface CampaignDetail {
  id: string
  title: string
  description: string
  status: string
  invitations: {
    id: string
    status: string
    influencer: {
      id: string
      userId: string
      influencerProfile: {
        handle: string
        displayName?: string
        profileImageUrl?: string
      }
    }
  }[]
  deliverables: {
    id: string
    description: string
    status: string
    influencerId: string
  }[]
}

export default function CampaignDetailPage() {
  const { id: rawId } = useParams()
  const id =
    typeof rawId === 'string'
      ? rawId
      : Array.isArray(rawId)
        ? rawId[0]
        : undefined

  const {
    data: campaign,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => apiFetch<CampaignDetail>(`/campaigns/${id}`),
    enabled: !!id,
  })

  if (!id)
    return <div className="d-card text-center py-12">Invalid campaign ID.</div>
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div
          className="animate-spin w-8 h-8 border-4 rounded-full"
          style={{
            borderColor: 'var(--d-accent)',
            borderTopColor: 'transparent',
          }}
        />
      </div>
    )
  }
  if (isError || !campaign) {
    return (
      <div
        className="d-card"
        style={{
          borderColor: 'var(--d-accent-light)',
          backgroundColor: 'var(--d-accent-light)',
        }}>
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{ color: 'var(--d-accent)' }}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p style={{ color: 'var(--d-accent)' }} className="font-medium">
            Failed to load campaign.
          </p>
        </div>
      </div>
    )
  }

  const getStatusTag = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return <span className="d-tag d-tag-success">{status}</span>
      case 'pending':
        return <span className="d-tag d-tag-warning">{status}</span>
      case 'declined':
        return (
          <span
            className="d-tag"
            style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
            {status}
          </span>
        )
      default:
        return <span className="d-tag d-tag-neutral">{status}</span>
    }
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div
        className="flex items-center gap-2 mb-6 text-sm"
        style={{ color: 'var(--d-text-muted)' }}>
        <Link
          href="/brand/dashboard"
          className="hover:underline"
          style={{ color: 'var(--d-text-secondary)' }}>
          Campaigns
        </Link>
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 4.5l7.5 7.5-7.5 7.5"
          />
        </svg>
        <span
          style={{ color: 'var(--d-text)' }}
          className="font-medium truncate max-w-xs">
          {campaign.title}
        </span>
      </div>

      {/* Header */}
      <div className="d-card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="d-section-title">{campaign.title}</h1>
              <span className="d-tag d-tag-neutral">{campaign.status}</span>
            </div>
            <p
              style={{ color: 'var(--d-text-secondary)' }}
              className="text-base leading-relaxed max-w-2xl">
              {campaign.description}
            </p>
          </div>
        </div>
      </div>

      {/* Participants */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            style={{ color: 'var(--d-text-secondary)' }}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.295-2.176-.843-3.104M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
          <h2
            className="font-semibold text-lg"
            style={{ color: 'var(--d-text)' }}>
            Participants
          </h2>
          <span className="d-tag d-tag-neutral text-[10px] py-1 px-2">
            {campaign.invitations?.length ?? 0}
          </span>
        </div>

        <div className="space-y-3">
          {campaign.invitations?.map((i) => (
            <Link
              key={i.id}
              href={`/brand/influencers/${i.influencer.userId}`}
              className="d-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group hover:opacity-80 transition-opacity">
              <div className="flex items-center gap-3">
                {i.influencer?.influencerProfile?.profileImageUrl ? (
                  <Image
                    src={i.influencer.influencerProfile.profileImageUrl}
                    alt={
                      i.influencer.influencerProfile.displayName ||
                      i.influencer.influencerProfile.handle
                    }
                    width={40}
                    height={40}
                    unoptimized
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                    style={{
                      backgroundColor: 'var(--d-content-bg-warm)',
                      color: 'var(--d-accent)',
                    }}>
                    {i.influencer?.influencerProfile?.handle
                      ?.charAt(0)
                      .toUpperCase() ?? '?'}
                  </div>
                )}
                <div className="flex flex-col">
                  <span
                    className="font-medium"
                    style={{ color: 'var(--d-text)' }}>
                    {i.influencer?.influencerProfile?.displayName ||
                      i.influencer?.influencerProfile?.handle}
                  </span>
                  {i.influencer?.influencerProfile?.displayName && (
                    <span
                      className="text-xs"
                      style={{ color: 'var(--d-text-secondary)' }}>
                      {i.influencer.influencerProfile.handle}
                    </span>
                  )}
                </div>
              </div>
              {getStatusTag(i.status)}
            </Link>
          ))}
          {(!campaign.invitations || campaign.invitations.length === 0) && (
            <div className="d-card">
              <div className="d-empty py-8">
                <div className="d-empty-icon">👥</div>
                <p className="d-empty-title">No participants yet</p>
                <p className="d-empty-desc">
                  Invite influencers to join this campaign.
                </p>
                <Link href="/brand/discover" className="d-btn-primary text-sm">
                  Find Creators
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deliverables */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            style={{ color: 'var(--d-text-secondary)' }}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2
            className="font-semibold text-lg"
            style={{ color: 'var(--d-text)' }}>
            Deliverables
          </h2>
          <span className="d-tag d-tag-neutral text-[10px] py-1 px-2">
            {campaign.deliverables?.length ?? 0}
          </span>
        </div>

        <div className="space-y-3">
          {campaign.deliverables?.map((d) => (
            <div
              key={d.id}
              className="d-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <span style={{ color: 'var(--d-text)' }}>{d.description}</span>
              <span
                className={
                  d.status === 'completed'
                    ? 'd-tag d-tag-success'
                    : 'd-tag d-tag-neutral'
                }>
                {d.status === 'completed' ? '✓ ' : ''}
                {d.status}
              </span>
            </div>
          ))}
          {(!campaign.deliverables || campaign.deliverables.length === 0) && (
            <div className="d-card">
              <div className="d-empty py-8">
                <div className="d-empty-icon">📦</div>
                <p className="d-empty-title">No deliverables yet</p>
                <p className="d-empty-desc">
                  Deliverables will appear here once participants start
                  submitting work.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

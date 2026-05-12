'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import SopGenerateModal from './components/sop-generate-modal'
import SopCard from './components/sop-card'

interface SopStep {
  name: string
  description: string
  dueDateOffset: number
  requirements: string[]
}

interface Sop {
  id: string
  campaignId: string
  title: string
  publishDate: string
  targetMarket: string
  influencerType: string
  sellingPoints: string[]
  steps: SopStep[]
  status: string
  createdAt: string
  updatedAt: string
}

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
  sop: Sop | null
}

export default function CampaignDetailPage() {
  const { id: rawId } = useParams()
  const id =
    typeof rawId === 'string'
      ? rawId
      : Array.isArray(rawId)
        ? rawId[0]
        : undefined

  const [showGenerateModal, setShowGenerateModal] = useState(false)

  const {
    data: campaign,
    isLoading,
    isError,
    refetch,
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

      {/* SOP Section */}
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
              d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
            />
          </svg>
          <h2
            className="font-semibold text-lg"
            style={{ color: 'var(--d-text)' }}>
            SOP
          </h2>
        </div>

        {campaign.sop ? (
          <SopCard sop={campaign.sop} onRefresh={refetch} />
        ) : (
          <div className="d-card">
            <div className="d-empty py-8">
              <div className="d-empty-icon">📋</div>
              <p className="d-empty-title">No SOP yet</p>
              <p className="d-empty-desc">
                Generate an AI-powered SOP to guide your influencers through the
                campaign workflow.
              </p>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="d-btn-primary text-sm">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                  />
                </svg>
                Generate SOP
              </button>
            </div>
          </div>
        )}
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
              href={`/brand/influencers/${i.influencer.id}`}
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

      {showGenerateModal && (
        <SopGenerateModal
          campaignId={campaign.id}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => {
            setShowGenerateModal(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}

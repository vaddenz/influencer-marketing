'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

interface InfluencerProfile {
  id: string
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

interface Campaign {
  id: string
  title: string
}

export default function InfluencerProfilePage() {
  const { id } = useParams()
  const [showInvite, setShowInvite] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [message, setMessage] = useState('')

  const {
    data: profile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['influencer', id],
    queryFn: () => apiFetch<InfluencerProfile>(`/influencers/${id}/profile`),
  })

  const { data: campaigns } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: () => apiFetch<Campaign[]>('/campaigns'),
  })

  const inviteMutation = useMutation({
    mutationFn: () =>
      apiFetch('/invitations', {
        method: 'POST',
        body: JSON.stringify({
          campaignId: selectedCampaign,
          influencerId: id,
          message,
        }),
      }),
    onSuccess: () => {
      alert('Invitation sent!')
      setShowInvite(false)
    },
  })

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
  if (isError || !profile) {
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
            Failed to load profile.
          </p>
        </div>
      </div>
    )
  }

  const getScopeLabel = (count: number) => {
    if (count < 10000) return 'Nano'
    if (count < 100000) return 'Micro'
    if (count < 1000000) return 'Macro'
    return 'Mega'
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div
        className="flex items-center gap-2 mb-6 text-sm"
        style={{ color: 'var(--d-text-muted)' }}>
        <Link
          href="/brand/discover"
          className="hover:underline"
          style={{ color: 'var(--d-text-secondary)' }}>
          Discover
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
          {profile.displayName}
        </span>
      </div>

      {/* Profile Header */}
      <div className="d-card mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          {profile.profileImageUrl ? (
            <Image
              src={profile.profileImageUrl}
              alt={profile.displayName}
              width={80}
              height={80}
              unoptimized
              className="w-20 h-20 rounded-2xl object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0"
              style={{
                backgroundColor: 'var(--d-content-bg-warm)',
                color: 'var(--d-accent)',
              }}>
              {profile.handle.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <h1 className="d-section-title">{profile.displayName}</h1>
              <div className="flex items-center gap-2">
                <span className="d-tag">{profile.niche}</span>
                <span className="d-tag d-tag-neutral">
                  {getScopeLabel(profile.followerCount)}
                </span>
              </div>
            </div>
            <p style={{ color: 'var(--d-text-secondary)' }} className="text-sm">
              {profile.handle}
            </p>
            <p style={{ color: 'var(--d-text-secondary)' }} className="text-sm">
              {profile.locationCountry} {profile.locationRegion}
            </p>
          </div>
          <button
            onClick={() => setShowInvite(true)}
            className="d-btn-primary flex-shrink-0">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            Invite
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="d-card text-center">
          <div className="d-stat-value">
            {profile.followerCount.toLocaleString()}
          </div>
          <div className="d-stat-label">Followers</div>
        </div>
        <div className="d-card text-center">
          <div className="d-stat-value">{profile.engagementRate}%</div>
          <div className="d-stat-label">Engagement</div>
        </div>
        <div className="d-card text-center">
          <div className="d-stat-value">
            {profile.platforms ? Object.keys(profile.platforms).length : 0}
          </div>
          <div className="d-stat-label">Platforms</div>
        </div>
        <div className="d-card text-center">
          <div className="d-stat-value">
            {getScopeLabel(profile.followerCount)}
          </div>
          <div className="d-stat-label">Tier</div>
        </div>
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="d-card mb-6">
          <h3
            className="font-semibold mb-3 flex items-center gap-2"
            style={{ color: 'var(--d-text)' }}>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              style={{ color: 'var(--d-text-secondary)' }}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            About
          </h3>
          <p
            style={{ color: 'var(--d-text-secondary)' }}
            className="text-sm leading-relaxed">
            {profile.bio}
          </p>
        </div>
      )}

      {/* Platforms */}
      {profile.platforms && Object.keys(profile.platforms).length > 0 && (
        <div className="d-card mb-6">
          <h3
            className="font-semibold mb-4 flex items-center gap-2"
            style={{ color: 'var(--d-text)' }}>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              style={{ color: 'var(--d-text-secondary)' }}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
              />
            </svg>
            Platforms
          </h3>
          <div className="space-y-3">
            {Object.entries(profile.platforms).map(([platform, handle]) => (
              <div
                key={platform}
                className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ backgroundColor: 'var(--d-content-bg)' }}>
                <div className="flex items-center gap-3">
                  <span
                    className="font-medium text-sm capitalize"
                    style={{ color: 'var(--d-text)' }}>
                    {platform}
                  </span>
                </div>
                <span
                  className="text-sm"
                  style={{ color: 'var(--d-text-secondary)' }}>
                  {handle}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <div className="d-card w-full max-w-md animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <h3
                className="font-semibold text-lg"
                style={{ color: 'var(--d-text)' }}>
                Invite {profile.displayName}
              </h3>
              <button
                onClick={() => setShowInvite(false)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  style={{ color: 'var(--d-text-muted)' }}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--d-text)' }}>
                  Select Campaign
                </label>
                <select
                  className="d-select"
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}>
                  <option value="">Choose a campaign...</option>
                  {campaigns?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: 'var(--d-text)' }}>
                  Personal Message
                </label>
                <textarea
                  placeholder="Hi! We'd love to collaborate with you on..."
                  className="d-input"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              {inviteMutation.error && (
                <div
                  className="p-3 rounded-lg text-sm font-medium"
                  style={{
                    backgroundColor: 'var(--d-accent-light)',
                    color: 'var(--d-accent)',
                  }}>
                  {inviteMutation.error.message}
                </div>
              )}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => inviteMutation.mutate()}
                  disabled={!selectedCampaign || inviteMutation.isPending}
                  className="d-btn-primary">
                  {inviteMutation.isPending ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      Sending...
                    </>
                  ) : (
                    'Send Invitation'
                  )}
                </button>
                <button
                  onClick={() => setShowInvite(false)}
                  className="d-btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

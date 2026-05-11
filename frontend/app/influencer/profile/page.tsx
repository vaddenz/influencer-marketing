'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useState } from 'react'

interface InfluencerProfile {
  id: string
  displayName: string
  handle: string
  bio?: string
  niche: string
  followerCount: number
  engagementRate: number
  platforms: { platform: string; url: string; followers: number }[]
  locationCountry: string
  locationRegion: string
}

export default function InfluencerProfilePage() {
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => apiFetch<InfluencerProfile>('/influencers/me/profile'),
  })

  const [form, setForm] = useState<Partial<InfluencerProfile>>({})

  const updateMutation = useMutation({
    mutationFn: () =>
      apiFetch('/influencers/me/profile', {
        method: 'PATCH',
        body: JSON.stringify(form),
      }),
    onSuccess: () => {
      refetch()
      alert('Profile updated!')
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
            Failed to load profile
          </p>
        </div>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--d-text-secondary)' }}>
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="d-page-header">
        <div>
          <h1 className="d-section-title">My Profile</h1>
          <p style={{ color: 'var(--d-text-secondary)' }} className="mt-1">
            Manage your creator profile and public information
          </p>
        </div>
      </div>

      {updateMutation.isError && (
        <div
          className="mb-6 p-4 rounded-xl text-sm font-medium"
          style={{
            backgroundColor: 'var(--d-accent-light)',
            color: 'var(--d-accent)',
          }}>
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0"
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
            {updateMutation.error instanceof Error
              ? updateMutation.error.message
              : 'Failed to update profile. Please try again.'}
          </div>
        </div>
      )}

      <div className="d-card">
        {/* Avatar preview */}
        <div
          className="flex items-center gap-4 mb-8 pb-6"
          style={{ borderBottom: '1px solid var(--d-card-border)' }}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold"
            style={{
              backgroundColor: 'var(--d-content-bg-warm)',
              color: 'var(--d-accent)',
            }}>
            {profile.handle.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--d-text)' }}>
              {profile.displayName || profile.handle}
            </p>
            <p className="text-sm" style={{ color: 'var(--d-text-secondary)' }}>
              @{profile.handle}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--d-text)' }}>
                Display Name
              </label>
              <input
                className="d-input"
                defaultValue={profile.displayName}
                placeholder="Your public display name"
                onChange={(e) =>
                  setForm({ ...form, displayName: e.target.value })
                }
              />
            </div>
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--d-text)' }}>
                Handle
              </label>
              <input
                className="d-input"
                defaultValue={profile.handle}
                placeholder="@yourhandle"
                onChange={(e) => setForm({ ...form, handle: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--d-text)' }}>
              Bio
            </label>
            <textarea
              className="d-input"
              rows={4}
              defaultValue={profile.bio}
              placeholder="Tell brands about yourself and your content..."
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--d-text)' }}>
              Niche
            </label>
            <input
              className="d-input"
              defaultValue={profile.niche}
              placeholder="e.g., Fashion, Travel, Fitness"
              onChange={(e) => setForm({ ...form, niche: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--d-text)' }}>
                Followers
              </label>
              <input
                type="number"
                className="d-input"
                defaultValue={profile.followerCount}
                placeholder="0"
                onChange={(e) =>
                  setForm({
                    ...form,
                    followerCount: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--d-text)' }}>
                Engagement Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                className="d-input"
                defaultValue={profile.engagementRate}
                placeholder="0.0"
                onChange={(e) =>
                  setForm({
                    ...form,
                    engagementRate: parseFloat(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--d-text)' }}>
                Country
              </label>
              <input
                className="d-input"
                defaultValue={profile.locationCountry}
                placeholder="e.g., United States"
                onChange={(e) =>
                  setForm({ ...form, locationCountry: e.target.value })
                }
              />
            </div>
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: 'var(--d-text)' }}>
                Region
              </label>
              <input
                className="d-input"
                defaultValue={profile.locationRegion}
                placeholder="e.g., California"
                onChange={(e) =>
                  setForm({ ...form, locationRegion: e.target.value })
                }
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              className="d-btn-primary">
              {updateMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9"
                    />
                  </svg>
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

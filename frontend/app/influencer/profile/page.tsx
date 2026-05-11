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

  if (isError || !profile) {
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
          <p className="font-medium text-ink">Failed to load profile</p>
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
          My Profile
        </h1>
        <p className="text-gray mt-1 text-sm">
          Manage your creator profile and public information
        </p>
      </div>

      {updateMutation.isError && (
        <div className="mb-6 p-4 rounded-xl text-sm font-medium bg-red-50 text-red-600 animate-fade-up relative z-10">
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

      <div className="d-card animate-fade-up delay-1 relative z-10">
        {/* Avatar preview */}
        <div className="flex items-center gap-4 pb-6 border-b border-border-gray">
          <div className="w-14 h-14 bg-ink/10 rounded-2xl flex items-center justify-center text-ink">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
              />
            </svg>
          </div>
          <div>
            <p
              className="font-semibold text-lg"
              style={{ fontFamily: 'var(--font-heading)' }}>
              {profile.displayName || profile.handle}
            </p>
            <p className="text-gray text-sm">@{profile.handle}</p>
          </div>
        </div>

        {/* Form */}
        <div className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium text-sm mb-2">
                Display Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-border-gray text-sm focus:outline-none focus:border-ink transition-colors"
                defaultValue={profile.displayName}
                placeholder="Your public display name"
                onChange={(e) =>
                  setForm({ ...form, displayName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block font-medium text-sm mb-2">Handle</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-border-gray text-sm focus:outline-none focus:border-ink transition-colors"
                defaultValue={profile.handle}
                placeholder="@yourhandle"
                onChange={(e) => setForm({ ...form, handle: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-sm mb-2">Bio</label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-border-gray text-sm focus:outline-none focus:border-ink transition-colors resize-none"
              defaultValue={profile.bio}
              placeholder="Tell brands about yourself and your content..."
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
            />
          </div>

          <div>
            <label className="block font-medium text-sm mb-2">Niche</label>
            <input
              type="text"
              className="w-full px-4 py-3 rounded-xl border border-border-gray text-sm focus:outline-none focus:border-ink transition-colors"
              defaultValue={profile.niche}
              placeholder="e.g., Fashion, Travel, Fitness"
              onChange={(e) => setForm({ ...form, niche: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium text-sm mb-2">
                Followers
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 rounded-xl border border-border-gray text-sm focus:outline-none focus:border-ink transition-colors"
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
              <label className="block font-medium text-sm mb-2">
                Engagement Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                className="w-full px-4 py-3 rounded-xl border border-border-gray text-sm focus:outline-none focus:border-ink transition-colors"
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-medium text-sm mb-2">Country</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-border-gray text-sm focus:outline-none focus:border-ink transition-colors"
                defaultValue={profile.locationCountry}
                placeholder="e.g., United States"
                onChange={(e) =>
                  setForm({ ...form, locationCountry: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block font-medium text-sm mb-2">Region</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-border-gray text-sm focus:outline-none focus:border-ink transition-colors"
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

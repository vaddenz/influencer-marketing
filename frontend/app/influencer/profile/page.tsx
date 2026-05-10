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
        <div className="animate-spin w-8 h-8 border-4 border-[var(--c-accent)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="p-6 bg-red-50 text-[var(--c-error)] rounded-lg">
        <p className="font-semibold">Failed to load profile</p>
        <p className="text-sm mt-1">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }

  return (
    <div className="card max-w-2xl">
      <h1 className="section-title mb-6">My Profile</h1>

      {updateMutation.isError && (
        <div className="mb-4 p-4 bg-red-50 text-[var(--c-error)] rounded-lg text-sm">
          {updateMutation.error instanceof Error
            ? updateMutation.error.message
            : 'Failed to update profile. Please try again.'}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Display Name</label>
          <input
            className="input"
            defaultValue={profile.displayName}
            onChange={(e) =>
              setForm({ ...form, displayName: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Handle</label>
          <input
            className="input"
            defaultValue={profile.handle}
            onChange={(e) => setForm({ ...form, handle: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bio</label>
          <textarea
            className="input"
            rows={3}
            defaultValue={profile.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Niche</label>
          <input
            className="input"
            defaultValue={profile.niche}
            onChange={(e) => setForm({ ...form, niche: e.target.value })}
          />
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Followers</label>
            <input
              type="number"
              className="input"
              defaultValue={profile.followerCount}
              onChange={(e) =>
                setForm({
                  ...form,
                  followerCount: parseInt(e.target.value),
                })
              }
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">
              Engagement Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              className="input"
              defaultValue={profile.engagementRate}
              onChange={(e) =>
                setForm({
                  ...form,
                  engagementRate: parseFloat(e.target.value),
                })
              }
            />
          </div>
        </div>
        <button
          onClick={() => updateMutation.mutate()}
          disabled={updateMutation.isPending}
          className="btn-primary"
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  )
}

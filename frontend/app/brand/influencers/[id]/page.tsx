'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useParams } from 'next/navigation'

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

interface Campaign {
  id: string
  title: string
}

export default function InfluencerProfilePage() {
  const { id } = useParams()
  const [showInvite, setShowInvite] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState('')
  const [message, setMessage] = useState('')

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['influencer', id],
    queryFn: () => apiFetch<InfluencerProfile>(`/influencers/${id}/profile`),
  })

  const { data: campaigns } = useQuery({
    queryKey: ['my-campaigns'],
    queryFn: () => apiFetch<Campaign[]>('/campaigns'),
  })

  const inviteMutation = useMutation({
    mutationFn: () => apiFetch('/invitations', {
      method: 'POST',
      body: JSON.stringify({ campaignId: selectedCampaign, influencerId: id, message }),
    }),
    onSuccess: () => {
      alert('Invitation sent!')
      setShowInvite(false)
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (isError || !profile) return <div>Failed to load profile.</div>

  return (
    <div className="card">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-[var(--c-bg-tertiary)] rounded-full flex items-center justify-center text-2xl">👤</div>
        <div>
          <h1 className="text-2xl font-bold">{profile.handle}</h1>
          <p className="text-[var(--c-text-secondary)]">{profile.niche} • {profile.locationCountry} {profile.locationRegion}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card-filled text-center">
          <div className="text-xl font-bold">{profile.followerCount.toLocaleString()}</div>
          <div className="text-xs text-[var(--c-text-secondary)]">Followers</div>
        </div>
        <div className="card-filled text-center">
          <div className="text-xl font-bold">{profile.engagementRate}%</div>
          <div className="text-xs text-[var(--c-text-secondary)]">Engagement</div>
        </div>
      </div>
      <p className="mb-6">{profile.bio}</p>
      <button onClick={() => setShowInvite(true)} className="btn-primary">Invite to Campaign</button>

      {showInvite && (
        <div className="mt-4 p-4 card-filled">
          <h3 className="font-semibold mb-2">Invite {profile.handle}</h3>
          <select className="input mb-2" value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}>
            <option value="">Select campaign...</option>
            {campaigns?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <textarea placeholder="Personal message (optional)" className="input mb-2" value={message} onChange={(e) => setMessage(e.target.value)} />
          {inviteMutation.error && (
            <div className="text-red-500 text-sm mb-2">{inviteMutation.error.message}</div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => inviteMutation.mutate()}
              disabled={!selectedCampaign || inviteMutation.isPending}
              className="btn-primary"
            >
              {inviteMutation.isPending ? 'Sending...' : 'Send'}
            </button>
            <button onClick={() => setShowInvite(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

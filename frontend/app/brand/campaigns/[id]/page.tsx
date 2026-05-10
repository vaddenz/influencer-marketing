'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useParams } from 'next/navigation'

interface CampaignDetail {
  id: string
  title: string
  description: string
  status: string
  invitations: {
    id: string
    status: string
    influencer: {
      influencerProfile: {
        handle: string
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

  if (!id) return <div>Invalid campaign ID.</div>
  if (isLoading) return <div>Loading...</div>
  if (isError || !campaign) return <div>Failed to load campaign.</div>

  return (
    <div>
      <h1 className="section-title mb-2">{campaign.title}</h1>
      <p className="text-[var(--c-text-secondary)] mb-6">
        {campaign.description}
      </p>

      <h2 className="font-semibold mb-3">Participants</h2>
      <div className="space-y-3 mb-8">
        {campaign.invitations?.map((i) => (
          <div key={i.id} className="card flex justify-between items-center">
            <span>{i.influencer?.influencerProfile?.handle}</span>
            <span className="tag">{i.status}</span>
          </div>
        ))}
        {(!campaign.invitations || campaign.invitations.length === 0) && (
          <div className="text-[var(--c-text-secondary)] text-sm">
            No participants yet.
          </div>
        )}
      </div>

      <h2 className="font-semibold mb-3">Deliverables</h2>
      <div className="space-y-3">
        {campaign.deliverables?.map((d) => (
          <div key={d.id} className="card flex justify-between items-center">
            <span>{d.description}</span>
            <span
              className={
                d.status === 'completed'
                  ? 'tag text-[var(--c-success)]'
                  : 'tag tag-neutral'
              }
            >
              {d.status}
            </span>
          </div>
        ))}
        {(!campaign.deliverables || campaign.deliverables.length === 0) && (
          <div className="text-[var(--c-text-secondary)] text-sm">
            No deliverables yet.
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useParams } from 'next/navigation'
import { useState } from 'react'

interface Campaign {
  id: string
  title: string
  description: string
}

interface Deliverable {
  id: string
  description: string
  status: string
  dueDate?: string
}

export default function InfluencerCampaignPage() {
  const { id: rawId } = useParams()
  const id =
    typeof rawId === 'string'
      ? rawId
      : Array.isArray(rawId)
        ? rawId[0]
        : undefined

  const [completingId, setCompletingId] = useState<string | null>(null)

  const {
    data: campaign,
    isLoading: campaignLoading,
    isError: campaignError,
    error: campaignErrorObj,
  } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => apiFetch<Campaign>(`/campaigns/${id}`),
    enabled: !!id,
  })

  const {
    data: deliverables,
    isLoading: deliverablesLoading,
    isError: deliverablesError,
    error: deliverablesErrorObj,
    refetch,
  } = useQuery({
    queryKey: ['deliverables', id],
    queryFn: () => apiFetch<Deliverable[]>(`/deliverables?campaignId=${id}`),
    enabled: !!id,
  })

  const completeMutation = useMutation({
    mutationFn: (deliverableId: string) =>
      apiFetch(`/deliverables/${deliverableId}/complete`, { method: 'PATCH' }),
    onSuccess: () => refetch(),
    onSettled: () => setCompletingId(null),
  })

  if (!id) return <div>Invalid campaign ID.</div>

  if (campaignLoading || deliverablesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--c-accent)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (campaignError || !campaign) {
    return (
      <div className="p-6 bg-red-50 text-[var(--c-error)] rounded-lg">
        <p className="font-semibold">Failed to load campaign</p>
        <p className="text-sm mt-1">
          {campaignErrorObj instanceof Error
            ? campaignErrorObj.message
            : 'Unknown error'}
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="section-title mb-2">{campaign.title}</h1>
      <p className="text-[var(--c-text-secondary)] mb-6">
        {campaign.description}
      </p>

      <h2 className="font-semibold mb-3">Deliverables</h2>

      {deliverablesError && (
        <div className="mb-4 p-4 bg-red-50 text-[var(--c-error)] rounded-lg text-sm">
          {deliverablesErrorObj instanceof Error
            ? deliverablesErrorObj.message
            : 'Failed to load deliverables.'}
        </div>
      )}

      <div className="space-y-3">
        {deliverables && deliverables.length > 0 ? (
          deliverables.map((d) => {
            const isCompleting = completingId === d.id
            return (
              <div
                key={d.id}
                className="card flex justify-between items-center"
              >
                <div>
                  <p
                    className={
                      d.status === 'completed'
                        ? 'line-through text-[var(--c-text-muted)]'
                        : ''
                    }
                  >
                    {d.description}
                  </p>
                  {d.dueDate && (
                    <p className="text-xs text-[var(--c-text-muted)]">
                      Due: {d.dueDate}
                    </p>
                  )}
                </div>
                {d.status !== 'completed' ? (
                  <button
                    onClick={() => {
                      setCompletingId(d.id)
                      completeMutation.mutate(d.id)
                    }}
                    disabled={isCompleting}
                    className="btn-primary text-sm"
                  >
                    {isCompleting ? 'Saving...' : 'Mark Done'}
                  </button>
                ) : (
                  <span className="text-[var(--c-success)] text-sm font-medium">
                    ✓ Completed
                  </span>
                )}
              </div>
            )
          })
        ) : (
          <div className="text-[var(--c-text-secondary)] text-sm">
            No deliverables yet.
          </div>
        )}
      </div>
    </div>
  )
}

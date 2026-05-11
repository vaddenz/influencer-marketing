'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

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

  if (!id)
    return <div className="d-card text-center py-12">Invalid campaign ID.</div>

  if (campaignLoading || deliverablesLoading) {
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

  if (campaignError || !campaign) {
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
            Failed to load campaign
          </p>
        </div>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--d-text-secondary)' }}>
          {campaignErrorObj instanceof Error
            ? campaignErrorObj.message
            : 'Unknown error'}
        </p>
      </div>
    )
  }

  const completedCount =
    deliverables?.filter((d) => d.status === 'completed').length ?? 0
  const totalCount = deliverables?.length ?? 0
  const progress =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div>
      {/* Breadcrumb */}
      <div
        className="flex items-center gap-2 mb-6 text-sm"
        style={{ color: 'var(--d-text-muted)' }}>
        <Link
          href="/influencer/invitations"
          className="hover:underline"
          style={{ color: 'var(--d-text-secondary)' }}>
          Invitations
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
        <h1 className="d-section-title mb-2">{campaign.title}</h1>
        <p
          style={{ color: 'var(--d-text-secondary)' }}
          className="text-base leading-relaxed max-w-2xl">
          {campaign.description}
        </p>
      </div>

      {/* Progress */}
      {totalCount > 0 && (
        <div className="d-card mb-6">
          <div className="flex items-center justify-between mb-3">
            <span
              className="font-semibold text-sm"
              style={{ color: 'var(--d-text)' }}>
              Progress
            </span>
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--d-accent)' }}>
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <div
            className="w-full h-3 rounded-full overflow-hidden"
            style={{ backgroundColor: 'var(--d-content-bg-warm)' }}>
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                backgroundColor: 'var(--d-success)',
              }}
            />
          </div>
        </div>
      )}

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
            {totalCount}
          </span>
        </div>

        {deliverablesError && (
          <div
            className="mb-4 p-4 rounded-xl text-sm font-medium"
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
              {deliverablesErrorObj instanceof Error
                ? deliverablesErrorObj.message
                : 'Failed to load deliverables.'}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {deliverables && deliverables.length > 0 ? (
            deliverables.map((d) => {
              const isCompleting = completingId === d.id
              return (
                <div
                  key={d.id}
                  className="d-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{
                        backgroundColor:
                          d.status === 'completed'
                            ? 'var(--d-success-light)'
                            : 'var(--d-content-bg-warm)',
                        color:
                          d.status === 'completed'
                            ? 'var(--d-success)'
                            : 'var(--d-text-muted)',
                      }}>
                      {d.status === 'completed' ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p
                        className={`font-medium ${d.status === 'completed' ? 'line-through' : ''}`}
                        style={{
                          color:
                            d.status === 'completed'
                              ? 'var(--d-text-muted)'
                              : 'var(--d-text)',
                        }}>
                        {d.description}
                      </p>
                      {d.dueDate && (
                        <p
                          className="text-xs mt-1"
                          style={{ color: 'var(--d-text-muted)' }}>
                          Due: {new Date(d.dueDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {d.status !== 'completed' ? (
                    <button
                      onClick={() => {
                        setCompletingId(d.id)
                        completeMutation.mutate(d.id)
                      }}
                      disabled={isCompleting}
                      className="d-btn-primary text-sm flex-shrink-0">
                      {isCompleting ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
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
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                          Mark Done
                        </>
                      )}
                    </button>
                  ) : (
                    <span
                      className="text-sm font-semibold flex items-center gap-1 flex-shrink-0"
                      style={{ color: 'var(--d-success)' }}>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      Completed
                    </span>
                  )}
                </div>
              )
            })
          ) : (
            <div className="d-card">
              <div className="d-empty py-8">
                <div className="d-empty-icon">📦</div>
                <p className="d-empty-title">No deliverables yet</p>
                <p className="d-empty-desc">
                  Deliverables will be added by the brand for this campaign.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

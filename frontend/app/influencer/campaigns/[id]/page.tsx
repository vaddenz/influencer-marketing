'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'

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

interface Campaign {
  id: string
  title: string
  description: string
  sop: Sop | null
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

  const calculateDueDate = (publishDate: string, offset: number) => {
    const date = new Date(publishDate)
    date.setDate(date.getDate() + offset)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div
        className="flex items-center gap-2 mb-6 text-sm"
        style={{ color: 'var(--d-text-muted)' }}>
        <Link
          href="/influencer/campaigns"
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

      {/* SOP Timeline */}
      {campaign.sop && (
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
            <span
              className="d-tag d-tag-success text-[10px] py-1 px-2"
              style={{ textTransform: 'capitalize' }}>
              {campaign.sop.status}
            </span>
          </div>

          <div className="d-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
              <div>
                <h3
                  className="font-semibold text-lg"
                  style={{ color: 'var(--d-text)' }}>
                  {campaign.sop.title}
                </h3>
                <div
                  className="flex items-center gap-3 text-sm mt-1"
                  style={{ color: 'var(--d-text-secondary)' }}>
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                    Publish:{' '}
                    {new Date(campaign.sop.publishDate).toLocaleDateString(
                      'en-US',
                      {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      }
                    )}
                  </span>
                  <span className="capitalize">
                    {campaign.sop.targetMarket.toUpperCase()} ·{' '}
                    {campaign.sop.influencerType}
                  </span>
                </div>
              </div>
            </div>

            {/* Steps Timeline */}
            <div className="space-y-3">
              {campaign.sop.steps.map((step, index) => (
                <div
                  key={index}
                  className="flex gap-4 p-4 rounded-xl"
                  style={{ backgroundColor: 'var(--d-content-bg-warm)' }}>
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        backgroundColor: 'var(--d-accent)',
                        color: 'white',
                      }}>
                      {index + 1}
                    </div>
                    {index < campaign.sop!.steps.length - 1 && (
                      <div
                        className="w-px flex-1 mt-2"
                        style={{
                          backgroundColor: 'var(--d-border-gray)',
                          minHeight: '20px',
                        }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                      <h4
                        className="font-semibold text-sm"
                        style={{ color: 'var(--d-text)' }}>
                        {step.name}
                      </h4>
                      <span
                        className="text-xs font-medium"
                        style={{ color: 'var(--d-text-muted)' }}>
                        Due:{' '}
                        {calculateDueDate(
                          campaign.sop!.publishDate,
                          step.dueDateOffset
                        )}
                      </span>
                    </div>
                    <p
                      className="text-sm mb-2"
                      style={{ color: 'var(--d-text-secondary)' }}>
                      {step.description}
                    </p>
                    {step.requirements.length > 0 && (
                      <ul className="space-y-1">
                        {step.requirements.map((req, ri) => (
                          <li
                            key={ri}
                            className="flex items-start gap-2 text-xs"
                            style={{ color: 'var(--d-text-secondary)' }}>
                            <svg
                              className="w-3 h-3 flex-shrink-0 mt-0.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}>
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            {req}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Selling Points */}
            {campaign.sop.sellingPoints.length > 0 && (
              <div
                className="mt-4 pt-4"
                style={{ borderTop: '1px solid var(--d-border-gray)' }}>
                <h4
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: 'var(--d-text-muted)' }}>
                  Selling Points
                </h4>
                <div className="flex flex-wrap gap-2">
                  {campaign.sop.sellingPoints.map((point, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: 'var(--d-accent-light)',
                        color: 'var(--d-accent)',
                      }}>
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            )}
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

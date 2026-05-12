'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import SopEditModal from './sop-edit-modal'

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

interface SopCardProps {
  sop: Sop
  onRefresh: () => void
}

export default function SopCard({ sop, onRefresh }: SopCardProps) {
  const [showEdit, setShowEdit] = useState(false)

  const activateMutation = useMutation({
    mutationFn: () =>
      apiFetch<Sop>(`/sops/${sop.id}/activate`, {
        method: 'POST',
      }),
    onSuccess: () => {
      onRefresh()
    },
  })

  const pushMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ pushedCount: number }>(`/sops/${sop.id}/push`, {
        method: 'POST',
      }),
    onSuccess: () => {
      onRefresh()
    },
  })

  const regenerateMutation = useMutation({
    mutationFn: () =>
      apiFetch<Sop>(`/sops/${sop.id}/regenerate`, {
        method: 'POST',
        body: JSON.stringify({
          campaignId: sop.campaignId,
          targetMarket: sop.targetMarket,
          influencerType: sop.influencerType,
          sellingPoints: sop.sellingPoints,
          publishDate: sop.publishDate.split('T')[0],
        }),
      }),
    onSuccess: () => {
      onRefresh()
    },
  })

  const getStatusTag = (status: string) => {
    switch (status) {
      case 'generated':
        return (
          <span
            className="d-tag"
            style={{ backgroundColor: '#e0e7ff', color: '#4338ca' }}>
            Draft
          </span>
        )
      case 'active':
        return <span className="d-tag d-tag-success">Active</span>
      case 'completed':
        return (
          <span
            className="d-tag"
            style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}>
            Completed
          </span>
        )
      default:
        return <span className="d-tag d-tag-neutral">{status}</span>
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const calculateDueDate = (publishDate: string, offset: number) => {
    const date = new Date(publishDate)
    date.setDate(date.getDate() + offset)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const anyMutationPending =
    activateMutation.isPending ||
    pushMutation.isPending ||
    regenerateMutation.isPending

  return (
    <>
      <div className="d-card">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3
                className="font-semibold text-lg"
                style={{ color: 'var(--d-text)' }}>
                {sop.title}
              </h3>
              {getStatusTag(sop.status)}
            </div>
            <div
              className="flex items-center gap-4 text-sm"
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
                Publish: {formatDate(sop.publishDate)}
              </span>
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
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
                {sop.targetMarket.toUpperCase()}
              </span>
              <span className="capitalize">{sop.influencerType}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {sop.status === 'generated' && (
              <>
                <button
                  onClick={() => setShowEdit(true)}
                  disabled={anyMutationPending}
                  className="d-btn-text text-sm">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                    />
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => activateMutation.mutate()}
                  disabled={anyMutationPending}
                  className="d-btn-primary text-sm">
                  {activateMutation.isPending ? (
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
                          d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
                        />
                      </svg>
                      Activate
                    </>
                  )}
                </button>
              </>
            )}
            {sop.status === 'active' && (
              <button
                onClick={() => pushMutation.mutate()}
                disabled={anyMutationPending}
                className="d-btn-primary text-sm">
                {pushMutation.isPending ? (
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
                        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                      />
                    </svg>
                    Push to Feishu
                  </>
                )}
              </button>
            )}
            <button
              onClick={() => regenerateMutation.mutate()}
              disabled={anyMutationPending}
              className="d-btn-text text-sm"
              title="Regenerate with AI">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              Regenerate
            </button>
          </div>
        </div>

        {/* Error messages */}
        {(activateMutation.error || pushMutation.error || regenerateMutation.error) && (
          <div
            className="p-3 rounded-lg text-sm font-medium mb-4"
            style={{
              backgroundColor: 'var(--d-accent-light)',
              color: 'var(--d-accent)',
            }}>
            {activateMutation.error?.message ||
              pushMutation.error?.message ||
              regenerateMutation.error?.message}
          </div>
        )}

        {/* Steps Timeline */}
        <div className="space-y-3">
          {sop.steps.map((step, index) => (
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
                {index < sop.steps.length - 1 && (
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
                    Due: {calculateDueDate(sop.publishDate, step.dueDateOffset)}
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
        {sop.sellingPoints.length > 0 && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--d-border-gray)' }}>
            <h4
              className="text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--d-text-muted)' }}>
              Selling Points
            </h4>
            <div className="flex flex-wrap gap-2">
              {sop.sellingPoints.map((point, i) => (
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

      {showEdit && (
        <SopEditModal
          sop={sop}
          onClose={() => setShowEdit(false)}
          onSuccess={() => {
            setShowEdit(false)
            onRefresh()
          }}
        />
      )}
    </>
  )
}

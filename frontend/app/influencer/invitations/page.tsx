'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'
import type { Invitation } from '@/lib/types'

export default function InvitationsPage() {
  const {
    data: invitations,
    refetch,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['invitations'],
    queryFn: () => apiFetch<Invitation[]>('/invitations'),
  })

  const [actingId, setActingId] = useState<string | null>(null)

  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      apiFetch(`/invitations/${id}/${action}`, { method: 'PATCH' }),
    onSuccess: () => refetch(),
    onSettled: () => setActingId(null),
  })

  const pending = invitations?.filter((i) => i.status === 'pending')
  const history = invitations?.filter((i) => i.status !== 'pending')

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

  if (isError) {
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
            Failed to load invitations
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

  const getStatusTag = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return <span className="d-tag d-tag-success">{status}</span>
      case 'declined':
        return (
          <span
            className="d-tag"
            style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}>
            {status}
          </span>
        )
      default:
        return <span className="d-tag d-tag-neutral">{status}</span>
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="d-page-header">
        <div>
          <h1 className="d-section-title">Invitations</h1>
          <p style={{ color: 'var(--d-text-secondary)' }} className="mt-1">
            Manage collaboration requests from brands
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="d-card text-center">
          <div className="d-stat-value">{pending?.length ?? 0}</div>
          <div className="d-stat-label">Pending</div>
        </div>
        <div className="d-card text-center">
          <div className="d-stat-value">
            {history?.filter((i) => i.status === 'accepted').length ?? 0}
          </div>
          <div className="d-stat-label">Accepted</div>
        </div>
        <div className="d-card text-center">
          <div className="d-stat-value">{invitations?.length ?? 0}</div>
          <div className="d-stat-label">Total</div>
        </div>
      </div>

      {respondMutation.isError && (
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
            {respondMutation.error instanceof Error
              ? respondMutation.error.message
              : 'Failed to respond. Please try again.'}
          </div>
        </div>
      )}

      {/* Pending */}
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
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2
            className="font-semibold text-lg"
            style={{ color: 'var(--d-text)' }}>
            Pending
          </h2>
          <span className="d-tag d-tag-warning text-[10px] py-1 px-2">
            {pending?.length ?? 0}
          </span>
        </div>

        <div className="space-y-3">
          {pending && pending.length > 0 ? (
            pending.map((i) => {
              const isActing = actingId === i.id
              return (
                <div key={i.id} className="d-card">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className="font-semibold"
                          style={{ color: 'var(--d-text)' }}>
                          {i.campaign?.title}
                        </h3>
                        <span className="d-tag d-tag-warning text-[10px] py-1 px-2">
                          pending
                        </span>
                      </div>
                      <p
                        className="text-sm"
                        style={{ color: 'var(--d-text-secondary)' }}>
                        {i.campaign?.brand?.brandProfile?.companyName}
                      </p>
                      {i.message && (
                        <div
                          className="mt-3 p-3 rounded-lg text-sm"
                          style={{
                            backgroundColor: 'var(--d-content-bg)',
                            color: 'var(--d-text-secondary)',
                          }}>
                          &ldquo;{i.message}&rdquo;
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => {
                          setActingId(i.id)
                          respondMutation.mutate({ id: i.id, action: 'accept' })
                        }}
                        disabled={isActing}
                        className="d-btn-primary text-sm">
                        {isActing ? (
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
                            Accept
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setActingId(i.id)
                          respondMutation.mutate({
                            id: i.id,
                            action: 'decline',
                          })
                        }}
                        disabled={isActing}
                        className="d-btn-secondary text-sm">
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="d-card">
              <div className="d-empty py-8">
                <div className="d-empty-icon">📭</div>
                <p className="d-empty-title">No pending invitations</p>
                <p className="d-empty-desc">
                  When brands invite you to collaborate, they&apos;ll appear
                  here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History */}
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
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2
            className="font-semibold text-lg"
            style={{ color: 'var(--d-text)' }}>
            History
          </h2>
        </div>
        <div className="space-y-3">
          {history && history.length > 0 ? (
            history.map((i) => (
              <Link
                key={i.id}
                href={`/influencer/campaigns/${i.campaign.id}`}
                className="d-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-shadow hover:shadow-md"
                style={{ opacity: 0.85 }}
              >
                <div>
                  <h3
                    className="font-semibold"
                    style={{ color: 'var(--d-text)' }}>
                    {i.campaign?.title}
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--d-text-secondary)' }}>
                    {i.campaign?.brand?.brandProfile?.companyName}
                  </p>
                </div>
                {getStatusTag(i.status)}
              </Link>
            ))
          ) : (
            <div className="d-card">
              <div className="d-empty py-8">
                <div className="d-empty-icon">📜</div>
                <p className="d-empty-title">No history yet</p>
                <p className="d-empty-desc">
                  Your past invitations will appear here.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

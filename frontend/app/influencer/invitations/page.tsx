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

  if (isError) {
    return (
      <div className="d-card animate-fade-up relative z-10">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="font-medium text-ink">Failed to load invitations</p>
        </div>
        <p className="text-sm mt-1 text-gray">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }

  const getStatusTag = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return (
          <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-medium rounded-full">
            {status}
          </span>
        )
      case 'declined':
        return (
          <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-medium rounded-full">
            {status}
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 bg-light-gray text-gray text-xs font-medium rounded-full">
            {status}
          </span>
        )
    }
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-10 animate-fade-up relative z-10">
        <h1
          className="text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Invitations
        </h1>
        <p className="text-gray mt-1 text-sm">
          Manage collaboration requests from brands
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-10 relative z-10">
        <div className="d-card text-center hover-lift animate-fade-up delay-1">
          <div className="d-stat-value">{pending?.length ?? 0}</div>
          <div className="d-stat-label">Pending</div>
        </div>
        <div className="d-card text-center hover-lift animate-fade-up delay-2">
          <div className="d-stat-value">
            {history?.filter((i) => i.status === 'accepted').length ?? 0}
          </div>
          <div className="d-stat-label">Accepted</div>
        </div>
        <div className="d-card text-center hover-lift animate-fade-up delay-3">
          <div className="d-stat-value">{invitations?.length ?? 0}</div>
          <div className="d-stat-label">Total</div>
        </div>
      </div>

      {respondMutation.isError && (
        <div className="mb-6 p-4 rounded-xl text-sm font-medium bg-red-50 text-red-600 animate-fade-up relative z-10">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
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
      <div className="mb-8 relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <svg
            className="w-5 h-5 text-gray"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2
            className="font-semibold text-lg"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Pending
          </h2>
          <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
            {pending?.length ?? 0}
          </span>
        </div>

        <div className="space-y-3">
          {pending && pending.length > 0 ? (
            pending.map((i, index) => {
              const isActing = actingId === i.id
              return (
                <div
                  key={i.id}
                  className={`d-card animate-fade-up delay-${Math.min(index + 4, 6)}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className="font-semibold"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {i.campaign?.title}
                        </h3>
                        <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                          pending
                        </span>
                      </div>
                      <p className="text-gray text-sm">
                        {i.campaign?.brand?.brandProfile?.companyName}
                      </p>
                      {i.message && (
                        <div className="mt-3 p-3 rounded-lg text-sm bg-light-gray text-gray">
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
                        className="d-btn-primary text-sm"
                      >
                        {isActing ? (
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
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
                        className="d-btn-secondary text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="d-card animate-fade-up delay-4">
              <div className="d-empty py-8">
                <div className="d-empty-icon">📬</div>
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
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <svg
            className="w-5 h-5 text-gray"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2
            className="font-semibold text-lg"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            History
          </h2>
        </div>
        <div className="space-y-3">
          {history && history.length > 0 ? (
            history.map((i, index) => (
              <Link
                key={i.id}
                href={`/influencer/campaigns/${i.campaign.id}`}
                className={`d-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 transition-shadow hover:shadow-md hover-lift animate-fade-up delay-${Math.min(index + 4, 6)}`}
                style={{ opacity: 0.85 }}
              >
                <div>
                  <h3
                    className="font-semibold"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {i.campaign?.title}
                  </h3>
                  <p className="text-gray text-sm">
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

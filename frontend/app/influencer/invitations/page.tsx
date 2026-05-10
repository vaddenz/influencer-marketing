'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'
import type { Invitation } from '@/lib/types'

export default function InvitationsPage() {
  const { data: invitations, refetch, isLoading, isError, error } = useQuery({
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
        <div className="animate-spin w-8 h-8 border-4 border-[var(--c-accent)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="p-6 bg-red-50 text-[var(--c-error)] rounded-lg">
        <p className="font-semibold">Failed to load invitations</p>
        <p className="text-sm mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="section-title mb-6">Invitations</h1>

      <h2 className="font-semibold mb-3">Pending ({pending?.length || 0})</h2>

      {respondMutation.isError && (
        <div className="mb-4 p-4 bg-red-50 text-[var(--c-error)] rounded-lg text-sm">
          {respondMutation.error instanceof Error ? respondMutation.error.message : 'Failed to respond. Please try again.'}
        </div>
      )}

      <div className="space-y-3 mb-8">
        {pending && pending.length > 0 ? (
          pending.map((i) => {
            const isActing = actingId === i.id
            return (
              <div key={i.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{i.campaign?.title}</h3>
                    <p className="text-sm text-[var(--c-text-secondary)]">{i.campaign?.brand?.brandProfile?.companyName}</p>
                    {i.message && <p className="text-sm text-[var(--c-text-muted)] mt-1">{i.message}</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setActingId(i.id)
                        respondMutation.mutate({ id: i.id, action: 'accept' })
                      }}
                      disabled={isActing}
                      className="btn-primary text-sm"
                    >
                      {isActing ? '...' : 'Accept'}
                    </button>
                    <button
                      onClick={() => {
                        setActingId(i.id)
                        respondMutation.mutate({ id: i.id, action: 'decline' })
                      }}
                      disabled={isActing}
                      className="btn-secondary text-sm"
                    >
                      {isActing ? '...' : 'Decline'}
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="card opacity-70">
            <p className="text-[var(--c-text-muted)]">No pending invitations.</p>
          </div>
        )}
      </div>

      <h2 className="font-semibold mb-3">History</h2>
      <div className="space-y-3">
        {history && history.length > 0 ? (
          history.map((i) => (
            <div key={i.id} className="card opacity-70">
              <div className="flex justify-between">
                <h3 className="font-semibold">{i.campaign?.title}</h3>
                <span className="tag tag-neutral capitalize">{i.status}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="card opacity-70">
            <p className="text-[var(--c-text-muted)]">No invitation history yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

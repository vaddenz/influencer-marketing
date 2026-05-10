'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'

export default function NewCampaignPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const queryClient = useQueryClient()
  const router = useRouter()

  const createMutation = useMutation({
    mutationFn: () =>
      apiFetch('/campaigns', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      router.push('/dashboard')
    },
  })

  const canSubmit = !!title.trim()

  return (
    <div className="max-w-2xl">
      <h1 className="section-title mb-6">Create Campaign</h1>
      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          createMutation.mutate()
        }}
      >
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            className="input"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        {createMutation.error && (
          <div className="text-[var(--c-error)] text-sm">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : 'Something went wrong'}
          </div>
        )}
        <button
          type="submit"
          disabled={createMutation.isPending || !canSubmit}
          className="btn-primary"
        >
          {createMutation.isPending ? 'Creating...' : 'Create Campaign'}
        </button>
      </form>
    </div>
  )
}

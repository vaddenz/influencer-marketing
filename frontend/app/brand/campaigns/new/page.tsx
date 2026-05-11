'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { apiFetch } from '@/lib/api'
import Link from 'next/link'

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
      router.push('/brand/dashboard')
    },
  })

  const canSubmit = !!title.trim()

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <div
        className="flex items-center gap-2 mb-6 text-sm"
        style={{ color: 'var(--d-text-muted)' }}>
        <Link
          href="/brand/dashboard"
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
        <span style={{ color: 'var(--d-text)' }} className="font-medium">
          New Campaign
        </span>
      </div>

      <div className="d-card">
        <div className="mb-6">
          <h1 className="d-section-title">Create Campaign</h1>
          <p style={{ color: 'var(--d-text-secondary)' }} className="mt-1">
            Set up a new campaign to collaborate with influencers.
          </p>
        </div>

        <form
          className="space-y-5"
          onSubmit={(e) => {
            e.preventDefault()
            createMutation.mutate()
          }}>
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--d-text)' }}>
              Campaign Title
            </label>
            <input
              className="d-input"
              placeholder="e.g., Summer Collection Launch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--d-text)' }}>
              Description
            </label>
            <textarea
              className="d-input"
              rows={5}
              placeholder="Describe your campaign goals, target audience, and what you're looking for from creators..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {createMutation.error && (
            <div
              className="p-4 rounded-xl text-sm font-medium"
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
                {createMutation.error instanceof Error
                  ? createMutation.error.message
                  : 'Something went wrong'}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending || !canSubmit}
              className="d-btn-primary">
              {createMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Creating...
                </>
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
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Create Campaign
                </>
              )}
            </button>
            <Link href="/brand/dashboard" className="d-btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

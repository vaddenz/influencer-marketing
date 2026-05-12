'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api'

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

interface SopGenerateModalProps {
  campaignId: string
  onClose: () => void
  onSuccess: (sop: Sop) => void
}

export default function SopGenerateModal({
  campaignId,
  onClose,
  onSuccess,
}: SopGenerateModalProps) {
  const [targetMarket, setTargetMarket] = useState('kr')
  const [influencerType, setInfluencerType] = useState('beauty')
  const [sellingPoints, setSellingPoints] = useState('')
  const [publishDate, setPublishDate] = useState('')

  const generateMutation = useMutation({
    mutationFn: () =>
      apiFetch<Sop>('/sops', {
        method: 'POST',
        body: JSON.stringify({
          campaignId,
          targetMarket,
          influencerType,
          sellingPoints: sellingPoints
            .split('\n')
            .map((s) => s.trim())
            .filter((s) => s.length > 0),
          publishDate,
        }),
      }),
    onSuccess: (sop) => {
      onSuccess(sop)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    generateMutation.mutate()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}>
      <div className="d-card w-full max-w-lg animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3
            className="font-semibold text-lg"
            style={{ color: 'var(--d-text)' }}>
            Generate SOP
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              style={{ color: 'var(--d-text-muted)' }}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--d-text)' }}>
              Target Market
            </label>
            <select
              className="d-select"
              value={targetMarket}
              onChange={(e) => setTargetMarket(e.target.value)}
              required>
              <option value="kr">Korea</option>
              <option value="jp">Japan</option>
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--d-text)' }}>
              Influencer Type
            </label>
            <select
              className="d-select"
              value={influencerType}
              onChange={(e) => setInfluencerType(e.target.value)}
              required>
              <option value="beauty">Beauty</option>
              <option value="fashion">Fashion</option>
              <option value="lifestyle">Lifestyle</option>
            </select>
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--d-text)' }}>
              Selling Points
            </label>
            <textarea
              placeholder="Enter one selling point per line..."
              className="d-input"
              rows={4}
              value={sellingPoints}
              onChange={(e) => setSellingPoints(e.target.value)}
              required
            />
            <p
              className="text-xs mt-1"
              style={{ color: 'var(--d-text-muted)' }}>
              One point per line. These will guide the AI generation.
            </p>
          </div>

          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--d-text)' }}>
              Publish Date
            </label>
            <input
              type="date"
              className="d-input"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              required
            />
          </div>

          {generateMutation.error && (
            <div
              className="p-3 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: 'var(--d-accent-light)',
                color: 'var(--d-accent)',
              }}>
              {generateMutation.error.message}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={generateMutation.isPending}
              className="d-btn-primary">
              {generateMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : (
                'Generate SOP'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="d-btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

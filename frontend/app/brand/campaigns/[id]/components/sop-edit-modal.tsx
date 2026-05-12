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

interface SopEditModalProps {
  sop: Sop
  onClose: () => void
  onSuccess: (sop: Sop) => void
}

export default function SopEditModal({
  sop,
  onClose,
  onSuccess,
}: SopEditModalProps) {
  const [title, setTitle] = useState(sop.title)
  const [publishDate, setPublishDate] = useState(sop.publishDate.split('T')[0])
  const [steps, setSteps] = useState<SopStep[]>(sop.steps)

  const updateMutation = useMutation({
    mutationFn: () =>
      apiFetch<Sop>(`/sops/${sop.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          publishDate,
          steps,
        }),
      }),
    onSuccess: (updatedSop) => {
      onSuccess(updatedSop)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate()
  }

  const addStep = () => {
    setSteps([
      ...steps,
      { name: '', description: '', dueDateOffset: 0, requirements: [''] },
    ])
  }

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index))
  }

  const updateStep = (index: number, field: keyof SopStep, value: unknown) => {
    const updated = [...steps]
    updated[index] = { ...updated[index], [field]: value }
    setSteps(updated)
  }

  const updateRequirements = (stepIndex: number, reqs: string[]) => {
    const updated = [...steps]
    updated[stepIndex] = { ...updated[stepIndex], requirements: reqs }
    setSteps(updated)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}>
      <div className="d-card w-full max-w-2xl animate-fade-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3
            className="font-semibold text-lg"
            style={{ color: 'var(--d-text)' }}>
            Edit SOP
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="block text-sm font-semibold mb-2"
              style={{ color: 'var(--d-text)' }}>
              Title
            </label>
            <input
              type="text"
              className="d-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
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

          <div>
            <div className="flex items-center justify-between mb-3">
              <label
                className="block text-sm font-semibold"
                style={{ color: 'var(--d-text)' }}>
                Steps
              </label>
              <button
                type="button"
                onClick={addStep}
                className="d-btn-text text-sm"
                style={{ color: 'var(--d-accent)' }}>
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
                Add Step
              </button>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => (
                <StepEditor
                  key={index}
                  step={step}
                  index={index}
                  onChange={(field, value) => updateStep(index, field, value)}
                  onRequirementsChange={(reqs) =>
                    updateRequirements(index, reqs)
                  }
                  onRemove={() => removeStep(index)}
                />
              ))}
              {steps.length === 0 && (
                <div
                  className="text-center py-6 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--d-content-bg-warm)',
                    color: 'var(--d-text-secondary)',
                  }}>
                  No steps yet. Click "Add Step" to create one.
                </div>
              )}
            </div>
          </div>

          {updateMutation.error && (
            <div
              className="p-3 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: 'var(--d-accent-light)',
                color: 'var(--d-accent)',
              }}>
              {updateMutation.error.message}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="d-btn-primary">
              {updateMutation.isPending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                'Save Changes'
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

function StepEditor({
  step,
  index,
  onChange,
  onRequirementsChange,
  onRemove,
}: {
  step: SopStep
  index: number
  onChange: (field: keyof SopStep, value: unknown) => void
  onRequirementsChange: (reqs: string[]) => void
  onRemove: () => void
}) {
  const [reqsText, setReqsText] = useState(step.requirements.join('\n'))

  const handleReqsChange = (value: string) => {
    setReqsText(value)
    onRequirementsChange(
      value
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    )
  }

  return (
    <div
      className="p-4 rounded-xl space-y-3"
      style={{ backgroundColor: 'var(--d-content-bg-warm)' }}>
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--d-text-muted)' }}>
          Step {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="p-1 rounded-lg hover:bg-red-100 transition-colors"
          title="Remove step">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            style={{ color: '#dc2626' }}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1 text-gray-500">
          Name
        </label>
        <input
          type="text"
          className="d-input"
          value={step.name}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g., Draft Submission"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1 text-gray-500">
          Description
        </label>
        <input
          type="text"
          className="d-input"
          value={step.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="e.g., Submit short video script outline"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1 text-gray-500">
          Due Date Offset (days from publish date)
        </label>
        <input
          type="number"
          className="d-input"
          value={step.dueDateOffset}
          onChange={(e) =>
            onChange('dueDateOffset', parseInt(e.target.value, 10) || 0)
          }
          placeholder="-7"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1 text-gray-500">
          Requirements (one per line)
        </label>
        <textarea
          className="d-input"
          rows={3}
          value={reqsText}
          onChange={(e) => handleReqsChange(e.target.value)}
          placeholder="Enter requirements, one per line..."
        />
      </div>
    </div>
  )
}

'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import type { Template, Agent } from '@/lib/types'
import { getApiUrl } from '@/lib/config'
import { OrgNode } from './OrgNode'
import { trackEvent } from '@/lib/analytics'
import { useCategories } from '@/lib/hooks'

interface TemplateDetailClientProps {
  template: Template
}

// Build organization structure based on parent-child relationships
function buildOrgStructure(agentList: Agent[]) {
  const agentMap = new Map(agentList.map((a) => [a.slug, a]))

  // Root agents are those without a parentId
  const roots = agentList.filter((agent) => !agent.parentId)

  return { roots, agentMap }
}

// Extract initials from role name
function getInitials(role: string): string {
  return role
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
}

// Clipboard copy function compatible with mobile devices
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Prefer modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    }

    // Fallback: use execCommand (compatible with older mobile browsers)
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '0'
    textArea.setAttribute('readonly', '')
    document.body.appendChild(textArea)

    // Select and copy
    textArea.select()
    textArea.setSelectionRange(0, textArea.value.length)

    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)

    return successful
  } catch (err) {
    console.error('Copy failed:', err)
    return false
  }
}

// Toast component
function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-[var(--c-text)] text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-out pointer-events-auto">
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-sm font-medium">{message}</span>
        </div>
      </div>
    </div>
  )
}

export function TemplateDetailClient({ template }: TemplateDetailClientProps) {
  const t = useTranslations('Templates')
  const locale = useLocale()
  const isZh = locale === 'zh'
  const templateName = isZh ? template.nameZh || template.name : template.name
  const templateDescription = isZh
    ? template.descriptionZh || template.description
    : template.description
  const [activeTab, setActiveTab] = useState<'organization' | 'agents'>(
    'organization'
  )
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({
    message: '',
    visible: false,
  })

  const { categories: apiCategories } = useCategories()

  function getCategoryLabel(code: string) {
    const category = apiCategories.find((cat) => cat.code === code)
    if (category) {
      return isZh ? category.nameZh : category.name
    }

    // Fallback to hardcoded mapping for categories not in API
    const map: Record<string, string> = {
      'content-creation': t('categories.content-creation'),
      'e-commerce': t('categories.e-commerce'),
      'customer-service': t('categories.customer-service'),
    }
    return map[code] || t(`categories.${code}`) || code
  }

  // Augment agents with order
  const agents = useMemo(() => {
    return (template.agents || []).map((a, i) => ({ ...a, order: i + 1 }))
  }, [template.agents])

  const orgStructure = useMemo(() => buildOrgStructure(agents), [agents])

  // Callback function to show toast
  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true })
    setTimeout(() => {
      setToast({ message: '', visible: false })
    }, 2000)
  }, [])

  // Handle copy operation
  const handleCopy = useCallback(
    async (text: string, shouldRecordDownload = false) => {
      const success = await copyToClipboard(text)
      if (success) {
        showToast(t('detail.copySuccess'))

        if (shouldRecordDownload) {
          try {
            await fetch(getApiUrl(`templates/${template.slug}/download`), {
              method: 'POST',
            })
          } catch (error) {
            console.error('Failed to record download:', error)
          }
        }
      } else {
        showToast(t('detail.copyFailed'))
      }
    },
    [showToast, t, template.slug]
  )

  return (
    <main className="pt-24 pb-20 min-h-screen bg-white">
      {/* Toast Notification */}
      <Toast message={toast.message} visible={toast.visible} />
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-[var(--c-text-secondary)] mb-6 sm:mb-8">
          <Link
            href="/"
            className="hover:text-[var(--c-accent)] transition-colors">
            {t('detail.home')}
          </Link>
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          <Link
            href="/templates"
            className="hover:text-[var(--c-accent)] transition-colors">
            {t('detail.templates')}
          </Link>
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-[var(--c-text)] truncate max-w-[150px] sm:max-w-[200px]">
            {templateName}
          </span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <span className="tag text-xs sm:text-sm">
                  {getCategoryLabel(template.category)}
                </span>
                <span className="w-px h-4 bg-[var(--c-border)] hidden sm:block"></span>
                <span className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--c-text-muted)]">
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {t('agentsCount', { count: template.agents?.length || 0 })}
                </span>
                <span className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--c-text-muted)]">
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  {t('downloadCount', { count: template.downloadCount })}
                </span>
              </div>
              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--c-text)] mb-3 sm:mb-4"
                style={{ fontFamily: 'var(--font-heading)' }}>
                {templateName}
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-[var(--c-text-secondary)] leading-relaxed">
                {templateDescription}
              </p>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="flex items-center gap-1 border-b border-[var(--c-border-light)]">
                <button
                  onClick={() => setActiveTab('organization')}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative hover:text-[var(--c-text)] ${
                    activeTab === 'organization'
                      ? 'text-[var(--c-accent)]'
                      : 'text-[var(--c-text-secondary)]'
                  }`}>
                  {t('detail.tabOrganization')}
                  {activeTab === 'organization' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--c-accent)]"></span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('agents')}
                  className={`px-4 py-3 text-sm font-medium transition-colors relative hover:text-[var(--c-text)] ${
                    activeTab === 'agents'
                      ? 'text-[var(--c-accent)]'
                      : 'text-[var(--c-text-secondary)]'
                  }`}>
                  {t('detail.tabAgents')}
                  {activeTab === 'agents' && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--c-accent)]"></span>
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="mb-8">
              {activeTab === 'organization' ? (
                /* Organization Chart */
                <div className="space-y-6">
                  {orgStructure.roots.map((root) => (
                    <OrgNode
                      key={root.slug}
                      agent={root}
                      agentMap={orgStructure.agentMap}
                      isRoot={true}
                    />
                  ))}
                </div>
              ) : (
                /* Agent Roles List */
                <div className="space-y-4">
                  {agents
                    .slice()
                    .sort((a, b) => {
                      // Prioritize root agents (agents without parentId) at the top
                      const aIsRoot = !a.parentId
                      const bIsRoot = !b.parentId
                      if (aIsRoot && !bIsRoot) return -1
                      if (!aIsRoot && bIsRoot) return 1
                      // For agents of the same type (both root or both non-root), maintain original order
                      return 0
                    })
                    .map((agent) => {
                      const agentName = isZh
                        ? agent.nameZh || agent.name
                        : agent.name
                      const agentRole = isZh
                        ? agent.roleZh || agent.role
                        : agent.role
                      const agentDescription = isZh
                        ? agent.descriptionZh || agent.description
                        : agent.description
                      const agentInitials = getInitials(agent.role)

                      return (
                        <div
                          key={agent.slug}
                          className="p-6 bg-[var(--c-bg-secondary)] rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="w-8 h-8 flex items-center justify-center bg-[var(--c-accent)] text-white text-sm font-bold rounded">
                                  {agentInitials}
                                </span>
                                <h3 className="text-xl font-semibold text-[var(--c-text)]">
                                  {agentRole}
                                </h3>
                              </div>
                              <p className="text-sm text-[var(--c-accent)] font-medium">
                                {agentName}
                              </p>
                            </div>
                            {agent.config?.spawnCommand && (
                              <button
                                onClick={() => {
                                  handleCopy(agent.config?.spawnCommand || '')
                                  trackEvent('copy_agent_command', {
                                    template_slug: template.slug,
                                    template_name: template.name,
                                    agent_name: agent.name,
                                    agent_role: agent.role,
                                  })
                                }}
                                className="flex items-center gap-2 px-3 py-2 bg-[var(--c-text)] text-white text-sm font-mono rounded hover:bg-[var(--c-accent)] transition-colors active:scale-95"
                                title={t('detail.clickToCopy')}>
                                <span className="truncate max-w-[200px] sm:max-w-[300px]">
                                  {agent.config?.spawnCommand}
                                </span>
                                <svg
                                  className="w-4 h-4 opacity-50 flex-shrink-0"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={1.5}>
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                          <p className="text-[var(--c-text-secondary)] leading-relaxed mb-4">
                            {agentDescription}
                          </p>
                          {agent.children && agent.children.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm text-[var(--c-text-muted)]">
                                {t('detail.subordinates')}
                              </span>
                              {agent.children.map((child) => (
                                <span
                                  key={child.slug}
                                  className="px-2 py-1 bg-white text-[var(--c-text-secondary)] text-xs rounded">
                                  {child.role}
                                </span>
                              ))}
                            </div>
                          ) : agent.config?.canSpawn?.length ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm text-[var(--c-text-muted)]">
                                {t('detail.subordinates')}
                              </span>
                              {agent.config.canSpawn.map((spawn: string) => (
                                <span
                                  key={spawn}
                                  className="px-2 py-1 bg-white text-[var(--c-text-secondary)] text-xs rounded">
                                  {spawn}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Download Card */}
              <div className="p-6 border border-[var(--c-border)] rounded-lg">
                <h3 className="text-lg font-semibold text-[var(--c-text)] mb-2">
                  {t('detail.getConfig')}
                </h3>
                <p className="text-sm text-[var(--c-text-secondary)] mb-4">
                  {t('detail.copyPrompt')}
                </p>
                <div className="mb-4 p-3 bg-[var(--c-bg-secondary)] rounded-lg">
                  <code className="text-xs text-[var(--c-text-secondary)] font-mono break-all block">
                    {t('detail.installCommand', { slug: template.slug })}
                  </code>
                </div>
                <button
                  onClick={() => {
                    handleCopy(
                      t('detail.installCommand', { slug: template.slug }),
                      true
                    )
                    trackEvent('copy_install_command', {
                      template_slug: template.slug,
                      template_name: template.name,
                      template_category: template.category,
                    })
                  }}
                  className="btn-primary w-full justify-center active:scale-95 transition-transform">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  {t('detail.copyInstallCommand')}
                </button>
              </div>

              {/* Installation Guide */}
              <div className="p-6 bg-[var(--c-bg-secondary)] rounded-lg">
                <h3 className="text-lg font-semibold text-[var(--c-text)] mb-4">
                  {t('detail.installSteps')}
                </h3>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-[var(--c-accent)] text-white text-xs font-bold rounded">
                      1
                    </span>
                    <span className="text-sm text-[var(--c-text-secondary)]">
                      {t('detail.step1')}
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-[var(--c-accent)] text-white text-xs font-bold rounded">
                      2
                    </span>
                    <span className="text-sm text-[var(--c-text-secondary)]">
                      {t('detail.step2')}
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-[var(--c-accent)] text-white text-xs font-bold rounded">
                      3
                    </span>
                    <span className="text-sm text-[var(--c-text-secondary)]">
                      {t('detail.step3')}
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-[var(--c-accent)] text-white text-xs font-bold rounded">
                      4
                    </span>
                    <span className="text-sm text-[var(--c-text-secondary)]">
                      {t('detail.step4')}
                    </span>
                  </li>
                </ol>
              </div>

              {/* Need Help */}
              <div className="p-6 border border-[var(--c-border-light)] rounded-lg">
                <h3 className="text-lg font-semibold text-[var(--c-text)] mb-2">
                  {t('detail.needHelp')}
                </h3>
                <p className="text-sm text-[var(--c-text-secondary)] mb-4">
                  {t('detail.contactSupportDesc')}
                </p>
                <a
                  href="mailto:contact@agentplanet.io"
                  className="text-sm font-medium text-[var(--c-accent)] hover:text-[var(--c-accent-hover)] transition-colors">
                  {t('detail.contactSupport')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

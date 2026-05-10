'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import type { Template } from '@/lib/types'
import { trackEvent } from '@/lib/analytics'
import { useCategories } from '@/lib/hooks'

interface TemplatesClientProps {
  templates: Template[]
}

export function TemplatesClient({ templates }: TemplatesClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('Templates')
  const locale = useLocale()
  const isZh = locale === 'zh'

  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get('category') || 'all'
  )
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('keyword') || ''
  )

  const {
    categories: apiCategories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories()

  const categories = useMemo(() => {
    if (categoriesLoading || categoriesError) {
      // Fallback to hardcoded categories while loading or on error
      return [
        { value: 'all', label: t('categories.all') },
        { value: 'content-creation', label: t('categories.content-creation') },
        { value: 'e-commerce', label: t('categories.e-commerce') },
        { value: 'customer-service', label: t('categories.customer-service') },
      ]
    }

    return [
      { value: 'all', label: t('categories.all') },
      ...apiCategories.map((cat) => ({
        value: cat.code,
        label: isZh ? cat.nameZh : cat.name,
      })),
    ]
  }, [apiCategories, categoriesLoading, categoriesError, t, isZh])

  function getCategoryLabel(code: string) {
    if (code === 'all') return t('categories.all')

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
    return map[code] || code
  }

  // Filter templates based on selected category and search query
  const filteredTemplates = templates.filter((template) => {
    // Category filter
    if (selectedCategory !== 'all') {
      if (template.category !== selectedCategory) {
        return false
      }
    }

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const templateName = isZh
        ? template.nameZh || template.name
        : template.name
      const templateDescription = isZh
        ? template.descriptionZh || template.description
        : template.description
      const nameMatch = templateName.toLowerCase().includes(query)
      const descMatch = templateDescription.toLowerCase().includes(query)
      if (!nameMatch && !descMatch) {
        return false
      }
    }

    return true
  })

  const updateFilters = useCallback(
    () => {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.set('category', selectedCategory)
      if (searchQuery) params.set('keyword', searchQuery)

      const url = `/templates?${params.toString()}`
      router.push(url)

      // Track search event if there's a search query
      if (searchQuery) {
        trackEvent('template_search', {
          search_query: searchQuery,
          category_filter: selectedCategory,
          results_count: filteredTemplates.length,
        })
      }
    },
    [selectedCategory, searchQuery, router, filteredTemplates.length]
  )

  useEffect(() => {
    const timer = setTimeout(() => {
      updateFilters()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery, updateFilters])

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    const params = new URLSearchParams()
    if (value !== 'all') params.set('category', value)
    if (searchQuery) params.set('keyword', searchQuery)
    router.push(`/templates?${params.toString()}`)
  }

  return (
    <main className="pt-24 pb-20 min-h-screen bg-white">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--c-text)] mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}>
            {t('title')}
          </h1>
          <div className="w-10 h-1 bg-[var(--c-accent)] rounded-full"></div>
          <p className="mt-4 text-base sm:text-lg text-[var(--c-text-secondary)]">
            {t('subtitle')}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-[var(--c-border-light)]">
          <div className="text-sm font-medium text-[var(--c-text-secondary)]">
            {t('categoryLabel')}
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex flex-wrap gap-2">
              {categoriesLoading && (
                <div className="text-sm text-[var(--c-text-secondary)]">
                  Loading categories...
                </div>
              )}
              {categoriesError && (
                <div className="text-sm text-red-600">
                  Failed to load categories
                </div>
              )}
              {!categoriesLoading &&
                !categoriesError &&
                categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => handleCategoryChange(category.value)}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-full transition-all"
                    style={{
                      backgroundColor:
                        selectedCategory === category.value
                          ? 'var(--c-accent)'
                          : 'white',
                      color:
                        selectedCategory === category.value
                          ? 'white'
                          : 'var(--c-text)',
                      border: `1px solid ${selectedCategory === category.value ? 'var(--c-accent)' : 'var(--c-border)'}`,
                    }}>
                    {category.label}
                  </button>
                ))}
            </div>
          </div>

          {/* Search */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="block w-full pl-10 pr-3 py-2 border border-[var(--c-border)] rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus:border-[var(--c-accent)] sm:text-sm"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-sm text-[var(--c-text-secondary)]">
          {t('foundCount', { count: filteredTemplates.length })}
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 flex items-center justify-center text-[var(--c-text-muted)] mb-4">
              <svg
                className="w-10 h-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--c-text)] mb-2">
              {t('noResults')}
            </h3>
            <p className="text-[var(--c-text-secondary)]">
              {t('tryAdjusting')}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => {
              const templateName = isZh
                ? template.nameZh || template.name
                : template.name
              const templateDescription = isZh
                ? template.descriptionZh || template.description
                : template.description

              return (
                <article
                  key={template.slug}
                  className="group border border-[var(--c-border-light)] hover:border-[var(--c-accent)] transition-colors rounded-lg p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <span className="tag">
                      {getCategoryLabel(template.category)}
                    </span>
                  </div>

                  {/* Content */}
                  <h2 className="text-xl font-bold text-[var(--c-text)] mb-3 group-hover:text-[var(--c-accent)] transition-colors">
                    <Link
                      href={`/templates/${template.slug}`}
                      onClick={() => {
                        trackEvent('template_click', {
                          template_slug: template.slug,
                          template_name: template.name,
                          template_category: template.category,
                        })
                      }}>
                      {templateName}
                    </Link>
                  </h2>
                  <p className="text-sm text-[var(--c-text-secondary)] leading-relaxed mb-6 line-clamp-2">
                    {templateDescription}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-[var(--c-text-secondary)] pt-4 border-t border-[var(--c-border-light)]">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
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
                      <span>
                        {t('agentsCount', {
                          count: template.agents?.length || 0,
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
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
                      <span>
                        {t('downloadCount', { count: template.downloadCount })}
                      </span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import type { Template } from '@/lib/types'
import { trackEvent } from '@/lib/analytics'
import { useCategories } from '@/lib/hooks'

interface TemplatesShowcaseProps {
  templates: Template[]
}

export function TemplatesShowcase({ templates }: TemplatesShowcaseProps) {
  const t = useTranslations('Templates')
  const locale = useLocale()
  const isZh = locale === 'zh'
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

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

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let result = templates

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter(
        (template) => template.category === selectedCategory
      )
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((t) => {
        const name = isZh ? t.nameZh || t.name : t.name
        const description = isZh
          ? t.descriptionZh || t.description
          : t.description
        return (
          name.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query)
        )
      })
    }

    return result
  }, [templates, selectedCategory, searchQuery, isZh])

  // Limit to 6 templates for homepage
  const displayTemplates = filteredTemplates.slice(0, 6)

  return (
    <section className="py-20 lg:py-32 bg-[var(--c-bg-secondary)]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-3xl lg:text-4xl font-bold text-[var(--c-text)] mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}>
            {t('hotTemplates')}
          </h2>
          <p className="text-lg text-[var(--c-text-secondary)] max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Categories */}
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
                  onClick={() => setSelectedCategory(category.value)}
                  className="px-4 py-2 text-sm font-medium rounded-full transition-all"
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
              className="block w-full pl-10 pr-3 py-2.5 border border-[var(--c-border)] rounded-lg leading-5 bg-white placeholder-gray-400 focus:outline-none focus:border-[var(--c-accent)] text-sm"
            />
          </div>
        </div>

        {/* Templates Grid */}
        {displayTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl">
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
            {displayTemplates.map((template) => {
              const templateName = isZh
                ? template.nameZh || template.name
                : template.name
              const templateDescription = isZh
                ? template.descriptionZh || template.description
                : template.description

              return (
                <article
                  key={template.slug}
                  className="group bg-white border border-[var(--c-border-light)] hover:border-[var(--c-accent)] hover:shadow-lg transition-all duration-300 rounded-xl p-6">
                  {/* Category Tag */}
                  <div className="mb-4">
                    <span className="tag">
                      {getCategoryLabel(template.category)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-[var(--c-text)] mb-3 group-hover:text-[var(--c-accent)] transition-colors line-clamp-1">
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
                  </h3>

                  {/* Description */}
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

        {/* View All Link */}
        {filteredTemplates.length > 6 && (
          <div className="text-center mt-10">
            <p className="text-sm text-[var(--c-text-muted)] mb-4">
              {t('moreTemplates', { count: filteredTemplates.length - 6 })}
            </p>
          </div>
        )}

        <div className="text-center mt-8">
          <Link href="/templates" className="btn-primary">
            {t('viewAll')}
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

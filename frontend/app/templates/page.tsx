import { getTranslations } from 'next-intl/server'
import { TemplatesClient } from './TemplatesClient'
import { getApiUrl } from '@/lib/config'
import type { Template } from '@/lib/types'

export async function generateMetadata() {
  const t = await getTranslations('Templates.metadata')
  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_ADVERTISED_HOST}/templates`,
    },
  }
}

async function getTemplates(searchParams: {
  [key: string]: string | string[] | undefined
}): Promise<Template[]> {
  try {
    const category = searchParams.category as string | undefined
    const keyword = searchParams.keyword as string | undefined

    const params = new URLSearchParams()
    if (category && category !== 'all') params.append('category', category)
    if (keyword) params.append('keyword', keyword)

    const apiUrl =
      getApiUrl('templates') +
      (params.toString() ? `?${params.toString()}` : '')
    const response = await fetch(apiUrl, { cache: 'no-store' })

    if (!response.ok) {
      throw new Error('Failed to fetch templates')
    }

    const result = await response.json()
    return result.data || []
  } catch (error) {
    console.error('Error loading templates:', error)
    return []
  }
}

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams
  const templates = await getTemplates(resolvedSearchParams)

  return <TemplatesClient templates={templates} />
}

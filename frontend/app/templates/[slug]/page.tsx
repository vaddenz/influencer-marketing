import type { Metadata } from 'next'
import { getTranslations, getLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { TemplateDetailClient } from './TemplateDetailClient'
import { getApiUrl } from '@/lib/config'
import type { Template } from '@/lib/types'

interface Props {
  params: Promise<{
    slug: string
  }>
}

// Generate static params for all templates (required for output: 'export')
export async function generateStaticParams() {
  try {
    const response = await fetch(getApiUrl('templates'), { cache: 'no-store' })
    if (!response.ok) {
      return []
    }
    const result = await response.json()
    const templates: Template[] = result.data || []
    return templates.map((template) => ({
      slug: template.slug,
    }))
  } catch (error) {
    console.error('Error generating static params:', error)
    return []
  }
}

async function getTemplate(slug: string): Promise<Template | null> {
  try {
    const response = await fetch(getApiUrl(`templates/${slug}`), {
      cache: 'no-store',
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error('Failed to fetch template')
    }

    const result = await response.json()
    return result.data || null
  } catch (error) {
    console.error('Error loading template:', error)
    return null
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const template = await getTemplate(slug)
  const t = await getTranslations('Templates.detail')
  const locale = await getLocale()
  const isZh = locale === 'zh'

  if (!template) {
    return {
      title: t('notFoundTitle'),
    }
  }

  const name = isZh ? template.nameZh || template.name : template.name
  const description = isZh
    ? template.descriptionZh || template.description
    : template.description

  return {
    title: t('metadataTitle', { name }),
    description,
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_ADVERTISED_HOST}/templates/${template.slug}`,
    },
    openGraph: {
      title: t('metadataTitle', { name }),
      description,
      url: `${process.env.NEXT_PUBLIC_ADVERTISED_HOST}/templates/${template.slug}`,
    },
  }
}

export default async function TemplateDetailPage({ params }: Props) {
  const { slug } = await params
  const template = await getTemplate(slug)

  if (!template) {
    notFound()
  }

  return <TemplateDetailClient template={template} />
}

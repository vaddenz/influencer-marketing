import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Admin')

  return {
    title: t('dashboard'),
  }
}

export default async function AdminDashboardPage() {
  const t = await getTranslations('Admin')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--c-text)]">
          {t('dashboard')}
        </h2>
        <p className="mt-1 text-sm text-[var(--c-text-secondary)]">
          Welcome to the admin panel.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card p-6">
          <div className="text-sm font-medium text-[var(--c-text-secondary)]">
            Placeholder metric
          </div>
          <div className="mt-2 text-3xl font-bold text-[var(--c-text)]">—</div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-medium text-[var(--c-text-secondary)]">
            Placeholder metric
          </div>
          <div className="mt-2 text-3xl font-bold text-[var(--c-text)]">—</div>
        </div>
        <div className="card p-6">
          <div className="text-sm font-medium text-[var(--c-text-secondary)]">
            Placeholder metric
          </div>
          <div className="mt-2 text-3xl font-bold text-[var(--c-text)]">—</div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-[var(--c-text)] mb-2">
          Content area
        </h3>
        <p className="text-sm text-[var(--c-text-secondary)]">
          This is a blank scaffold for the admin dashboard. Add charts, tables,
          and widgets here.
        </p>
      </div>
    </div>
  )
}

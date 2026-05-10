import type { Agent } from '@/lib/types'
import { useLocale } from 'next-intl'

interface OrgNodeProps {
  agent: Agent
  agentMap: Map<string, Agent>
  isRoot?: boolean
}

function getInitials(role: string): string {
  return role
    .split(' ')
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase()
}

function getAgentChildren(agent: Agent, agentMap: Map<string, Agent>): Agent[] {
  // Use the children array from backend if available
  if (agent.children && agent.children.length > 0) {
    return agent.children
      .map((child: { slug: string }) => agentMap.get(child.slug))
      .filter((child): child is Agent => child !== undefined)
  }

  // Fallback to config.canSpawn for backward compatibility
  if (agent.config?.canSpawn) {
    return agent.config.canSpawn
      .map((slug: string) => agentMap.get(slug))
      .filter((child: Agent | undefined): child is Agent => child !== undefined)
  }

  return []
}

export function OrgNode({ agent, agentMap, isRoot = false }: OrgNodeProps) {
  const children = getAgentChildren(agent, agentMap)
  const locale = useLocale()
  const isZh = locale === 'zh'
  const agentName = isZh ? agent.nameZh || agent.name : agent.name
  const agentRole = isZh ? agent.roleZh || agent.role : agent.role
  const agentInitials = getInitials(agent.role)

  return (
    <div className="flex flex-col items-center">
      {/* Node Card */}
      {isRoot ? (
        <div className="flex items-center gap-3 p-4 bg-[var(--c-accent-light)] border border-[var(--c-accent)] rounded-lg w-full max-w-sm">
          <span className="w-8 h-8 flex items-center justify-center bg-[var(--c-accent)] text-white text-sm font-bold rounded">
            {agentInitials}
          </span>
          <div>
            <h3 className="font-semibold text-[var(--c-text)]">{agentRole}</h3>
            <p className="text-xs text-[var(--c-accent)]">{agentName}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-[var(--c-bg-secondary)] border border-[var(--c-border)] rounded-lg min-w-[160px]">
          <span className="w-6 h-6 flex items-center justify-center bg-[var(--c-text)] text-white text-xs font-bold rounded">
            {agentInitials}
          </span>
          <div>
            <h4 className="text-sm font-medium text-[var(--c-text)]">
              {agentRole}
            </h4>
            <p className="text-xs text-[var(--c-text-muted)] truncate max-w-[120px]">
              {agentName}
            </p>
          </div>
        </div>
      )}

      {/* Children */}
      {children.length > 0 && (
        <>
          <div className="flex items-center justify-center my-2">
            <div className="w-px h-6 bg-[var(--c-border)]"></div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 w-full">
            {children.map((child) => (
              <OrgNode
                key={child.slug}
                agent={child}
                agentMap={agentMap}
                isRoot={false}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

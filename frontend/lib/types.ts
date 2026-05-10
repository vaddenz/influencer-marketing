export interface AgentConfig {
  spawnCommand?: string
  canSpawn?: string[]
  [key: string]: unknown
}

export interface Agent {
  id: string
  slug: string
  name: string
  nameZh?: string | null
  description?: string | null
  descriptionZh?: string | null
  role: string
  roleZh?: string | null
  parentId?: string | null
  children?: Agent[]
  config?: AgentConfig
  order?: number
}

export interface Template {
  slug: string
  name: string
  nameZh?: string | null
  description: string
  descriptionZh?: string | null
  category: string
  downloadCount: number
  agents?: Agent[]
  thumbnail?: string | null
  teamConfig?: Record<string, unknown> | null
  status?: string
  createdAt?: string
  updatedAt?: string
}

export type UserRole = 'brand' | 'influencer' | 'agency'

// Auth types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: UserRole
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface Category {
  id: string
  code: string
  name: string
  nameZh: string
  icon: string
  sortOrder: number
  isActive: boolean
}

export interface ApiError {
  code: string
  message: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error: string | ApiError | null
  requestId: string
  time: string
}

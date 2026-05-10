import { SetMetadata, applyDecorators } from '@nestjs/common'

/** Metadata key for cache invalidation */
export const INVALIDATE_CACHE_METADATA = 'INVALIDATE_CACHE_METADATA'

/**
 * Options for cache invalidation
 */
export interface InvalidateCacheOptions {
  /**
   * The cache group(s) to invalidate.
   * Can be a single string or an array of strings.
   * The group name(s) will be suffixed with the tenant/user ID.
   */
  group?: string | string[]
}

/**
 * Decorator to trigger cache invalidation after a successful method execution.
 * Useful for mutations (POST, PUT, DELETE) that should clear related cache entries.
 *
 * @param options - Configuration options defining which cache groups to invalidate
 * @returns A decorator function that sets the metadata
 */
export const InvalidateCache = (options: InvalidateCacheOptions) => {
  return applyDecorators(SetMetadata(INVALIDATE_CACHE_METADATA, options))
}

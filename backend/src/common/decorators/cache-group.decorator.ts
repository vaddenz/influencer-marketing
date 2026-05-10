import { SetMetadata, applyDecorators } from '@nestjs/common'

/** Metadata key for storage */
export const CACHE_GROUP_METADATA = 'CACHE_GROUP_METADATA'

/**
 * Decorator to assign a cache group to a controller or method.
 * Cache groups allow for invalidating multiple cache keys at once.
 * The group name will be automatically suffixed with the tenant/user ID.
 *
 * @param group - The name of the cache group (e.g., 'users', 'posts')
 * @returns A decorator function that sets the metadata
 */
export const CacheGroup = (group: string) => {
  return applyDecorators(SetMetadata(CACHE_GROUP_METADATA, group))
}

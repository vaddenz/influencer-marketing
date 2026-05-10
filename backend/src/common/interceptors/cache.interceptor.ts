import { createHash } from 'crypto'
import { Observable, tap } from 'rxjs'
import { HttpAdapterHost, Reflector } from '@nestjs/core'
import {
  Injectable,
  ExecutionContext,
  CallHandler,
  Logger,
  Inject,
} from '@nestjs/common'
import {
  CACHE_KEY_METADATA,
  CACHE_MANAGER,
  CACHE_TTL_METADATA,
  CacheInterceptor,
} from '@nestjs/cache-manager'
import type { Cache } from 'cache-manager'
import { ConfigService } from '@nestjs/config'
import { INVALIDATE_CACHE_METADATA } from '@/common/decorators/invalidate-cache.decorator'
import { CACHE_GROUP_METADATA } from '@/common/decorators/cache-group.decorator'

/**
 * Cache key prefix for individual cache entries
 * Used to namespace application-specific cache keys to avoid conflicts
 */
const APP_CACHE_PREFIX = 'app-cache'

/**
 * Cache key prefix for cache groups
 * Used to namespace group-based cache keys for cache invalidation by group
 */
const APP_CACHE_GROUP_PREFIX = 'app-cache-group'

/**
 * Configuration key for default cache TTL (Time To Live) in milliseconds
 * Can be configured via environment variables or configuration files
 */
const APP_CACHE_TTL_CONFIG_KEY = 'APP_CACHE_TTL'

/**
 * Configuration key for cache group TTL (Time To Live) in milliseconds
 * Controls how long group metadata is kept in cache
 */
const APP_CACHE_GROUP_TTL_CONFIG_KEY = 'APP_CACHE_GROUP_TTL'

/**
 * Application-level cache interceptor that extends NestJS CacheInterceptor
 * Provides user-aware caching with customizable TTL and cache key generation
 */
@Injectable()
export class UserCacheInterceptor extends CacheInterceptor {
  private cache: Cache
  private defaultTTL: number = 60 * 1000 // TTL in milliseconds
  private groupTTL: number = 3 * 60 * 1000 // TTL in milliseconds
  logger = new Logger(UserCacheInterceptor.name)

  /**
   * Creates an instance of UserCacheInterceptor
   * Initializes cache manager and TTL configurations from environment variables
   *
   * @param httpAdapterHost - NestJS HTTP adapter for accessing request information
   * @param reflector - NestJS reflector for accessing metadata from decorators
   * @param cacheManager - Cache manager instance for Redis operations
   * @param configService - Configuration service for environment-based TTL settings
   */
  constructor(
    httpAdapterHost: HttpAdapterHost,
    reflector: Reflector,
    @Inject(CACHE_MANAGER) cacheManager: Cache,
    @Inject(ConfigService) configService: ConfigService
  ) {
    super(httpAdapterHost, reflector)
    this.cache = cacheManager

    // Initialize TTL values from configuration with fallback to defaults
    this.defaultTTL = configService.get<number>(
      APP_CACHE_TTL_CONFIG_KEY,
      this.defaultTTL
    )
    this.groupTTL = configService.get<number>(
      APP_CACHE_GROUP_TTL_CONFIG_KEY,
      this.groupTTL
    )

    this.logger.debug(
      `Cache interceptor initialized with defaultTTL: ${this.defaultTTL}ms, groupTTL: ${this.groupTTL}ms`
    )
  }

  /**
   * Main interception method implementing the caching workflow
   * Implements cache-aside pattern: check cache → return if exists → execute → cache result
   *
   * @param context - Execution context containing request/response information
   * @param next - Call handler for executing the original method
   * @returns Observable that emits cached data or fresh response
   *
   * @workflow
   * 1. Check if request is eligible for caching
   * 2. Determine TTL from method metadata or use default
   * 3. Generate unique cache key and group key
   * 4. Attempt to retrieve from cache
   * 5. Cache miss: execute method and store result
   * 6. Handle cache invalidation for mutating operations
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    // 1. Check whether the request is cacheable based on method, entity, and refresh flag
    if (!this.isRequestCacheable(context)) {
      return next.handle().pipe(
        tap(() => {
          // Invalidate cache if needed (for non-cacheable requests that might mutate data)
          this.maybeInvalidateCache(context)
        })
      )
    }

    // 2. Get TTL defined on the method handler via @CacheTTL() decorator or use default
    const ttl =
      this.reflector.get(CACHE_TTL_METADATA, context.getHandler()) ||
      this.defaultTTL

    // 3. Generate cache key and group key based on request context
    const key = this.trackBy(context)
    const group = this.groupBy(context)

    // Skip caching if key generation fails
    if (!key) {
      return next.handle().pipe(
        tap(() => {
          this.maybeInvalidateCache(context)
        })
      )
    }

    // 4. Try to retrieve data from cache
    const value = await this.cache.get(key)
    if (value) {
      this.logger.verbose(`Cache hit for key: ${key}`)
      return new Observable((observer) => {
        observer.next(value)
        observer.complete()
      })
    }
    this.logger.verbose(`Cache miss for key: ${key}`)

    // 5. Execute original method and cache the result
    return next.handle().pipe(
      tap((response) => {
        this.logger.verbose(`Caching data for key: ${key}, group: ${group}`)
        this.cache.set(key, response, ttl as number)
        this.cacheKeysByGroup(group, key)
        this.maybeInvalidateCache(context)
      })
    )
  }

  /**
   * Determines if the current request should be cached based on multiple criteria
   * Implements caching rules to ensure only appropriate requests are cached
   *
   * @param context - Execution context containing the HTTP request
   * @returns true if request should be cached, false otherwise
   *
   * @rules
   * - Only GET and HEAD methods are cacheable
   * - Must have valid entity context (entity.id must exist)
   * - Must not have refresh=true query parameter
   */
  isRequestCacheable(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()
    const entityId = this.getEntityId(request)
    const method = request.method
    const refresh = request.query?.refresh

    // Cache only GET/HEAD requests with entity context and no refresh flag
    const isCacheable =
      (method === 'GET' || method === 'HEAD') && entityId && !refresh

    if (!isCacheable) {
      this.logger.verbose(
        `Request not cacheable: method=${method}, entity=${entityId}, refresh=${refresh}`
      )
    }

    return !!isCacheable
  }

  /**
   * Generates a cache key group for the current request
   * Groups are used for batch cache invalidation by logical grouping
   *
   * @param context - Execution context containing the HTTP request
   * @returns Cache group key string for grouping related cache entries
   *
   * @examples
   * - With @CacheGroup('users'): "app-cache-group:users:entity-123"
   * - Without group: "app-cache-group:/api/users:entity-123"
   */
  groupBy(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest()
    const { httpAdapter } = this.httpAdapterHost
    const entityId = this.getEntityId(request)

    // Check if custom group is defined via @CacheGroup() decorator
    const group = this.reflector.get(CACHE_GROUP_METADATA, context.getHandler())
    if (group) {
      return `${APP_CACHE_GROUP_PREFIX}:${group}:${entityId}`
    }

    // Fallback to URL-based grouping when no custom group is specified
    const url = httpAdapter.getRequestUrl(request)
    return `${APP_CACHE_GROUP_PREFIX}:${url}:${entityId}`
  }

  /**
   * Generates a unique cache key for the current request
   * Creates deterministic cache keys based on request context to ensure consistency
   *
   * @param context - Execution context containing the HTTP request
   * @returns Unique cache key string, or null if key generation fails
   *
   * @keyGeneration
   * 1. Uses custom cache key from @CacheKey() decorator if provided
   * 2. Otherwise generates MD5 hash from: method + URL + query params + entity ID
   * 3. Prepends application prefix for namespacing
   *
   * @examples
   * - Custom key: "my-custom-cache-key"
   * - Generated key: "app-cache:a1b2c3d4e5f6..."
   */
  trackBy(context: ExecutionContext): string {
    const request = context.switchToHttp().getRequest()
    const { httpAdapter } = this.httpAdapterHost

    // 1. Use custom cache key from @CacheKey() decorator if defined
    const cacheKey = this.reflector.get(
      CACHE_KEY_METADATA,
      context.getHandler()
    )
    if (cacheKey) {
      this.logger.verbose(`Using custom cache key: ${cacheKey}`)
      return cacheKey
    }

    // 2. Build deterministic cache key from request context
    const entityId = this.getEntityId(request)
    const method = request.method
    const url = httpAdapter.getRequestUrl(request)
    const query = request.query ? JSON.stringify(request.query) : ''

    // Create consistent hash for identical requests
    const hash = this.md5(`${method}:${url}:${query}:${entityId}`)
    const finalKey = `${APP_CACHE_PREFIX}:${hash}`

    this.logger.verbose(`Generated cache key: ${finalKey} for ${method} ${url}`)
    return finalKey
  }

  /**
   * Extracts entity ID from request context
   * Supports both entity context and user context for multi-tenancy support
   *
   * @param request - HTTP request object containing entity/user context
   * @returns Entity ID string if available, otherwise undefined
   */
  getEntityId(request: any): string | undefined {
    return request.user?.id
  }

  /**
   * Checks if cache invalidation is required for the current request
   * Triggered by @InvalidateCache() decorator on method handlers
   *
   * @param context - Execution context to check for invalidation metadata
   * @private
   */
  private async maybeInvalidateCache(context: ExecutionContext) {
    // Check if method has @InvalidateCache() decorator with configuration
    const options = this.reflector.get(
      INVALIDATE_CACHE_METADATA,
      context.getHandler()
    )
    if (options) {
      const request = context.switchToHttp().getRequest()
      this.logger.verbose(
        `Invalidating cache for groups: ${JSON.stringify(options.group)}`
      )
      await this.invalidateCacheByGroup(request, options.group)
    }
  }

  /**
   * Associates a cache key with a cache group for batch invalidation support
   * Uses Redis hash to store group-to-keys mapping with automatic expiration
   *
   * @param group - Cache group name for grouping related cache entries
   * @param key - Individual cache key to associate with the group
   * @private
   *
   * @implementation
   * - Uses Redis HSET to store key-timestamp pairs in group hash
   * - Sets expiration on group hash to prevent memory accumulation
   * - Timestamp is stored for potential future debugging/audit purposes
   */
  private async cacheKeysByGroup(group: string, key: string) {
    try {
      const store = this.cache.stores[0]?.store
      if (!store || !store.client) {
        this.logger.warn('Redis store not available for cache grouping')
        return
      }

      const groupKey = `${store.namespace}::${group}`
      const timestamp = new Date().getTime()

      // Add key to group hash with current timestamp
      await store.client.hSet(groupKey, key, timestamp)

      // Set expiration on group hash to prevent memory leaks
      await store.client.pExpire(groupKey, this.groupTTL)

      this.logger.verbose(`Added key ${key} to cache group ${group}`)
    } catch (error) {
      this.logger.error(`Error caching key: ${key} for group: ${group}`, error)
    }
  }

  /**
   * Invalidates all cache entries associated with specified cache groups
   * Performs batch deletion of cache keys by group association
   *
   * @param request - HTTP request object containing entity context
   * @param group - Single group name or array of group names to invalidate
   * @private
   *
   * @process
   * 1. Resolves group names for current entity
   * 2. Retrieves all keys associated with each group
   * 3. Deletes group metadata hash
   * 4. Deletes individual cache keys
   * 5. Logs operation results
   *
   * @todo Implement batch deletion with configurable batch size (current TODO: "delete per batch size 100")
   */
  private async invalidateCacheByGroup(request: any, group: string | string[]) {
    const groups = Array.isArray(group) ? group : [group]
    const store = this.cache.stores[0]?.store
    const entityId = this.getEntityId(request)

    if (!store || !store.client) {
      this.logger.warn('Redis store not available for cache invalidation')
      return
    }

    for (const g of groups) {
      const cacheGroup = `${APP_CACHE_GROUP_PREFIX}:${g}:${entityId}`
      const groupKey = `${store.namespace}::${cacheGroup}`

      try {
        // Get all keys associated with this group
        const keys = await store.client.hKeys(groupKey)

        if (keys.length === 0) {
          this.logger.verbose(`No cache keys found for group: ${cacheGroup}`)
          continue
        }

        // Delete group metadata hash first
        await store.client.del(groupKey)

        // Delete individual cache keys (TODO: implement batch deletion)
        await this.cache.del(keys)

        this.logger.verbose(
          `Invalidated cache for group: ${cacheGroup}, keys: ${JSON.stringify(keys)}`
        )
      } catch (error) {
        this.logger.error(
          `Error invalidating cache for group: ${cacheGroup}`,
          error
        )
      }
    }
  }

  /**
   * Generates MD5 hash for query parameter normalization and cache key generation
   * Creates consistent, URL-safe hash values for cache key generation
   *
   * @param str - Input string to hash (typically method:URL:query:entity)
   * @returns 32-character hexadecimal MD5 hash
   * @private
   *
   * @purpose
   * - Normalizes variable-length input to fixed-length output
   * - Ensures consistent cache keys for identical requests
   * - Handles special characters in URLs and query parameters safely
   */
  private md5(str: string): string {
    return createHash('md5').update(str).digest('hex')
  }
}

/**
 * Application-level cache interceptor that extends NestJS CacheInterceptor
 * Provides tenant-aware caching with customizable TTL and cache key generation
 */
@Injectable()
export class TenantCacheInterceptor extends UserCacheInterceptor {
  logger = new Logger(TenantCacheInterceptor.name)

  /**
   * Retrieves tenant ID from request context for multi-tenancy support
   *
   * @param request - HTTP request object containing tenant context
   * @returns Tenant ID string if available, otherwise undefined
   */
  getEntityId(request: any): string | undefined {
    return request.tenant?.id
  }
}

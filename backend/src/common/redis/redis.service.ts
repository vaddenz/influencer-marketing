import { Inject, Injectable } from '@nestjs/common'
import type { RedisClientType } from '@redis/client'

/**
 * Redis Service
 *
 * A wrapper service around the Redis client.
 * Provides access to the underlying Redis client instance.
 */
@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly _client: RedisClientType
  ) {}

  /**
   * Getter for the Redis client instance.
   * Allows direct access to Redis commands.
   *
   * @returns The Redis client instance
   */
  public get client(): RedisClientType {
    return this._client
  }
}

import { Logger, Injectable, Inject } from '@nestjs/common'
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager'
import { PrismaService } from '@/common/prisma/prisma.service'
import { IPromptBackend } from '@/ai/interfaces/prompt-backend.interface'
import { MINUTE } from '@/common/const/unit'

/**
 * Database implementation of the Prompt Backend.
 *
 * This backend retrieves prompt templates from a database via Prisma.
 * It implements a caching strategy using the CacheManager to reduce database load.
 */
@Injectable()
export class DBBackend implements IPromptBackend {
  private readonly logger = new Logger(DBBackend.name)

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Retrieves a prompt from the database or cache.
   *
   * Strategy:
   * 1. Check cache for the prompt key.
   * 2. If found, return cached value.
   * 3. If not found, query database for the latest version of the prompt.
   * 4. If found in DB, cache it (default TTL 5 minutes) and return it.
   * 5. If not found in DB, throw an Error.
   *
   * @param key - The prompt key.
   * @returns The prompt content.
   * @throws Error if the prompt is not found in DB.
   */
  async getPrompt(key: string): Promise<string> {
    const cacheKey = `prompt:${key}`
    const cachedPrompt = await this.cache.get<string>(cacheKey)
    if (cachedPrompt) {
      this.logger.verbose(`[DB Backend] Prompt found in cache: ${key}`)
      return cachedPrompt
    }

    const prompt = await this.prisma.prompt.findFirst({
      where: {
        key,
      },
      orderBy: {
        version: 'desc',
      },
    })
    if (!prompt) {
      this.logger.warn(`[DB Backend] Prompt not found: ${key}`)
      throw new Error(`Prompt not found: ${key}`)
    }
    await this.cache.set(cacheKey, prompt.content, 5 * MINUTE)
    return prompt.content
  }
}

import * as path from 'path'
import * as fs from 'fs/promises'
import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { IPromptBackend } from '@/ai/interfaces/prompt-backend.interface'

/**
 * JSON file-based implementation of the Prompt Backend.
 *
 * This backend loads prompt templates from a local JSON file.
 * Useful for development or when a database is not available.
 */
@Injectable()
export class JSONBackend implements IPromptBackend, OnModuleInit {
  private readonly logger = new Logger(JSONBackend.name)
  private prompts: Record<string, string> = {}
  private readonly filePath = path.join(
    process.cwd(),
    'src/ai/prompt/data/prompts.json'
  )

  /**
   * Lifecycle hook: Called when the module is initialized.
   * Loads prompts from the JSON file into memory.
   */
  async onModuleInit() {
    await this.loadPrompts()
  }

  /**
   * Reads the JSON file and parses the prompts.
   */
  private async loadPrompts() {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8')
      this.prompts = JSON.parse(data)
      this.logger.log(
        `Loaded ${Object.keys(this.prompts).length} prompts from ${this.filePath}`
      )
    } catch (error) {
      this.logger.error(`Failed to load prompts from ${this.filePath}`, error)
      throw error
    }
  }

  /**
   * Retrieves a prompt from the in-memory loaded JSON data.
   *
   * @param key - The prompt key.
   * @returns The prompt content.
   * @throws Error if the prompt is not found.
   */
  async getPrompt(key: string): Promise<string> {
    const prompt = this.prompts[key]
    if (!prompt) {
      this.logger.warn(`[JSON Backend] Prompt not found: ${key}`)
      throw new Error(`Prompt not found: ${key}`)
    }
    return prompt
  }
}

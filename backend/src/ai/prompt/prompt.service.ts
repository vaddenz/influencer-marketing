import { Inject, Injectable, Logger } from '@nestjs/common'
import { PromptTemplate } from '@langchain/core/prompts'
import {
  type IPromptBackend,
  PROMPT_BACKEND,
} from '@/ai/interfaces/prompt-backend.interface'

/**
 * Service for managing and retrieving prompt templates.
 *
 * This service acts as an abstraction layer over the specific prompt backend (DB, JSON, etc.).
 * It also handles the formatting of prompts using LangChain's PromptTemplate.
 */
@Injectable()
export class PromptService {
  private readonly logger = new Logger(PromptService.name)

  constructor(
    @Inject(PROMPT_BACKEND) private readonly backend: IPromptBackend
  ) {}

  /**
   * Retrieves and formats a prompt template.
   *
   * @param key - The unique key of the prompt to retrieve.
   * @param variables - Optional key-value pairs to substitute into the template.
   * @returns The formatted prompt string.
   */
  async getPrompt(
    key: string,
    variables?: Record<string, any>
  ): Promise<string> {
    const template = await this.backend.getPrompt(key)

    if (!variables) {
      return template
    }

    const promptTemplate = PromptTemplate.fromTemplate(template)
    return await promptTemplate.format(variables)
  }
}

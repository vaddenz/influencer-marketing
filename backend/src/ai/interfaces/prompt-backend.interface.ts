/**
 * Token used for dependency injection of the Prompt Backend.
 */
export const PROMPT_BACKEND = 'PROMPT_BACKEND'

/**
 * Interface for Prompt Backends.
 *
 * Implementations of this interface are responsible for retrieving prompt templates
 * from different storage sources (e.g., Database, JSON files, external services).
 */
export interface IPromptBackend {
  /**
   * Retrieves a prompt template by its unique key.
   *
   * @param key - The unique identifier for the prompt.
   * @returns A promise that resolves to the prompt template string.
   */
  getPrompt(key: string): Promise<string>
}

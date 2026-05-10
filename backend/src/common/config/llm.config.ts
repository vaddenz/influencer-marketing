import { registerAs } from '@nestjs/config'
import { SECOND } from '@/common/const/unit'

/**
 * LLM Configuration
 *
 * Registers the 'llm' configuration namespace.
 * Contains general application settings like port and environment.
 */
export default registerAs('llm', () => ({
  model: process.env.LLM_MODEL ?? '',
  apiKey: process.env.LLM_API_KEY ?? '',
  baseUrl: process.env.LLM_BASE_URL ?? '',
  temperature: process.env.LLM_TEMPERATURE
    ? parseFloat(process.env.LLM_TEMPERATURE)
    : null,
  maxTokens: process.env.LLM_MAX_TOKENS
    ? parseInt(process.env.LLM_MAX_TOKENS, 10)
    : null,
  topP: process.env.LLM_TOP_P ? parseFloat(process.env.LLM_TOP_P) : null,
  maxRetries: parseInt(process.env.LLM_MAX_RETRIES ?? '2', 10),
  timeout: parseInt(process.env.LLM_TIMEOUT_SEC ?? '60', 10) * SECOND,
}))

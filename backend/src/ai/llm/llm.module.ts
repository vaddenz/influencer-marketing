import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { LLMService } from './llm.service'

/**
 * LLM Module
 *
 * This module manages the integration with Large Language Models (LLMs), primarily OpenAI.
 * It provides the `LLMService` which handles model invocation, streaming, and file operations.
 */
@Module({
  imports: [ConfigModule],
  providers: [LLMService],
  exports: [LLMService],
})
export class LLMModule {}

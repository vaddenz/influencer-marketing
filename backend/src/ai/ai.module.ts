import { Module } from '@nestjs/common'
import { LanggraphModule } from './langgraph/langgraph.module'
import { LLMModule } from './llm/llm.module'
import { PromptModule } from './prompt/prompt.module'

/**
 * AI Module
 *
 * This module serves as the main entry point for AI-related functionality in the application.
 * It aggregates sub-modules for LangGraph, LLM (Large Language Model) integration, and Prompt management.
 */
@Module({
  imports: [LanggraphModule, LLMModule, PromptModule],
  providers: [],
  exports: [LanggraphModule, LLMModule, PromptModule],
})
export class AIModule {}

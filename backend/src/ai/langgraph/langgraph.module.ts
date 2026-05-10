import { Module } from '@nestjs/common'
import { PrismaModule } from '@/common/prisma/prisma.module'
import { ConfigModule } from '@nestjs/config'
import { PromptModule } from '../prompt/prompt.module'
import { LanggraphService } from './langgraph.service'
import { LLMModule } from '@/ai/llm/llm.module'
import { S3Client } from '@/common/clients/s3.client'

/**
 * LangGraph Module
 *
 * This module orchestrates AI workflows using LangGraph.
 * It manages the lifecycle of workflows and provides the `LanggraphService` to execute them.
 */
@Module({
  imports: [ConfigModule, PromptModule, LLMModule],
  providers: [LanggraphService, S3Client],
  exports: [LanggraphService],
})
export class LanggraphModule {}

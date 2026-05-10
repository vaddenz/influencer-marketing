import { Module } from '@nestjs/common'
import { PrismaModule } from '@/common/prisma/prisma.module'
import { PROMPT_BACKEND } from '@/ai/interfaces/prompt-backend.interface'
import { PromptService } from './prompt.service'
import { DBBackend } from './backends/db.backend'

/**
 * Prompt Module
 *
 * This module handles prompt management and retrieval.
 * It configures the prompt backend (currently using DBBackend) and provides the `PromptService`
 * for other modules to access prompts.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    PromptService,
    {
      provide: PROMPT_BACKEND,
      useClass: DBBackend,
    },
  ],
  exports: [PromptService],
})
export class PromptModule {}

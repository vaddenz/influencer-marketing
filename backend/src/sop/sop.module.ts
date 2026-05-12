import { Module } from '@nestjs/common'
import { PrismaModule } from '@/common/prisma/prisma.module'
import { PromptModule } from '@/ai/prompt/prompt.module'
import { LLMModule } from '@/ai/llm/llm.module'
import { SopController } from './sop.controller'
import { SopService } from './sop.service'
import { SopGenerationService } from './sop-generation.service'

@Module({
  controllers: [SopController],
  providers: [SopService, SopGenerationService],
  imports: [PrismaModule, PromptModule, LLMModule],
  exports: [SopService],
})
export class SopModule {}

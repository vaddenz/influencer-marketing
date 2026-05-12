import { Injectable, Logger, BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { LLMService } from '@/ai/llm/llm.service'
import { PromptService } from '@/ai/prompt/prompt.service'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export interface SOPGenerationOutput {
  title: string
  steps: {
    name: string
    description: string
    dueDateOffset: number
    requirements: string[]
  }[]
}

@Injectable()
export class SopGenerationService {
  private readonly logger = new Logger(SopGenerationService.name)

  constructor(
    private readonly llmService: LLMService,
    private readonly promptService: PromptService
  ) {}

  async generate(variables: {
    campaignTitle: string
    description: string
    targetMarket: string
    influencerType: string
    sellingPoints: string
    publishDate: string
  }): Promise<SOPGenerationOutput> {
    const prompt = await this.promptService.getPrompt('sop-generator', variables)

    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content:
          'You are an expert in influencer marketing operations in Korea and Japan. You generate structured SOP workflows as JSON. All deadlines must be on or before the publish date (dueDateOffset <= 0).',
      },
      { role: 'user', content: prompt },
    ]

    let result: SOPGenerationOutput | null = null
    let attempts = 0
    const maxAttempts = 2

    while (attempts < maxAttempts && !result) {
      attempts++
      try {
        result = await this.llmService.createTypedCompletion<SOPGenerationOutput>(messages)
      } catch (error) {
        this.logger.warn(`SOP generation attempt ${attempts} failed`, error)
      }
    }

    if (!result) {
      throw new ServiceUnavailableException('SOP generation failed, please try again')
    }

    if (!this.validateSchema(result)) {
      this.logger.error('AI generated invalid SOP structure', JSON.stringify(result))
      throw new BadRequestException('AI generated invalid SOP structure')
    }

    return result
  }

  validateSchema(output: unknown): output is SOPGenerationOutput {
    if (typeof output !== 'object' || output === null) return false
    const o = output as Record<string, unknown>
    if (typeof o.title !== 'string' || o.title.length === 0) return false
    if (!Array.isArray(o.steps) || o.steps.length === 0) return false

    for (const step of o.steps) {
      if (typeof step !== 'object' || step === null) return false
      if (typeof step.name !== 'string' || step.name.length === 0) return false
      if (typeof step.description !== 'string' || step.description.length === 0) return false
      if (typeof step.dueDateOffset !== 'number' || !Number.isInteger(step.dueDateOffset)) return false
      if (step.dueDateOffset > 0) return false
      if (!Array.isArray(step.requirements)) return false
      if (!step.requirements.every((r: unknown) => typeof r === 'string')) return false
    }

    return true
  }
}

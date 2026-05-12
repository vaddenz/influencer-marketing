import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { SopGenerationService, SOPGenerationOutput } from './sop-generation.service'
import { LLMService } from '@/ai/llm/llm.service'
import { PromptService } from '@/ai/prompt/prompt.service'

const mockLLMService = () => ({
  createTypedCompletion: jest.fn(),
})

const mockPromptService = () => ({
  getPrompt: jest.fn(),
})

describe('SopGenerationService', () => {
  let service: SopGenerationService
  let llmService: ReturnType<typeof mockLLMService>
  let promptService: ReturnType<typeof mockPromptService>

  const variables = {
    campaignTitle: 'Summer Glow',
    description: 'Promote our new skincare line',
    targetMarket: 'kr',
    influencerType: 'beauty',
    sellingPoints: 'natural ingredients, long-lasting',
    publishDate: '2026-06-10',
  }

  const validOutput: SOPGenerationOutput = {
    title: 'Summer Glow SOP',
    steps: [
      {
        name: 'Draft Submission',
        description: 'Submit the initial draft',
        dueDateOffset: -7,
        requirements: ['Include hook in first 3 seconds'],
      },
    ],
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SopGenerationService,
        { provide: LLMService, useFactory: mockLLMService },
        { provide: PromptService, useFactory: mockPromptService },
      ],
    }).compile()

    service = module.get<SopGenerationService>(SopGenerationService)
    llmService = module.get(LLMService)
    promptService = module.get(PromptService)
  })

  describe('generate', () => {
    it('should generate SOP successfully with valid output', async () => {
      promptService.getPrompt.mockResolvedValue('formatted prompt')
      llmService.createTypedCompletion.mockResolvedValue(validOutput)

      const result = await service.generate(variables)

      expect(result).toEqual(validOutput)
      expect(promptService.getPrompt).toHaveBeenCalledWith('sop-generator', variables)
      expect(llmService.createTypedCompletion).toHaveBeenCalledTimes(1)
    })

    it('should retry once on failure then succeed', async () => {
      promptService.getPrompt.mockResolvedValue('formatted prompt')
      llmService.createTypedCompletion
        .mockRejectedValueOnce(new Error('LLM error'))
        .mockResolvedValueOnce(validOutput)

      const result = await service.generate(variables)

      expect(result).toEqual(validOutput)
      expect(llmService.createTypedCompletion).toHaveBeenCalledTimes(2)
    })

    it('should throw ServiceUnavailableException after max retries', async () => {
      promptService.getPrompt.mockResolvedValue('formatted prompt')
      llmService.createTypedCompletion.mockRejectedValue(new Error('LLM error'))

      await expect(service.generate(variables)).rejects.toThrow(
        ServiceUnavailableException
      )
      expect(llmService.createTypedCompletion).toHaveBeenCalledTimes(2)
    })

    it('should throw BadRequestException for invalid schema', async () => {
      promptService.getPrompt.mockResolvedValue('formatted prompt')
      const invalidOutput = { title: 'Invalid', steps: [] }
      llmService.createTypedCompletion.mockResolvedValue(invalidOutput)

      await expect(service.generate(variables)).rejects.toThrow(
        BadRequestException
      )
    })
  })

  describe('validateSchema', () => {
    it('should accept valid output', () => {
      expect(service.validateSchema(validOutput)).toBe(true)
    })

    it('should reject missing fields', () => {
      expect(service.validateSchema({})).toBe(false)
      expect(service.validateSchema({ title: '' })).toBe(false)
      expect(service.validateSchema({ title: 'T', steps: [] })).toBe(false)
      expect(
        service.validateSchema({
          title: 'T',
          steps: [{ name: '', description: 'D', dueDateOffset: 0, requirements: [] }],
        })
      ).toBe(false)
      expect(
        service.validateSchema({
          title: 'T',
          steps: [{ name: 'N', description: '', dueDateOffset: 0, requirements: [] }],
        })
      ).toBe(false)
    })

    it('should reject positive dueDateOffset', () => {
      const invalid = {
        title: 'T',
        steps: [
          { name: 'N', description: 'D', dueDateOffset: 1, requirements: [] },
        ],
      }
      expect(service.validateSchema(invalid)).toBe(false)
    })

    it('should accept zero dueDateOffset', () => {
      const valid = {
        title: 'T',
        steps: [
          { name: 'N', description: 'D', dueDateOffset: 0, requirements: ['R'] },
        ],
      }
      expect(service.validateSchema(valid)).toBe(true)
    })

    it('should reject non-string requirements', () => {
      const invalid = {
        title: 'T',
        steps: [
          { name: 'N', description: 'D', dueDateOffset: 0, requirements: [1] },
        ],
      }
      expect(service.validateSchema(invalid)).toBe(false)
    })

    it('should reject non-integer dueDateOffset', () => {
      const invalid = {
        title: 'T',
        steps: [
          { name: 'N', description: 'D', dueDateOffset: 1.5, requirements: [] },
        ],
      }
      expect(service.validateSchema(invalid)).toBe(false)
    })
  })
})

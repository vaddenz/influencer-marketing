import { Test, TestingModule } from '@nestjs/testing'
import { ConfigService } from '@nestjs/config'
import { createHmac } from 'crypto'
import { FeishuService } from './feishu.service'

const mockConfigService = (webhookVerifyToken: string) => ({
  get: jest.fn((key: string) => {
    if (key === 'feishu.webhookVerifyToken') return webhookVerifyToken
    if (key === 'feishu.appId') return 'test-app-id'
    if (key === 'feishu.appSecret') return 'test-app-secret'
    return undefined
  }),
})

describe('FeishuService', () => {
  describe('verifySignature', () => {
    it('should return true for a valid signature', async () => {
      const token = 'my-verify-token'
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FeishuService,
          { provide: ConfigService, useFactory: () => mockConfigService(token) },
        ],
      }).compile()
      const service = module.get<FeishuService>(FeishuService)

      const timestamp = '1715488758'
      const body = '{"challenge":"test-challenge"}'
      const expectedSign = createHmac('sha256', token)
        .update(`${timestamp}\n${body}`)
        .digest('base64')

      expect(service.verifySignature(body, expectedSign, timestamp)).toBe(true)
    })

    it('should return true for a valid signature with Buffer body', async () => {
      const token = 'my-verify-token'
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FeishuService,
          { provide: ConfigService, useFactory: () => mockConfigService(token) },
        ],
      }).compile()
      const service = module.get<FeishuService>(FeishuService)

      const timestamp = '1715488758'
      const body = Buffer.from('{"challenge":"test-challenge"}')
      const expectedSign = createHmac('sha256', token)
        .update(`${timestamp}\n${body}`)
        .digest('base64')

      expect(service.verifySignature(body, expectedSign, timestamp)).toBe(true)
    })

    it('should return false for an invalid signature', async () => {
      const token = 'my-verify-token'
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FeishuService,
          { provide: ConfigService, useFactory: () => mockConfigService(token) },
        ],
      }).compile()
      const service = module.get<FeishuService>(FeishuService)

      const timestamp = '1715488758'
      const body = '{"challenge":"test-challenge"}'

      expect(service.verifySignature(body, 'invalid-signature', timestamp)).toBe(false)
    })

    it('should bypass verification when verifyToken is empty', async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          FeishuService,
          { provide: ConfigService, useFactory: () => mockConfigService('') },
        ],
      }).compile()
      const service = module.get<FeishuService>(FeishuService)

      expect(service.verifySignature('any-body', 'any-signature', 'any-timestamp')).toBe(true)
    })
  })
})

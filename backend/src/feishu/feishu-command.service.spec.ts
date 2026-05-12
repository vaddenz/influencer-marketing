import { Test, TestingModule } from '@nestjs/testing'
import { FeishuCommandService } from './feishu-command.service'
import { PrismaService } from '@/common/prisma/prisma.service'
import { FeishuService } from './feishu.service'
import { NotificationType } from '@/generated/prisma/enums'

const mockPrismaService = () => ({
  user: {
    findUnique: jest.fn(),
  },
  invitation: {
    findFirst: jest.fn(),
  },
  sopBinding: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
})

const mockFeishuService = () => ({
  sendMessage: jest.fn().mockResolvedValue(undefined),
})

describe('FeishuCommandService', () => {
  let service: FeishuCommandService
  let prisma: ReturnType<typeof mockPrismaService>
  let feishuService: ReturnType<typeof mockFeishuService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeishuCommandService,
        { provide: PrismaService, useFactory: mockPrismaService },
        { provide: FeishuService, useFactory: mockFeishuService },
      ],
    }).compile()

    service = module.get<FeishuCommandService>(FeishuCommandService)
    prisma = module.get(PrismaService)
    feishuService = module.get(FeishuService)
  })

  describe('parseCommand', () => {
    it('should parse /绑定 KR_001', () => {
      const result = service.parseCommand('/绑定 KR_001')
      expect(result).toEqual({ command: '/绑定', args: 'KR_001' })
    })

    it('should parse /延期 设备故障', () => {
      const result = service.parseCommand('/延期 设备故障')
      expect(result).toEqual({ command: '/延期', args: '设备故障' })
    })

    it('should handle extra spaces', () => {
      const result = service.parseCommand('  /绑定   KR_001  ')
      expect(result).toEqual({ command: '/绑定', args: 'KR_001' })
    })

    it('should parse command without args', () => {
      const result = service.parseCommand('/进度')
      expect(result).toEqual({ command: '/进度', args: '' })
    })
  })

  describe('handleCommand', () => {
    it('should send unknown command message for unsupported commands', async () => {
      await service.handleCommand('chat-1', '/foo')
      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        '未知命令。可用命令：/绑定, /进度, /延期'
      )
    })

    it('should catch errors and send error message', async () => {
      jest.spyOn(service, 'handleBind').mockRejectedValue(new Error('boom'))
      await service.handleCommand('chat-1', '/绑定 KR_001')
      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        '处理命令时出错，请稍后重试'
      )
    })
  })

  describe('handleBind', () => {
    it('should reject non-existent influencer ID', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await service.handleBind('chat-1', 'bad-id')

      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        '未找到该达人ID，请联系运营确认'
      )
      expect(prisma.sopBinding.create).not.toHaveBeenCalled()
    })

    it('should reject user without influencer profile', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', influencerProfile: null })

      await service.handleBind('chat-1', 'user-1')

      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        '未找到该达人ID，请联系运营确认'
      )
      expect(prisma.sopBinding.create).not.toHaveBeenCalled()
    })

    it('should reject unaccepted invitation', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'inf-1',
        influencerProfile: { id: 'prof-1' },
      })
      prisma.invitation.findFirst.mockResolvedValue(null)

      await service.handleBind('chat-1', 'inf-1')

      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        '该达人尚未接受合作邀请，请先完成邀请流程'
      )
      expect(prisma.sopBinding.create).not.toHaveBeenCalled()
    })

    it('should reject when campaign has no SOP', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'inf-1',
        influencerProfile: { id: 'prof-1' },
      })
      prisma.invitation.findFirst.mockResolvedValue({
        id: 'inv-1',
        campaign: { sop: null },
      })

      await service.handleBind('chat-1', 'inf-1')

      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        '该活动暂无SOP，请联系运营'
      )
      expect(prisma.sopBinding.create).not.toHaveBeenCalled()
    })

    it('should reject duplicate binding', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'inf-1',
        influencerProfile: { id: 'prof-1' },
      })
      prisma.invitation.findFirst.mockResolvedValue({
        id: 'inv-1',
        campaign: { sop: { id: 'sop-1' } },
      })
      prisma.sopBinding.findUnique.mockResolvedValue({ id: 'bind-1' })

      await service.handleBind('chat-1', 'inf-1')

      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        '您已绑定，无需重复操作'
      )
      expect(prisma.sopBinding.create).not.toHaveBeenCalled()
    })

    it('should create binding for valid input', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'inf-1',
        influencerProfile: { id: 'prof-1' },
      })
      prisma.invitation.findFirst.mockResolvedValue({
        id: 'inv-1',
        campaign: { sop: { id: 'sop-1' } },
      })
      prisma.sopBinding.findUnique.mockResolvedValue(null)
      prisma.sopBinding.create.mockResolvedValue({ id: 'bind-1' })

      await service.handleBind('chat-1', 'inf-1')

      expect(prisma.sopBinding.create).toHaveBeenCalledWith({
        data: {
          sopId: 'sop-1',
          invitationId: 'inv-1',
          chatId: 'chat-1',
        },
      })
      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        '绑定成功，将为您推送SOP'
      )
    })

    it('should send usage message when influencer ID is empty', async () => {
      await service.handleBind('chat-1', '   ')

      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        '用法: /绑定 <达人ID>'
      )
      expect(prisma.sopBinding.create).not.toHaveBeenCalled()
    })
  })

  describe('handleProgress', () => {
    it('should send message when no binding exists', async () => {
      prisma.sopBinding.findFirst.mockResolvedValue(null)

      await service.handleProgress('chat-1')

      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        '暂无进行中的SOP，请联系运营'
      )
    })

    it('should send current step info', async () => {
      const publishDate = new Date()
      publishDate.setHours(0, 0, 0, 0)
      prisma.sopBinding.findFirst.mockResolvedValue({
        sop: {
          publishDate,
          steps: [
            {
              name: 'Draft',
              description: 'Submit draft',
              dueDateOffset: 2,
              requirements: [],
            },
          ],
        },
      })

      await service.handleProgress('chat-1')

      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        expect.stringContaining('您当前处于【Draft】阶段')
      )
    })

    it('should send completion message when all steps are past due', async () => {
      const publishDate = new Date()
      publishDate.setDate(publishDate.getDate() - 10)
      publishDate.setHours(0, 0, 0, 0)
      prisma.sopBinding.findFirst.mockResolvedValue({
        sop: {
          publishDate,
          steps: [
            {
              name: 'Draft',
              description: 'Submit draft',
              dueDateOffset: -5,
              requirements: [],
            },
          ],
        },
      })

      await service.handleProgress('chat-1')

      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        '所有SOP步骤已结束'
      )
    })
  })

  describe('handleDelay', () => {
    it('should reject when not bound', async () => {
      prisma.sopBinding.findFirst.mockResolvedValue(null)

      await service.handleDelay('chat-1', '设备故障')

      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        '绑定后才能申请延期'
      )
      expect(prisma.notification.create).not.toHaveBeenCalled()
    })

    it('should send usage message when reason is empty', async () => {
      await service.handleDelay('chat-1', '   ')

      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        '用法: /延期 <原因>'
      )
      expect(prisma.notification.create).not.toHaveBeenCalled()
    })

    it('should create notification for valid delay request', async () => {
      prisma.sopBinding.findFirst.mockResolvedValue({
        sop: {
          id: 'sop-1',
          campaign: { brandId: 'brand-1' },
        },
        invitation: {
          influencer: {
            influencerProfile: {
              displayName: 'Alice',
              handle: 'alice_handle',
            },
          },
        },
      })
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' })

      await service.handleDelay('chat-1', '设备故障')

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'brand-1',
          type: NotificationType.sop_delay_requested,
          title: '达人申请延期',
          message: 'Alice 申请延期: 设备故障',
          relatedEntityType: 'sop',
          relatedEntityId: 'sop-1',
        },
      })
      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        '延期申请已提交，运营将手动处理'
      )
    })

    it('should use handle as fallback for influencer name', async () => {
      prisma.sopBinding.findFirst.mockResolvedValue({
        sop: {
          id: 'sop-1',
          campaign: { brandId: 'brand-1' },
        },
        invitation: {
          influencer: {
            influencerProfile: {
              displayName: null,
              handle: 'alice_handle',
            },
          },
        },
      })
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' })

      await service.handleDelay('chat-1', '设备故障')

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            message: 'alice_handle 申请延期: 设备故障',
          }),
        })
      )
    })
  })
})

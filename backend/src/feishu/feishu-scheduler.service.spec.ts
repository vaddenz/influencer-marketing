import { Test, TestingModule } from '@nestjs/testing'
import { FeishuSchedulerService } from './feishu-scheduler.service'
import { PrismaService } from '@/common/prisma/prisma.service'
import { FeishuService } from './feishu.service'
import { SopStatus, NotificationType } from '@/generated/prisma/enums'

const mockPrismaService = () => ({
  sop: {
    findMany: jest.fn(),
  },
  sopReminderLog: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  notification: {
    create: jest.fn(),
  },
})

const mockFeishuService = () => ({
  sendMessage: jest.fn().mockResolvedValue(undefined),
})

describe('FeishuSchedulerService', () => {
  let service: FeishuSchedulerService
  let prisma: ReturnType<typeof mockPrismaService>
  let feishuService: ReturnType<typeof mockFeishuService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeishuSchedulerService,
        { provide: PrismaService, useFactory: mockPrismaService },
        { provide: FeishuService, useFactory: mockFeishuService },
      ],
    }).compile()

    service = module.get<FeishuSchedulerService>(FeishuSchedulerService)
    prisma = module.get(PrismaService)
    feishuService = module.get(FeishuService)
  })

  describe('sendReminders', () => {
    it('should send 3-day reminder when due date is 3 days away', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const publishDate = new Date(today)
      publishDate.setDate(publishDate.getDate() + 2)

      prisma.sop.findMany.mockResolvedValue([
        {
          id: 'sop-1',
          publishDate,
          status: SopStatus.active,
          steps: [
            {
              name: 'Draft Submission',
              description: 'Submit the initial draft',
              dueDateOffset: 1,
              requirements: [],
            },
          ],
          bindings: [
            {
              id: 'bind-1',
              chatId: 'chat-1',
              invitation: {
                influencer: {
                  influencerProfile: { displayName: 'Alice' },
                },
              },
            },
          ],
          campaign: { brandId: 'brand-1' },
        },
      ])

      prisma.sopReminderLog.findUnique.mockResolvedValue(null)
      prisma.sopReminderLog.create.mockResolvedValue({ id: 'log-1' })
      prisma.notification.create.mockResolvedValue({ id: 'notif-1' })

      await service.sendReminders()

      expect(feishuService.sendMessage).toHaveBeenCalledWith(
        'chat-1',
        expect.stringContaining('还有3天')
      )
      expect(prisma.sopReminderLog.create).toHaveBeenCalledWith({
        data: {
          sopBindingId: 'bind-1',
          stepIndex: 0,
          reminderType: '3_day',
        },
      })
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'brand-1',
          type: NotificationType.sop_reminder,
          title: 'SOP提醒已发送',
          message: '已发送 Draft Submission 的3天前提醒',
          relatedEntityType: 'sop',
          relatedEntityId: 'sop-1',
        },
      })
    })

    it('should skip past due dates', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const publishDate = new Date(today)
      publishDate.setDate(publishDate.getDate() - 10)

      prisma.sop.findMany.mockResolvedValue([
        {
          id: 'sop-1',
          publishDate,
          status: SopStatus.active,
          steps: [
            {
              name: 'Draft Submission',
              description: 'Submit the initial draft',
              dueDateOffset: 1,
              requirements: [],
            },
          ],
          bindings: [
            {
              id: 'bind-1',
              chatId: 'chat-1',
              invitation: {
                influencer: {
                  influencerProfile: { displayName: 'Alice' },
                },
              },
            },
          ],
          campaign: { brandId: 'brand-1' },
        },
      ])

      await service.sendReminders()

      expect(feishuService.sendMessage).not.toHaveBeenCalled()
      expect(prisma.sopReminderLog.create).not.toHaveBeenCalled()
    })

    it('should not send duplicate reminders when log exists', async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const publishDate = new Date(today)
      publishDate.setDate(publishDate.getDate() - 2)

      prisma.sop.findMany.mockResolvedValue([
        {
          id: 'sop-1',
          publishDate,
          status: SopStatus.active,
          steps: [
            {
              name: 'Draft Submission',
              description: 'Submit the initial draft',
              dueDateOffset: 1,
              requirements: [],
            },
          ],
          bindings: [
            {
              id: 'bind-1',
              chatId: 'chat-1',
              invitation: {
                influencer: {
                  influencerProfile: { displayName: 'Alice' },
                },
              },
            },
          ],
          campaign: { brandId: 'brand-1' },
        },
      ])

      prisma.sopReminderLog.findUnique.mockResolvedValue({ id: 'log-1' })

      await service.sendReminders()

      expect(feishuService.sendMessage).not.toHaveBeenCalled()
      expect(prisma.sopReminderLog.create).not.toHaveBeenCalled()
      expect(prisma.notification.create).not.toHaveBeenCalled()
    })
  })
})

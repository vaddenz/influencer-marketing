import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import { PrismaService } from '@/common/prisma/prisma.service'
import { FeishuService } from './feishu.service'
import { SopStatus, NotificationType } from '@/generated/prisma/enums'

@Injectable()
export class FeishuSchedulerService {
  private readonly logger = new Logger(FeishuSchedulerService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly feishuService: FeishuService
  ) {}

  @Cron('0 9 * * *', { timeZone: 'Asia/Tokyo' })
  async sendReminders() {
    this.logger.log('Running daily SOP reminder check')

    const activeSops = await this.prisma.sop.findMany({
      where: { status: SopStatus.active, deletedAt: null },
      include: {
        bindings: {
          include: {
            invitation: {
              include: {
                influencer: {
                  include: { influencerProfile: true },
                },
              },
            },
          },
        },
        campaign: true,
      },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const sop of activeSops) {
      const steps = sop.steps as Array<{
        name: string
        description: string
        dueDateOffset: number
        requirements: string[]
      }>
      const publishDate = new Date(sop.publishDate)
      publishDate.setHours(0, 0, 0, 0)

      for (const binding of sop.bindings) {
        for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
          const step = steps[stepIndex]
          const dueDate = new Date(publishDate)
          dueDate.setDate(dueDate.getDate() + step.dueDateOffset)

          if (dueDate.getTime() < today.getTime()) continue

          const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

          for (const reminderType of ['3_day', '1_day'] as const) {
            const expectedDays = reminderType === '3_day' ? 3 : 1
            if (daysUntilDue !== expectedDays) continue

            const existingLog = await this.prisma.sopReminderLog.findUnique({
              where: {
                sopBindingId_stepIndex_reminderType: {
                  sopBindingId: binding.id,
                  stepIndex,
                  reminderType,
                },
              },
            })

            if (existingLog) continue

            try {
              await this.feishuService.sendMessage(
                binding.chatId,
                `提醒：距离${step.name}还有${expectedDays}天（截止日：${dueDate.toISOString().split('T')[0]}）\n${step.description}`
              )

              await this.prisma.sopReminderLog.create({
                data: {
                  sopBindingId: binding.id,
                  stepIndex,
                  reminderType,
                },
              })

              await this.prisma.notification.create({
                data: {
                  userId: sop.campaign.brandId,
                  type: NotificationType.sop_reminder,
                  title: 'SOP提醒已发送',
                  message: `已发送 ${step.name} 的${expectedDays}天前提醒`,
                  relatedEntityType: 'sop',
                  relatedEntityId: sop.id,
                },
              })

              this.logger.log(`Sent ${reminderType} reminder for sopId=${sop.id}, bindingId=${binding.id}, stepIndex=${stepIndex}`)
            } catch (error) {
              this.logger.error(`Failed to send reminder to binding ${binding.id}`, error)
            }
          }
        }
      }
    }
  }
}

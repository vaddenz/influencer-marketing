import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/prisma/prisma.service'
import { FeishuService } from './feishu.service'
import { NotificationType } from '@/generated/prisma'

@Injectable()
export class FeishuCommandService {
  private readonly logger = new Logger(FeishuCommandService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly feishuService: FeishuService
  ) {}

  parseCommand(text: string): { command: string; args: string } {
    const trimmed = text.trim()
    const spaceIndex = trimmed.indexOf(' ')
    if (spaceIndex === -1) {
      return { command: trimmed, args: '' }
    }
    return {
      command: trimmed.slice(0, spaceIndex).trim(),
      args: trimmed.slice(spaceIndex + 1).trim(),
    }
  }

  async handleCommand(chatId: string, text: string) {
    const { command, args } = this.parseCommand(text)

    try {
      switch (command) {
        case '/绑定':
          await this.handleBind(chatId, args)
          break
        case '/进度':
          await this.handleProgress(chatId)
          break
        case '/延期':
          await this.handleDelay(chatId, args)
          break
        default:
          await this.feishuService.sendMessage(chatId, '未知命令。可用命令：/绑定, /进度, /延期')
      }
    } catch (error) {
      this.logger.error(`Command error: ${command}`, error)
      await this.feishuService.sendMessage(chatId, '处理命令时出错，请稍后重试')
    }
  }

  async handleBind(chatId: string, influencerIdRaw: string) {
    const influencerId = influencerIdRaw.trim()
    if (!influencerId) {
      await this.feishuService.sendMessage(chatId, '用法: /绑定 <达人ID>')
      return
    }

    const user = await this.prisma.user.findUnique({
      where: { id: influencerId },
      include: { influencerProfile: true },
    })
    if (!user || !user.influencerProfile) {
      await this.feishuService.sendMessage(chatId, '未找到该达人ID，请联系运营确认')
      return
    }

    const invitation = await this.prisma.invitation.findFirst({
      where: {
        influencerId: user.id,
        status: 'accepted',
      },
      include: { campaign: { include: { sop: true } } },
      orderBy: { createdAt: 'desc' },
    })

    if (!invitation) {
      await this.feishuService.sendMessage(chatId, '该达人尚未接受合作邀请，请先完成邀请流程')
      return
    }

    if (!invitation.campaign.sop) {
      await this.feishuService.sendMessage(chatId, '该活动暂无SOP，请联系运营')
      return
    }

    const existing = await this.prisma.sopBinding.findUnique({
      where: { invitationId: invitation.id },
    })
    if (existing) {
      await this.feishuService.sendMessage(chatId, '您已绑定，无需重复操作')
      return
    }

    await this.prisma.sopBinding.create({
      data: {
        sopId: invitation.campaign.sop.id,
        invitationId: invitation.id,
        chatId,
      },
    })

    await this.feishuService.sendMessage(chatId, '绑定成功，将为您推送SOP')
    this.logger.log(`Influencer ${influencerId} bound to chat ${chatId}`)
  }

  async handleProgress(chatId: string) {
    const binding = await this.prisma.sopBinding.findFirst({
      where: { chatId },
      include: { sop: true },
    })

    if (!binding || !binding.sop) {
      await this.feishuService.sendMessage(chatId, '暂无进行中的SOP，请联系运营')
      return
    }

    const steps = binding.sop.steps as Array<{
      name: string
      description: string
      dueDateOffset: number
      requirements: string[]
    }>

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const publishDate = new Date(binding.sop.publishDate)
    publishDate.setHours(0, 0, 0, 0)

    let currentStepIndex = -1
    let minDiff = Infinity

    for (let i = 0; i < steps.length; i++) {
      const dueDate = new Date(publishDate)
      dueDate.setDate(dueDate.getDate() + steps[i].dueDateOffset)
      const diff = dueDate.getTime() - today.getTime()
      if (diff >= 0 && diff < minDiff) {
        minDiff = diff
        currentStepIndex = i
      }
    }

    if (currentStepIndex === -1) {
      await this.feishuService.sendMessage(chatId, '所有SOP步骤已结束')
      return
    }

    const step = steps[currentStepIndex]
    const dueDate = new Date(publishDate)
    dueDate.setDate(dueDate.getDate() + step.dueDateOffset)
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const dateStr = dueDate.toISOString().split('T')[0]

    await this.feishuService.sendMessage(
      chatId,
      `您当前处于【${step.name}】阶段，截止日${dateStr}，剩余${daysRemaining}天`
    )
  }

  async handleDelay(chatId: string, reason: string) {
    if (!reason.trim()) {
      await this.feishuService.sendMessage(chatId, '用法: /延期 <原因>')
      return
    }

    const binding = await this.prisma.sopBinding.findFirst({
      where: { chatId },
      include: {
        sop: { include: { campaign: true } },
        invitation: { include: { influencer: { include: { influencerProfile: true } } } },
      },
    })

    if (!binding) {
      await this.feishuService.sendMessage(chatId, '绑定后才能申请延期')
      return
    }

    const influencerName =
      binding.invitation.influencer.influencerProfile?.displayName ||
      binding.invitation.influencer.influencerProfile?.handle ||
      'Unknown'

    await this.prisma.notification.create({
      data: {
        userId: binding.sop.campaign.brandId,
        type: NotificationType.sop_delay_requested,
        title: '达人申请延期',
        message: `${influencerName} 申请延期: ${reason}`,
        relatedEntityType: 'sop',
        relatedEntityId: binding.sop.id,
      },
    })

    await this.feishuService.sendMessage(chatId, '延期申请已提交，运营将手动处理')
    this.logger.log(`Delay request from chat ${chatId}: ${reason}`)
  }
}

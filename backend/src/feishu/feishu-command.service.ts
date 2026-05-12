import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '@/common/prisma/prisma.service'
import { FeishuService } from './feishu.service'
import { NotificationType } from '@/generated/prisma/enums'

@Injectable()
export class FeishuCommandService {
  private readonly logger = new Logger(FeishuCommandService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly feishuService: FeishuService
  ) {}

  parseCommand(text: string): { command: string; args: string } {
    // Remove all @mention tokens regardless of position
    const cleaned = text
      .split(/\s+/)
      .filter((token) => !token.startsWith('@'))
      .join(' ')
      .trim()

    const spaceIndex = cleaned.indexOf(' ')
    if (spaceIndex === -1) {
      return { command: cleaned, args: '' }
    }
    return {
      command: cleaned.slice(0, spaceIndex).trim(),
      args: cleaned.slice(spaceIndex + 1).trim(),
    }
  }

  async handleCommand(chatId: string, text: string) {
    this.logger.log(`handleCommand called. chatId=${chatId}, text=${text}`)
    const { command, args } = this.parseCommand(text)
    this.logger.log(`Parsed command. command=${command}, args=${args}`)

    try {
      switch (command) {
        case '/绑定':
          this.logger.log(`Handling /绑定 command for chatId=${chatId}`)
          await this.handleBind(chatId, args)
          break
        case '/进度':
          this.logger.log(`Handling /进度 command for chatId=${chatId}`)
          await this.handleProgress(chatId)
          break
        case '/延期':
          this.logger.log(`Handling /延期 command for chatId=${chatId}`)
          await this.handleDelay(chatId, args)
          break
        default:
          this.logger.log(`Unknown command received: ${command}`)
          await this.feishuService.sendMessage(chatId, '未知命令。可用命令：/绑定, /进度, /延期')
      }
    } catch (error) {
      this.logger.error(`Command error: ${command}`, error)
      await this.feishuService.sendMessage(chatId, '处理命令时出错，请稍后重试')
    }
  }

  async handleBind(chatId: string, influencerIdRaw: string) {
    this.logger.log(`handleBind called. chatId=${chatId}, influencerIdRaw=${influencerIdRaw}`)
    const influencerId = influencerIdRaw.trim()
    if (!influencerId) {
      this.logger.log(`handleBind: empty influencerId for chatId=${chatId}`)
      await this.feishuService.sendMessage(chatId, '用法: /绑定 <达人ID>')
      return
    }

    const user = await this.prisma.user.findUnique({
      where: { id: influencerId },
      include: { influencerProfile: true },
    })
    if (!user || !user.influencerProfile) {
      this.logger.log(`handleBind: user or influencerProfile not found for id=${influencerId}`)
      await this.feishuService.sendMessage(chatId, '未找到该达人 ID，请联系运营确认')
      return
    }
    this.logger.log(`handleBind: found user id=${user.id}`)

    const invitation = await this.prisma.invitation.findFirst({
      where: {
        influencerId: user.id,
        status: 'accepted',
      },
      include: { campaign: { include: { sop: true } } },
      orderBy: { createdAt: 'desc' },
    })

    if (!invitation) {
      this.logger.log(`handleBind: no accepted invitation for user id=${user.id}`)
      await this.feishuService.sendMessage(chatId, '该达人尚未接受合作邀请，请先完成邀请流程')
      return
    }
    this.logger.log(`handleBind: found invitation id=${invitation.id}`)

    if (!invitation.campaign.sop) {
      this.logger.log(`handleBind: no SOP for campaign id=${invitation.campaign.id}`)
      await this.feishuService.sendMessage(chatId, '该活动暂无交付流程（SOP），请联系运营创建')
      return
    }

    const existing = await this.prisma.sopBinding.findUnique({
      where: { invitationId: invitation.id },
    })
    if (existing) {
      this.logger.log(`handleBind: binding already exists for invitation id=${invitation.id}`)
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

    this.logger.log(`handleBind: created sopBinding for influencer ${influencerId}, chat ${chatId}`)
    await this.feishuService.sendMessage(chatId, '绑定成功，将为您推送交付流程（SOP）')
    this.logger.log(`Influencer ${influencerId} bound to chat ${chatId}`)
  }

  async handleProgress(chatId: string) {
    this.logger.log(`handleProgress called. chatId=${chatId}`)
    const binding = await this.prisma.sopBinding.findFirst({
      where: { chatId },
      include: { sop: true },
    })

    if (!binding || !binding.sop) {
      this.logger.log(`handleProgress: no binding or SOP for chatId=${chatId}`)
      await this.feishuService.sendMessage(chatId, '暂无进行中的交付流程（SOP），请联系运营创建')
      return
    }
    this.logger.log(`handleProgress: found binding id=${binding.id}, sop id=${binding.sop.id}`)

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
      this.logger.log(`handleProgress: all SOP steps ended for binding id=${binding.id}`)
      await this.feishuService.sendMessage(chatId, '所有交付流程（SOP）步骤已结束')
      return
    }

    const step = steps[currentStepIndex]
    const dueDate = new Date(publishDate)
    dueDate.setDate(dueDate.getDate() + step.dueDateOffset)
    const daysRemaining = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const dateStr = dueDate.toISOString().split('T')[0]

    this.logger.log(`handleProgress: currentStep=${step.name}, dueDate=${dateStr}, daysRemaining=${daysRemaining}`)
    await this.feishuService.sendMessage(
      chatId,
      `您当前处于【${step.name}】阶段，截止日${dateStr}，剩余${daysRemaining}天`
    )
  }

  async handleDelay(chatId: string, reason: string) {
    this.logger.log(`handleDelay called. chatId=${chatId}, reason=${reason}`)
    if (!reason.trim()) {
      this.logger.log(`handleDelay: empty reason for chatId=${chatId}`)
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
      this.logger.log(`handleDelay: no binding for chatId=${chatId}`)
      await this.feishuService.sendMessage(chatId, '绑定后才能申请延期')
      return
    }
    this.logger.log(`handleDelay: found binding id=${binding.id}`)

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

    this.logger.log(`handleDelay: notification created for userId=${binding.sop.campaign.brandId}`)
    await this.feishuService.sendMessage(chatId, '延期申请已提交，运营将手动处理')
    this.logger.log(`Delay request from chat ${chatId}: ${reason}`)
  }
}

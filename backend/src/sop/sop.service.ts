import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/common/prisma/prisma.service'
import { Role } from '@/common/enums/role.enum'
import type { UserPayload } from '@/common/decorators/current-user.decorator'
import { SopGenerationService } from './sop-generation.service'
import { GenerateSopDto } from './dto/generate-sop.dto'
import { UpdateSopDto } from './dto/update-sop.dto'
import { SopStatus } from '@/generated/prisma'

const SOP_SELECT = {
  id: true,
  campaignId: true,
  title: true,
  publishDate: true,
  targetMarket: true,
  influencerType: true,
  sellingPoints: true,
  steps: true,
  status: true,
  createdAt: true,
  updatedAt: true,
}

@Injectable()
export class SopService {
  private readonly logger = new Logger(SopService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly generationService: SopGenerationService
  ) {}

  private async assertBrandOwnsCampaign(userId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } })
    if (!campaign) throw new NotFoundException('Campaign not found')
    if (campaign.brandId !== userId) throw new ForbiddenException('You do not own this campaign')
  }

  async create(userId: string, dto: GenerateSopDto) {
    await this.assertBrandOwnsCampaign(userId, dto.campaignId)

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: dto.campaignId },
    })
    if (!campaign) throw new NotFoundException('Campaign not found')

    const existing = await this.prisma.sop.findUnique({
      where: { campaignId: dto.campaignId },
    })
    if (existing) throw new ForbiddenException('SOP already exists for this campaign')

    const generated = await this.generationService.generate({
      campaignTitle: campaign.title,
      description: campaign.description,
      targetMarket: dto.targetMarket,
      influencerType: dto.influencerType,
      sellingPoints: JSON.stringify(dto.sellingPoints),
      publishDate: dto.publishDate,
    })

    const sop = await this.prisma.sop.create({
      data: {
        campaignId: dto.campaignId,
        title: generated.title,
        publishDate: new Date(dto.publishDate),
        targetMarket: dto.targetMarket,
        influencerType: dto.influencerType,
        sellingPoints: dto.sellingPoints,
        steps: generated.steps,
        status: SopStatus.generated,
      },
      select: SOP_SELECT,
    })

    this.logger.log(`SOP created for campaign ${dto.campaignId}: ${sop.id}`)
    return sop
  }

  async findByCampaign(user: UserPayload, campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { invitations: true },
    })
    if (!campaign) throw new NotFoundException('Campaign not found')

    const isBrandOwner = campaign.brandId === user.id
    const isAcceptedInfluencer = campaign.invitations.some(
      (inv) => inv.influencerId === user.id && inv.status === 'accepted'
    )

    if (!isBrandOwner && !isAcceptedInfluencer) {
      throw new ForbiddenException('You do not have access to this campaign')
    }

    const sop = await this.prisma.sop.findUnique({
      where: { campaignId },
      select: SOP_SELECT,
    })

    if (!sop) throw new NotFoundException('SOP not found for this campaign')
    return sop
  }

  async update(userId: string, sopId: string, dto: UpdateSopDto) {
    const sop = await this.prisma.sop.findUnique({ where: { id: sopId } })
    if (!sop) throw new NotFoundException('SOP not found')

    await this.assertBrandOwnsCampaign(userId, sop.campaignId)

    const updated = await this.prisma.sop.update({
      where: { id: sopId },
      data: {
        ...(dto as any),
        publishDate: dto.publishDate ? new Date(dto.publishDate) : undefined,
      },
      select: SOP_SELECT,
    })

    this.logger.log(`SOP updated: ${sopId}`)
    return updated
  }

  async regenerate(userId: string, sopId: string, dto: GenerateSopDto) {
    const sop = await this.prisma.sop.findUnique({ where: { id: sopId } })
    if (!sop) throw new NotFoundException('SOP not found')
    await this.assertBrandOwnsCampaign(userId, sop.campaignId)

    const campaign = await this.prisma.campaign.findUnique({
      where: { id: sop.campaignId },
    })
    if (!campaign) throw new NotFoundException('Campaign not found')

    const generated = await this.generationService.generate({
      campaignTitle: campaign.title,
      description: campaign.description,
      targetMarket: dto.targetMarket,
      influencerType: dto.influencerType,
      sellingPoints: JSON.stringify(dto.sellingPoints),
      publishDate: dto.publishDate,
    })

    const updated = await this.prisma.sop.update({
      where: { id: sopId },
      data: {
        title: generated.title,
        publishDate: new Date(dto.publishDate),
        targetMarket: dto.targetMarket,
        influencerType: dto.influencerType,
        sellingPoints: dto.sellingPoints,
        steps: generated.steps,
        status: SopStatus.generated,
      },
      select: SOP_SELECT,
    })

    this.logger.log(`SOP regenerated: ${sopId}`)
    return updated
  }

  async activate(userId: string, sopId: string) {
    const sop = await this.prisma.sop.findUnique({ where: { id: sopId } })
    if (!sop) throw new NotFoundException('SOP not found')
    await this.assertBrandOwnsCampaign(userId, sop.campaignId)

    const updated = await this.prisma.sop.update({
      where: { id: sopId },
      data: { status: SopStatus.active },
      select: SOP_SELECT,
    })

    this.logger.log(`SOP activated: ${sopId}`)
    return updated
  }

  async push(userId: string, sopId: string) {
    const sop = await this.prisma.sop.findUnique({
      where: { id: sopId },
      include: { bindings: true },
    })
    if (!sop) throw new NotFoundException('SOP not found')
    await this.assertBrandOwnsCampaign(userId, sop.campaignId)

    if (sop.status !== SopStatus.active) {
      throw new ForbiddenException('SOP must be active before pushing')
    }

    return { sop, bindings: sop.bindings }
  }
}

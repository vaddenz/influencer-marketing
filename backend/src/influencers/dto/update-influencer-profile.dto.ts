import { PartialType } from '@nestjs/swagger'
import { CreateInfluencerProfileDto } from './create-influencer-profile.dto'

export class UpdateInfluencerProfileDto extends PartialType(CreateInfluencerProfileDto) {}

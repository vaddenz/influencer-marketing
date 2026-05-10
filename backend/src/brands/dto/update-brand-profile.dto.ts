import { PartialType } from '@nestjs/swagger'
import { CreateBrandProfileDto } from './create-brand-profile.dto'

export class UpdateBrandProfileDto extends PartialType(CreateBrandProfileDto) {}

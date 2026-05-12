import { IsString, IsOptional, IsDateString, IsArray, ValidateNested, IsEnum } from 'class-validator'
import { Type } from 'class-transformer'
import { SopStepDto } from './sop-step.dto'
import { SopStatus } from '@/generated/prisma'

export class UpdateSopDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsDateString()
  publishDate?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SopStepDto)
  steps?: SopStepDto[]

  @IsOptional()
  @IsEnum(SopStatus)
  status?: SopStatus
}

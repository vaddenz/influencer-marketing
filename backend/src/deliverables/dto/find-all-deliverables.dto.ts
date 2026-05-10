import { IsString, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class FindAllDeliverablesDto {
  @ApiProperty({ description: 'Campaign ID to filter deliverables' })
  @IsString()
  @IsNotEmpty()
  campaignId!: string
}

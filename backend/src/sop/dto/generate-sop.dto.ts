import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsDateString, IsArray } from 'class-validator'

export class GenerateSopDto {
  @ApiProperty({ example: 'campaign_cuid' })
  @IsString()
  @IsNotEmpty()
  campaignId!: string

  @ApiProperty({ example: 'kr', enum: ['kr', 'jp'] })
  @IsString()
  @IsNotEmpty()
  targetMarket!: string

  @ApiProperty({ example: 'beauty', enum: ['beauty', 'fashion', 'lifestyle'] })
  @IsString()
  @IsNotEmpty()
  influencerType!: string

  @ApiProperty({ example: ['天然成分', '持久度'] })
  @IsArray()
  @IsString({ each: true })
  sellingPoints!: string[]

  @ApiProperty({ example: '2026-06-10' })
  @IsDateString()
  publishDate!: string
}

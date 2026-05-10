import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator'

export class CreateCampaignDto {
  @ApiProperty({
    description: 'Title of the campaign',
    example: 'Summer Collection Launch',
    minLength: 1,
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 200)
  title!: string

  @ApiProperty({
    description: 'Description of the campaign',
    example: 'Promote our new summer collection across Instagram and TikTok.',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 2000)
  description!: string

  @ApiPropertyOptional({
    description: 'Campaign budget in USD',
    example: 5000,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  budget?: number

  @ApiPropertyOptional({
    description: 'Campaign start date (ISO 8601)',
    example: '2025-06-01',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string

  @ApiPropertyOptional({
    description: 'Campaign end date (ISO 8601)',
    example: '2025-08-31',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string
}

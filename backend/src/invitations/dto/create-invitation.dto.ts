import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsString, IsNotEmpty, Length, IsOptional } from 'class-validator'

export class CreateInvitationDto {
  @ApiProperty({
    description: 'ID of the campaign to invite the influencer to',
    example: 'campaign-123',
  })
  @IsString()
  @IsNotEmpty()
  campaignId!: string

  @ApiProperty({
    description: 'ID of the influencer to invite',
    example: 'influencer-456',
  })
  @IsString()
  @IsNotEmpty()
  influencerId!: string

  @ApiPropertyOptional({
    description: 'Optional message from the brand to the influencer',
    example: 'We would love to collaborate with you on our summer campaign.',
    minLength: 1,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  message?: string
}

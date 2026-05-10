import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsInt,
  Min,
  IsNumber,
  Max,
  IsArray,
  IsUrl,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'

class PlatformDto {
  @IsString()
  @IsNotEmpty()
  platform!: string

  @IsString()
  @IsNotEmpty()
  url!: string

  @IsInt()
  @Min(0)
  followers!: number
}

export class CreateInfluencerProfileDto {
  @ApiProperty({
    description: 'Display name of the influencer',
    example: 'Jane Doe',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  displayName!: string

  @ApiProperty({
    description: 'Unique handle of the influencer',
    example: 'janedoe',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  handle!: string

  @ApiPropertyOptional({
    description: 'Bio of the influencer',
    example: 'Lifestyle and travel content creator.',
    minLength: 0,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string

  @ApiProperty({
    description: 'Niche of the influencer',
    example: 'Travel',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  niche!: string

  @ApiProperty({
    description: 'Total follower count',
    example: 15000,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  followerCount!: number

  @ApiProperty({
    description: 'Engagement rate (0-100)',
    example: 4.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  engagementRate!: number

  @ApiProperty({
    description: 'Platforms with URLs and follower counts',
    example: [
      {
        platform: 'instagram',
        url: 'https://instagram.com/janedoe',
        followers: 10000,
      },
    ],
    type: [PlatformDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlatformDto)
  platforms!: PlatformDto[]

  @ApiProperty({
    description: 'ISO country code (2 characters)',
    example: 'US',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  locationCountry!: string

  @ApiProperty({
    description: 'Region or state',
    example: 'California',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  locationRegion!: string

  @ApiPropertyOptional({
    description: 'Profile image URL',
    example: 'https://example.com/image.png',
  })
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string
}

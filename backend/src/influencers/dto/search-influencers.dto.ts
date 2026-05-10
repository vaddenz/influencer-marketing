import { ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsIn,
} from 'class-validator'
import { Transform, Type } from 'class-transformer'

export class SearchInfluencersDto {
  @ApiPropertyOptional({
    description: 'Search query matching displayName, handle, or bio',
    example: 'jane',
  })
  @IsOptional()
  @IsString()
  q?: string

  @ApiPropertyOptional({
    description: 'Niche exact match (case-insensitive)',
    example: 'Travel',
  })
  @IsOptional()
  @IsString()
  niche?: string

  @ApiPropertyOptional({
    description: 'Comma-separated list of platform names',
    example: 'instagram,tiktok',
  })
  @IsOptional()
  @IsString()
  platforms?: string

  @ApiPropertyOptional({
    description: 'Country code exact match',
    example: 'US',
  })
  @IsOptional()
  @IsString()
  location?: string

  @ApiPropertyOptional({
    description: 'Region exact match',
    example: 'California',
  })
  @IsOptional()
  @IsString()
  region?: string

  @ApiPropertyOptional({
    description: 'Minimum follower count',
    example: 1000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  followersMin?: number

  @ApiPropertyOptional({
    description: 'Maximum follower count',
    example: 100000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  followersMax?: number

  @ApiPropertyOptional({
    description: 'Follower scope: nano, micro, macro, mega',
    example: 'micro',
  })
  @IsOptional()
  @IsIn(['nano', 'micro', 'macro', 'mega'])
  scope?: string
}

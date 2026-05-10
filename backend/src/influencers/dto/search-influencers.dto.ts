import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator'
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

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 20
}

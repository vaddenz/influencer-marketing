import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsUrl,
} from 'class-validator'

export class CreateBrandProfileDto {
  @ApiProperty({
    description: 'The company name of the brand',
    example: 'Acme Corp',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  companyName!: string

  @ApiProperty({
    description: 'The industry of the brand',
    example: 'Technology',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  industry!: string

  @ApiPropertyOptional({
    description: 'The website URL of the brand',
    example: 'https://acme.com',
  })
  @IsOptional()
  @IsUrl()
  website?: string

  @ApiPropertyOptional({
    description: 'The description of the brand',
    example: 'We build awesome products.',
    minLength: 0,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string

  @ApiPropertyOptional({
    description: 'The logo URL of the brand',
    example: 'https://acme.com/logo.png',
  })
  @IsOptional()
  @IsUrl()
  logoUrl?: string
}

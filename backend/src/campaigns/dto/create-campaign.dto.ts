import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsNotEmpty,
  Length,
  IsOptional,
  IsDateString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator'

@ValidatorConstraint({ name: 'isDateRange', async: false })
class IsDateRangeConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments) {
    const obj = args.object as CreateCampaignDto
    if (obj.startDate && obj.endDate) {
      return new Date(obj.startDate) <= new Date(obj.endDate)
    }
    return true
  }

  defaultMessage(_args: ValidationArguments) {
    return 'startDate must be before or equal to endDate'
  }
}

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
    description: 'Campaign budget in USD as a decimal string',
    example: '5000.00',
  })
  @IsOptional()
  @IsString()
  budget?: string

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
  @Validate(IsDateRangeConstraint)
  endDate?: string
}

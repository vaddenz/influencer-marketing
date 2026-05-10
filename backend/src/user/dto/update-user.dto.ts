import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEmail, IsOptional, IsString, Length } from 'class-validator'

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'The email address of the user',
    example: 'new-email@example.com',
    minLength: 5,
    maxLength: 30,
  })
  @IsEmail()
  @IsOptional()
  @Length(5, 30)
  email?: string

  @ApiPropertyOptional({
    description: 'The password of the user',
    example: 'new-password123',
    minLength: 5,
    maxLength: 30,
  })
  @IsString()
  @IsOptional()
  @Length(5, 30)
  password?: string

  @ApiPropertyOptional({
    description: 'The name of the user',
    example: 'John Doe',
    minLength: 2,
    maxLength: 30,
  })
  @IsString()
  @IsOptional()
  @Length(2, 30)
  name?: string
}

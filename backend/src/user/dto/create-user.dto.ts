import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator'
import { Role } from '@/common/enums/role.enum'

export class CreateUserDto {
  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@example.com',
    minLength: 5,
    maxLength: 30,
  })
  @IsEmail()
  @IsNotEmpty()
  @Length(5, 30)
  email!: string

  @ApiProperty({
    description: 'The password of the user',
    example: 'password123',
    minLength: 5,
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty()
  @Length(5, 30)
  password!: string

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

  @ApiProperty({ description: 'User role', enum: Role, example: Role.Brand })
  @IsEnum(Role)
  role!: Role
}

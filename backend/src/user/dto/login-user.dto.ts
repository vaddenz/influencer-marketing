import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator'

export class LoginUserDto {
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
}

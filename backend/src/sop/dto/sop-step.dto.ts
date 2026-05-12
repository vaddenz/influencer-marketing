import { IsString, IsInt, IsArray, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SopStepDto {
  @ApiProperty({ example: '初稿提交' })
  @IsString()
  @IsNotEmpty()
  name!: string

  @ApiProperty({ example: '提交短视频脚本框架' })
  @IsString()
  @IsNotEmpty()
  description!: string

  @ApiProperty({ example: -7, description: 'Days relative to publishDate. Negative = before.' })
  @IsInt()
  dueDateOffset!: number

  @ApiProperty({ example: ['15秒开头抓眼球', '卖点韩语标注'] })
  @IsArray()
  @IsString({ each: true })
  requirements!: string[]
}

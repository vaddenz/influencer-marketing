import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { PrismaService } from '@/common/prisma/prisma.service'
import { CreateUserDto } from '@/user/dto/create-user.dto'
import { UpdateUserDto } from '@/user/dto/update-user.dto'
import * as bcrypt from 'bcrypt'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { EmailJobData } from '@/user/email.processor'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('email')
    private readonly emailQueue: Queue<EmailJobData>
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto

    // Check if user with the same email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    })
    if (existingUser) {
      throw new ConflictException('Email already registered')
    }

    // Check if password is provided
    if (!password) {
      throw new UnauthorizedException('Password is required')
    }

    // Hash password
    const salt = await bcrypt.genSalt()
    const hashedPassword = await bcrypt.hash(password, salt)
    const user = await this.prisma.user.create({
      data: {
        ...userData,
        passwordHash: hashedPassword,
      },
    })

    // Send welcome email
    if (user.email) {
      await this.sendWelcomeEmail(user.email, user.name || 'User')
    }

    const { passwordHash, ...result } = user
    this.logger.log(`New user created`, result)
    return result
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, ...data } = updateUserDto
    const updateData: any = { ...data }

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10)
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
    })

    const { passwordHash, ...result } = user
    return result
  }

  async findOne(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    })
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.findOne(email)
    if (
      user &&
      user.passwordHash &&
      (await bcrypt.compare(pass, user.passwordHash))
    ) {
      const { passwordHash, ...result } = user
      return result
    }
    return null
  }

  async getUserProfile(userId: string) {
    const user = await this.findById(userId)
    if (!user) {
      throw new NotFoundException('User not found')
    }
    const { passwordHash, ...result } = user
    return result
  }

  private async sendEmail(
    to: string,
    subject: string,
    body: string
  ): Promise<void> {
    await this.emailQueue.add(
      'send-email',
      { to, subject, body },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      }
    )
  }

  private async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.sendEmail(
      email,
      'Welcome!',
      `Hello ${name}, welcome to our platform!`
    )
  }
}

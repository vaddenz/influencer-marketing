import { Command, CommandRunner } from 'nest-commander'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/common/prisma/prisma.service'

@Command({ name: 'list-users', description: 'List all users in the database' })
@Injectable()
export class ListUsersCommand extends CommandRunner {
  constructor(private readonly prisma: PrismaService) {
    super()
  }

  async run(inputs: string[], options: Record<string, any>): Promise<void> {
    const users = await this.prisma.user.findMany()
    console.table(
      users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        createdAt: u.createdAt,
      }))
    )
  }
}

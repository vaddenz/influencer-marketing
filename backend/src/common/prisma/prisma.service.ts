import { Injectable } from '@nestjs/common'
import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * Prisma Service
 *
 * Extends the generated PrismaClient to provide database access.
 * Configures the connection to the PostgreSQL database using the pg adapter.
 */
@Injectable()
export class PrismaService extends PrismaClient {
  /**
   * Initializes the Prisma client with the PostgreSQL adapter.
   * Reads the database URL from the environment variables.
   */
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL as string,
    })
    super({ adapter })
  }
}

import * as bcrypt from 'bcrypt'
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client' // DO NOT USE @prisma/client
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

// Helper function to create a new user with basic info
async function createUser(email: string, name: string, avatarSeed: string) {
  const salt = await bcrypt.genSalt()
  const passwordHash = await bcrypt.hash('password', salt)

  return await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name,
      passwordHash,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`
    }
  })
}

// 1. Create new user with no data (for empty state demo)
async function createNewUserNoData() {
  console.log('\n--- Creating New User with No Data ---')

  const user = await createUser('newuser@example.com', 'New User', 'NewUser')
  console.log(`Created user: ${user.name} (${user.id})`)

  // User is created but no additional data is added
  console.log('Created empty user for demo purposes')

  return user
}

// 2. Create new user with basic data (demo with data)
async function createNewUserWithData() {
  console.log('\n--- Creating New User with Basic Data ---')

  const user = await createUser('demouser@example.com', 'Demo User', 'DemoUser')
  console.log(`Created user: ${user.name} (${user.id})`)

  return user
}

// 3. Create experienced user with extensive data
async function createExperiencedUser() {
  console.log('\n--- Creating Experienced User with Extensive Data ---')

  const user = await createUser(
    'experienced@example.com',
    'Experienced User',
    'ExperiencedUser'
  )
  console.log(`Created user: ${user.name} (${user.id})`)

  return user
}

async function main() {
  console.log(`Database: [${connectionString}]`)
  console.log('Start seeding ...')

  try {
    // Create all types of users
    await createNewUserNoData()
    await createNewUserWithData()
    await createExperiencedUser()

    console.log('\n✅ Seeding completed successfully!')
    console.log('\nCreated users:')
    console.log('- newuser@example.com (empty user for demo)')
    console.log('- demouser@example.com (user with basic data)')
    console.log('- experienced@example.com (user with extensive data)')
  } catch (error) {
    console.error('\n❌ Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

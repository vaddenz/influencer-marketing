import * as bcrypt from 'bcrypt'
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, User, InfluencerProfile, Invitation, NotificationType } from '@/generated/prisma/client' // DO NOT USE @prisma/client, USE @/generated/prisma/client INSTEAD
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

// Helper function to hash password
async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt()
  return bcrypt.hash(password, salt)
}

// 1. Create a new brand user with no data (for empty state demo)
async function createEmptyBrandUser() {
  console.log('\n--- Creating Empty Brand User ---')

  const user = await prisma.user.upsert({
    where: { email: 'newbrand@example.com' },
    update: {},
    create: {
      email: 'newbrand@example.com',
      name: 'New Brand',
      passwordHash: await hashPassword('password'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NewBrand',
      role: 'brand',
    },
  })
  console.log(`Created user: ${user.name} (${user.id})`)

  return user
}

// 2. Create a brand user with profile and campaigns
async function createBrandWithCampaigns() {
  console.log('\n--- Creating Brand with Campaigns ---')

  const user = await prisma.user.upsert({
    where: { email: 'brand@example.com' },
    update: {},
    create: {
      email: 'brand@example.com',
      name: 'Acme Corp',
      passwordHash: await hashPassword('password'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AcmeCorp',
      role: 'brand',
      brandProfile: {
        create: {
          companyName: 'Acme Corporation',
          industry: 'Technology',
          website: 'https://acme.example.com',
          description: 'Leading tech innovator',
          logoUrl: 'https://api.dicebear.com/7.x/identicon/svg?seed=AcmeCorp',
        },
      },
      campaigns: {
        create: [
          {
            title: 'Summer Tech Launch',
            description: 'Promote our latest summer tech gadgets',
            status: 'active',
            budget: '50000.00',
            startDate: new Date('2025-06-01'),
            endDate: new Date('2025-08-31'),
          },
          {
            title: 'Back to School',
            description: 'Target students for back-to-school season',
            status: 'draft',
            budget: '25000.00',
          },
          {
            title: 'Holiday Special',
            description: 'End of year holiday campaign',
            status: 'completed',
            budget: '75000.00',
            startDate: new Date('2024-11-01'),
            endDate: new Date('2024-12-31'),
          },
        ],
      },
    },
    include: {
      brandProfile: true,
      campaigns: true,
    },
  })

  console.log(`Created brand: ${user.name} (${user.id})`)
  console.log(`  Profile: ${user.brandProfile?.companyName}`)
  console.log(`  Campaigns: ${user.campaigns.length}`)

  return user
}

// 3. Create influencer users with profiles
async function createInfluencers() {
  console.log('\n--- Creating Influencers ---')

  const influencersData = [
    {
      email: 'influencer1@example.com',
      name: 'Sarah Style',
      seed: 'SarahStyle',
      handle: '@sarahstyle',
      niche: 'Fashion',
      followers: 150000,
      engagement: '4.50',
      platforms: { instagram: 'sarahstyle', tiktok: 'sarahstyle' },
      country: 'United States',
      region: 'California',
    },
    {
      email: 'influencer2@example.com',
      name: 'Tech Tom',
      seed: 'TechTom',
      handle: '@techtom',
      niche: 'Technology',
      followers: 300000,
      engagement: '3.20',
      platforms: { youtube: 'TechTom', twitter: 'techtom' },
      country: 'United Kingdom',
      region: 'London',
    },
    {
      email: 'influencer3@example.com',
      name: 'Fitness Fiona',
      seed: 'FitnessFiona',
      handle: '@fitnessfiona',
      niche: 'Fitness',
      followers: 500000,
      engagement: '5.80',
      platforms: { instagram: 'fitnessfiona', youtube: 'FitnessFionaOfficial' },
      country: 'Australia',
      region: 'Sydney',
    },
  ]

  const influencers: Array<User & { influencerProfile: InfluencerProfile | null }> = []
  for (const data of influencersData) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        name: data.name,
        passwordHash: await hashPassword('password'),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.seed}`,
        role: 'influencer',
        influencerProfile: {
          create: {
            displayName: data.name,
            handle: data.handle,
            bio: `${data.niche} enthusiast sharing daily content`,
            niche: data.niche,
            followerCount: data.followers,
            engagementRate: data.engagement,
            platforms: data.platforms,
            locationCountry: data.country,
            locationRegion: data.region,
            profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.seed}`,
          },
        },
      },
      include: {
        influencerProfile: true,
      },
    })

    console.log(`Created influencer: ${user.name} (${user.id})`)
    console.log(`  Handle: ${user.influencerProfile?.handle}`)
    influencers.push(user)
  }

  return influencers
}

// 4. Create invitations and deliverables
async function createInvitationsAndDeliverables(
  brand: { campaigns: { id: string }[] },
  influencers: { id: string }[]
) {
  console.log('\n--- Creating Invitations and Deliverables ---')

  const campaign = brand.campaigns[0]

  const invitations: Invitation[] = []
  for (let i = 0; i < influencers.length; i++) {
    const status = i === 0 ? 'accepted' : i === 1 ? 'pending' : 'declined'
    const invitation = await prisma.invitation.create({
      data: {
        campaignId: campaign.id,
        influencerId: influencers[i].id,
        status,
        message: `Hi! We'd love you to join our campaign.`,
        respondedAt: status !== 'pending' ? new Date() : null,
      },
    })
    console.log(`Created invitation: ${invitation.id} (${status})`)
    invitations.push(invitation)

    // Create notifications for invitations
    await prisma.notification.create({
      data: {
        userId: influencers[i].id,
        type: 'invitation_received',
        title: 'New Campaign Invitation',
        message: `You've been invited to join "Summer Tech Launch"`,
        relatedEntityType: 'invitation',
        relatedEntityId: invitation.id,
      },
    })

    // Create deliverables for accepted invitation
    if (status === 'accepted') {
      const deliverable = await prisma.deliverable.create({
        data: {
          campaignId: campaign.id,
          influencerId: influencers[i].id,
          description: 'Create an Instagram post featuring our product',
          dueDate: new Date('2025-07-15'),
          status: 'in_progress',
        },
      })
      console.log(`Created deliverable: ${deliverable.id}`)

      await prisma.notification.create({
        data: {
          userId: influencers[i].id,
          type: 'deliverable_due',
          title: 'Deliverable Due Soon',
          message: 'Your Instagram post is due on July 15th',
          relatedEntityType: 'deliverable',
          relatedEntityId: deliverable.id,
        },
      })
    }
  }

  return invitations
}

// 5. Create agency user
async function createAgencyUser() {
  console.log('\n--- Creating Agency User ---')

  const user = await prisma.user.upsert({
    where: { email: 'agency@example.com' },
    update: {},
    create: {
      email: 'agency@example.com',
      name: 'Star Agency',
      passwordHash: await hashPassword('password'),
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=StarAgency',
      role: 'agency',
    },
  })

  console.log(`Created agency: ${user.name} (${user.id})`)

  return user
}

// 6. Create OAuth accounts
async function createOAuthAccounts(users: { id: string }[]) {
  console.log('\n--- Creating OAuth Accounts ---')

  for (const user of users.slice(0, 2)) {
    const oauth = await prisma.userOAuthAccount.create({
      data: {
        userId: user.id,
        provider: 'google',
        providerId: `google_${user.id.slice(-8)}`,
        email: `oauth_${user.id.slice(-8)}@gmail.com`,
        name: 'OAuth User',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=OAuth',
      },
    })
    console.log(`Created OAuth account: ${oauth.provider} (${oauth.id})`)
  }
}

// 7. Create prompts
async function createPrompts() {
  console.log('\n--- Creating Prompts ---')

  const promptsData = [
    {
      key: 'campaign_welcome',
      content: 'Welcome to the campaign! Here are the guidelines...',
      version: 1,
    },
    {
      key: 'invitation_message',
      content: 'You have received a new invitation to collaborate...',
      version: 1,
    },
    {
      key: 'campaign_welcome',
      content: 'Welcome! Updated guidelines for 2025...',
      version: 2,
    },
  ]

  for (const data of promptsData) {
    const prompt = await prisma.prompt.create({
      data: {
        key: data.key,
        content: data.content,
        version: data.version,
      },
    })
    console.log(`Created prompt: ${prompt.key} (v${prompt.version})`)
  }
}

// 8. Create notifications for various scenarios
async function createNotifications(users: { id: string }[]) {
  console.log('\n--- Creating Additional Notifications ---')

  const notificationData: Array<{
    userId: string
    type: NotificationType
    title: string
    message: string
    read: boolean
  }> = [
    {
      userId: users[0].id,
      type: 'campaign_updated',
      title: 'Campaign Updated',
      message: 'Your campaign budget has been increased',
      read: true,
    },
    {
      userId: users[0].id,
      type: 'deliverables_completed',
      title: 'Deliverables Completed',
      message: 'All deliverables for Summer Tech Launch are complete',
      read: false,
    },
    {
      userId: users[1]?.id || users[0].id,
      type: 'invitation_accepted',
      title: 'Invitation Accepted',
      message: 'An influencer has accepted your invitation',
      read: false,
    },
    {
      userId: users[1]?.id || users[0].id,
      type: 'invitation_declined',
      title: 'Invitation Declined',
      message: 'An influencer has declined your invitation',
      read: true,
    },
  ]

  for (const data of notificationData) {
    const notification = await prisma.notification.create({ data })
    console.log(`Created notification: ${notification.title}`)
  }
}

async function main() {
  console.log(`Database: [${connectionString}]`)
  console.log('Start seeding ...')

  try {
    // Create all types of users
    const emptyBrand = await createEmptyBrandUser()
    const brand = await createBrandWithCampaigns()
    const influencers = await createInfluencers()
    const agency = await createAgencyUser()

    // Create related data
    if (brand.campaigns.length > 0 && influencers.length > 0) {
      await createInvitationsAndDeliverables(brand, influencers)
    }

    const allUsers = [emptyBrand, brand, ...influencers, agency]
    await createOAuthAccounts(allUsers)
    await createPrompts()
    await createNotifications(allUsers)

    console.log('\n✅ Seeding completed successfully!')
    console.log('\nCreated users:')
    console.log('- newbrand@example.com (empty brand user for demo)')
    console.log('- brand@example.com (brand with profile and campaigns)')
    console.log('- influencer1@example.com (fashion influencer)')
    console.log('- influencer2@example.com (tech influencer)')
    console.log('- influencer3@example.com (fitness influencer)')
    console.log('- agency@example.com (agency user)')
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

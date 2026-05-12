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

// 3b. Create real Douyin influencers from fetched API data
async function createDouyinInfluencers() {
  console.log('\n--- Creating Real Douyin Influencers ---')

  const douyinInfluencersData = [
    {
      email: 'qinghua.xin.ge@example.com',
      name: '清华鑫哥讲AI智能体',
      handle: '@98707849718',
      bio: '189页OpenClaw蓝皮书主页群聊看公告\n清华大学硕士丨研究方向神经网络预测\nAgent全链路赋能，多赛道头部IP案例\n激波Agent创始人丨曾就职于中民投等一线PE投资机构\n👇橱窗智能体课程+AI社群',
      niche: 'AI & Technology',
      followers: 180735,
      engagement: '3.20',
      platforms: { douyin: '98707849718' },
      country: 'China',
      region: 'Sichuan',
      avatar: 'https://p3.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-avt-0015_6ad9dff8b42f411ed89e1c39b6a8d6f4.jpeg?from=2956013662',
    },
    {
      email: 'motianlun@example.com',
      name: '摩天轮短剧',
      handle: '@motianlun',
      bio: '短剧创作者，分享精彩短剧内容',
      niche: 'Entertainment',
      followers: 1028180,
      engagement: '2.80',
      platforms: { douyin: 'MS4wLjABAAAA-gfcPom5_EcguiHkYY3H6a0a8eCXt5LfcAfaszNeAk8TyKG2ZeKj1s9Yf6ixSZev' },
      country: 'China',
      region: '',
      avatar: 'https://p3.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-avt-0015_aa3ff9ec2c981647d82bde2d089fb14b.jpeg?from=2956013662',
    },
    {
      email: 'du.laoshi.aigc@example.com',
      name: '杜老师AIGC',
      handle: '@dulaoshi',
      bio: 'AIGC领域创作者，分享AI生成内容技术与应用',
      niche: 'AI & Technology',
      followers: 133911,
      engagement: '7.50',
      platforms: { douyin: 'MS4wLjABAAAA8823HyxJMan39uAmpKwfmZWoux1Q2qHwtbilHivlDtA' },
      country: 'China',
      region: '',
      avatar: 'https://p3.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-avt-0015_cd1d32cbb07dae41cd98b8424a3550f5.jpeg?from=2956013662',
    },
    {
      email: 'qinghua.jiang@example.com',
      name: '清华姜学长',
      handle: '@qinghuajiang',
      bio: '清华大学学长，分享学习经验与科技前沿',
      niche: 'Education & Technology',
      followers: 183922,
      engagement: '3.80',
      platforms: { douyin: 'MS4wLjABAAAAfte3rFiVQ8VUE3Nfxph1NhCnq1ZAttn43OIr5UsXD5c' },
      country: 'China',
      region: '',
      avatar: 'https://p3.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-avt-0015_21514c189971a84eced2bb1db5575a85.jpeg?from=2956013662',
    },
    {
      email: 'qiuzhi.2046@example.com',
      name: '秋芝2046',
      handle: '@qiuzhi2046',
      bio: '生活方式与科技融合创作者',
      niche: 'Lifestyle & Technology',
      followers: 1184667,
      engagement: '5.20',
      platforms: { douyin: 'MS4wLjABAAAAwbbVuf1W2DdgRe0xCa0oxg1ZIHbzuiTzyjq3NcOVgBuu6qIidYlMYqbL3ZFY2swu' },
      country: 'China',
      region: '',
      avatar: 'https://p3.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-avt-0015_1aea2b7ed4b464ba6ca670ead9d89ce8.jpeg?from=2956013662',
    },
    {
      email: 'eyemore@example.com',
      name: 'EyeMore智能体设备',
      handle: '@eyemore',
      bio: '智能体硬件设备官方账号',
      niche: 'Tech Hardware',
      followers: 440002,
      engagement: '6.80',
      platforms: { douyin: 'MS4wLjABAAAAhqjd8c-Xb02tDd9nwFpSU_In8eVAvqEmZqf_6AjAjcuCOkfIM9o2sLx-UxzlA4Xm' },
      country: 'China',
      region: '',
      avatar: 'https://p3.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-avt-0015_3b63ee6c3087292bd883e14e15e56dc2.jpeg?from=2956013662',
    },
    {
      email: 'yang.boshi.ai@example.com',
      name: '杨博士说AI',
      handle: '@yangboshi',
      bio: 'AI博士，科普人工智能知识与应用',
      niche: 'AI & Technology',
      followers: 37458,
      engagement: '4.50',
      platforms: { douyin: 'MS4wLjABAAAAMmbd2Qxnde80FDRpgCGCt2VOYp3ITbkZ_LJf2ywqoZw' },
      country: 'China',
      region: '',
      avatar: 'https://p3.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-i-0813c000-ce_oEDENUNcEfuB88fEd9KDfJN7HCAFAAVgAozTIM.jpeg?from=2956013662',
    },
    {
      email: 'jun.agent@example.com',
      name: 'Jun_Agent',
      handle: '@junagent',
      bio: 'Agent智能体开发者，分享开发经验',
      niche: 'AI & Technology',
      followers: 16733,
      engagement: '5.60',
      platforms: { douyin: 'MS4wLjABAAAAv8r8Kj1BFD6TCMmju1Hv9eMXW6cKzPXKTsk6Y_3vOuHFDDXRhxinyQg0EjCO8jcw' },
      country: 'China',
      region: '',
      avatar: 'https://p3.douyinpic.com/aweme/100x100/aweme-avatar/tos-cn-avt-0015_8b90eb7ee506c847223b8ce1abc4d4c8.jpeg?from=2956013662',
    },
  ]

  const influencers: Array<User & { influencerProfile: InfluencerProfile | null }> = []
  for (const data of douyinInfluencersData) {
    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {},
      create: {
        email: data.email,
        name: data.name,
        passwordHash: await hashPassword('password'),
        avatar: data.avatar,
        role: 'influencer',
        influencerProfile: {
          create: {
            displayName: data.name,
            handle: data.handle,
            bio: data.bio,
            niche: data.niche,
            followerCount: data.followers,
            engagementRate: data.engagement,
            platforms: data.platforms,
            locationCountry: data.country,
            locationRegion: data.region,
            profileImageUrl: data.avatar,
          },
        },
      },
      include: {
        influencerProfile: true,
      },
    })

    console.log(`Created Douyin influencer: ${user.name} (${user.id})`)
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

  // Clean up existing to prevent duplicates
  await prisma.deliverable.deleteMany({ where: { campaignId: campaign.id } })
  await prisma.notification.deleteMany({ where: { title: { in: ['New Campaign Invitation', 'Deliverable Due Soon'] } } })
  await prisma.invitation.deleteMany({ where: { campaignId: campaign.id } })

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
    const providerId = `google_${user.id.slice(-8)}`
    const oauth = await prisma.userOAuthAccount.upsert({
      where: {
        provider_providerId: {
          provider: 'google',
          providerId,
        },
      },
      update: {},
      create: {
        userId: user.id,
        provider: 'google',
        providerId,
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
    {
      key: 'sop-generator',
      content: `Generate a detailed Standard Operating Procedure (SOP) for an influencer marketing campaign.

Campaign: {campaignTitle}
Description: {description}
Target Market: {targetMarket}
Influencer Type: {influencerType}
Selling Points: {sellingPoints}
Publish Date: {publishDate}

Create a structured SOP with:
1. A clear, concise title for the SOP
2. 4-8 workflow steps that an influencer must follow

For each step, provide:
- name: Short step name (e.g., "Draft Submission", "Content Review")
- description: Detailed explanation of what the influencer must do
- dueDateOffset: Integer representing days relative to publish date (must be 0 or negative, where 0 = publish day, -7 = one week before)
- requirements: Array of specific requirements/checklist items for this step

All deadlines must be on or before the publish date. Steps should be ordered chronologically from earliest to latest.

Return ONLY valid JSON matching this structure:
{{
  "title": "SOP Title",
  "steps": [
    {{
      "name": "Step Name",
      "description": "Step description",
      "dueDateOffset": -7,
      "requirements": ["Requirement 1", "Requirement 2"]
    }}
  ]
}}`,
      version: 1,
    },
  ]

  // Clean up existing to prevent duplicates
  await prisma.prompt.deleteMany()

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

  // Clean up static notifications to prevent duplicates
  const titles = notificationData.map(d => d.title)
  await prisma.notification.deleteMany({
    where: { title: { in: titles } }
  })

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
    const douyinInfluencers = await createDouyinInfluencers()
    const agency = await createAgencyUser()

    // Create related data
    if (brand.campaigns.length > 0 && influencers.length > 0) {
      await createInvitationsAndDeliverables(brand, influencers)
    }

    const allUsers = [emptyBrand, brand, ...influencers, ...douyinInfluencers, agency]
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
    console.log('\nCreated real Douyin influencers:')
    console.log('- 清华鑫哥讲AI智能体 (180K followers, AI & Technology)')
    console.log('- 摩天轮短剧 (1M followers, Entertainment)')
    console.log('- 杜老师AIGC (133K followers, AI & Technology)')
    console.log('- 清华姜学长 (183K followers, Education & Technology)')
    console.log('- 秋芝2046 (1.1M followers, Lifestyle & Technology)')
    console.log('- EyeMore智能体设备 (440K followers, Tech Hardware)')
    console.log('- 杨博士说AI (37K followers, AI & Technology)')
    console.log('- Jun_Agent (16K followers, AI & Technology)')
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

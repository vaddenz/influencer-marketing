import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'

export interface EmailJobData {
  to: string
  subject: string
  body: string
}

@Processor('email')
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name)

  async process(job: Job<EmailJobData>): Promise<void> {
    this.logger.debug(`Processing email job ${job.id}`)

    const { to, subject, body } = job.data

    // 这里实现实际的邮件发送逻辑
    this.logger.log(`Sending email to: ${to}, subject: ${subject}`)

    // 模拟邮件发送
    await new Promise((resolve) => setTimeout(resolve, 1000))

    this.logger.debug(`Email job ${job.id} completed`)
  }
}

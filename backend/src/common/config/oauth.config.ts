import { registerAs } from '@nestjs/config'

/**
 * OAuth Configuration
 *
 * Registers the 'oauth' configuration namespace.
 * Contains OAuth provider settings for Google and GitHub.
 */
export default registerAs('oauth', () => ({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  },
}))

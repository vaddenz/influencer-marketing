import path from 'path'
import fs from 'fs/promises'
import { Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createId } from '@paralleldrive/cuid2'
import { SECOND } from '@/common/const/unit'

/**
 * Base HTTP Client
 *
 * Provides common functionality for HTTP clients, including timeout, retries, logging, and authentication.
 * Designed to be extended by specific service clients.
 */
export class BaseHTTPClient {
  /** Base URL for the API */
  baseUrl: string
  /** Request timeout in milliseconds */
  timeout: number
  /** Maximum number of retry attempts for failed requests */
  maxRetries: number
  /** Logger instance */
  logger = new Logger(BaseHTTPClient.name)

  /**
   * Initialize the Base HTTP Client
   * @param configService - NestJS ConfigService for retrieving configuration
   * @param baseUrl - Base URL for the API (optional)
   * @param timeoutInSec - Timeout in seconds (optional, defaults to config or default value)
   * @param maxRetries - Maximum retry attempts (optional, defaults to config or default value)
   */
  constructor(
    configService: ConfigService,
    baseUrl?: string,
    timeoutInSec?: number,
    maxRetries?: number
  ) {
    this.baseUrl = baseUrl || ''
    this.timeout =
      (timeoutInSec ?? configService.get('http-client.timeoutInSec')!) * SECOND
    this.maxRetries = maxRetries ?? configService.get('http-client.maxRetries')!
  }

  /**
   * Get default headers for API requests
   * @param includeAuth - Whether to include authentication headers
   * @returns Headers object
   */
  async getHeaders(includeAuth: boolean = false): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }

    // Add authentication headers if required
    if (includeAuth) {
      const token = await this.getAuthToken()
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
    return headers
  }

  /**
   * Get authentication token from session provider. Overwrite this method to provide custom authentication logic.
   * @returns Authentication token or null
   */
  async getAuthToken(): Promise<string | null> {
    return ''
  }

  /**
   * Build URLSearchParams from query parameters object
   * @param params - Query parameters object
   * @returns URLSearchParams instance
   */
  buildQueryParams(params?: Record<string, any>): URLSearchParams {
    const query = new URLSearchParams()

    if (!params) return query

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value.toString())
      }
    })

    return query
  }

  /**
   * Build complete URL from endpoint with optional query parameters
   * @param endpoint - API endpoint path
   * @param params - Optional query parameters object
   * @returns Complete URL with query string
   */
  buildUrl(endpoint: string, params?: Record<string, any>): string {
    let url = `${this.baseUrl}/${endpoint.startsWith('/') ? endpoint.slice(1) : endpoint}`
    if (params && Object.keys(params).length > 0) {
      const query = this.buildQueryParams(params)
      const queryString = query.toString()
      if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`
      }
    }

    return url
  }

  /**
   * Authenticated fetch method compatible with both client and server environments
   * @param url - Request URL
   * @param options - Fetch options
   * @param retryCount - Current retry attempt
   * @returns Promise with response data
   */
  async fetchWithAuth<T>(
    url: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    // 1. Merge authenticated headers with existing options
    const authOptions: RequestInit = {
      ...options,
      headers: {
        ...(await this.getHeaders(true)),
        ...options.headers,
      },
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)

    try {
      // 2. Execute authenticated fetch request
      const response = await fetch(url, {
        ...authOptions,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // 3. Handle authentication errors
      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid or expired token')
      }

      // 4. Check other response statuses
      if (!response.ok) {
        const errorData = await response.text()
        let errorMessage = `HTTP error, status: ${response.status}`
        this.logger.error('Error data:', errorData)

        try {
          const parsedError = JSON.parse(errorData)
          errorMessage += parsedError.message
            ? ` - ${parsedError.message}`
            : ` - ${errorData}`
        } catch {
          errorMessage += errorData ? ` - ${errorData}` : ''
        }

        throw new Error(errorMessage)
      }

      // 5. Parse and return response
      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      // 6. Retry logic for network errors (but not auth errors)
      if (
        retryCount < this.maxRetries &&
        error instanceof Error &&
        !error.message.includes('Authentication failed')
      ) {
        this.logger.warn(
          `Request failed, retrying... (${retryCount + 1}/${this.maxRetries})`,
          error.message
        )
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        )
        return this.fetchWithAuth(url, options, retryCount + 1)
      }

      throw error
    }
  }

  /**
   * Download file from remote URL to /tmp directory with retry mechanism
   * @param url - Remote file URL to download
   * @param filename - Optional filename to save as (defaults to extracted from URL)
   * @param retryCount - Current retry attempt
   * @returns Promise with the local file path
   */
  async downloadFile(
    url: string,
    options?: {
      includeAuth?: boolean
      directory?: string
      filename?: string
      retryCount?: number
      headers?: Record<string, string>
    }
  ): Promise<string> {
    const {
      includeAuth = false,
      directory = '/tmp',
      filename,
      retryCount = 0,
      headers = {},
    } = options || {}

    try {
      // 1. Determine filename from URL or use provided filename
      const urlPath = new URL(url).pathname
      const extractedFilename = filename || path.basename(urlPath) || createId()
      const localPath = path.join(directory, extractedFilename)

      // 2. Create directory if it doesn't exist
      await fs.mkdir(directory, { recursive: true })

      this.logger.log(`Starting download from ${url} to ${localPath}`)

      // 3. Set up authenticated request options
      if (includeAuth) {
        headers['Authorization'] = `Bearer ${await this.getAuthToken()}`
      }
      const options: RequestInit = {
        headers,
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.timeout)

      // 4. Execute download request
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      // 5. Handle authentication errors
      if (response.status === 401) {
        throw new Error('Authentication failed: Invalid or expired token')
      }

      // 6. Check response status
      if (!response.ok) {
        const errorData = await response.text()
        let errorMessage = `Download failed, status: ${response.status}`
        this.logger.error('Download error data:', errorData)

        try {
          const parsedError = JSON.parse(errorData)
          errorMessage += parsedError.message
            ? ` - ${parsedError.message}`
            : ` - ${errorData}`
        } catch {
          errorMessage += errorData ? ` - ${errorData}` : ''
        }

        throw new Error(errorMessage)
      }

      // 7. Create write stream and pipe response to file
      const fileStream = require('fs').createWriteStream(localPath)
      const reader = response.body?.getReader()

      if (!reader) {
        throw new Error('Response body is not readable')
      }

      // 8. Stream the response to file
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fileStream.write(value)
      }

      fileStream.end()

      // 9. Wait for file stream to finish
      await new Promise((resolve, reject) => {
        fileStream.on('finish', resolve)
        fileStream.on('error', reject)
      })

      this.logger.log(`Successfully downloaded file to ${localPath}`)
      return localPath
    } catch (error) {
      // 10. Retry logic for network errors (but not auth errors)
      if (
        retryCount < this.maxRetries &&
        error instanceof Error &&
        !error.message.includes('Authentication failed')
      ) {
        this.logger.warn(
          `Download failed, retrying... (${retryCount + 1}/${this.maxRetries})`,
          error.message
        )
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (retryCount + 1))
        )
        return this.downloadFile(url, {
          ...options,
          retryCount: retryCount + 1,
        })
      }

      this.logger.error('Download failed:', (error as Error).message)
      throw error
    }
  }

  /**
   * Download file from URL and return as Buffer
   * @param url - URL to download from
   * @returns Promise with file buffer
   */
  async downloadFileBuffer(url: string): Promise<Buffer> {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }
}

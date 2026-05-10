import { Logger, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI, { APIConnectionTimeoutError, toFile } from 'openai'
import {
  ChatCompletion,
  ChatCompletionMessageParam,
} from 'openai/resources/chat/completions'
import { FileObject } from 'openai/resources'
import { JSONUtil, TimeUtil } from '@/common/utils'
import { MINUTE, SECOND } from '@/common/const/unit'

/**
 * Service for interacting with Large Language Models (LLMs).
 *
 * This service provides a unified interface for invoking LLMs, streaming responses,
 * and managing file uploads/retrievals for LLM processing (e.g., OpenAI Files API).
 * It uses the native OpenAI client.
 */
@Injectable()
export class LLMService {
  private readonly logger = new Logger(LLMService.name)
  private openAIClient: OpenAI
  private modelName: string
  private temperature?: number
  private maxTokens?: number
  private topP?: number

  constructor(private readonly configService: ConfigService) {
    this.modelName = this.configService.get('llm.model')!
    this.temperature = this.configService.get('llm.temperature')
    this.maxTokens = this.configService.get('llm.maxTokens')
    this.topP = this.configService.get('llm.topP')

    // Initialize native OpenAI client
    this.openAIClient = new OpenAI({
      apiKey: this.configService.get('llm.apiKey'),
      baseURL: this.configService.get('llm.baseUrl'),
      timeout: this.configService.get('llm.timeout'),
      maxRetries: this.configService.get('llm.maxRetries'),
    })
  }

  /**
   * Exposes the native OpenAI client instance.
   */
  get client() {
    return this.openAIClient
  }

  /**
   * Invokes the LLM with a sequence of messages.
   *
   * @param messages - An array of ChatCompletionMessageParam objects representing the conversation history.
   * @returns The response from the LLM.
   * @throws Error if the invocation fails.
   */
  async createCompletion(
    messages: ChatCompletionMessageParam[]
  ): Promise<ChatCompletion> {
    try {
      const completion = await this.openAIClient.chat.completions.create({
        model: this.modelName,
        messages: messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        top_p: this.topP,
      })
      return completion
    } catch (error) {
      this.logger.error('Failed to invoke model', error)
      throw error
    }
  }

  /**
   * Invokes the LLM and attempts to parse the response as a JSON object of type T.
   *
   * @typeParam T - The expected type of the parsed JSON response.
   * @param messages - An array of ChatCompletionMessageParam objects.
   * @returns The parsed object of type T, or null if parsing fails.
   * @throws Error if the invocation fails.
   */
  async createTypedCompletion<T>(
    messages: ChatCompletionMessageParam[]
  ): Promise<T | null> {
    try {
      const completion = await this.createCompletion(messages)
      return JSONUtil.parseOrNull<T>(
        completion.choices[0]?.message?.content || '',
        {
          preprocess: true,
        }
      )
    } catch (error) {
      this.logger.error('Failed to invoke model', error)
      throw error
    }
  }

  /**
   * Streams the LLM response chunk by chunk.
   *
   * @param messages - An array of ChatCompletionMessageParam objects.
   * @param onChunk - A callback function invoked for each chunk of content received.
   * @throws Error if streaming fails.
   */
  async stream(
    messages: ChatCompletionMessageParam[],
    onChunk: (chunk: string) => void
  ) {
    try {
      const stream = await this.openAIClient.chat.completions.create({
        model: this.modelName,
        messages: messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        top_p: this.topP,
        stream: true,
      })
      // this.logger.verbose('Streaming started')

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          this.logger.verbose(content)
          onChunk(content)
        }
      }
      // this.logger.verbose('All chunks streamed')
    } catch (error) {
      this.logger.error('Failed to stream response', error)
      throw error
    }
  }

  /**
   * Uploads a file to the LLM provider (e.g., OpenAI Files API).
   *
   * @param file - The file content as a Buffer or ReadableStream.
   * @param filename - The name of the file.
   * @param purpose - The purpose of the file upload (e.g., 'assistants', 'fine-tune').
   * @returns The uploaded FileObject from OpenAI.
   * @throws Error if the upload fails.
   */
  async uploadFile(
    file: Buffer | NodeJS.ReadableStream,
    filename: string,
    purpose: any
  ): Promise<FileObject> {
    try {
      const uploadable = await toFile(file, filename)
      const response = await this.openAIClient.files.create({
        file: uploadable,
        purpose: purpose,
      })
      return response
    } catch (error) {
      this.logger.error('Failed to upload file to LLM provider', error)
      throw error
    }
  }

  /**
   * Retrieves file metadata from the LLM provider.
   *
   * @param fileId - The ID of the file to retrieve.
   * @returns The FileObject containing metadata.
   * @throws Error if retrieval fails.
   */
  async retrieveFile(fileId: string): Promise<FileObject> {
    try {
      const response = await this.openAIClient.files.retrieve(fileId)
      return response
    } catch (error) {
      this.logger.error('Failed to retrieve file from LLM provider', error)
      throw error
    }
  }

  /**
   * Retrieves the actual content of a file from the LLM provider.
   *
   * @param fileId - The ID of the file to retrieve content for.
   * @returns The raw Response object containing the file content.
   * @throws Error if retrieval fails.
   */
  async retrieveFileContent(fileId: string): Promise<Response> {
    try {
      const response = await this.openAIClient.files.content(fileId)
      return response
    } catch (error) {
      this.logger.error(
        'Failed to retrieve file content from LLM provider',
        error
      )
      throw error
    }
  }

  /**
   * Waits for a file to finish processing on the LLM provider side.
   *
   * @param fileId - The ID of the file to wait for.
   * @param options - Polling options (pollInterval, maxWait).
   * @returns The FileObject after processing is complete or terminal state is reached.
   * @throws Error if waiting fails.
   */
  async waitForFileProcessing(
    fileId: string,
    options: { pollInterval?: number; maxWait?: number } = {}
  ): Promise<FileObject> {
    try {
      const response = await this.waitForProcessing(fileId, options)
      if (
        response.status === 'error' ||
        response.status === ('deleted' as any)
      ) {
        this.logger.warn('File process failed from LLM provider', response)
      }
      return response
    } catch (error) {
      this.logger.error(
        'Failed to wait for file processing from LLM provider',
        error
      )
      throw error
    }
  }

  /**
   * Internal helper to poll for file status.
   */
  private async waitForProcessing(
    id: string,
    {
      pollInterval = 5000,
      maxWait = 30 * 60 * 1000,
    }: { pollInterval?: number; maxWait?: number } = {}
  ): Promise<FileObject> {
    const start = Date.now()
    const TERMINAL_STATES = new Set(['processed', 'error', 'deleted', 'ok'])
    let file = await this.openAIClient.files.retrieve(id)

    while (!file.status || !TERMINAL_STATES.has(file.status)) {
      await TimeUtil.sleep(pollInterval)

      file = await this.openAIClient.files.retrieve(id)
      this.logger.verbose(`File ${id} status: ${file.status}`)
      if (Date.now() - start > maxWait) {
        throw new APIConnectionTimeoutError({
          message: `Giving up on waiting for file ${id} to finish processing after ${maxWait} milliseconds.`,
        })
      }
    }

    return file
  }

  /**
   * Deletes a file from the LLM provider.
   *
   * @param fileId - The ID of the file to delete.
   * @param options - Options (silent: if true, suppress errors).
   */
  async deleteFile(fileId: string, options?: { silent?: boolean }) {
    try {
      const response = await this.openAIClient.files.delete(fileId)
      this.logger.debug(
        `File ${fileId} deleted from LLM provider: ${response.deleted}`
      )
      return
    } catch (error) {
      this.logger.error('Failed to delete file from LLM provider', error)
      if (options?.silent) {
        return
      }
      throw error
    }
  }

  /**
   * Convenience method to upload a file, wait for it to be processed, retrieve its content,
   * and optionally delete it afterwards.
   *
   * @param file - The file content.
   * @param filename - The file name.
   * @param options - Options (deleteFile: whether to delete after extraction, silent: suppress errors).
   * @returns An object containing the fileId and the content Response (or null if failed silently).
   */
  async extractFileContent(
    file: Buffer | NodeJS.ReadableStream,
    filename: string,
    options?: {
      deleteFile?: boolean
      silent?: boolean
    }
  ): Promise<{
    fileId: string
    content: Response | null
  }> {
    let fileId = ''
    try {
      const response = await this.uploadFile(file, filename, 'file-extract')
      fileId = response.id
      await this.waitForFileProcessing(response.id, {
        pollInterval: 2 * SECOND,
        maxWait: 30 * MINUTE,
      })
      const content = await this.retrieveFileContent(response.id)
      if (!content) {
        throw new Error(
          `File extract failed, empty content (file id: ${fileId})`
        )
      }

      this.logger.log(`File ${response.id} extract content success`)
      if (options?.deleteFile) {
        await this.deleteFile(response.id, { silent: true })
      }
      return {
        content,
        fileId: response.id,
      }
    } catch (error) {
      this.logger.error(
        'Failed to extract file content from LLM provider',
        error
      )
      if (fileId) await this.deleteFile(fileId, { silent: true })
      if (options?.silent) {
        return {
          content: null,
          fileId,
        }
      }
      throw error
    }
  }
}

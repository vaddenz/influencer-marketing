import path from 'path'
import fs from 'fs/promises'
import {
  Document,
  NodeWithScore,
  SentenceSplitter,
  VectorStoreBaseParams,
  Settings,
  VectorStoreQueryMode,
} from 'llamaindex'
import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { SimpleDirectoryReader } from '@llamaindex/readers/directory'
import { WeaviateVectorStore } from '@llamaindex/weaviate'
import { OpenAIEmbedding } from '@llamaindex/openai'
import weaviate, {
  ConnectToCustomOptions,
  WeaviateClient,
} from 'weaviate-client'
import { RandomUtil } from '@/common/utils'
import { S3Client } from './s3.client'

/**
 * Taken from https://github.com/run-llama/LlamaIndexTS/blob/main/packages/providers/storage/weaviate/src/WeaviateVectorStore.ts
 *
 * Schema definition for Weaviate vector store nodes
 * Defines the structure for storing document nodes with their metadata
 */
const NODE_SCHEMA = [
  {
    dataType: ['text'],
    description: 'Text property',
    name: 'text',
  },
  {
    dataType: ['text'],
    description: 'The ref_doc_id of the Node',
    name: 'ref_doc_id',
  },
  {
    dataType: ['text'],
    description: 'node_info (in JSON)',
    name: 'node_info',
  },
  {
    dataType: ['text'],
    description: 'The relationships of the node (in JSON)',
    name: 'relationships',
  },
]

/**
 * Configuration interface for Weaviate vector store
 * Extends base vector store parameters with Weaviate-specific options
 */
export type WeaviateVectorStoreConfig = VectorStoreBaseParams & {
  weaviateClient?: WeaviateClient
  cloudOptions?: {
    clusterURL?: string
    apiKey?: string
  }
  indexName?: string
  idKey?: string
  contentKey?: string
  metadataKey?: string
  embeddingKey?: string
  sanitizeMetadata?: boolean
}

/**
 * Vector Search Client for managing document indexing and retrieval
 * Provides integration with Weaviate vector database for semantic search
 */
@Injectable()
export class VectorSearchClient {
  private readonly logger = new Logger(VectorSearchClient.name)
  private readonly embeddingModel: OpenAIEmbedding
  private readonly tempDirectory = '/tmp/vector-search-document'
  // @ts-ignore
  private client: WeaviateClient

  constructor(
    private readonly configService: ConfigService,
    private readonly s3: S3Client
  ) {
    // 1. Initialize OpenAI embedding model with configuration from environment
    const { weviateConfig, ...embeddingConfig } =
      this.configService.get('vector-search')
    this.embeddingModel = new OpenAIEmbedding(embeddingConfig)

    // 2. Set global embedding model for LlamaIndex
    Settings.embedModel = this.embeddingModel

    // 3. Initialize Weaviate client connection
    this.init()
  }

  /**
   * Creates a new index in Weaviate with the specified name
   * @param name - Name of the index to create
   */
  public async createIndex(name: string) {
    // 1. Ensure Weaviate client is initialized
    await this.ensureClient()

    // 2. Create collection with standardized schema
    await this.client.collections.createFromSchema({
      class: this.collectionName(name),
      properties: NODE_SCHEMA,
    })
  }

  /**
   * Adds documents to the specified index
   * @param index - Target index name
   * @param documents - Array of documents to add
   */
  public async add(index: string, documents: Document[]) {
    // 1. Ensure Weaviate client is initialized
    await this.ensureClient()

    // 2. Initialize vector store for the target index
    const vectorStore = new WeaviateVectorStore({
      weaviateClient: this.client,
      indexName: this.collectionName(index),
    })

    // 3. Create embeddings when missing
    for (const doc of documents) {
      if (!doc.embedding) {
        doc.embedding = await this.embeddingModel.getTextEmbedding(doc.text)
      }
    }

    // 4. Add documents to vector store
    await vectorStore.add(documents)
  }

  /**
   * Queries multiple indexes for relevant documents based on semantic similarity
   * @param indexes - Array of index names to search
   * @param query - Search query string
   * @param options - Query options including topK parameter
   * @returns Array of nodes with relevance scores
   */
  public async query(
    indexes: string[],
    query: string,
    options?: {
      topK?: number
    }
  ): Promise<NodeWithScore[]> {
    // 1. Parse query options with default values
    const { topK = 10 } = options || { topK: 10 }

    // 2. Ensure Weaviate client is initialized
    await this.ensureClient()

    // 3. Initialize vector stores for all target indexes
    const vectorStores = indexes.map((index) => {
      return new WeaviateVectorStore({
        weaviateClient: this.client,
        indexName: this.collectionName(index),
      })
    })

    // 4. Generate embedding for the search query
    const queryEmbedding = await this.embeddingModel.getTextEmbedding(query)

    // 5. Execute queries across all indexes in parallel
    const queryResults = await Promise.all(
      vectorStores.map(async (vectorStore) => {
        return vectorStore.query({
          queryEmbedding,
          queryStr: query,
          similarityTopK: topK,
          mode: VectorStoreQueryMode.HYBRID,
        })
      })
    )

    // 6. Collect and merge results from all indexes
    const results: NodeWithScore[] = []
    for (const result of queryResults) {
      result.nodes?.forEach((node, index) => {
        const nodeWithScore = {
          node,
          score: result.similarities?.[index] ?? 0,
        }
        results.push(nodeWithScore)
      })
    }

    // 7. Sort results by relevance score in descending order
    results.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))

    // 8. Return top K results
    return results.slice(0, topK)
  }

  /**
   * Indexes all documents from a directory into the specified index
   * @param index - Target index name
   * @param directory - Path to directory containing documents
   */
  public async indexDirectory(index: string, directory: string) {
    // 1. Initialize directory reader for loading documents
    const reader = new SimpleDirectoryReader()

    // 2. Configure reader parameters with parallel processing
    const params: any /* @llamaindex/readers/directory: SimpleDirectoryReaderLoadDataParams */ =
      {
        directoryPath: directory,
        numWorkers: 5,
      }

    // 3. Load documents from directory
    const docs = await reader.loadData(params)

    // 4. Process and split documents into chunks
    const processedDocs = docs
      .map((doc) => VectorSearchUtil.process(doc))
      .flat()

    // 5. Generate embeddings for each document chunk
    // TODO: parallel with pool
    for (const doc of processedDocs) {
      doc.embedding = await this.embeddingModel.getTextEmbedding(doc.text)
    }

    // 6. Add processed documents to vector store
    await this.add(index, processedDocs)

    // 7. Log completion with document count
    this.logger.log(`Indexed ${docs?.length || 0} docs in index ${index}`)
  }

  /**
   * Indexes a file buffer directly into the specified index
   * @param index - Target index name
   * @param buffer - File content as buffer
   * @param filename - Optional filename for the temporary file
   */
  public async indexFileBuffer(
    index: string,
    buffer: Buffer,
    filename?: string
  ) {
    // 1. Create temporary file path
    const directory = path.join(this.tempDirectory, RandomUtil.randomString())
    const filePath = path.join(directory, filename || 'temp-file')

    // 2. Ensure directory exists
    await fs.mkdir(directory, { recursive: true })

    // 3. Write buffer to temporary file
    await fs.writeFile(filePath, buffer)

    // 4. Index the temporary file
    try {
      await this.indexDirectory(index, directory)
    } catch (error) {
      this.logger.error('Error indexing file buffer:', error)
      throw error
    } finally {
      // 5. Clean up temporary file
      await fs.unlink(filePath)
      await fs.rmdir(directory)
    }
  }

  /**
   * Index file stored in object storage
   * @param index - Target index name
   * @param bucket - S3 bucket name
   * @param key - S3 object key
   */
  public async indexS3File(index: string, bucket: string, key: string) {
    // 1. Create temporary file path
    const directory = path.join(this.tempDirectory, RandomUtil.randomString())
    const name = path.basename(key)
    const filePath = path.join(directory, name || 'temp-file')

    // 2. Download file from S3
    await this.s3.client.fGetObject(bucket, key, filePath)
    this.logger.log(`Downloaded s3 file from ${bucket}/${key} to ${filePath}`)

    // 3. Index the temporary file
    try {
      await this.indexDirectory(index, directory)
    } catch (error) {
      this.logger.error('Error indexing file buffer:', error)
      throw error
    } finally {
      // 4. Clean up temporary file
      await fs.unlink(filePath)
      await fs.rmdir(directory)
    }
  }

  /**
   * Initializes Weaviate client connection using configuration from environment
   */
  private async init() {
    // 1. Create authentication credentials
    const authCredentials = new weaviate.ApiKey(
      this.configService.get<string>('vector-search.weaviate.apiKey')!
    )

    // 2. Set headers for OpenAI API integration
    const headers = {
      // 'X-OpenAI-Api-Key': this.embeddingModel.apiKey || ''
    }

    // 3. Parse connection configuration from environment variables
    const { scheme, host, port, secure, path } = this.configService.get(
      'vector-search.weaviate'
    )
    const options: ConnectToCustomOptions = {
      ...(scheme === 'http' && {
        httpHost: host,
        httpPort: port,
        httpPath: path,
        httpSecure: secure,
      }),
      ...(scheme === 'grpc' && {
        grpcHost: host,
        grpcPort: port,
        grpcSecure: secure,
      }),
      authCredentials,
      headers,
    }

    // 4. Initialize custom Weaviate connection
    this.client = await weaviate.connectToCustom(options)

    // 5. Verify client readiness
    await this.client.isReady()

    // 6. Log successful connection
    this.logger.log(`Weaviate client connected to ${host}:${port}${path}`)
  }

  /**
   * Ensures Weaviate client is initialized before use
   * Initializes client if not already connected
   */
  private async ensureClient() {
    if (!this.client) {
      await this.init()
    }
  }

  /**
   * Standardizes collection names with C_ prefix.
   * Index name must start with a capital letter, e.g. 'LlamaIndex'
   * @param collection - Original collection name
   * @returns Standardized collection name
   */
  private collectionName(collection: string) {
    if (collection.startsWith('C_')) {
      return collection
    }
    return `C_${collection}`
  }
}

/**
 * Utility class for document processing and text analysis
 * Provides methods for identifying code files, cleaning text, and chunking documents
 */
class VectorSearchUtil {
  /**
   * Determines if a file is a code file based on extension and naming patterns
   * @param filename - Name of the file to check
   * @returns True if the file is identified as a code file
   */
  public static isCodeFile(filename: string): boolean {
    if (!filename || typeof filename !== 'string') {
      return false
    }

    const extension = filename.toLowerCase().split('.').pop()
    if (!extension) {
      return false
    }

    // Comprehensive list of code file extensions
    const codeExtensions = new Set([
      // JavaScript/TypeScript
      'js',
      'jsx',
      'ts',
      'tsx',
      'mjs',
      'cjs',
      'mts',
      'cts',

      // Python
      'py',
      'pyx',
      'pyi',
      'pyc',
      'pyd',
      'pyw',
      'pxd',
      'pxi',

      // Java/Kotlin
      'java',
      'kt',
      'kts',
      'groovy',
      'scala',
      'clj',
      'cljs',
      'edn',

      // C/C++/C#
      'c',
      'cpp',
      'cxx',
      'cc',
      'h',
      'hpp',
      'hxx',
      'hh',
      'cs',
      'csx',
      'fs',
      'fsx',
      'vb',

      // Go/Rust
      'go',
      'rs',
      'rlib',
      'toml',
      'cargo',

      // PHP
      'php',
      'phtml',
      'php3',
      'php4',
      'php5',
      'php7',
      'phps',

      // Ruby
      'rb',
      'ruby',
      'rake',
      'gemspec',
      'ru',
      'erb',

      // Swift/Objective-C
      'swift',
      'm',
      'mm',
      'h',
      'plist',

      // Dart
      'dart',
      'g.dart',

      // HTML/XML/Markup
      'html',
      'htm',
      'xhtml',
      'xml',
      'xaml',
      'xsd',
      'xsl',
      'xslt',
      'svg',
      'md',
      'markdown',
      'rst',
      'adoc',

      // CSS/Stylesheets
      'css',
      'scss',
      'sass',
      'less',
      'styl',
      'stylus',
      'pcss',
      'postcss',

      // SQL/Database
      'sql',
      'sqlite',
      'mysql',
      'pgsql',
      'psql',
      'ddl',
      'dml',

      // Shell/Scripts
      'sh',
      'bash',
      'zsh',
      'fish',
      'ps1',
      'bat',
      'cmd',
      'awk',
      'sed',

      // Configuration files
      'json',
      'yaml',
      'yml',
      'toml',
      'ini',
      'cfg',
      'conf',
      'config',
      'env',
      'properties',

      // Package managers
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml',
      'pnpm-workspace.yaml',
      'composer.json',
      'composer.lock',
      'requirements.txt',
      'setup.py',
      'pyproject.toml',
      'pom.xml',
      'build.gradle',
      'gradle.properties',
      'Cargo.toml',
      'Cargo.lock',
      'go.mod',
      'go.sum',
      'Gemfile',
      'Gemfile.lock',

      // Build tools
      'makefile',
      'make',
      'cmake',
      'ninja',
      'rakefile',
      'rake',

      // Docker/Container
      'dockerfile',
      'dockerignore',
      'yml',
      'yaml',

      // Web development
      'vue',
      'svelte',
      'astro',
      'njk',
      'pug',
      'jade',
      'haml',
      'slim',

      // TypeScript definitions
      'd.ts',

      // Test files
      'test.js',
      'test.ts',
      'spec.js',
      'spec.ts',
      'test.py',
      'test.java',
      'test.rb',

      // Infrastructure/DevOps
      'tf',
      'hcl',
      'tfvars',
      'nomad',
      'helm',
      'yaml',
      'yml',

      // Other languages
      'r',
      'rmd',
      'jl',
      'pl',
      'pm',
      'lua',
      'erl',
      'hrl',
      'ex',
      'exs',
      'elm',
      'elm',
      'ml',
      'mli',
      're',
      'rei',
      'ts',
      'tsx',
      'elm',
      'purs',
      'idr',
      'agda',

      // Documentation with code
      'mdx',
      'md',
      'rst',
      'tex',
      'latex',
      'bib',

      // JSON, csv and configuration files
      'json',
      'json5',
      'csv',
      'yml',
      'yaml',
      'toml',

      // Misc development files
      'gitignore',
      'gitattributes',
      'editorconfig',
      'prettierrc',
      'eslintrc',
      'babelrc',
      'webpack.config.js',
      'rollup.config.js',
      'vite.config.ts',
      'next.config.js',
      'nuxt.config.js',
      'jest.config.js',
      'tsconfig.json',
      'jsconfig.json',
      'angular.json',
      'vue.config.js',
    ])

    // Special handling for files without extensions or with specific names
    const specialCodeFiles = new Set([
      'dockerfile',
      'makefile',
      'rakefile',
      'gemfile',
      'cargo.toml',
      'package.json',
      'tsconfig.json',
      'jsconfig.json',
      'babelrc',
      'eslintrc',
      'prettierrc',
    ])

    const filenameLower = filename.toLowerCase()

    // Check exact matches for special files
    if (specialCodeFiles.has(filenameLower)) {
      return true
    }

    // Check extension-based detection
    if (codeExtensions.has(extension)) {
      return true
    }

    // Handle dotfiles (e.g., .gitignore, .env)
    if (
      (filename.startsWith('.') && filename.includes('ignore')) ||
      (filename.startsWith('.') && filename.includes('env')) ||
      (filename.startsWith('.') && filename.includes('rc'))
    ) {
      return true
    }

    return false
  }

  /**
   * Analyzes text content to determine if it contains code patterns
   * @param text - Text content to analyze
   * @returns True if the text is identified as code
   */
  public static isCode(text: string): boolean {
    if (!text || text.trim().length === 0) {
      return false
    }

    const trimmedText = text.trim()

    // 1. Check for common code patterns
    const codePatterns = [
      // Function definitions
      /\b(?:function|def|fn|fun)\s+\w+\s*\(/i,
      // Class declarations
      /\b(?:class|struct|interface|type)\s+\w+/i,
      // Import statements
      /\b(?:import|require|using|include)\s+['"<\w]/i,
      // Variable declarations with types
      /\b(?:const|let|var|int|string|boolean|float|double|char)\s+\w+/i,
      // Method calls with parentheses
      /\w+\([^)]*\)/,
      // Object literals or arrays
      /[{}[\]]/,
      // Operators
      /[{}[\];=<>!&|+\-*/%]/,
      // Common programming keywords
      /\b(?:if|else|for|while|switch|case|try|catch|return|break|continue)\b/i,
      // Common code structure patterns
      /\b(?:public|private|protected|static|async|await|export|default)\b/i,
      // Arrow functions
      /=\s*>/,
      // Generic types
      /\w+\s*<\w+>/,
      // Semicolon usage
      /;/,
      // Code comments
      /\/\/.*|\/\*[\s\S]*?\*\//,
      // HTML tags
      /<(\/)?\w+[^>]*>/,
      // CSS patterns
      /\w+\s*:\s*[^;]+;/,
    ]

    // 2. Calculate code pattern matches
    let patternMatches = 0
    for (const pattern of codePatterns) {
      if (pattern.test(trimmedText)) {
        patternMatches++
      }
    }

    // 3. Check for natural language indicators (low weight for code detection)
    const naturalLanguagePatterns = [
      /\b(?:the|and|or|but|with|from|this|that|these|those|very|really|actually|basically)\b/i,
      /\b(?:hello|hi|hey|please|thank|sorry)\b/i,
      /[.!?]\s+[A-Z]/, // Sentence endings with capital letters
      /\b(?:I|you|he|she|it|we|they|my|your|his|her|its|our|their)\b/i,
    ]

    let naturalLanguageMatches = 0
    for (const pattern of naturalLanguagePatterns) {
      if (pattern.test(trimmedText)) {
        naturalLanguageMatches++
      }
    }

    // 4. Calculate code likelihood score
    const codeScore = patternMatches / codePatterns.length
    const naturalLanguageScore =
      naturalLanguageMatches / naturalLanguagePatterns.length

    // 5. Heuristic: If we have significant code patterns and low natural language, it's code
    // Also check for minimum code-like structure
    const hasCodeStructure =
      /[{}[\];=<>+\-*/%]/.test(trimmedText) ||
      /\b(?:function|class|def|import|if|for|while)\b/i.test(trimmedText)

    const hasCodeLength = trimmedText.length > 10

    // 6. Final decision based on weighted factors
    const isLikelyCode =
      (codeScore > 0.1 && naturalLanguageScore < 0.3) ||
      (patternMatches >= 2 && hasCodeStructure) ||
      (hasCodeStructure && hasCodeLength)

    return isLikelyCode
  }

  /**
   * Cleans and normalizes code text for consistent formatting
   * @param text - Code text to clean
   * @returns Cleaned and normalized code text
   */
  public static cleanCodeText(text: string): string {
    if (!text || typeof text !== 'string') {
      return ''
    }

    let cleaned = text

    // 1. Normalize line endings to \n
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // 2. Remove excessive empty lines (more than 2 consecutive)
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

    // 3. Normalize indentation (convert tabs to 2 spaces)
    cleaned = cleaned.replace(/\t/g, '  ')

    // 4. Remove trailing whitespace from each line
    cleaned = cleaned.replace(/[ \t]+$/gm, '')

    // 5. Remove leading/trailing whitespace from the entire text
    cleaned = cleaned.trim()

    // 6. Ensure consistent spacing around operators and punctuation
    cleaned = cleaned.replace(/\s*([{}()\[\];,])\s*/g, '$1')
    cleaned = cleaned.replace(/\s*([=+\-*/<>!&|])\s*/g, ' $1 ')

    // 7. Remove excessive spaces
    cleaned = cleaned.replace(/ {2,}/g, ' ')

    // 8. Final cleanup
    cleaned = cleaned.trim()

    return cleaned
  }

  /**
   * Cleans and normalizes raw text for document processing
   * @param text - Raw text to clean
   * @returns Cleaned and normalized text
   */
  public static cleanRawText(text: string): string {
    if (!text || typeof text !== 'string') {
      return ''
    }
    let cleaned = text

    // 1. Normalize line endings to \n
    cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // 2. Remove excessive empty lines (more than 3 consecutive)
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n')

    // 3. Normalize Unicode and special characters
    cleaned = cleaned
      .replace(/\u00A0/g, ' ') // Non-breaking space to regular space
      .replace(/\u200B/g, '') // Zero-width space
      .replace(/\uFEFF/g, '') // Zero-width no-break space (BOM)
      .replace(/[\u2018\u2019]/g, "'") // Smart quotes to regular quotes
      .replace(/[\u201C\u201D]/g, '"')

    // 4. Remove control characters except newline, tab, and space
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')

    // 5. Handle HTML/XML tags and entities
    cleaned = cleaned
      .replace(/&nbsp;/g, ' ') // HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")

    // 6. Remove excessive whitespace
    cleaned = cleaned.replace(/\s+/g, ' ').trim()

    // 7. Ensure meaningful content
    if (cleaned.length < 10) {
      // If too short after processing, return original trimmed text
      return text.trim()
    }

    return cleaned
  }

  /**
   * Determines appropriate cleaning method based on file type and applies it
   * @param text - Text to clean
   * @param filename - Optional filename for type detection
   * @returns Cleaned text using appropriate method
   */
  public static cleanText(text: string, filename?: string): string {
    if (!text || typeof text !== 'string') {
      return ''
    }

    if (
      (filename && VectorSearchUtil.isCodeFile(filename)) ||
      VectorSearchUtil.isCode(text)
    ) {
      return VectorSearchUtil.cleanCodeText(text)
    }

    return VectorSearchUtil.cleanRawText(text)
  }

  /**
   * Splits text into chunks using sentence-based splitting
   * @param text - Text to split into chunks
   * @returns Array of text chunks
   */
  public static split(text: string): string[] {
    const splitter = new SentenceSplitter({
      chunkSize: 1024,
      chunkOverlap: 100,
      paragraphSeparator: '\n\n',
    })
    return splitter.splitText(text)
  }

  /**
   * Splits document into chunks while preserving metadata
   * @param doc - Document to split
   * @returns Array of document chunks
   */
  public static splitDocument(doc: Document): string[] {
    const splitter = new SentenceSplitter({
      chunkSize: 1024,
      chunkOverlap: 100,
      paragraphSeparator: '\n\n',
    })
    return splitter.splitTextMetadataAware(
      doc.text,
      doc.metadata?.toString() || ''
    )
  }

  /**
   * Complete document processing pipeline
   * Cleans text, splits into chunks, and creates new documents with metadata
   * @param doc - Original document to process
   * @returns Array of processed document chunks
   */
  public static process(doc: Document): Document[] {
    try {
      doc.text = VectorSearchUtil.cleanText(doc.text, doc.metadata?.file_name)
    } catch (error) {
      Logger.error('Error cleaning text', error)
    }
    const chunks = VectorSearchUtil.splitDocument(doc).filter(
      (chunk) => chunk.length > 10
    )
    return chunks.map(
      (chunk, index) =>
        new Document({ text: chunk, metadata: { ...doc.metadata, index } })
    )
  }
}

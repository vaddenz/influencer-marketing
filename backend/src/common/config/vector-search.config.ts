import { registerAs } from '@nestjs/config'

/**
 * Vector Search Configuration
 *
 * Registers the 'vector-search' configuration namespace.
 * Contains vector search settings like port and environment.
 */
export default registerAs('vector-search', () => ({
  apiKey: process.env.EMBEDDING_MODEL_API_KEY || '',
  model: process.env.EMBEDDING_MODEL_NAME || '',
  baseURL: process.env.EMBEDDING_MODEL_BASE_URL || '',
  dimensions: parseInt(process.env.EMBEDDING_MODEL_DIMENSIONS || '768', 10),
  weaviate: {
    apiKey: process.env.EMBEDDING_WEAVIATE_API_KEY || '',
    scheme:
      process.env.EMBEDDING_WEAVIATE_SCHEME || ('http' as 'http' | 'grpc'),
    host: process.env.EMBEDDING_WEAVIATE_HOST || 'localhost',
    port: process.env.EMBEDDING_WEAVIATE_PORT
      ? parseInt(process.env.EMBEDDING_WEAVIATE_PORT, 10)
      : undefined,
    secure: process.env.EMBEDDING_WEAVIATE_SECURE === 'true',
    path: process.env.EMBEDDING_WEAVIATE_PATH || undefined,
  },
}))

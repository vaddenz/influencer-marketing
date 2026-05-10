export class FileMetadataDto {
  bucket: string
  key: string
  name: string
  size: number
  contentType: string
  lastModified?: Date
  etag?: string
}

export class FileExistsDto {
  exists: boolean
  key: string
}

export class FileDownloadDto {
  buffer: Buffer
  metadata: FileMetadataDto
}

export class FileDeleteResultDto {
  success: boolean
  key: string
  message?: string
}

import { createId } from '@paralleldrive/cuid2'
import archiver from 'archiver'

export interface ZipEntry {
  name: string
  content: string | Buffer
}

export interface ZipResult {
  buffer: Buffer
  size: number
}

export class FileUtil {
  /**
   * Get filename from multer file object
   * @param file - Multer file object
   */
  static getFileName(file: Express.Multer.File) {
    return file.originalname
  }

  /**
   * Get file extension from filename
   * @param file - Multer file object
   */
  static getFileExtension(file: Express.Multer.File) {
    return file.originalname.includes('.')
      ? `.${file.originalname.split('.').pop()}`
      : ''
  }

  /**
   * Get file size in bytes
   * @param file - Multer file object
   */
  static getFileSize(file: Express.Multer.File) {
    return file.size
  }

  /**
   * Format file size to human readable string
   * @param bytes - File size in bytes
   * @param decimals - Number of decimal places
   * @returns Formatted string (e.g. "1.5 MB")
   */
  static formatSize(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
  }

  /**
   * Check if file is an image
   * @param file - Multer file object
   */
  static isImage(file: Express.Multer.File): boolean {
    return file.mimetype.startsWith('image/')
  }

  /**
   * Check if file is an animated image
   * @param file - Multer file object
   */
  static isAnimatedImage(file: Express.Multer.File): boolean {
    return this.isImage(file) && file.mimetype.includes('gif')
  }

  /**
   * Check if file is a video
   * @param file - Multer file object
   */
  static isVideo(file: Express.Multer.File): boolean {
    return file.mimetype.startsWith('video/')
  }

  /**
   * Check if file is an audio
   * @param file - Multer file object
   */
  static isAudio(file: Express.Multer.File): boolean {
    return file.mimetype.startsWith('audio/')
  }

  /**
   * Check if file is a PDF
   * @param file - Multer file object
   */
  static isPDF(file: Express.Multer.File): boolean {
    return file.mimetype === 'application/pdf'
  }

  /**
   * Fix filename encoding issue where UTF-8 bytes are interpreted as Latin-1
   * @param fileName - Original filename
   */
  static fixUtf8FileName(fileName: string): string {
    try {
      return Buffer.from(fileName, 'latin1').toString('utf8')
    } catch (e) {
      return fileName
    }
  }

  /**
   * Check if file size is within limit
   * @param file - Multer file object
   * @param maxSize - Max size in bytes
   */
  static validateSize(file: Express.Multer.File, maxSize: number): boolean {
    return file.size <= maxSize
  }

  /**
   * Get safe filename (remove special characters)
   * @param file - Multer file object
   */
  static getSafeFileName(file: Express.Multer.File): string {
    const originalName = file.originalname
    const extension = this.getFileExtension(file)
    const nameWithoutExt = originalName.slice(
      0,
      originalName.lastIndexOf(extension)
    )
    const safeName = nameWithoutExt
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
    return `${safeName}${extension}`
  }

  /**
   * Generate unique filename
   * @param file - Multer file object
   */
  static generateUniqueFileName(file: Express.Multer.File): string {
    const extension = this.getFileExtension(file)
    return `${createId()}${extension}`
  }

  /**
   * Create a zip archive from multiple files
   * @param entries - Array of file entries with name and content
   * @returns ZipResult containing the buffer and size
   */
  static async createZip(entries: ZipEntry[]): Promise<ZipResult> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      })

      archive.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      archive.on('end', () => {
        const buffer = Buffer.concat(chunks)
        resolve({
          buffer,
          size: buffer.length,
        })
      })
      archive.on('error', (err) => reject(err))
      archive.on('warning', (err) => {
        if (err.code === 'ENOENT') {
          console.warn('Archiver warning:', err)
        } else {
          reject(err)
        }
      })

      // Add files to archive
      for (const entry of entries) {
        archive.append(entry.content, { name: entry.name })
      }

      archive.finalize()
    })
  }
}

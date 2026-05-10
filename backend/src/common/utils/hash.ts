import { createHash } from 'crypto'

/**
 * Utility class for cryptographic hashing
 */
export class HashUtil {
  /**
   * Generate SHA1 hash of a string
   * @param str - Input string
   * @returns Hexadecimal hash string
   */
  static sha1(str: string) {
    return createHash('sha1').update(str).digest('hex')
  }

  /**
   * Generate SHA256 hash of a string
   * @param str - Input string
   * @returns Hexadecimal hash string
   */
  static sha256(str: string) {
    return createHash('sha256').update(str).digest('hex')
  }

  /**
   * Generate MD5 hash of a string
   * @param str - Input string
   * @returns Hexadecimal hash string
   */
  static md5(str: string) {
    return createHash('md5').update(str).digest('hex')
  }
}

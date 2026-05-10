import { createId } from '@paralleldrive/cuid2'

/**
 * Utility class for generating random values
 */
export class RandomUtil {
  /**
   * Generate a unique random string (using CUID2)
   * @returns Unique string ID
   */
  public static randomString(): string {
    return createId()
  }

  /**
   * Generate a random numeric code of specified length.
   * Useful for OTPs (One Time Passwords).
   *
   * @param digit - Number of digits (e.g., 4 or 6)
   * @throws Error if digit is not positive
   * @returns Random number with specified digits
   */
  public static randomCode(digit: number): number {
    if (digit <= 0) {
      throw new Error('Digit must be a positive integer')
    }

    const min = Math.pow(10, digit - 1)
    const max = Math.pow(10, digit) - 1

    return Math.floor(Math.random() * (max - min + 1)) + min
  }
}

import { DAY, HOUR, MINUTE, SECOND } from '../const/unit'

export type TimeUnit = 'day' | 'hour' | 'minute' | 'second' | 'millisecond'

/**
 * Utility class for time manipulation and formatting
 */
export class TimeUtil {
  /**
   * Pause execution for a specified duration
   * @param ms Duration in milliseconds
   * @returns Promise that resolves after the duration
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get current date object
   * @returns Current Date
   */
  static now(): Date {
    return new Date()
  }

  /**
   * Get current timestamp in milliseconds
   * @returns Timestamp in ms
   */
  static timestamp(): number {
    return Date.now()
  }

  /**
   * Get current unix timestamp in seconds
   * @returns Timestamp in seconds
   */
  static unix(): number {
    return Math.floor(Date.now() / 1000)
  }

  /**
   * Format date to string using a simple template
   * Supported placeholders: YYYY, MM, DD, HH, mm, ss, SSS
   *
   * @param date Date object (default: now)
   * @param formatStr Format string (default: YYYY-MM-DD HH:mm:ss)
   * @returns Formatted date string
   */
  static format(
    date: Date = new Date(),
    formatStr: string = 'YYYY-MM-DD HH:mm:ss'
  ): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    const ms = String(date.getMilliseconds()).padStart(3, '0')

    return formatStr
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
      .replace('SSS', ms)
  }

  /**
   * Add time to date
   * @param amount - Amount to add
   * @param unit - Time unit (day, hour, minute, second, millisecond)
   * @param date - Base date (default: now)
   * @returns New Date object
   */
  static add(amount: number, unit: TimeUnit, date: Date = new Date()): Date {
    const newDate = new Date(date)
    switch (unit) {
      case 'day':
        newDate.setDate(newDate.getDate() + amount)
        break
      case 'hour':
        newDate.setTime(newDate.getTime() + amount * HOUR)
        break
      case 'minute':
        newDate.setTime(newDate.getTime() + amount * MINUTE)
        break
      case 'second':
        newDate.setTime(newDate.getTime() + amount * SECOND)
        break
      case 'millisecond':
        newDate.setTime(newDate.getTime() + amount)
        break
    }
    return newDate
  }

  /**
   * Subtract time from date
   * @param amount - Amount to subtract
   * @param unit - Time unit
   * @param date - Base date
   * @returns New Date object
   */
  static subtract(
    amount: number,
    unit: TimeUnit,
    date: Date = new Date()
  ): Date {
    return this.add(-amount, unit, date)
  }

  /**
   * Get start of day (00:00:00.000)
   * @param date - Reference date
   * @returns New Date object at start of day
   */
  static startOfDay(date: Date = new Date()): Date {
    const newDate = new Date(date)
    newDate.setHours(0, 0, 0, 0)
    return newDate
  }

  /**
   * Get end of day (23:59:59.999)
   * @param date - Reference date
   * @returns New Date object at end of day
   */
  static endOfDay(date: Date = new Date()): Date {
    const newDate = new Date(date)
    newDate.setHours(23, 59, 59, 999)
    return newDate
  }

  /**
   * Check if date is valid
   * @param date - Date object to check
   * @returns true if valid Date object
   */
  static isValid(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime())
  }

  /**
   * Get difference between two dates
   * @param date1 - First date
   * @param date2 - Second date
   * @param unit - Return unit (default: millisecond)
   * @returns Difference in specified unit (date1 - date2)
   */
  static diff(
    date1: Date,
    date2: Date,
    unit: TimeUnit = 'millisecond'
  ): number {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    const diff = d1.getTime() - d2.getTime()

    switch (unit) {
      case 'day':
        return diff / DAY
      case 'hour':
        return diff / HOUR
      case 'minute':
        return diff / MINUTE
      case 'second':
        return diff / SECOND
      case 'millisecond':
        return diff
    }
  }

  /**
   * Check if date1 is before date2
   * @param date1 - First date
   * @param date2 - Second date
   * @returns true if date1 < date2
   */
  static isBefore(date1: Date, date2: Date): boolean {
    return new Date(date1).getTime() < new Date(date2).getTime()
  }

  /**
   * Check if date1 is after date2
   * @param date1 - First date
   * @param date2 - Second date
   * @returns true if date1 > date2
   */
  static isAfter(date1: Date, date2: Date): boolean {
    return new Date(date1).getTime() > new Date(date2).getTime()
  }

  /**
   * Check if date1 is same as date2
   * @param date1 - First date
   * @param date2 - Second date
   * @returns true if date1 == date2 (by timestamp)
   */
  static isSame(date1: Date, date2: Date): boolean {
    return new Date(date1).getTime() === new Date(date2).getTime()
  }
}

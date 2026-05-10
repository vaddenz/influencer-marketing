import { Readable } from 'stream'
import { HOUR, MINUTE } from '@/common/const/unit'
import { TimeUtil } from './time'
import { JSONUtil } from './json'
import { ContextUtil } from './context'
import { ErrorUtil } from './error'
import { FileUtil } from './file'
import { HashUtil } from './hash'
import { PromiseUtil } from './promise'
import { RandomUtil } from './random'
import { RetryUtil } from './retry'
import { safeAccess } from './safe'
import { BadRequestException } from '@nestjs/common'

describe('JSONUtil', () => {
  describe('preprocess', () => {
    it('should return original string if it is already clean', () => {
      const json = '{"key": "value"}'
      expect(JSONUtil.preprocess(json)).toBe(json)
    })

    it('should extract JSON from markdown code blocks', () => {
      const json = '```json\n{"key": "value"}\n```'
      expect(JSONUtil.preprocess(json)).toBe('{"key": "value"}')
    })

    it('should extract JSON from markdown code blocks without language identifier', () => {
      const json = '```\n{"key": "value"}\n```'
      expect(JSONUtil.preprocess(json)).toBe('{"key": "value"}')
    })

    it('should extract JSON with surrounding text', () => {
      const json = 'Here is the response: {"key": "value"} Hope this helps.'
      expect(JSONUtil.preprocess(json)).toBe('{"key": "value"}')
    })

    it('should handle multiline JSON correctly', () => {
      const json = '{\n  "key": "value"\n}'
      // We expect it to return the JSON string, format preservation is good but extraction is key.
      // If we implement it to just extract, it should be:
      expect(JSONUtil.preprocess(json)).toBe('{\n  "key": "value"\n}')
    })

    it('should handle arrays', () => {
      const json = 'Here is a list: [1, 2, 3]'
      expect(JSONUtil.preprocess(json)).toBe('[1, 2, 3]')
    })

    it('should handle nested structures', () => {
      const json = '```json\n{"a": {"b": [1, 2]}}\n```'
      expect(JSONUtil.preprocess(json)).toBe('{"a": {"b": [1, 2]}}')
    })

    it('should handle broken JSON by returning it as best effort (or maybe original?)', () => {
      // If it cannot find braces, maybe return original?
      const text = 'Just some text'
      // Current plan: if no brackets found, return original.
      expect(JSONUtil.preprocess(text)).toBe(text)
    })
  })
})

describe('TimeUtil', () => {
  describe('sleep', () => {
    it('should wait for specified time', async () => {
      const start = Date.now()
      await TimeUtil.sleep(100)
      const end = Date.now()
      expect(end - start).toBeGreaterThanOrEqual(95) // Allow small variance
    })
  })

  describe('now', () => {
    it('should return current date', () => {
      const now = TimeUtil.now()
      expect(now).toBeInstanceOf(Date)
      expect(Date.now() - now.getTime()).toBeLessThan(1000)
    })
  })

  describe('timestamp', () => {
    it('should return current timestamp', () => {
      const ts = TimeUtil.timestamp()
      expect(typeof ts).toBe('number')
      expect(Date.now() - ts).toBeLessThan(1000)
    })
  })

  describe('unix', () => {
    it('should return unix timestamp', () => {
      const unix = TimeUtil.unix()
      expect(typeof unix).toBe('number')
      expect(Math.floor(Date.now() / 1000) - unix).toBeLessThan(2)
    })
  })

  describe('format', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-01-02T03:04:05.678')
      expect(TimeUtil.format(date)).toBe('2023-01-02 03:04:05')
      expect(TimeUtil.format(date, 'YYYY/MM/DD')).toBe('2023/01/02')
      expect(TimeUtil.format(date, 'HH:mm')).toBe('03:04')
      expect(TimeUtil.format(date, 'ss.SSS')).toBe('05.678')
    })
  })

  describe('add', () => {
    it('should add time correctly', () => {
      const base = new Date('2023-01-01T00:00:00.000Z')

      const addedDay = TimeUtil.add(1, 'day', base)
      expect(addedDay.getTime() - base.getTime()).toBe(24 * 60 * 60 * 1000)

      const addedHour = TimeUtil.add(2, 'hour', base)
      expect(addedHour.getTime() - base.getTime()).toBe(2 * HOUR)

      const addedMinute = TimeUtil.add(30, 'minute', base)
      expect(addedMinute.getTime() - base.getTime()).toBe(30 * MINUTE)
    })
  })

  describe('subtract', () => {
    it('should subtract time correctly', () => {
      const base = new Date('2023-01-02T00:00:00.000Z')

      const subDay = TimeUtil.subtract(1, 'day', base)
      expect(base.getTime() - subDay.getTime()).toBe(24 * 60 * 60 * 1000)
    })
  })

  describe('startOfDay', () => {
    it('should return start of day', () => {
      const date = new Date('2023-01-01T15:30:45.123')
      const start = TimeUtil.startOfDay(date)
      expect(start.getHours()).toBe(0)
      expect(start.getMinutes()).toBe(0)
      expect(start.getSeconds()).toBe(0)
      expect(start.getMilliseconds()).toBe(0)
      expect(start.getDate()).toBe(1)
      expect(start.getMonth()).toBe(0)
      expect(start.getFullYear()).toBe(2023)
    })
  })

  describe('endOfDay', () => {
    it('should return end of day', () => {
      const date = new Date('2023-01-01T15:30:45.123')
      const end = TimeUtil.endOfDay(date)
      expect(end.getHours()).toBe(23)
      expect(end.getMinutes()).toBe(59)
      expect(end.getSeconds()).toBe(59)
      expect(end.getMilliseconds()).toBe(999)
      expect(end.getDate()).toBe(1)
    })
  })

  describe('isValid', () => {
    it('should validate date', () => {
      expect(TimeUtil.isValid(new Date())).toBe(true)
      expect(TimeUtil.isValid(new Date('invalid'))).toBe(false)
      expect(TimeUtil.isValid('string')).toBe(false)
      expect(TimeUtil.isValid(123)).toBe(false)
      expect(TimeUtil.isValid(null)).toBe(false)
    })
  })

  describe('diff', () => {
    it('should calculate difference correctly', () => {
      const d1 = new Date('2023-01-02T12:00:00')
      const d2 = new Date('2023-01-01T12:00:00')

      expect(TimeUtil.diff(d1, d2, 'day')).toBe(1)
      expect(TimeUtil.diff(d1, d2, 'hour')).toBe(24)
      expect(TimeUtil.diff(d1, d2, 'minute')).toBe(24 * 60)
    })
  })

  describe('comparison', () => {
    it('should compare dates correctly', () => {
      const earlier = new Date('2023-01-01')
      const later = new Date('2023-01-02')
      const same = new Date('2023-01-01')

      expect(TimeUtil.isBefore(earlier, later)).toBe(true)
      expect(TimeUtil.isBefore(later, earlier)).toBe(false)

      expect(TimeUtil.isAfter(later, earlier)).toBe(true)
      expect(TimeUtil.isAfter(earlier, later)).toBe(false)

      expect(TimeUtil.isSame(earlier, same)).toBe(true)
      expect(TimeUtil.isSame(earlier, later)).toBe(false)
    })
  })
})

describe('ContextUtil', () => {
  const mockReq = {
    user: { id: 'user-123' },
    tenant: { id: 'tenant-456' },
  }
  const emptyReq = {}

  describe('getCurrentUserId', () => {
    it('should return user id when present', () => {
      expect(ContextUtil.getCurrentUserId(mockReq)).toBe('user-123')
    })

    it('should return null when user is missing', () => {
      expect(ContextUtil.getCurrentUserId(emptyReq)).toBeNull()
    })
  })

  describe('getCurrentUserIdOrThrow', () => {
    it('should return user id when present', () => {
      expect(ContextUtil.getCurrentUserIdOrThrow(mockReq)).toBe('user-123')
    })

    it('should throw BadRequestException when user is missing', () => {
      expect(() => ContextUtil.getCurrentUserIdOrThrow(emptyReq)).toThrow(
        BadRequestException
      )
    })
  })

  describe('getTenantId', () => {
    it('should return tenant id when present', () => {
      expect(ContextUtil.getTenantId(mockReq)).toBe('tenant-456')
    })

    it('should return null when tenant is missing', () => {
      expect(ContextUtil.getTenantId(emptyReq)).toBeNull()
    })
  })

  describe('getTenantIdOrThrow', () => {
    it('should return tenant id when present', () => {
      expect(ContextUtil.getTenantIdOrThrow(mockReq)).toBe('tenant-456')
    })

    it('should throw BadRequestException when tenant is missing', () => {
      expect(() => ContextUtil.getTenantIdOrThrow(emptyReq)).toThrow(
        BadRequestException
      )
    })
  })
})

describe('ErrorUtil', () => {
  describe('message', () => {
    it('should return empty string for null/undefined', () => {
      expect(ErrorUtil.message(null)).toBe('')
      expect(ErrorUtil.message(undefined)).toBe('')
    })

    it('should format Error object with stack', () => {
      const err = new Error('test error')
      // Just check it contains message and stack indication
      const msg = ErrorUtil.message(err)
      expect(msg).toContain('test error')
      expect(msg).toContain('[stack:')
    })

    it('should return string as is', () => {
      expect(ErrorUtil.message('error string')).toBe('error string')
    })

    it('should stringify object', () => {
      const obj = { foo: 'bar' }
      expect(ErrorUtil.message(obj)).toBe('{"foo":"bar"}')
    })
  })

  describe('name', () => {
    it('should return error name for Error object', () => {
      const err = new Error('test')
      err.name = 'CustomError'
      expect(ErrorUtil.name(err)).toBe('CustomError')
    })

    it('should return object name property', () => {
      expect(ErrorUtil.name({ name: 'ObjError' })).toBe('ObjError')
    })

    it('should return string representation for others', () => {
      expect(ErrorUtil.name('string error')).toBe('string error')
    })
  })

  describe('code', () => {
    it('should return code from object', () => {
      expect(ErrorUtil.code({ code: 'ERR_001' })).toBe('ERR_001')
    })

    it('should return string representation for others', () => {
      expect(ErrorUtil.code('some error')).toBe('some error')
    })
  })
})

describe('HashUtil', () => {
  it('should generate sha1 hash', () => {
    // echo -n "test" | openssl sha1
    // a94a8fe5ccb19ba61c4c0873d391e987982fbbd3
    expect(HashUtil.sha1('test')).toBe(
      'a94a8fe5ccb19ba61c4c0873d391e987982fbbd3'
    )
  })

  it('should generate sha256 hash', () => {
    // echo -n "test" | openssl sha256
    // 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
    expect(HashUtil.sha256('test')).toBe(
      '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    )
  })

  it('should generate md5 hash', () => {
    // echo -n "test" | openssl md5
    // 098f6bcd4621d373cade4e832627b4f6
    expect(HashUtil.md5('test')).toBe('098f6bcd4621d373cade4e832627b4f6')
  })
})

describe('PromiseUtil', () => {
  describe('all', () => {
    it('should execute all promises with concurrency', async () => {
      const items = [1, 2, 3, 4, 5]
      const results = await PromiseUtil.all(
        items,
        async (item) => {
          return item * 2
        },
        2
      )
      expect(results).toEqual([2, 4, 6, 8, 10])
    })

    it('should handle empty array', async () => {
      const results = await PromiseUtil.all([], async () => {}, 2)
      expect(results).toEqual([])
    })
  })
})

describe('RandomUtil', () => {
  describe('randomString', () => {
    it('should return a string', () => {
      expect(typeof RandomUtil.randomString()).toBe('string')
    })
    it('should return unique strings', () => {
      expect(RandomUtil.randomString()).not.toBe(RandomUtil.randomString())
    })
  })

  describe('randomCode', () => {
    it('should return a number with specified digits', () => {
      const code = RandomUtil.randomCode(4)
      expect(code).toBeGreaterThanOrEqual(1000)
      expect(code).toBeLessThanOrEqual(9999)
    })

    it('should throw error for invalid digit', () => {
      expect(() => RandomUtil.randomCode(0)).toThrow()
    })
  })
})

describe('RetryUtil', () => {
  describe('retry', () => {
    it('should return result on success', async () => {
      const fn = jest.fn().mockResolvedValue('success')
      const result = await RetryUtil.retry(fn)
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValue('success')

      const result = await RetryUtil.retry(fn, 3, 10) // fast retry
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should throw after max attempts', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('fail'))
      await expect(RetryUtil.retry(fn, 3, 10)).rejects.toThrow('fail')
      expect(fn).toHaveBeenCalledTimes(3)
    })

    it('should stop retry if predicate returns false', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('stop'))
      const shouldRetry = (err: Error) => err.message !== 'stop'
      await expect(RetryUtil.retry(fn, 3, 10, 2, shouldRetry)).rejects.toThrow(
        'stop'
      )
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })

  describe('retryNetworkErrors', () => {
    it('should retry on network error', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('network error'))
        .mockResolvedValue('success')

      const result = await RetryUtil.retryNetworkErrors(fn, 3, 10)
      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should not retry on non-network error', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('logic error'))
      await expect(RetryUtil.retryNetworkErrors(fn, 3, 10)).rejects.toThrow(
        'logic error'
      )
      expect(fn).toHaveBeenCalledTimes(1)
    })
  })
})

describe('safeAccess', () => {
  const obj = {
    a: {
      b: {
        c: 1,
        d: [10, 20],
      },
    },
  }

  it('should access nested property', () => {
    expect(safeAccess(obj, 'a.b.c')).toBe(1)
  })

  it('should access array element', () => {
    expect(safeAccess(obj, 'a.b.d[0]')).toBe(10)
  })

  it('should return default value if path not found', () => {
    expect(safeAccess(obj, 'a.b.x', 'default')).toBe('default')
  })

  it('should return default value if intermediate path missing', () => {
    expect(safeAccess(obj, 'x.y.z', 'default')).toBe('default')
  })

  it('should handle null/undefined object', () => {
    expect(safeAccess(null, 'a.b')).toBeUndefined()
    expect(safeAccess(undefined, 'a.b', 'def')).toBe('def')
  })
})

// Mock dependencies
const mockSharpInstance = {
  jpeg: jest.fn().mockReturnThis(),
  toBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-image')),
}
const mockFfmpegInstance = {
  screenshots: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
}

jest.mock('sharp', () => jest.fn(() => mockSharpInstance))
jest.mock('fluent-ffmpeg', () => {
  const fn = jest.fn(() => mockFfmpegInstance)
  // @ts-ignore
  fn.setFfmpegPath = jest.fn()
  return fn
})
jest.mock('@ffmpeg-installer/ffmpeg', () => ({ path: '/mock/path/to/ffmpeg' }))

// Mock fs
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue(Buffer.from('mock-video-cover')),
    unlink: jest.fn().mockResolvedValue(undefined),
  },
  existsSync: jest.fn().mockReturnValue(true),
}))

describe('FileUtil', () => {
  const mockFile = (
    overrides: Partial<Express.Multer.File> = {}
  ): Express.Multer.File => ({
    fieldname: 'file',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    destination: '',
    filename: '',
    path: '',
    buffer: Buffer.from([]),
    stream: Readable.from([]),
    ...overrides,
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('formatSize', () => {
    it('should format bytes to human readable string', () => {
      expect(FileUtil.formatSize(0)).toBe('0 B')
      expect(FileUtil.formatSize(1024)).toBe('1 KB')
      expect(FileUtil.formatSize(1024 * 1024)).toBe('1 MB')
      expect(FileUtil.formatSize(1024 * 1024 * 1024)).toBe('1 GB')
      expect(FileUtil.formatSize(1500)).toBe('1.46 KB')
    })

    it('should respect decimals parameter', () => {
      expect(FileUtil.formatSize(1500, 1)).toBe('1.5 KB')
      expect(FileUtil.formatSize(1500, 0)).toBe('1 KB')
    })
  })

  describe('isImage', () => {
    it('should return true for image mimetype', () => {
      expect(FileUtil.isImage(mockFile({ mimetype: 'image/jpeg' }))).toBe(true)
      expect(FileUtil.isImage(mockFile({ mimetype: 'image/png' }))).toBe(true)
    })

    it('should return false for non-image mimetype', () => {
      expect(FileUtil.isImage(mockFile({ mimetype: 'application/pdf' }))).toBe(
        false
      )
    })
  })

  describe('isVideo', () => {
    it('should return true for video mimetype', () => {
      expect(FileUtil.isVideo(mockFile({ mimetype: 'video/mp4' }))).toBe(true)
    })

    it('should return false for non-video mimetype', () => {
      expect(FileUtil.isVideo(mockFile({ mimetype: 'image/jpeg' }))).toBe(false)
    })
  })

  describe('getSafeFileName', () => {
    it('should replace special characters with hyphen', () => {
      expect(
        FileUtil.getSafeFileName(mockFile({ originalname: 'My File!.jpg' }))
      ).toBe('My-File-.jpg')
    })

    it('should handle multiple special characters', () => {
      expect(
        FileUtil.getSafeFileName(
          mockFile({ originalname: 'my@file#name$.png' })
        )
      ).toBe('my-file-name-.png')
    })

    it('should condense multiple hyphens', () => {
      expect(
        FileUtil.getSafeFileName(mockFile({ originalname: 'a!!!b.txt' }))
      ).toBe('a-b.txt')
    })
  })

  describe('validateSize', () => {
    it('should return true if file size is within limit', () => {
      expect(FileUtil.validateSize(mockFile({ size: 100 }), 200)).toBe(true)
      expect(FileUtil.validateSize(mockFile({ size: 200 }), 200)).toBe(true)
    })

    it('should return false if file size exceeds limit', () => {
      expect(FileUtil.validateSize(mockFile({ size: 300 }), 200)).toBe(false)
    })
  })

  describe('generateUniqueFileName', () => {
    it('should generate a unique filename with correct extension', () => {
      const file = mockFile({ originalname: 'test.png' })
      const uniqueName = FileUtil.generateUniqueFileName(file)
      expect(uniqueName).toMatch(/^[a-z0-9]+\.png$/) // Cuid2 is alphanumeric
      expect(uniqueName).not.toBe(file.originalname)
    })
  })
})

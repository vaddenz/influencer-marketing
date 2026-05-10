# Common Utilities

This directory contains a collection of utility classes and functions designed for common tasks across the application. These utilities are stateless and provide static methods for easy consumption. LLMs should use these utilities to ensure consistent behavior and avoid duplicating logic.

## Table of Contents

- [ContextUtil](#contextutil)
- [ErrorUtil](#errorutil)
- [FileUtil](#fileutil)
- [HashUtil](#hashutil)
- [JSONUtil](#jsonutil)
- [PromiseUtil](#promiseutil)
- [RandomUtil](#randomutil)
- [RetryUtil](#retryutil)
- [Safe Access](#safe-access)
- [TimeUtil](#timeutil)

---

## ContextUtil

`context.ts`

Utilities for extracting context information (User ID, Tenant ID) from request objects.

- `getCurrentUserId(req)`: Get current user ID or null.
- `getCurrentUserIdOrThrow(req)`: Get current user ID or throw `BadRequestException`.
- `getTenantId(req)`: Get tenant ID or null.
- `getTenantIdOrThrow(req)`: Get tenant ID or throw `BadRequestException`.

## ErrorUtil

`error.ts`

Utilities for handling and formatting errors.

- `message(error)`: Extract readable message from error object/string.
- `name(error)`: Extract error name.
- `code(error)`: Extract error code.

## FileUtil

`file.ts`

Utilities for file handling, validation, and processing.

- **Metadata**: `getFileName`, `getFileExtension`, `getFileSize`, `formatSize`.
- **Validation**: `isImage`, `isAnimatedImage`, `isVideo`, `isAudio`, `isPDF`, `validateSize`.
- **Naming**: `getSafeFileName`, `generateUniqueFileName`.
- **Processing**: `expensiveGetCoverImage` (extracts cover from video/animated image).

## HashUtil

`hash.ts`

Cryptographic hashing utilities.

- `sha1(str)`: Generate SHA1 hash.
- `sha256(str)`: Generate SHA256 hash.
- `md5(str)`: Generate MD5 hash.

## JSONUtil

`json.ts`

Safe JSON handling utilities.

- `parseOrNull(str, options)`: Safely parse JSON, returns null/default on failure. Supports preprocessing (stripping Markdown code blocks).
- `parse(str)`: Wrapper for `JSON.parse`.
- `stringify(obj)`: Wrapper for `JSON.stringify`.
- `isValid(str)`: Check if string is valid JSON.
- `preprocess(str)`: Extract JSON from mixed content (e.g., LLM responses).

## PromiseUtil

`promise.ts`

Promise flow control utilities.

- `all(items, executor, concurrency)`: Execute promises with limited concurrency.

## RandomUtil

`random.ts`

Random value generation.

- `randomString()`: Generate unique string (CUID2).
- `randomCode(digit)`: Generate random numeric code (e.g., for OTP).

## RetryUtil

`retry.ts`

Retry logic for unstable operations.

- `retry(fn, maxAttempts, delayMs, backoffMultiplier, shouldRetry)`: Generic retry with exponential backoff.
- `retryWithFixedDelay(fn, maxAttempts, delayMs, shouldRetry)`: Retry with fixed delay.
- `retryNetworkErrors(fn, maxAttempts, delayMs)`: Retry only for common network errors.

## Safe Access

`safe.ts`

- `safeAccess(obj, path, defaultValue, maxDepth)`: Safely access nested object properties using string path (e.g., "user.profile.name").

## TimeUtil

`time.ts`

Time manipulation and formatting.

- **Basics**: `sleep`, `now`, `timestamp`, `unix`.
- **Formatting**: `format(date, formatStr)`.
- **Manipulation**: `add`, `subtract`, `startOfDay`, `endOfDay`.
- **Comparison**: `diff`, `isBefore`, `isAfter`, `isSame`.
- **Validation**: `isValid`.

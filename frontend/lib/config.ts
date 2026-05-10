// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

// Build full API URL
export function getApiUrl(path: string): string {
  // If path is already a full URL, return it directly
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  // Remove leading slash from path to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path

  // If base URL ends with slash, concatenate directly
  if (API_BASE_URL.endsWith('/')) {
    return `${API_BASE_URL}${cleanPath}`
  }

  return `${API_BASE_URL}/${cleanPath}`
}

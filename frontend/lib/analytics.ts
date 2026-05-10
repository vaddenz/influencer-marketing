/**
 * Umami Analytics Event Tracking Utility
 *
 * This module provides a type-safe wrapper for tracking events with Umami analytics.
 * It ensures the Umami script is loaded before attempting to track events.
 */

// Extend the Window interface to include the umami property
declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, unknown>) => void
    }
  }
}

/**
 * Track an event with Umami analytics
 * @param eventName - The name of the event to track
 * @param eventData - Optional data to include with the event
 * @returns Promise that resolves when the event is tracked or rejects if tracking fails
 */
export function trackEvent(
  eventName: string,
  eventData?: Record<string, unknown>
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.warn(
        'Umami tracking: window is undefined (server-side rendering)'
      )
      resolve()
      return
    }

    // Check if Umami is available
    if (!window.umami) {
      console.warn('Umami tracking: umami object not found')
      resolve()
      return
    }

    try {
      // Track the event
      window.umami.track(eventName, eventData)
      console.log(`Umami event tracked: ${eventName}`, eventData)
      resolve()
    } catch (error) {
      console.error('Umami tracking error:', error)
      reject(error)
    }
  })
}

/**
 * Check if Umami analytics is available
 * @returns true if Umami is loaded and available
 */
export function isUmamiAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.umami
}

/**
 * Wait for Umami to be available before tracking an event
 * @param eventName - The name of the event to track
 * @param eventData - Optional data to include with the event
 * @param maxWaitTime - Maximum time to wait in milliseconds (default: 5000)
 * @returns Promise that resolves when the event is tracked
 */
export async function trackEventWhenReady(
  eventName: string,
  eventData?: Record<string, unknown>,
  maxWaitTime = 5000
): Promise<void> {
  const startTime = Date.now()

  while (!isUmamiAvailable() && Date.now() - startTime < maxWaitTime) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  if (isUmamiAvailable()) {
    return trackEvent(eventName, eventData)
  } else {
    console.warn(
      `Umami tracking: timeout waiting for umami to load after ${maxWaitTime}ms`
    )
  }
}

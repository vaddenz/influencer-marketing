'use client'

import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getApiUrl } from '@/lib/config'
import { useTranslations } from 'next-intl'
import Link from 'next/link'

const OAUTH_PROVIDERS = {
  // github: {
  //   name: 'GitHub',
  //   icon: (
  //     <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
  //       <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
  //     </svg>
  //   ),
  //   url: getApiUrl('auth/github')
  // },
  google: {
    name: 'Google',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
    url: getApiUrl('auth/google'),
  },
}

export function AuthButton() {
  const { user, isAuthenticated, isBrand, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const t = useTranslations('Auth')
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  function handleLogin(provider: 'google' /* | 'github' */) {
    if (typeof window === 'undefined') return

    // Store current URL for redirect after login
    sessionStorage.setItem('auth_redirect', window.location.pathname)

    // Redirect to OAuth provider
    window.location.assign(OAUTH_PROVIDERS[provider].url)
  }

  function handleLogout() {
    logout()
    setIsOpen(false)
  }

  if (isAuthenticated && user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--c-bg-secondary)] transition-colors"
          type="button">
          {user.avatar ? (
            <Image
              src={user.avatar}
              alt={user.name}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[var(--c-accent)] flex items-center justify-center text-white font-medium">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <span className="text-sm font-medium text-[var(--c-text)] hidden sm:block">
            {user.name}
          </span>
          <svg
            className={`w-4 h-4 text-[var(--c-text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-[var(--c-border)] py-1 z-50">
            <div className="px-4 py-2 border-b border-[var(--c-border-light)]">
              <p className="text-sm font-medium text-[var(--c-text)] truncate">
                {user.name}
              </p>
              <p className="text-xs text-[var(--c-text-secondary)] truncate">
                {user.email}
              </p>
            </div>
            {isBrand && (
              <Link
                href="/admin"
                className="block px-4 py-2 text-sm text-[var(--c-text)] hover:bg-[var(--c-bg-secondary)] transition-colors"
                onClick={() => setIsOpen(false)}>
                Admin Panel
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
              type="button">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              {t('logout')}
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-primary text-sm"
        type="button">
        {t('login')}
        <svg
          className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-[var(--c-border)] py-2 z-50">
          <p className="px-4 py-1 text-xs text-[var(--c-text-secondary)]">
            {t('selectMethod')}
          </p>
          <button
            onClick={() => {
              setIsOpen(false)
              router.push('/login')
            }}
            className="w-full px-4 py-2.5 text-left hover:bg-[var(--c-bg-secondary)] transition-colors flex items-center gap-3"
            type="button">
            <svg
              className="w-5 h-5 text-[var(--c-text-secondary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
            <span className="text-sm text-[var(--c-text)]">
              {t('emailPassword')}
            </span>
          </button>
          <div className="mx-4 my-1.5 border-t border-[var(--c-border-light)]" />
          {(
            Object.keys(OAUTH_PROVIDERS) as Array<keyof typeof OAUTH_PROVIDERS>
          ).map((key) => (
            <button
              key={key}
              onClick={() => handleLogin(key)}
              className="w-full px-4 py-2.5 text-left hover:bg-[var(--c-bg-secondary)] transition-colors flex items-center gap-3"
              type="button">
              {OAUTH_PROVIDERS[key].icon}
              <span className="text-sm text-[var(--c-text)]">
                {t('loginWith', { provider: OAUTH_PROVIDERS[key].name })}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

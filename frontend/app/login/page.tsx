'use client'

import { useState, FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { getApiUrl } from '@/lib/config'
import type { ApiResponse } from '@/lib/types'

interface LoginFormErrors {
  email?: string
  password?: string
  form?: string
}

interface LoginResponse {
  accessToken: string
  refreshToken: string
}

export default function LoginPage() {
  const t = useTranslations('LoginPage')
  const router = useRouter()
  const auth = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<LoginFormErrors>({})
  const [isLoading, setIsLoading] = useState(false)

  function validateForm(): boolean {
    const newErrors: LoginFormErrors = {}

    if (!email.trim()) {
      newErrors.email = t('error.invalidEmail')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('error.invalidEmail')
    }

    if (!password) {
      newErrors.password = t('error.passwordTooShort')
    } else if (password.length < 8) {
      newErrors.password = t('error.passwordTooShort')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})

    if (!validateForm()) return

    setIsLoading(true)

    try {
      const response = await fetch(getApiUrl('auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result: ApiResponse<LoginResponse> = await response.json()

      if (!response.ok || !result.success) {
        if (response.status === 401) {
          setErrors({ form: t('error.invalidCredentials') })
        } else {
          setErrors({ form: t('error.generic') })
        }
        setIsLoading(false)
        return
      }

      await auth.login(
        {
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        },
        rememberMe
      )

      router.push('/')
    } catch {
      setErrors({ form: t('error.generic') })
      setIsLoading(false)
    }
  }

  const brandName = process.env.NEXT_PUBLIC_BRAND_NAME || 'InfluencerHub'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--c-bg-secondary)] px-4 py-12">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-lg border border-[var(--c-border-light)] p-8 shadow-sm">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-[var(--c-text)]">
              {brandName}
            </h1>
          </div>

          {/* Title */}
          <h2 className="text-xl font-semibold text-[var(--c-text)] mb-6">
            {t('title')}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--c-text)] mb-1.5">
                {t('emailLabel')}
                <span className="text-[var(--c-error)] ml-0.5">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                className="input"
                disabled={isLoading}
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-[var(--c-error)]">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--c-text)] mb-1.5">
                {t('passwordLabel')}
                <span className="text-[var(--c-error)] ml-0.5">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('passwordPlaceholder')}
                  className="input pr-10"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--c-text-muted)] hover:text-[var(--c-text-secondary)] transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-[var(--c-error)]">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--c-border)] text-[var(--c-accent)] focus:ring-[var(--c-accent)] cursor-pointer"
                disabled={isLoading}
              />
              <label
                htmlFor="remember-me"
                className="ml-2 text-sm text-[var(--c-text-secondary)] cursor-pointer">
                {t('rememberMe')}
              </label>
            </div>

            {/* Form error */}
            {errors.form && (
              <p className="text-sm text-[var(--c-error)] text-center">
                {errors.form}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-base disabled:opacity-60 disabled:cursor-not-allowed">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {t('signingIn')}
                </span>
              ) : (
                t('signIn')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[var(--c-border-light)]" />
            </div>
          </div>

          {/* Links */}
          <div className="space-y-3 text-center">
            <Link
              href="/forgot-password"
              className="block text-sm text-[var(--c-accent)] hover:underline underline-offset-4">
              {t('forgotPassword')}
            </Link>
            <p className="text-sm text-[var(--c-text-secondary)]">
              {t('noAccount')}{' '}
              <Link
                href="/signup"
                className="text-[var(--c-accent)] font-medium hover:underline underline-offset-4">
                {t('createAccount')}
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[var(--c-text-muted)] mt-8">
          © 2026 {brandName}
        </p>
      </div>
    </div>
  )
}

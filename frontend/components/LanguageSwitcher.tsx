'use client'

import { useLocale } from 'next-intl'
import { useTransition, useState, useRef, useEffect } from 'react'
import { setUserLocale } from '@/lib/locale'

export default function LanguageSwitcher() {
  const [isPending, startTransition] = useTransition()
  const locale = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ja', label: '日本語' },
    { code: 'zh', label: '简体中文' },
  ]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLanguageChange(nextLocale: string) {
    if (nextLocale === locale) {
      setIsOpen(false)
      return
    }

    setIsOpen(false)
    startTransition(() => {
      setUserLocale(nextLocale).then(() => {
        // Force a hard reload to ensure all components (server & client) update
        window.location.reload()
      })
    })
  }

  const currentLanguage =
    languages.find((l) => l.code === locale)?.label || 'Language'

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 
          ${
            isOpen
              ? 'text-[var(--c-text)] bg-[var(--c-bg-secondary)]'
              : 'text-[var(--c-text-secondary)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg-secondary)]'
          }
          ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-expanded={isOpen}
        aria-haspopup="true">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{currentLanguage}</span>
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      <div
        className={`
          absolute right-0 mt-2 w-40 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-50 
          transition-all duration-200 transform
          ${
            isOpen
              ? 'opacity-100 scale-100 translate-y-0 visible'
              : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
          }
        `}>
        <div className="py-1">
          {languages.map((lang) => {
            const isSelected = locale === lang.code
            return (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={isPending}
                className={`
                  group flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors
                  ${
                    isSelected
                      ? 'text-[var(--c-accent)] bg-[var(--c-accent-light)]/10 font-medium'
                      : 'text-[var(--c-text-secondary)] hover:bg-[var(--c-bg-secondary)] hover:text-[var(--c-text)]'
                  }
                `}
                role="menuitem">
                <span>{lang.label}</span>
                {isSelected && (
                  <svg
                    className="w-4 h-4 text-[var(--c-accent)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

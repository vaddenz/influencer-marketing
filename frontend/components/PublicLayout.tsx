'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isBrandRoute = pathname?.startsWith('/admin') || pathname?.startsWith('/brand') || pathname?.startsWith('/influencer')

  return (
    <>
      {!isBrandRoute && <Navbar />}
      {children}
      {!isBrandRoute && <Footer />}
    </>
  )
}

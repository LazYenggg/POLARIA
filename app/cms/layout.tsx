'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import CmsSessionGuard from '@/components/CmsSessionGuard'

export default function CmsLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()

  if (pathname === '/cms/login') {
    return children
  }

  return <CmsSessionGuard>{children}</CmsSessionGuard>
}

'use client'

import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  usePathname,
  useRouter,
} from 'next/navigation'
import {
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function isAllowedAdminEmail(
  email: string | null | undefined
): boolean {
  if (!email) return false

  const raw =
    process.env.NEXT_PUBLIC_POLARIA_ADMIN_EMAILS ?? ''

  const allowedEmails = raw
    .split(',')
    .map((value) => normalizeEmail(value))
    .filter(Boolean)

  return allowedEmails.includes(
    normalizeEmail(email)
  )
}

export default function CmsSessionGuard({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()

  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (pathname === '/cms/login') {
      setChecking(false)
      setAuthorized(true)
      return
    }

    let active = true

    const unsubscribe =
      onAuthStateChanged(auth, async (user) => {
        if (!active) return

        setChecking(true)
        setAuthorized(false)

        if (!user) {
          router.replace('/cms/login')
          return
        }

        try {
          if (
            !isAllowedAdminEmail(user.email)
          ) {
            await signOut(auth)

            router.replace(
              '/cms/login?error=not-admin'
            )

            return
          }

          if (!active) return

          setAuthorized(true)
          setChecking(false)
        } catch (error) {
          console.error(
            '[POLARIA CMS Guard]',
            error
          )

          await signOut(auth).catch(
            () => undefined
          )

          router.replace(
            '/cms/login?error=session'
          )
        }
      })

    return () => {
      active = false
      unsubscribe()
    }
  }, [pathname, router])

  if (checking || !authorized) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          background: '#edf8e7',
          color: '#6b604b',
          fontFamily:
            "'Baloo 2', cursive",
          fontSize: '24px',
        }}
      >
        Memeriksa akses CMS…
      </div>
    )
  }

  return <>{children}</>
}
'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  clearCurrentSubmissionId,
  ensureAnonymousUser,
  getCurrentSubmissionId,
  getSubmission,
} from '@/lib/submission'

function getStudentPage(pathname: string): number | null {
  const match = pathname.match(/^\/page-(\d+)$/)

  if (!match) return null

  const value = Number(match[1])

  return Number.isInteger(value) ? value : null
}

export default function StudentRouteGuard({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)

  useEffect(() => {
    let active = true

    const pageNumber = getStudentPage(pathname)

    // Hanya pages 4–14 yang memakai session submission.
    if (pageNumber === null || pageNumber < 4 || pageNumber > 14) {
      setChecking(false)
      setAllowed(true)
      return () => {
        active = false
      }
    }

    const isRetryLink =
      pageNumber === 4 &&
      new URLSearchParams(window.location.search).has('retry')

    async function checkSession() {
      try {
        // Retry link harus dapat masuk ke Page 4 walaupun browser
        // masih memiliki submission lama.
        if (isRetryLink) {
          if (active) {
            setAllowed(true)
            setChecking(false)
          }
          return
        }

        const currentSubmissionId = getCurrentSubmissionId()

        if (!currentSubmissionId) {
          if (pageNumber === 4) {
            if (active) {
              setAllowed(true)
              setChecking(false)
            }
            return
          }

          router.replace('/page-4')
          return
        }

        await ensureAnonymousUser()
        const submission = await getSubmission(currentSubmissionId)

        if (!submission) {
          clearCurrentSubmissionId()

          if (pageNumber === 4) {
            if (active) {
              setAllowed(true)
              setChecking(false)
            }
            return
          }

          router.replace('/page-4')
          return
        }

        if (pageNumber === 4) {
          // Identitas sudah disubmit / sesi sudah dibuat.
          // Page 4 tidak boleh dibuka lagi lewat navigasi biasa.
          router.replace('/page-5')
          return
        }

        if (active) {
          setAllowed(true)
          setChecking(false)
        }
      } catch (error) {
        console.error('[POLARIA Student Route Guard]', error)
        clearCurrentSubmissionId()

        if (pageNumber === 4) {
          if (active) {
            setAllowed(true)
            setChecking(false)
          }
          return
        }

        router.replace('/page-4')
      }
    }

    void checkSession()

    return () => {
      active = false
    }
  }, [pathname, router])

  if (checking || !allowed) {
    return null
  }

  return <>{children}</>
}

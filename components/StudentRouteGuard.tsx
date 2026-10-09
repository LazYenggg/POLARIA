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
  clearCurrentSubmissionId,
  ensureAnonymousUser,
  getCurrentSubmissionId,
  getSubmission,
} from '@/lib/submission'

const CLEAN_PATH_TO_PAGE: Record<string, number> = {
  '/': 1,
  '/identitas-penyusun': 2,
  '/petunjuk-penggunaan': 3,
  '/identitas-kelompok': 4,
  '/menu': 5,
  '/tujuan-pembelajaran': 6,
  '/aritmatika-a': 7,
  '/aritmatika-b': 8,
  '/aritmatika-c': 9,
  '/geometri-a': 10,
  '/geometri-b': 11,
  '/geometri-c': 12,
  '/evaluasi': 13,
  '/rangkuman': 14,
}

function getStudentPage(pathname: string): number | null {
  const normalizedPath =
    pathname.length > 1
      ? pathname.replace(/\/+$/, '')
      : '/'

  // Dukungan URL lama jika masih digunakan.
  const legacyMatch =
    normalizedPath.match(/^\/page-(\d+)$/)

  if (legacyMatch) {
    const pageNumber = Number(legacyMatch[1])

    return Number.isInteger(pageNumber)
      ? pageNumber
      : null
  }

  // Dukungan URL baru yang lebih rapi.
  return CLEAN_PATH_TO_PAGE[normalizedPath] ?? null
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

    // Hanya halaman 4–14 yang memerlukan submission aktif.
    // Halaman CMS juga tidak diperiksa oleh guard siswa ini;
    // akses CMS tetap diperiksa oleh CmsSessionGuard.
    if (
      pageNumber === null ||
      pageNumber < 4 ||
      pageNumber > 14
    ) {
      setChecking(false)
      setAllowed(true)

      return () => {
        active = false
      }
    }

    const isRetryLink =
      pageNumber === 4 &&
      new URLSearchParams(
        window.location.search
      ).has('retry')

    async function checkSession() {
      try {
        // Link tes ulang harus bisa membuka form identitas
        // walaupun browser masih memiliki submission lama.
        if (isRetryLink) {
          if (active) {
            setAllowed(true)
            setChecking(false)
          }

          return
        }

        const submissionId =
          getCurrentSubmissionId()

        // Belum memiliki submission.
        if (!submissionId) {
          if (pageNumber === 4) {
            if (active) {
              setAllowed(true)
              setChecking(false)
            }

            return
          }

          router.replace('/identitas-kelompok')
          return
        }

        await ensureAnonymousUser()

        const submission =
          await getSubmission(submissionId)

        // Submission aktif tidak ditemukan.
        if (!submission) {
          clearCurrentSubmissionId()

          if (pageNumber === 4) {
            if (active) {
              setAllowed(true)
              setChecking(false)
            }

            return
          }

          router.replace('/identitas-kelompok')
          return
        }

        // Identitas kelompok sudah memiliki sesi.
        // Akses biasa ke form diarahkan ke menu.
        if (pageNumber === 4) {
          router.replace('/menu')
          return
        }

        if (active) {
          setAllowed(true)
          setChecking(false)
        }
      } catch (error) {
        console.error(
          '[POLARIA Student Route Guard]',
          error
        )

        clearCurrentSubmissionId()

        if (pageNumber === 4) {
          if (active) {
            setAllowed(true)
            setChecking(false)
          }

          return
        }

        router.replace('/identitas-kelompok')
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
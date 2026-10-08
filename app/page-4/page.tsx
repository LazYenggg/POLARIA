'use client'

import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import PageNavigation from '@/components/PageNavigation'
import PageFooter from '@/components/PageFooter'
import {
  createSubmission,
  ensureAnonymousUser,
  getCurrentSubmissionId,
  getSubmission,
  setCurrentSubmissionId,
  updateGroupIdentity,
} from '@/lib/submission'
import './page-4.css'

const assets = {
  background:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Background-AYVfyfZ2jrtRlPSmsDhD65flMPS5do.png',
  header:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fixed_header-R8NOtrcQNhvGZ32Db36AgdJcm2oZx2.png',
  classroom:
    'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/kids_and_teacher-4k6GLUhdp0BzqVRowUCxBPFL0ydEEk.png',
}

type GroupIdentity = {
  groupName: string
  members: string
  className: string
}

const initialIdentity: GroupIdentity = {
  groupName: '',
  members: '',
  className: '',
}


/* =========================================================
   REMOVE EDGE WHITE
   ========================================================= */

function removeEdgeWhite(src: string) {
  return new Promise<string>((resolve) => {
    const image = new Image()

    image.crossOrigin = 'anonymous'

    image.onload = () => {
      const canvas = document.createElement('canvas')

      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight

      const context = canvas.getContext('2d', {
        willReadFrequently: true,
      })

      if (!context) {
        resolve(src)
        return
      }

      context.drawImage(image, 0, 0)

      const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      )

      const { data, width, height } = pixels

      const visited = new Uint8Array(width * height)
      const queue: number[] = []

      const isEdgeWhite = (point: number) => {
        const index = point * 4

        return (
          data[index] > 242 &&
          data[index + 1] > 242 &&
          data[index + 2] > 242 &&
          data[index + 3] > 0
        )
      }

      const enqueue = (x: number, y: number) => {
        const point = y * width + x

        if (!visited[point] && isEdgeWhite(point)) {
          visited[point] = 1
          queue.push(point)
        }
      }

      for (let x = 0; x < width; x += 1) {
        enqueue(x, 0)
        enqueue(x, height - 1)
      }

      for (let y = 1; y < height - 1; y += 1) {
        enqueue(0, y)
        enqueue(width - 1, y)
      }

      for (let index = 0; index < queue.length; index += 1) {
        const point = queue[index]

        data[point * 4 + 3] = 0

        const x = point % width
        const y = Math.floor(point / width)

        if (x > 0) {
          enqueue(x - 1, y)
        }

        if (x < width - 1) {
          enqueue(x + 1, y)
        }

        if (y > 0) {
          enqueue(x, y - 1)
        }

        if (y < height - 1) {
          enqueue(x, y + 1)
        }
      }

      context.putImageData(pixels, 0, 0)

      resolve(canvas.toDataURL('image/png'))
    }

    image.onerror = () => {
      resolve(src)
    }

    image.src = src
  })
}


/* =========================================================
   PAGE FOUR
   ========================================================= */

export default function PageFour() {
  const router = useRouter()

  const [identity, setIdentity] =
    useState<GroupIdentity>(initialIdentity)

  const submittingRef = useRef(false)
  const retryProcessingRef = useRef(false)

  const [processedAssets, setProcessedAssets] =
    useState(assets)


  /* =======================================================
     LOAD SAVED FORM DATA

     localStorage tetap digunakan agar isi form tidak hilang.
     Routing guard global menangani akses ulang Page 4.
     ======================================================= */

  useEffect(() => {
    try {
      const saved =
        window.localStorage.getItem(
          'polaria-group-identity'
        )

      if (saved) {
        const parsedIdentity =
          JSON.parse(saved) as Partial<GroupIdentity>

        setIdentity({
          ...initialIdentity,
          ...parsedIdentity,
        })
      }
    } catch {
      // Abaikan data localStorage yang malformed.
    }


    /* =====================================================
       PROCESS ASSETS
       ===================================================== */

    let active = true

    Promise.all([
      removeEdgeWhite(assets.background),
      removeEdgeWhite(assets.header),
      removeEdgeWhite(assets.classroom),
    ]).then(
      ([background, header, classroom]) => {
        if (!active) return

        setProcessedAssets({
          background,
          header,
          classroom,
        })
      }
    )

    return () => {
      active = false
    }
  }, [])


  /* =======================================================
     CLAIM RETRY SESSION

     Link tes ulang dari CMS berbentuk /page-4?retry=TOKEN.
     Token ditebus oleh sesi anonymous siswa melalui API server,
     lalu submission baru dijadikan submission aktif di browser.
     ======================================================= */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const retryToken = params.get('retry')?.trim()

    if (!retryToken || retryProcessingRef.current) {
      return
    }

    retryProcessingRef.current = true

    async function redeemRetry() {
      try {
        const currentUser = await ensureAnonymousUser()
        const idToken = await currentUser.getIdToken(true)

        const response = await fetch('/api/retry/redeem', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token: retryToken }),
        })

        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          const message =
            payload && typeof payload.error === 'string'
              ? payload.error
              : 'Kode tes ulang tidak dapat digunakan.'
          throw new Error(message)
        }

        if (
          !payload ||
          typeof payload.submissionId !== 'string' ||
          typeof payload.groupName !== 'string' ||
          typeof payload.members !== 'string' ||
          typeof payload.className !== 'string'
        ) {
          throw new Error('Respons tes ulang dari server tidak valid.')
        }

        setCurrentSubmissionId(payload.submissionId)

        window.localStorage.setItem(
          'polaria-group-identity',
          JSON.stringify({
            groupName: payload.groupName,
            members: payload.members,
            className: payload.className,
          })
        )

        router.replace('/page-5')
      } catch (error) {
        console.error('[POLARIA Page 4 Retry]', error)

        window.alert(
          error instanceof Error
            ? error.message
            : 'Tes ulang tidak dapat dimulai. Silakan minta link baru dari admin.'
        )

        const cleanUrl = `${window.location.pathname}`
        window.history.replaceState({}, '', cleanUrl)
        retryProcessingRef.current = false
      }
    }

    void redeemRetry()
  }, [router])


  /* =======================================================
     UPDATE IDENTITY

     Tetap local React state + localStorage.
     Belum CMS/Firebase.
     ======================================================= */

  const updateIdentity = (
    field: keyof GroupIdentity,
    value: string
  ) => {
    setIdentity((current) => {
      const next = {
        ...current,
        [field]: value,
      }

      try {
        window.localStorage.setItem(
          'polaria-group-identity',
          JSON.stringify(next)
        )
      } catch {
        // Abaikan jika localStorage tidak tersedia.
      }

      return next
    })
  }

  /* =======================================================
     CONTINUE TO MAIN MENU

     Page 4 membuat satu submission teknis untuk kelompok.
     Jika submission sudah ada, identitas hanya diperbarui.
     ======================================================= */

  const handleContinueToMenu = async (
    event: MouseEvent<HTMLAnchorElement>
  ) => {
    event.preventDefault()

    if (submittingRef.current) {
      return
    }

    const cleanIdentity: GroupIdentity = {
      groupName: identity.groupName.trim(),
      members: identity.members.trim(),
      className: identity.className.trim(),
    }

    if (
      !cleanIdentity.groupName ||
      !cleanIdentity.members ||
      !cleanIdentity.className
    ) {
      window.alert(
        'Silakan lengkapi Nama Kelompok, Nama Anggota Kelompok, dan Kelas terlebih dahulu.'
      )
      return
    }

    submittingRef.current = true

    try {
      const currentSubmissionId = getCurrentSubmissionId()

      if (currentSubmissionId) {
        const existingSubmission =
          await getSubmission(currentSubmissionId)

        if (existingSubmission) {
          await updateGroupIdentity(
            cleanIdentity,
            currentSubmissionId
          )

          router.push('/page-5')
          return
        }
      }

      await createSubmission(cleanIdentity)
      router.push('/page-5')
    } catch (error) {
      console.error(
        '[POLARIA Page 4 Submission]',
        error
      )

      window.alert(
        'Data belum berhasil disimpan. Periksa koneksi internet lalu coba lagi.'
      )
    } finally {
      submittingRef.current = false
    }
  }



  return (
    <main className="identity-page-shell">
      <section
        className="identity-canvas"
        aria-label="Identitas kelompok"
      >

        {/* =================================================
            BACKGROUND
            ================================================= */}

        <img
          className="identity-background"
          src={processedAssets.background}
          alt=""
        />


        {/* =================================================
            CLASSROOM
            ================================================= */}

        <img
          className="identity-classroom"
          src={processedAssets.classroom}
          alt=""
          aria-hidden="true"
        />


        {/* =================================================
            HEADER
            ================================================= */}

        <img
          className="identity-header"
          src={processedAssets.header}
          alt="SMP Islam De Green Camp dan Kurikulum Merdeka"
        />


        {/* =================================================
            TITLE
            ================================================= */}

        <h1 className="identity-title">
          IDENTITAS KELOMPOK
        </h1>


        {/* =================================================
            FORM
            ================================================= */}

        <form
          className="identity-fields"
          onSubmit={(event) =>
            event.preventDefault()
          }
        >

          {/* =================================================
              NAMA KELOMPOK
              ================================================= */}

          <label
            className="identity-field identity-field-group"
          >
            <span className="identity-field-label">
              NAMA KELOMPOK
            </span>

            <span className="identity-input-shell">
              <input
                type="text"
                value={identity.groupName}
                onChange={(event) =>
                  updateIdentity(
                    'groupName',
                    event.target.value
                  )
                }
                aria-label="Nama Kelompok"
                autoComplete="off"
              />
            </span>
          </label>


          {/* =================================================
              NAMA ANGGOTA KELOMPOK
              ================================================= */}

          <label
            className="identity-field identity-field-members"
          >
            <span className="identity-field-label">
              NAMA ANGGOTA KELOMPOK
            </span>

            <span className="identity-input-shell">
              <textarea
                value={identity.members}
                onChange={(event) =>
                  updateIdentity(
                    'members',
                    event.target.value
                  )
                }
                aria-label="Nama Anggota Kelompok"
                rows={1}
              />
            </span>
          </label>


          {/* =================================================
              KELAS
              ================================================= */}

          <label
            className="identity-field identity-field-class"
          >
            <span className="identity-field-label">
              KELAS
            </span>

            <span className="identity-input-shell">
              <input
                type="text"
                value={identity.className}
                onChange={(event) =>
                  updateIdentity(
                    'className',
                    event.target.value
                  )
                }
                aria-label="Kelas"
                autoComplete="off"
              />
            </span>
          </label>

        </form>


        {/* =================================================
            NAVIGATION

            Page 4 tetap bisa:
            ← Page 3
            → Page 5
            ================================================= */}

        <PageNavigation
          variant="dual"
          backHref="/page-3"
          backLabel="Kembali ke halaman petunjuk penggunaan"
          forwardHref="/page-5"
          forwardLabel="Lanjut ke halaman berikutnya"
          className="identity-nav"
          processTransparency={true}
          onForwardClick={handleContinueToMenu}
        />

        <PageFooter />

      </section>
    </main>
  )
}
'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import PageNavigation from '@/components/PageNavigation'
import PageFooter from '@/components/PageFooter'
import {
  ensureAnonymousUser,
  getCurrentSubmissionId,
  getSubmission,
  savePage10Answers,
} from '@/lib/submission'
import './page-10.css'

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

      // Mulai dari seluruh sisi gambar.
      for (let x = 0; x < width; x += 1) {
        enqueue(x, 0)
        enqueue(x, height - 1)
      }

      for (let y = 1; y < height - 1; y += 1) {
        enqueue(0, y)
        enqueue(width - 1, y)
      }

      // Hilangkan area putih yang terhubung dengan tepi luar.
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

const assets = {
  background: '/assets/Background.png',
  header: '/assets/header.png',
  classroom: '/assets/kids_and_teacher.png',

  // Gunakan URL publik, bukan static import dari folder public.
  section: '/assets/page-10-section-artwork.png',
}

export default function PageTen() {
  const router = useRouter()

  const [submitted, setSubmitted] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [answer, setAnswer] = useState('')

  const [processedAssets, setProcessedAssets] = useState({
    background: assets.background,
    header: assets.header,
    classroom: assets.classroom,
    section: assets.section,
  })

  /*
   * Memproses asset agar tepian putih dari PNG
   * dapat dibuat transparan.
   */
  useEffect(() => {
    let active = true

    Promise.all([
      removeEdgeWhite(assets.background),
      removeEdgeWhite(assets.header),
      removeEdgeWhite(assets.classroom),
      removeEdgeWhite(assets.section),
    ]).then(([background, header, classroom, section]) => {
      if (!active) return

      setProcessedAssets({
        background,
        header,
        classroom,
        section,
      })
    })

    return () => {
      active = false
    }
  }, [])

  /*
   * Memuat jawaban Page 10 dan status submission.
   */
  useEffect(() => {
    let active = true

    async function loadSubmission() {
      try {
        await ensureAnonymousUser()

        const submissionId = getCurrentSubmissionId()

        if (!submissionId) {
          if (active) {
            setLoaded(true)
          }

          return
        }

        const submission = await getSubmission(submissionId)

        if (!active) return

        if (submission?.geometry.page10) {
          setAnswer(submission.geometry.page10.opinion)
        }

        setSubmitted(
          Boolean(submission?.geometry.status.submitted)
        )

        setLoaded(true)
      } catch (error) {
        console.error('[POLARIA Page 10 Load]', error)

        if (active) {
          setLoaded(true)
        }
      }
    }

    void loadSubmission()

    return () => {
      active = false
    }
  }, [])

  /*
   * Menyimpan jawaban sebelum menuju Page 11.
   */
  const handleForward = async (
    event: MouseEvent<HTMLAnchorElement>
  ) => {
    event.preventDefault()

    if (!loaded) return

    if (submitted) {
      router.push('/page-11')
      return
    }

    try {
      await savePage10Answers({
        opinion: answer,
      })

      router.push('/page-11')
    } catch (error) {
      console.error('[POLARIA Page 10 Save]', error)

      window.alert(
        'Jawaban belum berhasil disimpan. Periksa koneksi internet lalu coba lagi.'
      )
    }
  }

  return (
    <main className="page-shell page-ten-shell">
      <section
        className="page-ten-canvas"
        aria-label="Barisan Geometri - A. Ayo Memecahkan Masalah"
      >
        {/* BACKGROUND */}
        <img
          className="page-ten-background"
          src={processedAssets.background}
          alt=""
          aria-hidden="true"
        />

        {/* DEKORASI KELAS */}
        <img
          className="page-ten-classroom"
          src={processedAssets.classroom}
          alt=""
          aria-hidden="true"
          draggable={false}
        />

        {/* HEADER */}
        <img
          className="page-ten-header"
          src={processedAssets.header}
          alt="SMP Islam De Green Camp dan Kurikulum Merdeka"
          draggable={false}
        />

        {/* JUDUL HALAMAN */}
        <h1 className="page-ten-title">
          BARISAN GEOMETRI
        </h1>

        {/* AREA AKTIVITAS */}
        <div className="page-ten-activity">
          <img
            className="page-ten-section-artwork"
            src={processedAssets.section}
            alt="A. Ayo Memecahkan Masalah"
            draggable={false}
          />

          <textarea
            id="page-ten-answer"
            name="pageTenAnswer"
            className="page-ten-answer-input"
            value={answer}
            readOnly={submitted}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder=""
            aria-label="Tuliskan pendapatmu"
            data-cms-field="pageTen.answer"
            spellCheck
          />
        </div>

        {/* NAVIGASI */}
        <PageNavigation
          variant="forward-only"
          forwardHref="/page-11"
          forwardLabel="Lanjut ke halaman berikutnya"
          className="page-ten-nav"
          processTransparency={true}
          onForwardClick={handleForward}
        />

        <PageFooter />
      </section>
    </main>
  )
}
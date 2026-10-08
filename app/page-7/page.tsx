'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import PageNavigation from '@/components/PageNavigation'
import PageFooter from '@/components/PageFooter'
import {
  ensureAnonymousUser,
  getCurrentSubmissionId,
  getSubmission,
  savePage7Answers,
} from '@/lib/submission'
import './page-7.css'

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

const assets = {
  background: '/assets/Background.png',
  header: '/assets/header.png',
  classroom: '/assets/kids_and_teacher.png',
  section: '/assets/page-7-Asection.png',
}

export default function PageSeven() {
  const router = useRouter()

  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const [processedAssets, setProcessedAssets] = useState({
    background: assets.background,
    header: assets.header,
    classroom: assets.classroom,
    section: assets.section,
  })

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


  /* =======================================================
     LOAD SAVED PAGE 7 ANSWER
     ======================================================= */
  useEffect(() => {
    let active = true

    async function loadSubmission() {
      try {
        await ensureAnonymousUser()

        const submissionId = getCurrentSubmissionId()

        if (!submissionId) {
          setLoaded(true)
          return
        }

        const submission = await getSubmission(submissionId)

        if (!active) return

        if (submission?.arithmetic.page7) {
          setAnswer(submission.arithmetic.page7.opinion)
        }

        setSubmitted(Boolean(submission?.arithmetic.status.submitted))
        setLoaded(true)
      } catch (error) {
        console.error('[POLARIA Page 7 Load]', error)
        if (active) setLoaded(true)
      }
    }

    void loadSubmission()

    return () => {
      active = false
    }
  }, [])


  /* =======================================================
     SAVE BEFORE MOVING FORWARD
     ======================================================= */
  const handleForward = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()

    if (!loaded) return

    if (submitted) {
      router.push('/page-8')
      return
    }

    try {
      await savePage7Answers({ opinion: answer })
      router.push('/page-8')
    } catch (error) {
      console.error('[POLARIA Page 7 Save]', error)
      window.alert(
        'Jawaban belum berhasil disimpan. Periksa koneksi internet lalu coba lagi.'
      )
    }
  }

  return (
    <main className="page-shell page-seven-shell">
      <section
        className="page-seven-canvas"
        aria-label="Barisan Aritmatika - Ayo Memecahkan Masalah"
      >
        {/* Background */}
        <img
          className="page-seven-background"
          src={processedAssets.background}
          alt=""
          aria-hidden="true"
        />

        {/* Decorative classroom */}
        <img
          className="page-seven-classroom"
          src={processedAssets.classroom}
          alt=""
          aria-hidden="true"
          draggable={false}
        />

        {/* Header */}
        <img
          className="page-seven-header"
          src={processedAssets.header}
          alt="SMP Islam De Green Camp dan Kurikulum Merdeka"
          draggable={false}
        />

        {/* Title */}
        <h1 className="page-seven-title">
          BARISAN ARITMATIKA
        </h1>

        {/* =================================================
            ACTIVITY AREA

            Artwork + textarea berada dalam wrapper yang sama
            agar textarea selalu mengikuti textbox pada asset.
            ================================================= */}
        <div className="page-seven-activity">
          <img
            className="page-seven-section-artwork"
            src={processedAssets.section}
            alt="A. Ayo Memecahkan Masalah"
            draggable={false}
          />

          <textarea
            id="page-seven-answer"
            name="pageSevenAnswer"
            className="page-seven-answer-input"
            value={answer}
            readOnly={submitted}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder=""
            aria-label="Tuliskan pendapatmu"
            data-cms-field="pageSevenAnswer"
            spellCheck
          />
        </div>

        {/* Navigation */}
        <PageNavigation
          variant="forward-only"
          forwardHref="/page-8"
          forwardLabel="Lanjut ke halaman berikutnya"
          className="page-seven-nav"
          processTransparency={true}
          onForwardClick={handleForward}
        />

        <PageFooter />
      </section>
    </main>
  )
}
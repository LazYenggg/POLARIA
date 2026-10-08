'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PageFooter from '@/components/PageFooter'
import {
  ensureAnonymousUser,
  getCurrentSubmissionId,
  getSubmission,
  saveEvaluationAnswers,
} from '@/lib/submission'
import './page-13.css'

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

      // Seluruh sisi gambar menjadi titik awal flood-fill.
      for (let x = 0; x < width; x += 1) {
        enqueue(x, 0)
        enqueue(x, height - 1)
      }

      for (let y = 1; y < height - 1; y += 1) {
        enqueue(0, y)
        enqueue(width - 1, y)
      }

      // Hapus hanya area putih yang tersambung
      // ke bagian luar gambar.
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


const EVALUATION_DRAFT_KEY = 'polaria-evaluation-draft'


const assets = {
  background: '/assets/Background.png',
  header: '/assets/header.png',
  classroom: '/assets/kids_and_teacher.png',
  scrollTextbox: '/assets/scroll-textbox.png',
  downloadButton: '/assets/download-button.png',
  homeIcon: '/assets/home_icon.png',
}


export default function PageThirteen() {
  const router = useRouter()

  const [submitted, setSubmitted] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [showHomeModal, setShowHomeModal] = useState(false)
  const [submitError, setSubmitError] = useState('')

  /*
   * =========================================================
   * EVALUATION ANSWER
   * =========================================================
   *
   * React state untuk editing aktif; data final disimpan di Firestore.
   */
  const [answer, setAnswer] = useState('')


  /*
   * =========================================================
   * PROCESSED ASSETS
   * =========================================================
   */
  const [processedAssets, setProcessedAssets] = useState({
    background: assets.background,
    header: assets.header,
    classroom: assets.classroom,
    scrollTextbox: assets.scrollTextbox,
    downloadButton: assets.downloadButton,
    homeIcon: assets.homeIcon,
  })


  /*
   * =========================================================
   * REMOVE WHITE BACKGROUND
   * =========================================================
   */
  useEffect(() => {
    let active = true

    Promise.all([
      removeEdgeWhite(assets.background),
      removeEdgeWhite(assets.header),
      removeEdgeWhite(assets.classroom),
      removeEdgeWhite(assets.scrollTextbox),
      removeEdgeWhite(assets.downloadButton),
      removeEdgeWhite(assets.homeIcon),
    ]).then(
      ([
        background,
        header,
        classroom,
        scrollTextbox,
        downloadButton,
        homeIcon,
      ]) => {
        if (!active) return

        setProcessedAssets({
          background,
          header,
          classroom,
          scrollTextbox,
          downloadButton,
          homeIcon,
        })
      }
    )

    return () => {
      active = false
    }
  }, [])


  /* =======================================================
     LOAD SAVED EVALUATION + STATUS
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

        const savedExperience =
          submission?.evaluation?.page13?.experience

        if (typeof savedExperience === 'string') {
          setAnswer(savedExperience)
        } else if (typeof window !== 'undefined') {
          const localDraft = window.localStorage.getItem(
            EVALUATION_DRAFT_KEY
          )

          if (localDraft !== null) {
            setAnswer(localDraft)
          }

          if (submission?.evaluation?.status?.submitted) {
            console.warn(
              '[POLARIA Page 13] Evaluation is marked submitted, but page13 data is missing. Restoring local draft for display.'
            )
          }
        }

        setSubmitted(Boolean(submission?.evaluation?.status?.submitted))
        setLoaded(true)
      } catch (error) {
        console.error('[POLARIA Page 13 Load]', error)
        if (active) setLoaded(true)
      }
    }

    void loadSubmission()

    return () => {
      active = false
    }
  }, [])


  /*
   * =========================================================
   * DOWNLOAD SUMMARY
   * =========================================================
   */
  const downloadSummary = () => {
    const anchor = document.createElement('a')

    anchor.href = '/assets/page-14-summary.png'
    anchor.download = 'POLARIA-Rangkuman-Materi.png'
    anchor.rel = 'noopener'

    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }


  /*
   * =========================================================
   * DOWNLOAD BUTTON
   *
   * Sebelum submit: buka modal konfirmasi.
   * Setelah submitted: langsung unduh + Page 14.
   * =========================================================
   */
  const handleDownloadSummary = () => {
    if (!loaded || submitting) return

    if (submitted) {
      downloadSummary()
      window.setTimeout(() => {
        router.push('/page-14')
      }, 150)
      return
    }

    setSubmitError('')
    setShowSubmitModal(true)
  }


  /*
   * =========================================================
   * CONFIRM EVALUATION SUBMISSION
   * =========================================================
   */
  const handleConfirmSubmit = async () => {
    if (!loaded || submitting || submitted) return

    setSubmitting(true)
    setSubmitError('')

    try {
      await saveEvaluationAnswers({ experience: answer })

      const savedSubmissionId = getCurrentSubmissionId()
      const verifiedSubmission = savedSubmissionId
        ? await getSubmission(savedSubmissionId)
        : null

      const verifiedExperience =
        verifiedSubmission?.evaluation?.page13?.experience

      if (verifiedExperience !== answer) {
        throw new Error(
          '[POLARIA Page 13] Evaluation save verification failed.'
        )
      }

      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(EVALUATION_DRAFT_KEY)
      }

      setSubmitted(true)
      setShowSubmitModal(false)

      downloadSummary()

      window.setTimeout(() => {
        router.push('/page-14')
      }, 150)
    } catch (error) {
      console.error('[POLARIA Page 13 Submit]', error)

      setSubmitting(false)
      setSubmitError(
        'Evaluasi belum berhasil disimpan. Periksa koneksi internet lalu coba lagi.'
      )
    }
  }


  /*
   * =========================================================
   * HOME
   * =========================================================
   */
  const handleHome = () => {
    if (!loaded || submitting) return

    if (submitted) {
      router.push('/page-5')
      return
    }

    setShowHomeModal(true)
  }


  const handleLeaveWithoutSubmitting = () => {
    setShowHomeModal(false)
    router.push('/page-5')
  }


  return (
    <main className="page-shell page-thirteen-shell">

      <section
        className="page-thirteen-canvas"
        aria-label="Evaluasi POLARIA"
      >

        {/* =================================================
            BACKGROUND
            ================================================= */}
        <img
          className="page-thirteen-background"
          src={processedAssets.background}
          alt=""
          aria-hidden="true"
        />


        {/* =================================================
            CLASSROOM DECORATION
            ================================================= */}
        <img
          className="page-thirteen-classroom"
          src={processedAssets.classroom}
          alt=""
          aria-hidden="true"
          draggable={false}
        />


        {/* =================================================
            HEADER
            ================================================= */}
        <img
          className="page-thirteen-header"
          src={processedAssets.header}
          alt="SMP Islam De Green Camp dan Kurikulum Merdeka"
          draggable={false}
        />


        {/* =================================================
            TITLE
            ================================================= */}
        <h1 className="page-thirteen-title">
          EVALUASI
        </h1>


        {/* =================================================
            QUESTION
            ================================================= */}
        <div className="page-thirteen-question">
          Bagaimana pengalaman kalian mengikuti pembelajaran hari ini?
        </div>


        {/* =================================================
            PARCHMENT / SCROLL
            ================================================= */}
        <div className="page-thirteen-scroll-area">

          <img
            className="page-thirteen-scroll-textbox"
            src={processedAssets.scrollTextbox}
            alt=""
            aria-hidden="true"
            draggable={false}
          />


          {/* =================================================
              TEXTAREA
              ================================================= */}
          <textarea
            id="page-thirteen-answer"
            name="pageThirteenAnswer"
            value={answer}
            readOnly={submitted}
            onChange={(event) => {
              const nextValue = event.target.value
              setAnswer(nextValue)

              if (typeof window !== 'undefined') {
                window.localStorage.setItem(
                  EVALUATION_DRAFT_KEY,
                  nextValue
                )
              }
            }}
            aria-label="Tuliskan pengalaman mengikuti pembelajaran"
            data-cms-field="pageThirteen.answer"
            className="page-thirteen-answer-input"
            placeholder=""
            spellCheck
          />

        </div>


        {/* =================================================
            DOWNLOAD BUTTON
            ================================================= */}
        <button
          type="button"
          className="page-thirteen-download-button"
          onClick={handleDownloadSummary}
          aria-label="Unduh rangkuman evaluasi"
        >
          <img
            src={processedAssets.downloadButton}
            alt="Unduh Rangkuman"
            draggable={false}
          />
        </button>


        {/* =================================================
            HOME BUTTON
            =================================================
            
            Hanya satu tombol navigation:
            home_icon.png
            ================================================= */}
        <button
          type="button"
          className="page-thirteen-home-button"
          onClick={handleHome}
          aria-label="Kembali ke menu utama"
        >
          <img
            src={processedAssets.homeIcon}
            alt="Kembali ke menu utama"
            draggable={false}
          />
        </button>


        {/* =================================================
            IN-PAGE CONFIRMATION MODALS
            ================================================= */}
        {showSubmitModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="page-thirteen-submit-title"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              display: 'grid',
              placeItems: 'center',
              padding: '6%',
              background: 'rgba(14, 69, 39, 0.24)',
            }}
          >
            <div
              style={{
                width: 'min(88%, 520px)',
                padding: '7% 7% 6%',
                borderRadius: '24px',
                background: '#fffdf5',
                boxShadow: '0 18px 45px rgba(0, 0, 0, 0.18)',
                textAlign: 'center',
                border: '2px solid rgba(7, 139, 69, 0.18)',
              }}
            >
              <h2
                id="page-thirteen-submit-title"
                style={{
                  margin: 0,
                  color: '#078b45',
                  fontFamily: "'Baloo 2', cursive",
                  fontSize: 'clamp(22px, 5.2cqw, 38px)',
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                Kumpulkan Evaluasi?
              </h2>

              <p
                style={{
                  margin: '1.2em 0 1.5em',
                  color: '#5d553f',
                  fontFamily: "'Times New Roman', serif",
                  fontSize: 'clamp(13px, 2.6cqw, 20px)',
                  lineHeight: 1.45,
                }}
              >
                Setelah dikumpulkan, jawaban evaluasi tidak dapat diubah lagi.
                Rangkuman juga akan diunduh.
              </p>

              {submitError && (
                <p
                  role="alert"
                  style={{
                    margin: '-0.5em 0 1.25em',
                    color: '#a23a2a',
                    fontFamily: "'Times New Roman', serif",
                    fontSize: 'clamp(12px, 2.35cqw, 18px)',
                    lineHeight: 1.4,
                  }}
                >
                  {submitError}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '3%',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  disabled={submitting}
                  style={{
                    minWidth: '110px',
                    padding: '0.7em 1.25em',
                    border: '2px solid #078b45',
                    borderRadius: '999px',
                    background: '#fff',
                    color: '#078b45',
                    fontFamily: "'Baloo 2', cursive",
                    fontSize: 'clamp(14px, 2.6cqw, 20px)',
                    fontWeight: 700,
                    cursor: submitting ? 'default' : 'pointer',
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={() => void handleConfirmSubmit()}
                  disabled={submitting}
                  style={{
                    minWidth: '150px',
                    padding: '0.7em 1.25em',
                    border: '2px solid #078b45',
                    borderRadius: '999px',
                    background: '#078b45',
                    color: '#fff',
                    fontFamily: "'Baloo 2', cursive",
                    fontSize: 'clamp(14px, 2.6cqw, 20px)',
                    fontWeight: 700,
                    cursor: submitting ? 'default' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? 'Menyimpan...' : 'Kumpulkan & Unduh'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showHomeModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="page-thirteen-home-title"
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              display: 'grid',
              placeItems: 'center',
              padding: '6%',
              background: 'rgba(14, 69, 39, 0.24)',
            }}
          >
            <div
              style={{
                width: 'min(88%, 520px)',
                padding: '7% 7% 6%',
                borderRadius: '24px',
                background: '#fffdf5',
                boxShadow: '0 18px 45px rgba(0, 0, 0, 0.18)',
                textAlign: 'center',
                border: '2px solid rgba(7, 139, 69, 0.18)',
              }}
            >
              <h2
                id="page-thirteen-home-title"
                style={{
                  margin: 0,
                  color: '#078b45',
                  fontFamily: "'Baloo 2', cursive",
                  fontSize: 'clamp(22px, 5.2cqw, 38px)',
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                Kembali ke Menu?
              </h2>

              <p
                style={{
                  margin: '1.2em 0 1.5em',
                  color: '#5d553f',
                  fontFamily: "'Times New Roman', serif",
                  fontSize: 'clamp(13px, 2.6cqw, 20px)',
                  lineHeight: 1.45,
                }}
              >
                Jawaban evaluasi belum dikumpulkan. Jika kembali sekarang,
                evaluasi belum dianggap selesai.
              </p>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '3%',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowHomeModal(false)}
                  style={{
                    minWidth: '110px',
                    padding: '0.7em 1.25em',
                    border: '2px solid #078b45',
                    borderRadius: '999px',
                    background: '#fff',
                    color: '#078b45',
                    fontFamily: "'Baloo 2', cursive",
                    fontSize: 'clamp(14px, 2.6cqw, 20px)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Tetap di Sini
                </button>

                <button
                  type="button"
                  onClick={handleLeaveWithoutSubmitting}
                  style={{
                    minWidth: '150px',
                    padding: '0.7em 1.25em',
                    border: '2px solid #078b45',
                    borderRadius: '999px',
                    background: '#078b45',
                    color: '#fff',
                    fontFamily: "'Baloo 2', cursive",
                    fontSize: 'clamp(14px, 2.6cqw, 20px)',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Kembali ke Menu
                </button>
              </div>
            </div>
          </div>
        )}

        <PageFooter />

      </section>

    </main>
  )
}
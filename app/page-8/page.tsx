'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import PageNavigation from '@/components/PageNavigation'
import PageFooter from '@/components/PageFooter'
import {
  ensureAnonymousUser,
  getCurrentSubmissionId,
  getSubmission,
  savePage8Answers,
} from '@/lib/submission'
import type { Page8Answers } from '@/lib/types'
import './page-8.css'

type TableRow = {
  stage: number
  seedCount: string
  difference: string
}

type DifferenceChoice = '' | 'yes' | 'no'

/**
 * Hanya mempertahankan karakter angka 0-9.
 *
 * Contoh:
 * "123"      -> "123"
 * "12abc34"  -> "1234"
 * "10.5"     -> "105"
 * "1e20"     -> "120"
 * "-25"      -> "25"
 */
const sanitizeInteger = (value: string) => {
  return value.replace(/\D/g, '')
}


/**
 * Menghapus background putih yang terhubung dengan
 * tepi gambar, tetapi mempertahankan area putih
 * yang benar-benar merupakan bagian dari artwork.
 *
 * Digunakan untuk asset Page 8 dengan logika yang
 * sama seperti Page 7.
 */
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

      // Mulai dari seluruh sisi gambar
      for (let x = 0; x < width; x += 1) {
        enqueue(x, 0)
        enqueue(x, height - 1)
      }

      for (let y = 1; y < height - 1; y += 1) {
        enqueue(0, y)
        enqueue(width - 1, y)
      }

      // Flood-fill seluruh area putih yang terhubung
      // dengan bagian luar gambar.
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
  section: '/assets/page-8-Bsection.png',
}


const createInitialTable = (): TableRow[] =>
  Array.from({ length: 8 }, (_, index) => ({
    stage: index + 1,
    seedCount: '',
    difference: index === 0 ? '-' : '',
  }))


export default function PageEight() {
  const router = useRouter()

  const [submitted, setSubmitted] = useState(false)
  const [loaded, setLoaded] = useState(false)

  /*
   * =========================================================
   * TABLE STATE
   * =========================================================
   */
  const [tableRows, setTableRows] =
    useState<TableRow[]>(createInitialTable)


  /*
   * =========================================================
   * QUESTION 1
   * =========================================================
   *
   * Berapa banyak bibit pada tahap ke-8?
   */
  const [stageEightSeedCount, setStageEightSeedCount] =
    useState('')


  /*
   * =========================================================
   * QUESTION 2
   * =========================================================
   *
   * Apakah perubahannya selalu sama?
   */
  const [sameDifference, setSameDifference] =
    useState<DifferenceChoice>('')


  /*
   * =========================================================
   * QUESTION 3
   * =========================================================
   *
   * Jika iya, berapa nilainya?
   */
  const [differenceValue, setDifferenceValue] =
    useState('')


  /*
   * =========================================================
   * PROCESSED ASSETS
   * =========================================================
   */
  const [processedAssets, setProcessedAssets] = useState({
    background: assets.background,
    header: assets.header,
    classroom: assets.classroom,
    section: assets.section,
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
   * =========================================================
   * TABLE UPDATE
   * =========================================================
   */
  const updateTableValue = (
    stage: number,
    field: 'seedCount' | 'difference',
    value: string
  ) => {
    const sanitizedValue = sanitizeInteger(value)

    setTableRows((currentRows) =>
      currentRows.map((row) => {
        if (row.stage !== stage) {
          return row
        }

        return {
          ...row,
          [field]: sanitizedValue,
        }
      })
    )
  }


  /*
   * =========================================================
   * YES / NO
   * =========================================================
   *
   * Hanya satu pilihan yang bisa aktif.
   * Klik pilihan yang sama lagi = batal.
   */
  const handleDifferenceChoice = (
    choice: Exclude<DifferenceChoice, ''>
  ) => {
    setSameDifference((currentChoice) =>
      currentChoice === choice ? '' : choice
    )
  }


  const toNumericAnswer = (value: string): number | null => {
    if (!value.trim()) return null
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : null
  }

  const fromNumericAnswer = (value: number | null): string =>
    value === null ? '' : String(value)

  const buildAnswers = (): Page8Answers => ({
    table: tableRows.map((row) => ({
      stage: row.stage,
      seedCount: toNumericAnswer(row.seedCount),
      difference: row.stage === 1
        ? null
        : toNumericAnswer(row.difference),
    })),
    stageEightSeedCount: toNumericAnswer(stageEightSeedCount),
    sameDifference:
      sameDifference === ''
        ? null
        : sameDifference === 'yes',
    differenceValue: toNumericAnswer(differenceValue),
  })


  /* =======================================================
     LOAD SAVED PAGE 8 ANSWERS + SECTION STATUS
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

        const saved = submission?.arithmetic.page8

        if (saved) {
          setTableRows(
            saved.table.map((row) => ({
              stage: row.stage,
              seedCount: fromNumericAnswer(row.seedCount),
              difference:
                row.stage === 1
                  ? '-'
                  : fromNumericAnswer(row.difference),
            }))
          )

          setStageEightSeedCount(
            fromNumericAnswer(saved.stageEightSeedCount)
          )

          setSameDifference(
            saved.sameDifference === null
              ? ''
              : saved.sameDifference
                ? 'yes'
                : 'no'
          )

          setDifferenceValue(
            fromNumericAnswer(saved.differenceValue)
          )
        }

        setSubmitted(Boolean(submission?.arithmetic.status.submitted))
        setLoaded(true)
      } catch (error) {
        console.error('[POLARIA Page 8 Load]', error)
        if (active) setLoaded(true)
      }
    }

    void loadSubmission()

    return () => {
      active = false
    }
  }, [])


  const navigateTo = async (
    event: MouseEvent<HTMLAnchorElement>,
    href: '/page-7' | '/page-9'
  ) => {
    event.preventDefault()

    if (!loaded) return

    if (submitted) {
      router.push(href)
      return
    }

    try {
      await savePage8Answers(buildAnswers())
      router.push(href)
    } catch (error) {
      console.error('[POLARIA Page 8 Save]', error)
      window.alert(
        'Jawaban belum berhasil disimpan. Periksa koneksi internet lalu coba lagi.'
      )
    }
  }


  const handleBack = (event: MouseEvent<HTMLAnchorElement>) =>
    navigateTo(event, '/page-7')

  const handleForward = (event: MouseEvent<HTMLAnchorElement>) =>
    navigateTo(event, '/page-9')


  return (
    <main className="page-shell page-eight-shell">
      <section
        className="page-eight-canvas"
        aria-label="Barisan Aritmatika - B. Mengamati Masalah"
      >

        {/* =================================================
            BACKGROUND
            ================================================= */}
        <img
          className="page-eight-background"
          src={processedAssets.background}
          alt=""
          aria-hidden="true"
        />


        {/* =================================================
            CLASSROOM DECORATION
            ================================================= */}
        <img
          className="page-eight-classroom"
          src={processedAssets.classroom}
          alt=""
          aria-hidden="true"
          draggable={false}
        />


        {/* =================================================
            HEADER
            ================================================= */}
        <img
          className="page-eight-header"
          src={processedAssets.header}
          alt="SMP Islam De Green Camp dan Kurikulum Merdeka"
          draggable={false}
        />


        {/* =================================================
            PAGE TITLE
            ================================================= */}
        <h1 className="page-eight-title">
          BARISAN ARITMATIKA
        </h1>


        {/* =================================================
            ACTIVITY AREA
            ================================================= */}
        <div className="page-eight-activity">

          {/* =================================================
              B. MENGAMATI MASALAH ARTWORK
              ================================================= */}
          <img
            className="page-eight-section-artwork"
            src={processedAssets.section}
            alt="B. Mengamati Masalah"
            draggable={false}
          />


          {/* =================================================
              TABLE
              ================================================= */}
          <div className="page-eight-table-wrapper">
            <table className="page-eight-table">
              <thead>
                <tr>
                  <th>Tahap ke-(n)</th>
                  <th>Banyak bibit (Un)</th>
                  <th>Selisih</th>
                </tr>
              </thead>

              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.stage}>

                    {/* Tahap */}
                    <td>
                      <span className="page-eight-fixed-value">
                        {row.stage}
                      </span>
                    </td>


                    {/* Banyak bibit */}
                    <td>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={row.seedCount}
                        readOnly={submitted}
                        onChange={(event) =>
                          updateTableValue(
                            row.stage,
                            'seedCount',
                            event.target.value
                          )
                        }
                        aria-label={`Banyak bibit tahap ${row.stage}`}
                        name={`pageEightTableStage${row.stage}SeedCount`}
                        data-cms-field={`pageEight.table.stage${row.stage}.seedCount`}
                        className="page-eight-table-input"
                        placeholder="..."
                        autoComplete="off"
                      />
                    </td>


                    {/* Selisih */}
                    <td>
                      {row.stage === 1 ? (
                        <span className="page-eight-fixed-value">
                          -
                        </span>
                      ) : (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={row.difference}
                          readOnly={submitted}
                          onChange={(event) =>
                            updateTableValue(
                              row.stage,
                              'difference',
                              event.target.value
                            )
                          }
                          aria-label={`Selisih tahap ${row.stage}`}
                          name={`pageEightTableStage${row.stage}Difference`}
                          data-cms-field={`pageEight.table.stage${row.stage}.difference`}
                          className="page-eight-table-input"
                          placeholder="..."
                          autoComplete="off"
                        />
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>


          {/* =================================================
              QUESTION 1
              Berapa banyak bibit pada tahap ke-8?
              ================================================= */}
          <input
            type="text"
            inputMode="numeric"
            value={stageEightSeedCount}
            readOnly={submitted}
            onChange={(event) =>
              setStageEightSeedCount(
                sanitizeInteger(event.target.value)
              )
            }
            aria-label="Banyak bibit pada tahap ke-8"
            name="pageEightStageEightSeedCount"
            data-cms-field="pageEight.stageEightSeedCount"
            className={`page-eight-short-input page-eight-stage-eight-input ${
              stageEightSeedCount ? 'has-value' : ''
            }`}
            autoComplete="off"
          />


          {/* =================================================
              IYA
              ================================================= */}
          <label className="page-eight-choice page-eight-choice-yes">
            <input
              type="checkbox"
              checked={sameDifference === 'yes'}
              disabled={submitted}
              onChange={() =>
                handleDifferenceChoice('yes')
              }
              aria-label="Perubahannya selalu sama - Iya"
            />

            <span
              className="page-eight-choice-check"
              aria-hidden="true"
            >
              {sameDifference === 'yes' ? '✓' : ''}
            </span>
          </label>


          {/* =================================================
              TIDAK
              ================================================= */}
          <label className="page-eight-choice page-eight-choice-no">
            <input
              type="checkbox"
              checked={sameDifference === 'no'}
              disabled={submitted}
              onChange={() =>
                handleDifferenceChoice('no')
              }
              aria-label="Perubahannya selalu sama - Tidak"
            />

            <span
              className="page-eight-choice-check"
              aria-hidden="true"
            >
              {sameDifference === 'no' ? '✓' : ''}
            </span>
          </label>


          {/* =================================================
              FINAL DIFFERENCE VALUE
              ================================================= */}
          <input
            type="text"
            inputMode="numeric"
            value={differenceValue}
            readOnly={submitted}
            onChange={(event) =>
              setDifferenceValue(
                sanitizeInteger(event.target.value)
              )
            }
            aria-label="Nilai perubahan"
            name="pageEightDifferenceValue"
            data-cms-field="pageEight.differenceValue"
            className={`page-eight-short-input page-eight-difference-input ${
              differenceValue ? 'has-value' : ''
            }`}
            autoComplete="off"
          />

        </div>


        {/* =================================================
            NAVIGATION
            ================================================= */}
        <PageNavigation
          variant="dual"
          backHref="/page-7"
          backLabel="Kembali ke halaman sebelumnya"
          forwardHref="/page-9"
          forwardLabel="Lanjut ke halaman berikutnya"
          className="page-eight-nav"
          processTransparency={true}
          onBackClick={handleBack}
          onForwardClick={handleForward}
        />

        <PageFooter />

      </section>
    </main>
  )
}
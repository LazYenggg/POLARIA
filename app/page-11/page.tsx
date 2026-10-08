'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import PageNavigation from '@/components/PageNavigation'
import PageFooter from '@/components/PageFooter'
import {
  ensureAnonymousUser,
  getCurrentSubmissionId,
  getSubmission,
  savePage11Answers,
} from '@/lib/submission'
import type { Page11Answers } from '@/lib/types'
import './page-11.css'

type TableRow = {
  week: number
  seedCount: string
  ratio: string
}

type RatioChoice = '' | 'yes' | 'no'

/**
 * Hanya mempertahankan angka 0-9.
 *
 * Contoh:
 * "123"      -> "123"
 * "12abc34"  -> "1234"
 * "10.5"     -> "105"
 * "-20"      -> "20"
 */
const sanitizeInteger = (value: string) => {
  return value.replace(/\D/g, '')
}


/**
 * Menghapus background putih yang terhubung
 * dengan tepi gambar.
 *
 * Logika sama seperti Page 7, 8, dan 9.
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

      // Mulai dari seluruh sisi gambar.
      for (let x = 0; x < width; x += 1) {
        enqueue(x, 0)
        enqueue(x, height - 1)
      }

      for (let y = 1; y < height - 1; y += 1) {
        enqueue(0, y)
        enqueue(width - 1, y)
      }

      // Flood-fill area putih yang tersambung
      // dengan sisi luar gambar.
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
  section: '/assets/page-11-Bsection.png',
}


/**
 * Membuat tabel awal:
 *
 * Minggu 1–8
 *
 * Rasio minggu pertama = "-"
 * karena belum ada perbandingan dengan minggu sebelumnya.
 */
const createInitialTable = (): TableRow[] =>
  Array.from({ length: 8 }, (_, index) => ({
    week: index + 1,
    seedCount: '',
    ratio: index === 0 ? '-' : '',
  }))


export default function PageEleven() {
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
   *
   * Berapa banyak bibit pada minggu ke-8?
   * =========================================================
   */
  const [weekEightSeedCount, setWeekEightSeedCount] =
    useState('')


  /*
   * =========================================================
   * QUESTION 2
   *
   * Apakah perubahannya selalu sama?
   * =========================================================
   */
  const [sameRatio, setSameRatio] =
    useState<RatioChoice>('')


  /*
   * =========================================================
   * QUESTION 3
   *
   * Jika iya, berapa nilainya?
   * =========================================================
   */
  const [ratioValue, setRatioValue] =
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
    week: number,
    field: 'seedCount' | 'ratio',
    value: string
  ) => {
    const sanitizedValue = sanitizeInteger(value)

    setTableRows((currentRows) =>
      currentRows.map((row) => {
        if (row.week !== week) {
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
   *
   * Mutually exclusive.
   * Klik pilihan yang sama lagi = batal.
   * =========================================================
   */
  const handleRatioChoice = (
    choice: Exclude<RatioChoice, ''>
  ) => {
    setSameRatio((currentChoice) =>
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

  const buildAnswers = (): Page11Answers => ({
    table: tableRows.map((row) => ({
      week: row.week,
      seedCount: toNumericAnswer(row.seedCount),
      ratio: row.week === 1 ? null : toNumericAnswer(row.ratio),
    })),
    weekEightSeedCount: toNumericAnswer(weekEightSeedCount),
    sameRatio:
      sameRatio === ''
        ? null
        : sameRatio === 'yes',
    ratioValue: toNumericAnswer(ratioValue),
  })


  /* =======================================================
     LOAD SAVED PAGE 11 ANSWERS + SECTION STATUS
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

        const saved = submission?.geometry.page11

        if (saved) {
          setTableRows(
            saved.table.map((row) => ({
              week: row.week,
              seedCount: fromNumericAnswer(row.seedCount),
              ratio:
                row.week === 1
                  ? '-'
                  : fromNumericAnswer(row.ratio),
            }))
          )

          setWeekEightSeedCount(
            fromNumericAnswer(saved.weekEightSeedCount)
          )

          setSameRatio(
            saved.sameRatio === null
              ? ''
              : saved.sameRatio
                ? 'yes'
                : 'no'
          )

          setRatioValue(
            fromNumericAnswer(saved.ratioValue)
          )
        }

        setSubmitted(Boolean(submission?.geometry.status.submitted))
        setLoaded(true)
      } catch (error) {
        console.error('[POLARIA Page 11 Load]', error)
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
    href: '/page-10' | '/page-12'
  ) => {
    event.preventDefault()

    if (!loaded) return

    if (submitted) {
      router.push(href)
      return
    }

    try {
      await savePage11Answers(buildAnswers())
      router.push(href)
    } catch (error) {
      console.error('[POLARIA Page 11 Save]', error)
      window.alert(
        'Jawaban belum berhasil disimpan. Periksa koneksi internet lalu coba lagi.'
      )
    }
  }


  const handleBack = (event: MouseEvent<HTMLAnchorElement>) =>
    navigateTo(event, '/page-10')

  const handleForward = (event: MouseEvent<HTMLAnchorElement>) =>
    navigateTo(event, '/page-12')


  return (
    <main className="page-shell page-eleven-shell">
      <section
        className="page-eleven-canvas"
        aria-label="Barisan Geometri - B. Mengamati Masalah"
      >

        {/* =================================================
            BACKGROUND
            ================================================= */}
        <img
          className="page-eleven-background"
          src={processedAssets.background}
          alt=""
          aria-hidden="true"
        />


        {/* =================================================
            CLASSROOM DECORATION
            ================================================= */}
        <img
          className="page-eleven-classroom"
          src={processedAssets.classroom}
          alt=""
          aria-hidden="true"
          draggable={false}
        />


        {/* =================================================
            HEADER
            ================================================= */}
        <img
          className="page-eleven-header"
          src={processedAssets.header}
          alt="SMP Islam De Green Camp dan Kurikulum Merdeka"
          draggable={false}
        />


        {/* =================================================
            PAGE TITLE
            ================================================= */}
        <h1 className="page-eleven-title">
          BARISAN GEOMETRI
        </h1>


        {/* =================================================
            ACTIVITY AREA
            ================================================= */}
        <div className="page-eleven-activity">

          {/* =================================================
              B. MENGAMATI MASALAH ARTWORK
              ================================================= */}
          <img
            className="page-eleven-section-artwork"
            src={processedAssets.section}
            alt="B. Mengamati Masalah"
            draggable={false}
          />


          {/* =================================================
              TABLE
              ================================================= */}
          <div className="page-eleven-table-wrapper">

            <table className="page-eleven-table">

              <thead>
                <tr>
                  <th>
                    Minggu ke-(n)
                  </th>

                  <th>
                    Banyak bibit (Un)
                  </th>

                  <th>
                    Rasio (r)
                  </th>
                </tr>
              </thead>


              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.week}>

                    {/* Minggu */}
                    <td>
                      <span className="page-eleven-fixed-value">
                        {row.week}
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
                            row.week,
                            'seedCount',
                            event.target.value
                          )
                        }
                        aria-label={`Banyak bibit minggu ${row.week}`}
                        name={`pageElevenTableWeek${row.week}SeedCount`}
                        data-cms-field={`pageEleven.table.week${row.week}.seedCount`}
                        className="page-eleven-table-input"
                        placeholder="..."
                        autoComplete="off"
                      />
                    </td>


                    {/* Rasio */}
                    <td>
                      {row.week === 1 ? (
                        <span className="page-eleven-fixed-value">
                          -
                        </span>
                      ) : (
                        <input
                          type="text"
                          inputMode="numeric"
                          value={row.ratio}
                          readOnly={submitted}
                          onChange={(event) =>
                            updateTableValue(
                              row.week,
                              'ratio',
                              event.target.value
                            )
                          }
                          aria-label={`Rasio minggu ${row.week}`}
                          name={`pageElevenTableWeek${row.week}Ratio`}
                          data-cms-field={`pageEleven.table.week${row.week}.ratio`}
                          className="page-eleven-table-input"
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
              Berapa banyak bibit pada minggu ke-8?
              ================================================= */}
          <input
            type="text"
            inputMode="numeric"
            value={weekEightSeedCount}
            readOnly={submitted}
            onChange={(event) =>
              setWeekEightSeedCount(
                sanitizeInteger(event.target.value)
              )
            }
            aria-label="Banyak bibit pada minggu ke-8"
            name="pageElevenWeekEightSeedCount"
            data-cms-field="pageEleven.weekEightSeedCount"
            className={`page-eleven-short-input page-eleven-week-eight-input ${
              weekEightSeedCount ? 'has-value' : ''
            }`}
            autoComplete="off"
          />


          {/* =================================================
              IYA
              ================================================= */}
          <label className="page-eleven-choice page-eleven-choice-yes">

            <input
              type="checkbox"
              checked={sameRatio === 'yes'}
              disabled={submitted}
              onChange={() =>
                handleRatioChoice('yes')
              }
              aria-label="Perubahannya selalu sama - Iya"
            />

            <span
              className="page-eleven-choice-check"
              aria-hidden="true"
            >
              {sameRatio === 'yes' ? '✓' : ''}
            </span>

          </label>


          {/* =================================================
              TIDAK
              ================================================= */}
          <label className="page-eleven-choice page-eleven-choice-no">

            <input
              type="checkbox"
              checked={sameRatio === 'no'}
              disabled={submitted}
              onChange={() =>
                handleRatioChoice('no')
              }
              aria-label="Perubahannya selalu sama - Tidak"
            />

            <span
              className="page-eleven-choice-check"
              aria-hidden="true"
            >
              {sameRatio === 'no' ? '✓' : ''}
            </span>

          </label>


          {/* =================================================
              FINAL RATIO VALUE
              ================================================= */}
          <input
            type="text"
            inputMode="numeric"
            value={ratioValue}
            readOnly={submitted}
            onChange={(event) =>
              setRatioValue(
                sanitizeInteger(event.target.value)
              )
            }
            aria-label="Nilai rasio"
            name="pageElevenRatioValue"
            data-cms-field="pageEleven.ratioValue"
            className={`page-eleven-short-input page-eleven-ratio-input ${
              ratioValue ? 'has-value' : ''
            }`}
            autoComplete="off"
          />

        </div>


        {/* =================================================
            NAVIGATION

            ← Page 10
            Home → Page 5
            → Page 12
            ================================================= */}
        <PageNavigation
          variant="dual"
          backHref="/page-10"
          backLabel="Kembali ke halaman sebelumnya"
          forwardHref="/page-12"
          forwardLabel="Lanjut ke halaman berikutnya"
          className="page-eleven-nav"
          processTransparency={true}
          onBackClick={handleBack}
          onForwardClick={handleForward}
        />

        <PageFooter />

      </section>
    </main>
  )
}
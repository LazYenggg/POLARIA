'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import PageNavigation from '@/components/PageNavigation'
import PageFooter from '@/components/PageFooter'
import {
  ensureAnonymousUser,
  getCurrentSubmissionId,
  getSubmission,
  savePage12Answers,
  submitGeometry,
} from '@/lib/submission'
import type { Page12Answers } from '@/lib/types'
import './page-12.css'

type SequenceAnswers = {
  u3: string[]
  u4: string[]
  u5Value: string
  u5: string[]
  u6Value: string
  u6: string[]
  u7Value: string
  u7: string[]
  u8Value: string
  u8: string[]
}

type RightFormulaAnswers = {
  u3: string
  u4: string
  u5: string
  u6: string
  u7: string
  u8: string
}

type MeaningAnswers = {
  a: string
  r: string
  n: string
}

type GeneralFormulaAnswers = {
  first: string
  ratio: string
}


/* =========================================================
   INTEGER SANITIZER

   Untuk field matematika yang memang berupa angka.
   Hanya 0-9 yang diterima.
   ========================================================= */

const sanitizeInteger = (value: string) => {
  return value.replace(/\D/g, '')
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

      // Start dari seluruh sisi gambar.
      for (let x = 0; x < width; x += 1) {
        enqueue(x, 0)
        enqueue(x, height - 1)
      }

      for (let y = 1; y < height - 1; y += 1) {
        enqueue(0, y)
        enqueue(width - 1, y)
      }

      // Flood-fill area putih yang terhubung
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


/* =========================================================
   ASSETS
   ========================================================= */

const assets = {
  background: '/assets/Background.png',
  header: '/assets/header.png',
  classroom: '/assets/kids_and_teacher.png',
  section: '/assets/page-12-Csection.png',
}


export default function PageTwelve() {
  const router = useRouter()

  const [submitted, setSubmitted] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [submitError, setSubmitError] = useState('')

  /* =======================================================
     LEFT FORMULA
     ======================================================= */

  const [sequenceAnswers, setSequenceAnswers] =
    useState<SequenceAnswers>({
      u3: [''],

      u4: ['', ''],

      u5Value: '',
      u5: ['', '', ''],

      u6Value: '',
      u6: ['', '', '', ''],

      u7Value: '',
      u7: ['', '', '', '', ''],

      u8Value: '',
      u8: ['', '', '', '', '', ''],
    })


  /* =======================================================
     RIGHT L-SHAPE FORMULA

     u2 = 2 · 2¹     → fixed
     u3 = 2 · 2(...)  → input
     u4 = 2 · 2(...)
     ...
     u8 = 2 · 2(...)
     ======================================================= */

  const [rightFormulaAnswers, setRightFormulaAnswers] =
    useState<RightFormulaAnswers>({
      u3: '',
      u4: '',
      u5: '',
      u6: '',
      u7: '',
      u8: '',
    })


  /* =======================================================
     TEXTBOX
     
     a
     r
     n
     ======================================================= */

  const [meaningAnswers, setMeaningAnswers] =
    useState<MeaningAnswers>({
      a: '',
      r: '',
      n: '',
    })


  /* =======================================================
     GENERAL FORMULA

     uₙ = ... · ...^(n−1)
     ======================================================= */

  const [generalFormulaAnswers, setGeneralFormulaAnswers] =
    useState<GeneralFormulaAnswers>({
      first: '',
      ratio: '',
    })


  /* =======================================================
     PROCESSED ASSETS
     ======================================================= */

  const [processedAssets, setProcessedAssets] = useState({
    background: assets.background,
    header: assets.header,
    classroom: assets.classroom,
    section: assets.section,
  })


  /* =======================================================
     REMOVE WHITE BACKGROUND
     ======================================================= */

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
     LEFT FORMULA ARRAY UPDATE
     ======================================================= */

  const updateSequenceArray = (
    field:
      | 'u3'
      | 'u4'
      | 'u5'
      | 'u6'
      | 'u7'
      | 'u8',
    index: number,
    value: string
  ) => {
    setSequenceAnswers((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) =>
        itemIndex === index
          ? sanitizeInteger(value)
          : item
      ),
    }))
  }


  /* =======================================================
     LEFT VALUE UPDATE

     Nilai u5-u8.
     ======================================================= */

  const updateSequenceValue = (
    field:
      | 'u5Value'
      | 'u6Value'
      | 'u7Value'
      | 'u8Value',
    value: string
  ) => {
    setSequenceAnswers((current) => ({
      ...current,
      [field]: sanitizeInteger(value),
    }))
  }


  /* =======================================================
     RIGHT FORMULA UPDATE
     ======================================================= */

  const updateRightFormula = (
    field: keyof RightFormulaAnswers,
    value: string
  ) => {
    setRightFormulaAnswers((current) => ({
      ...current,
      [field]: sanitizeInteger(value),
    }))
  }


  /* =======================================================
     TEXTBOX UPDATE
     ======================================================= */

  const updateMeaning = (
    field: keyof MeaningAnswers,
    value: string
  ) => {
    setMeaningAnswers((current) => ({
      ...current,
      [field]: value,
    }))
  }


  /* =======================================================
     GENERAL FORMULA UPDATE
     ======================================================= */

  const updateGeneralFormula = (
    field: keyof GeneralFormulaAnswers,
    value: string
  ) => {
    setGeneralFormulaAnswers((current) => ({
      ...current,
      [field]: sanitizeInteger(value),
    }))
  }


  const toNumericAnswer = (value: string): number | null => {
    if (!value.trim()) return null
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue : null
  }

  const fromNumericAnswer = (value: number | null): string =>
    value === null ? '' : String(value)

  const numericArray = (values: string[]) =>
    values.map(toNumericAnswer)

  const stringArray = (values: Array<number | null>) =>
    values.map(fromNumericAnswer)

  const buildAnswers = (): Page12Answers => ({
    sequence: {
      u3: numericArray(sequenceAnswers.u3),
      u4: numericArray(sequenceAnswers.u4),
      u5Value: toNumericAnswer(sequenceAnswers.u5Value),
      u5: numericArray(sequenceAnswers.u5),
      u6Value: toNumericAnswer(sequenceAnswers.u6Value),
      u6: numericArray(sequenceAnswers.u6),
      u7Value: toNumericAnswer(sequenceAnswers.u7Value),
      u7: numericArray(sequenceAnswers.u7),
      u8Value: toNumericAnswer(sequenceAnswers.u8Value),
      u8: numericArray(sequenceAnswers.u8),
    },
    rightFormula: {
      u3: toNumericAnswer(rightFormulaAnswers.u3),
      u4: toNumericAnswer(rightFormulaAnswers.u4),
      u5: toNumericAnswer(rightFormulaAnswers.u5),
      u6: toNumericAnswer(rightFormulaAnswers.u6),
      u7: toNumericAnswer(rightFormulaAnswers.u7),
      u8: toNumericAnswer(rightFormulaAnswers.u8),
    },
    meaning: meaningAnswers,
    generalFormula: {
      first: toNumericAnswer(generalFormulaAnswers.first),
      ratio: toNumericAnswer(generalFormulaAnswers.ratio),
    },
  })


  /* =======================================================
     LOAD SAVED PAGE 12 ANSWERS + SECTION STATUS
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

        const saved = submission?.geometry.page12

        if (saved) {
          setSequenceAnswers({
            u3: stringArray(saved.sequence.u3),
            u4: stringArray(saved.sequence.u4),
            u5Value: fromNumericAnswer(saved.sequence.u5Value),
            u5: stringArray(saved.sequence.u5),
            u6Value: fromNumericAnswer(saved.sequence.u6Value),
            u6: stringArray(saved.sequence.u6),
            u7Value: fromNumericAnswer(saved.sequence.u7Value),
            u7: stringArray(saved.sequence.u7),
            u8Value: fromNumericAnswer(saved.sequence.u8Value),
            u8: stringArray(saved.sequence.u8),
          })

          setRightFormulaAnswers({
            u3: fromNumericAnswer(saved.rightFormula.u3),
            u4: fromNumericAnswer(saved.rightFormula.u4),
            u5: fromNumericAnswer(saved.rightFormula.u5),
            u6: fromNumericAnswer(saved.rightFormula.u6),
            u7: fromNumericAnswer(saved.rightFormula.u7),
            u8: fromNumericAnswer(saved.rightFormula.u8),
          })

          setMeaningAnswers(saved.meaning)

          setGeneralFormulaAnswers({
            first: fromNumericAnswer(saved.generalFormula.first),
            ratio: fromNumericAnswer(saved.generalFormula.ratio),
          })
        }

        setSubmitted(Boolean(submission?.geometry.status.submitted))
        setLoaded(true)
      } catch (error) {
        console.error('[POLARIA Page 12 Load]', error)
        if (active) setLoaded(true)
      }
    }

    void loadSubmission()

    return () => {
      active = false
    }
  }, [])


  /* =======================================================
     SAVE DRAFT BEFORE BACK
     ======================================================= */
  const handleBack = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()

    if (!loaded) return

    if (submitted) {
      router.push('/page-11')
      return
    }

    try {
      await savePage12Answers(buildAnswers())
      router.push('/page-11')
    } catch (error) {
      console.error('[POLARIA Page 12 Save]', error)
      window.alert(
        'Jawaban belum berhasil disimpan. Periksa koneksi internet lalu coba lagi.'
      )
    }
  }


  /* =======================================================
     SUBMIT GEOMETRY SECTION
     ======================================================= */
  const handleSubmitToMenu = (
    event: MouseEvent<HTMLAnchorElement>
  ) => {
    event.preventDefault()

    if (!loaded || submitting) return

    if (submitted) {
      router.push('/page-5')
      return
    }

    setSubmitError('')
    setShowSubmitModal(true)
  }


  const handleConfirmSubmit = async () => {
    if (!loaded || submitting || submitted) return

    setSubmitting(true)
    setSubmitError('')

    try {
      await submitGeometry(buildAnswers())
      setSubmitted(true)
      setShowSubmitModal(false)
      router.push('/page-5')
    } catch (error) {
      console.error('[POLARIA Page 12 Submit]', error)
      setSubmitting(false)
      setSubmitError(
        'Jawaban belum berhasil dikumpulkan. Periksa koneksi internet lalu coba lagi.'
      )
    }
  }


  /* =======================================================
     REUSABLE FORMULA INPUT
     ======================================================= */

  const FormulaInput = ({
    value,
    onChange,
    cmsField,
    name,
    className = '',
    ariaLabel,
    placeholder = '...',
  }: {
    value: string
    onChange: (value: string) => void
    cmsField: string
    name: string
    className?: string
    ariaLabel: string
    placeholder?: string
  }) => (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      readOnly={submitted}
      onChange={(event) =>
        onChange(event.target.value)
      }
      name={name}
      data-cms-field={cmsField}
      aria-label={ariaLabel}
      placeholder={placeholder}
      autoComplete="off"
      spellCheck={false}
      className={`page-twelve-formula-input ${className}`}
    />
  )


  return (
    <main className="page-shell page-twelve-shell">

      <section
        className="page-twelve-canvas"
        aria-label="Barisan Geometri - C. Menemukan Rumus"
      >

        {/* =================================================
            BACKGROUND
            ================================================= */}

        <img
          className="page-twelve-background"
          src={processedAssets.background}
          alt=""
          aria-hidden="true"
        />


        {/* =================================================
            CLASSROOM
            ================================================= */}

        <img
          className="page-twelve-classroom"
          src={processedAssets.classroom}
          alt=""
          aria-hidden="true"
          draggable={false}
        />


        {/* =================================================
            HEADER
            ================================================= */}

        <img
          className="page-twelve-header"
          src={processedAssets.header}
          alt="SMP Islam De Green Camp dan Kurikulum Merdeka"
          draggable={false}
        />


        {/* =================================================
            PAGE TITLE
            ================================================= */}

        <h1 className="page-twelve-title">
          BARISAN GEOMETRI
        </h1>


        {/* =================================================
            ACTIVITY
            ================================================= */}

        <div className="page-twelve-activity">

          {/* =================================================
              ARTWORK
              ================================================= */}

          <img
            className="page-twelve-section-artwork"
            src={processedAssets.section}
            alt="C. Menemukan Rumus"
            draggable={false}
          />


          {/* =================================================
              LEFT FORMULAS
              ================================================= */}

          <div className="page-twelve-left-formulas">

            {/* u2 */}
            <div className="page-twelve-formula-row">

              <span className="formula-variable">
                u₂
              </span>

              <span>&nbsp;=&nbsp;4&nbsp;=&nbsp;</span>

              <span className="formula-red">
                2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <span className="formula-blue">
                2
              </span>

            </div>


            {/* u3 */}
            <div className="page-twelve-formula-row">

              <span className="formula-variable">
                u₃
              </span>

              <span>&nbsp;=&nbsp;8&nbsp;=&nbsp;</span>

              <span className="formula-red">
                2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <span className="formula-blue">
                2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <FormulaInput
                value={sequenceAnswers.u3[0]}
                onChange={(value) =>
                  updateSequenceArray(
                    'u3',
                    0,
                    value
                  )
                }
                cmsField="pageTwelve.sequence.u3.term1"
                name="pageTwelveU3Term1"
                className="formula-dot-input"
                ariaLabel="Isian rumus u3"
              />

            </div>


            {/* u4 */}
            <div className="page-twelve-formula-row">

              <span className="formula-variable">
                u₄
              </span>

              <span>&nbsp;=&nbsp;16&nbsp;=&nbsp;</span>

              <span className="formula-red">
                2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <span className="formula-blue">
                2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <FormulaInput
                value={sequenceAnswers.u4[0]}
                onChange={(value) =>
                  updateSequenceArray(
                    'u4',
                    0,
                    value
                  )
                }
                cmsField="pageTwelve.sequence.u4.term1"
                name="pageTwelveU4Term1"
                className="formula-dot-input"
                ariaLabel="Isian pertama rumus u4"
              />

              <span>&nbsp;·&nbsp;</span>

              <FormulaInput
                value={sequenceAnswers.u4[1]}
                onChange={(value) =>
                  updateSequenceArray(
                    'u4',
                    1,
                    value
                  )
                }
                cmsField="pageTwelve.sequence.u4.term2"
                name="pageTwelveU4Term2"
                className="formula-dot-input"
                ariaLabel="Isian kedua rumus u4"
              />

            </div>


            {/* u5 */}
            <div className="page-twelve-formula-row">

              <span className="formula-variable">
                u₅
              </span>

              <span>&nbsp;=&nbsp;</span>

              <FormulaInput
                value={sequenceAnswers.u5Value}
                onChange={(value) =>
                  updateSequenceValue(
                    'u5Value',
                    value
                  )
                }
                cmsField="pageTwelve.sequence.u5.value"
                name="pageTwelveU5Value"
                className="formula-leading-input"
                ariaLabel="Nilai u5"
              />

              <span>&nbsp;=&nbsp;</span>

              <span className="formula-red">
                2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <span className="formula-blue">
                2
              </span>

              <span>&nbsp;·&nbsp;</span>

              {sequenceAnswers.u5.map(
                (value, index) => (
                  <span
                    className="formula-inline-group"
                    key={`u5-${index}`}
                  >

                    <FormulaInput
                      value={value}
                      onChange={(nextValue) =>
                        updateSequenceArray(
                          'u5',
                          index,
                          nextValue
                        )
                      }
                      cmsField={`pageTwelve.sequence.u5.term${index + 1}`}
                      name={`pageTwelveU5Term${index + 1}`}
                      className="formula-dot-input"
                      ariaLabel={`Isian u5 ${index + 1}`}
                    />

                    {index <
                      sequenceAnswers.u5.length - 1 && (
                      <span>&nbsp;·&nbsp;</span>
                    )}

                  </span>
                )
              )}

            </div>


            {/* u6 */}
            <div className="page-twelve-formula-row">

              <span className="formula-variable">
                u₆
              </span>

              <span>&nbsp;=&nbsp;</span>

              <FormulaInput
                value={sequenceAnswers.u6Value}
                onChange={(value) =>
                  updateSequenceValue(
                    'u6Value',
                    value
                  )
                }
                cmsField="pageTwelve.sequence.u6.value"
                name="pageTwelveU6Value"
                className="formula-leading-input"
                ariaLabel="Nilai u6"
              />

              <span>&nbsp;=&nbsp;</span>

              <span className="formula-red">
                2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <span className="formula-blue">
                2
              </span>

              <span>&nbsp;·&nbsp;</span>

              {sequenceAnswers.u6.map(
                (value, index) => (
                  <span
                    className="formula-inline-group"
                    key={`u6-${index}`}
                  >

                    <FormulaInput
                      value={value}
                      onChange={(nextValue) =>
                        updateSequenceArray(
                          'u6',
                          index,
                          nextValue
                        )
                      }
                      cmsField={`pageTwelve.sequence.u6.term${index + 1}`}
                      name={`pageTwelveU6Term${index + 1}`}
                      className="formula-dot-input"
                      ariaLabel={`Isian u6 ${index + 1}`}
                    />

                    {index <
                      sequenceAnswers.u6.length - 1 && (
                      <span>&nbsp;·&nbsp;</span>
                    )}

                  </span>
                )
              )}

            </div>


            {/* u7 */}
            <div className="page-twelve-formula-row">

              <span className="formula-variable">
                u₇
              </span>

              <span>&nbsp;=&nbsp;</span>

              <FormulaInput
                value={sequenceAnswers.u7Value}
                onChange={(value) =>
                  updateSequenceValue(
                    'u7Value',
                    value
                  )
                }
                cmsField="pageTwelve.sequence.u7.value"
                name="pageTwelveU7Value"
                className="formula-leading-input"
                ariaLabel="Nilai u7"
              />

              <span>&nbsp;=&nbsp;</span>

              <span className="formula-red">
                2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <span className="formula-blue">
                2
              </span>

              <span>&nbsp;·&nbsp;</span>

              {sequenceAnswers.u7.map(
                (value, index) => (
                  <span
                    className="formula-inline-group"
                    key={`u7-${index}`}
                  >

                    <FormulaInput
                      value={value}
                      onChange={(nextValue) =>
                        updateSequenceArray(
                          'u7',
                          index,
                          nextValue
                        )
                      }
                      cmsField={`pageTwelve.sequence.u7.term${index + 1}`}
                      name={`pageTwelveU7Term${index + 1}`}
                      className="formula-dot-input"
                      ariaLabel={`Isian u7 ${index + 1}`}
                    />

                    {index <
                      sequenceAnswers.u7.length - 1 && (
                      <span>&nbsp;·&nbsp;</span>
                    )}

                  </span>
                )
              )}

            </div>


            {/* u8 */}
            <div className="page-twelve-formula-row">

              <span className="formula-variable">
                u₈
              </span>

              <span>&nbsp;=&nbsp;</span>

              <FormulaInput
                value={sequenceAnswers.u8Value}
                onChange={(value) =>
                  updateSequenceValue(
                    'u8Value',
                    value
                  )
                }
                cmsField="pageTwelve.sequence.u8.value"
                name="pageTwelveU8Value"
                className="formula-leading-input"
                ariaLabel="Nilai u8"
              />

              <span>&nbsp;=&nbsp;</span>

              <span className="formula-red">
                2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <span className="formula-blue">
                2
              </span>

              <span>&nbsp;·&nbsp;</span>

              {sequenceAnswers.u8.map(
                (value, index) => (
                  <span
                    className="formula-inline-group"
                    key={`u8-${index}`}
                  >

                    <FormulaInput
                      value={value}
                      onChange={(nextValue) =>
                        updateSequenceArray(
                          'u8',
                          index,
                          nextValue
                        )
                      }
                      cmsField={`pageTwelve.sequence.u8.term${index + 1}`}
                      name={`pageTwelveU8Term${index + 1}`}
                      className="formula-dot-input"
                      ariaLabel={`Isian u8 ${index + 1}`}
                    />

                    {index <
                      sequenceAnswers.u8.length - 1 && (
                      <span>&nbsp;·&nbsp;</span>
                    )}

                  </span>
                )
              )}

            </div>

          </div>


          {/* =================================================
              RIGHT L-SHAPE FORMULA
              ================================================= */}

          <div className="page-twelve-right-formulas">

            {/* u2 */}
            <div className="page-twelve-right-row">

              <span>=</span>

              <span className="formula-red">
                &nbsp;2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <span className="formula-blue">
                2
              </span>

              <sup>1</sup>

            </div>


            {/* u3 */}
            <div className="page-twelve-right-row">

              <span>=</span>

              <span className="formula-red">
                &nbsp;2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <span className="formula-blue">
                2
              </span>

              <sup>
                <FormulaInput
                  value={rightFormulaAnswers.u3}
                  onChange={(value) =>
                    updateRightFormula(
                      'u3',
                      value
                    )
                  }
                  cmsField="pageTwelve.rightFormula.u3"
                  name="pageTwelveRightU3"
                  className="formula-exponent-input"
                  ariaLabel="Eksponen u3"
                />
              </sup>

            </div>


            {/* u4 */}
            <div className="page-twelve-right-row">

              <span>=</span>

              <span className="formula-red">
                &nbsp;2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <span className="formula-blue">
                2
              </span>

              <sup>
                <FormulaInput
                  value={rightFormulaAnswers.u4}
                  onChange={(value) =>
                    updateRightFormula(
                      'u4',
                      value
                    )
                  }
                  cmsField="pageTwelve.rightFormula.u4"
                  name="pageTwelveRightU4"
                  className="formula-exponent-input"
                  ariaLabel="Eksponen u4"
                />
              </sup>

            </div>


            {/* u5 */}
            <div className="page-twelve-right-row">

              <span>=</span>

              <span className="formula-red">
                &nbsp;2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <span className="formula-blue">
                2
              </span>

              <sup>
                <FormulaInput
                  value={rightFormulaAnswers.u5}
                  onChange={(value) =>
                    updateRightFormula(
                      'u5',
                      value
                    )
                  }
                  cmsField="pageTwelve.rightFormula.u5"
                  name="pageTwelveRightU5"
                  className="formula-exponent-input"
                  ariaLabel="Eksponen u5"
                />
              </sup>

            </div>


            {/* u6 */}
            <div className="page-twelve-right-row">

              <span>=</span>

              <span className="formula-red">
                &nbsp;2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <span className="formula-blue">
                2
              </span>

              <sup>
                <FormulaInput
                  value={rightFormulaAnswers.u6}
                  onChange={(value) =>
                    updateRightFormula(
                      'u6',
                      value
                    )
                  }
                  cmsField="pageTwelve.rightFormula.u6"
                  name="pageTwelveRightU6"
                  className="formula-exponent-input"
                  ariaLabel="Eksponen u6"
                />
              </sup>

            </div>


            {/* u7 */}
            <div className="page-twelve-right-row">

              <span>=</span>

              <span className="formula-red">
                &nbsp;2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <span className="formula-blue">
                2
              </span>

              <sup>
                <FormulaInput
                  value={rightFormulaAnswers.u7}
                  onChange={(value) =>
                    updateRightFormula(
                      'u7',
                      value
                    )
                  }
                  cmsField="pageTwelve.rightFormula.u7"
                  name="pageTwelveRightU7"
                  className="formula-exponent-input"
                  ariaLabel="Eksponen u7"
                />
              </sup>

            </div>


            {/* u8 */}
            <div className="page-twelve-right-row">

              <span>=</span>

              <span className="formula-red">
                &nbsp;2
              </span>

              <span>&nbsp;·&nbsp;</span>

              <span className="formula-blue">
                2
              </span>

              <sup>
                <FormulaInput
                  value={rightFormulaAnswers.u8}
                  onChange={(value) =>
                    updateRightFormula(
                      'u8',
                      value
                    )
                  }
                  cmsField="pageTwelve.rightFormula.u8"
                  name="pageTwelveRightU8"
                  className="formula-exponent-input"
                  ariaLabel="Eksponen u8"
                />
              </sup>

            </div>

          </div>


          {/* =================================================
              GENERAL FORMULA
              uₙ = ... · ...^(n − 1)
              ================================================= */}

          <div className="page-twelve-general-formula">

            <span className="formula-variable">
              uₙ
            </span>

            <span>&nbsp;=&nbsp;</span>

            <FormulaInput
              value={generalFormulaAnswers.first}
              onChange={(value) =>
                updateGeneralFormula(
                  'first',
                  value
                )
              }
              cmsField="pageTwelve.generalFormula.first"
              name="pageTwelveGeneralFirst"
              className="formula-general-input"
              ariaLabel="Bagian pertama rumus umum"
            />

            <span>&nbsp;·&nbsp;</span>

            <FormulaInput
              value={generalFormulaAnswers.ratio}
              onChange={(value) =>
                updateGeneralFormula(
                  'ratio',
                  value
                )
              }
              cmsField="pageTwelve.generalFormula.ratio"
              name="pageTwelveGeneralRatio"
              className="formula-general-input"
              ariaLabel="Rasio pada rumus umum"
            />

            <sup className="formula-general-exponent">
              (n − 1)
            </sup>

          </div>


          {/* =================================================
              TEXTBOX INPUT A
              ================================================= */}

          <input
            type="text"
            value={meaningAnswers.a}
            readOnly={submitted}
            onChange={(event) =>
              updateMeaning(
                'a',
                event.target.value
              )
            }
            name="pageTwelveMeaningA"
            data-cms-field="pageTwelve.meaning.a"
            aria-label="Arti a"
            autoComplete="off"
            spellCheck
            className="page-twelve-meaning-overlay page-twelve-meaning-a"
          />


          {/* =================================================
              TEXTBOX INPUT R
              ================================================= */}

          <input
            type="text"
            value={meaningAnswers.r}
            readOnly={submitted}
            onChange={(event) =>
              updateMeaning(
                'r',
                event.target.value
              )
            }
            name="pageTwelveMeaningR"
            data-cms-field="pageTwelve.meaning.r"
            aria-label="Arti r"
            autoComplete="off"
            spellCheck
            className="page-twelve-meaning-overlay page-twelve-meaning-r"
          />


          {/* =================================================
              TEXTBOX INPUT N
              ================================================= */}

          <input
            type="text"
            value={meaningAnswers.n}
            readOnly={submitted}
            onChange={(event) =>
              updateMeaning(
                'n',
                event.target.value
              )
            }
            name="pageTwelveMeaningN"
            data-cms-field="pageTwelve.meaning.n"
            aria-label="Arti n"
            autoComplete="off"
            spellCheck
            className="page-twelve-meaning-overlay page-twelve-meaning-n"
          />

        </div>


        {/* =================================================
            NAVIGATION
            ================================================= */}

        {/* =================================================
            IN-PAGE SUBMISSION CONFIRMATION
            ================================================= */}
        {showSubmitModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="page-twelve-submit-title"
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
                id="page-twelve-submit-title"
                style={{
                  margin: 0,
                  color: '#078b45',
                  fontFamily: "'Baloo 2', cursive",
                  fontSize: 'clamp(22px, 5.2cqw, 38px)',
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                Kumpulkan Barisan Geometri?
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
                Setelah dikumpulkan, jawaban Barisan Geometri tidak dapat diubah lagi.
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
                  {submitting ? 'Menyimpan...' : 'Kumpulkan'}
                </button>
              </div>
            </div>
          </div>
        )}


        <PageNavigation
          variant="full"
          backHref="/page-11"
          backLabel="Kembali ke halaman sebelumnya"
          homeHref="/page-5"
          homeLabel="Selesai dan kembali ke menu utama"
          className="page-twelve-nav"
          processTransparency={true}
          onBackClick={handleBack}
          onHomeClick={handleSubmitToMenu}
        />

        <PageFooter />

      </section>
    </main>
  )
}
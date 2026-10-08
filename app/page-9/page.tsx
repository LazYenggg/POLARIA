'use client'

import { useEffect, useState, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import PageNavigation from '@/components/PageNavigation'
import PageFooter from '@/components/PageFooter'
import {
  ensureAnonymousUser,
  getCurrentSubmissionId,
  getSubmission,
  savePage9Answers,
  submitArithmetic,
} from '@/lib/submission'
import type { Page9Answers } from '@/lib/types'
import './page-9.css'

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
  u5: string
  u6: string
  u7: string
  u8: string
}

type MeaningAnswers = {
  a: string
  b: string
  n: string
}

type AlternativeFormulaAnswers = {
  first: string
  middle: string
  last: string
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
   ASSETS
   ========================================================= */

const assets = {
  background: '/assets/Background.png',
  header: '/assets/header.png',
  classroom: '/assets/kids_and_teacher.png',
  section: '/assets/page-9-Csection.png',
}


export default function PageNine() {
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
     RIGHT SIDE
     ======================================================= */

  const [rightFormulaAnswers, setRightFormulaAnswers] =
    useState<RightFormulaAnswers>({
      u5: '',
      u6: '',
      u7: '',
      u8: '',
    })


  /* =======================================================
     TEXTBOX A / B / N
     ======================================================= */

  const [meaningAnswers, setMeaningAnswers] =
    useState<MeaningAnswers>({
      a: '',
      b: '',
      n: '',
    })


  /* =======================================================
     ALTERNATIVE FORMULA
     ======================================================= */

  const [alternativeFormulaAnswers, setAlternativeFormulaAnswers] =
    useState<AlternativeFormulaAnswers>({
      first: '',
      middle: '',
      last: '',
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
     LEFT FORMULA HANDLERS
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
        itemIndex === index ? value : item
      ),
    }))
  }


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
      [field]: value,
    }))
  }


  /* =======================================================
     RIGHT FORMULA HANDLER
     ======================================================= */

  const updateRightFormula = (
    field: keyof RightFormulaAnswers,
    value: string
  ) => {
    setRightFormulaAnswers((current) => ({
      ...current,
      [field]: value,
    }))
  }


  /* =======================================================
     TEXTBOX HANDLER
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
     ALTERNATIVE FORMULA HANDLER
     ======================================================= */

  const updateAlternativeFormula = (
    field: keyof AlternativeFormulaAnswers,
    value: string
  ) => {
    setAlternativeFormulaAnswers((current) => ({
      ...current,
      [field]: value,
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

  const buildAnswers = (): Page9Answers => ({
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
      u5: toNumericAnswer(rightFormulaAnswers.u5),
      u6: toNumericAnswer(rightFormulaAnswers.u6),
      u7: toNumericAnswer(rightFormulaAnswers.u7),
      u8: toNumericAnswer(rightFormulaAnswers.u8),
    },
    meaning: meaningAnswers,
    alternativeFormula: {
      first: toNumericAnswer(alternativeFormulaAnswers.first),
      middle: toNumericAnswer(alternativeFormulaAnswers.middle),
      last: toNumericAnswer(alternativeFormulaAnswers.last),
    },
  })


  /* =======================================================
     LOAD SAVED PAGE 9 ANSWERS + SECTION STATUS
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

        const saved = submission?.arithmetic.page9

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
            u5: fromNumericAnswer(saved.rightFormula.u5),
            u6: fromNumericAnswer(saved.rightFormula.u6),
            u7: fromNumericAnswer(saved.rightFormula.u7),
            u8: fromNumericAnswer(saved.rightFormula.u8),
          })

          setMeaningAnswers(saved.meaning)

          setAlternativeFormulaAnswers({
            first: fromNumericAnswer(saved.alternativeFormula.first),
            middle: fromNumericAnswer(saved.alternativeFormula.middle),
            last: fromNumericAnswer(saved.alternativeFormula.last),
          })
        }

        setSubmitted(Boolean(submission?.arithmetic.status.submitted))
        setLoaded(true)
      } catch (error) {
        console.error('[POLARIA Page 9 Load]', error)
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
      router.push('/page-8')
      return
    }

    try {
      await savePage9Answers(buildAnswers())
      router.push('/page-8')
    } catch (error) {
      console.error('[POLARIA Page 9 Save]', error)
      window.alert(
        'Jawaban belum berhasil disimpan. Periksa koneksi internet lalu coba lagi.'
      )
    }
  }


  /* =======================================================
     SUBMIT ARITHMETIC SECTION
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
      await submitArithmetic(buildAnswers())
      setSubmitted(true)
      setShowSubmitModal(false)
      router.push('/page-5')
    } catch (error) {
      console.error('[POLARIA Page 9 Submit]', error)
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
      value={value}
      readOnly={submitted}
      onChange={(event) => onChange(event.target.value)}
      name={name}
      data-cms-field={cmsField}
      aria-label={ariaLabel}
      placeholder={placeholder}
      autoComplete="off"
      spellCheck={false}
      className={`page-nine-formula-input ${className}`}
    />
  )


  return (
    <main className="page-shell page-nine-shell">
      <section
        className="page-nine-canvas"
        aria-label="Barisan Aritmatika - C. Menemukan Rumus"
      >

        {/* =================================================
            BACKGROUND
            ================================================= */}

        <img
          className="page-nine-background"
          src={processedAssets.background}
          alt=""
          aria-hidden="true"
        />


        {/* =================================================
            CLASSROOM
            ================================================= */}

        <img
          className="page-nine-classroom"
          src={processedAssets.classroom}
          alt=""
          aria-hidden="true"
          draggable={false}
        />


        {/* =================================================
            HEADER
            ================================================= */}

        <img
          className="page-nine-header"
          src={processedAssets.header}
          alt="SMP Islam De Green Camp dan Kurikulum Merdeka"
          draggable={false}
        />


        {/* =================================================
            TITLE
            ================================================= */}

        <h1 className="page-nine-title">
          BARISAN ARITMATIKA
        </h1>


        {/* =================================================
            ACTIVITY
            ================================================= */}

        <div className="page-nine-activity">

          {/* =================================================
              C SECTION ARTWORK

              Bagian atas tetap untouched:
              u1, u2, u3, u4, u5, u6, u7, u8
              +3
              gelombang
              ================================================= */}

          <img
            className="page-nine-section-artwork"
            src={processedAssets.section}
            alt="C. Menemukan Rumus"
            draggable={false}
          />


          {/* =================================================
              LEFT FORMULAS
              ================================================= */}

          <div className="page-nine-left-formulas">

            {/* u2 */}
            <div className="page-nine-formula-row">

              <span className="formula-variable">
                u₂
              </span>

              <span>&nbsp;=&nbsp;5&nbsp;=&nbsp;</span>

              <span className="formula-red">
                2
              </span>

              <span>&nbsp;+&nbsp;</span>

              <span className="formula-blue">
                3
              </span>

            </div>


            {/* u3 */}
            <div className="page-nine-formula-row">

              <span className="formula-variable">
                u₃
              </span>

              <span>&nbsp;=&nbsp;8&nbsp;=&nbsp;</span>

              <span className="formula-red">
                2
              </span>

              <span>&nbsp;+&nbsp;</span>

              <span className="formula-blue">
                3
              </span>

              <span>&nbsp;+&nbsp;</span>

              <FormulaInput
                value={sequenceAnswers.u3[0]}
                onChange={(value) =>
                  updateSequenceArray(
                    'u3',
                    0,
                    value
                  )
                }
                cmsField="pageNine.sequence.u3.term1"
                name="pageNineU3Term1"
                className="formula-dot-input"
                ariaLabel="Isian titik rumus u3"
              />

            </div>


            {/* u4 */}
            <div className="page-nine-formula-row">

              <span className="formula-variable">
                u₄
              </span>

              <span>&nbsp;=&nbsp;11&nbsp;=&nbsp;</span>

              <span className="formula-red">
                2
              </span>

              <span>&nbsp;+&nbsp;</span>

              <span className="formula-blue">
                3
              </span>

              <span>&nbsp;+&nbsp;</span>

              <FormulaInput
                value={sequenceAnswers.u4[0]}
                onChange={(value) =>
                  updateSequenceArray(
                    'u4',
                    0,
                    value
                  )
                }
                cmsField="pageNine.sequence.u4.term1"
                name="pageNineU4Term1"
                className="formula-dot-input"
                ariaLabel="Isian pertama rumus u4"
              />

              <span>&nbsp;+&nbsp;</span>

              <FormulaInput
                value={sequenceAnswers.u4[1]}
                onChange={(value) =>
                  updateSequenceArray(
                    'u4',
                    1,
                    value
                  )
                }
                cmsField="pageNine.sequence.u4.term2"
                name="pageNineU4Term2"
                className="formula-dot-input"
                ariaLabel="Isian kedua rumus u4"
              />

            </div>


            {/* u5 */}
            <div className="page-nine-formula-row">

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
                cmsField="pageNine.sequence.u5.value"
                name="pageNineU5Value"
                className="formula-leading-input"
                ariaLabel="Nilai u5"
              />

              <span>&nbsp;=&nbsp;</span>

              <span className="formula-red">
                2
              </span>

              <span>&nbsp;+&nbsp;</span>

              <span className="formula-blue">
                3
              </span>

              <span>&nbsp;+&nbsp;</span>

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
                      cmsField={`pageNine.sequence.u5.term${index + 1}`}
                      name={`pageNineU5Term${index + 1}`}
                      className="formula-dot-input"
                      ariaLabel={`Isian u5 ${index + 1}`}
                    />

                    {index <
                      sequenceAnswers.u5.length - 1 && (
                      <span>&nbsp;+&nbsp;</span>
                    )}
                  </span>
                )
              )}

            </div>


            {/* u6 */}
            <div className="page-nine-formula-row">

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
                cmsField="pageNine.sequence.u6.value"
                name="pageNineU6Value"
                className="formula-leading-input"
                ariaLabel="Nilai u6"
              />

              <span>&nbsp;=&nbsp;</span>

              <span className="formula-red">
                2
              </span>

              <span>&nbsp;+&nbsp;</span>

              <span className="formula-blue">
                3
              </span>

              <span>&nbsp;+&nbsp;</span>

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
                      cmsField={`pageNine.sequence.u6.term${index + 1}`}
                      name={`pageNineU6Term${index + 1}`}
                      className="formula-dot-input"
                      ariaLabel={`Isian u6 ${index + 1}`}
                    />

                    {index <
                      sequenceAnswers.u6.length - 1 && (
                      <span>&nbsp;+&nbsp;</span>
                    )}
                  </span>
                )
              )}

            </div>


            {/* u7 */}
            <div className="page-nine-formula-row">

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
                cmsField="pageNine.sequence.u7.value"
                name="pageNineU7Value"
                className="formula-leading-input"
                ariaLabel="Nilai u7"
              />

              <span>&nbsp;=&nbsp;</span>

              <span className="formula-red">
                2
              </span>

              <span>&nbsp;+&nbsp;</span>

              <span className="formula-blue">
                3
              </span>

              <span>&nbsp;+&nbsp;</span>

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
                      cmsField={`pageNine.sequence.u7.term${index + 1}`}
                      name={`pageNineU7Term${index + 1}`}
                      className="formula-dot-input"
                      ariaLabel={`Isian u7 ${index + 1}`}
                    />

                    {index <
                      sequenceAnswers.u7.length - 1 && (
                      <span>&nbsp;+&nbsp;</span>
                    )}
                  </span>
                )
              )}

            </div>


            {/* u8 */}
            <div className="page-nine-formula-row">

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
                cmsField="pageNine.sequence.u8.value"
                name="pageNineU8Value"
                className="formula-leading-input"
                ariaLabel="Nilai u8"
              />

              <span>&nbsp;=&nbsp;</span>

              <span className="formula-red">
                2
              </span>

              <span>&nbsp;+&nbsp;</span>

              <span className="formula-blue">
                3
              </span>

              <span>&nbsp;+&nbsp;</span>

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
                      cmsField={`pageNine.sequence.u8.term${index + 1}`}
                      name={`pageNineU8Term${index + 1}`}
                      className="formula-dot-input"
                      ariaLabel={`Isian u8 ${index + 1}`}
                    />

                    {index <
                      sequenceAnswers.u8.length - 1 && (
                      <span>&nbsp;+&nbsp;</span>
                    )}
                  </span>
                )
              )}

            </div>

          </div>


          {/* =================================================
              RIGHT FORMULA - INSIDE L SHAPE
              ================================================= */}

          <div className="page-nine-right-formulas">

            {/* u2 */}
            <div className="page-nine-right-row">
              <span>=</span>
              <span className="formula-red">&nbsp;2</span>
              <span>&nbsp;+&nbsp;</span>
              <span className="formula-blue">3</span>
              <span>&nbsp;·&nbsp;1</span>
            </div>

            {/* u3 */}
            <div className="page-nine-right-row">
              <span>=</span>
              <span className="formula-red">&nbsp;2</span>
              <span>&nbsp;+&nbsp;</span>
              <span className="formula-blue">3</span>
              <span>&nbsp;·&nbsp;2</span>
            </div>

            {/* u4 */}
            <div className="page-nine-right-row">
              <span>=</span>
              <span className="formula-red">&nbsp;2</span>
              <span>&nbsp;+&nbsp;</span>
              <span className="formula-blue">3</span>
              <span>&nbsp;·&nbsp;3</span>
            </div>

            {/* u5 */}
            <div className="page-nine-right-row">
              <span>=</span>
              <span className="formula-red">&nbsp;2</span>
              <span>&nbsp;+&nbsp;</span>
              <span className="formula-blue">3</span>
              <span>&nbsp;·&nbsp;(</span>

              <FormulaInput
                value={rightFormulaAnswers.u5}
                onChange={(value) =>
                  updateRightFormula(
                    'u5',
                    value
                  )
                }
                cmsField="pageNine.rightFormula.u5"
                name="pageNineRightU5"
                className="formula-parenthesis-input"
                ariaLabel="Isian u5 rumus kanan"
              />

              <span>)</span>
            </div>

            {/* u6 */}
            <div className="page-nine-right-row">
              <span>=</span>
              <span className="formula-red">&nbsp;2</span>
              <span>&nbsp;+&nbsp;</span>
              <span className="formula-blue">3</span>
              <span>&nbsp;·&nbsp;(</span>

              <FormulaInput
                value={rightFormulaAnswers.u6}
                onChange={(value) =>
                  updateRightFormula(
                    'u6',
                    value
                  )
                }
                cmsField="pageNine.rightFormula.u6"
                name="pageNineRightU6"
                className="formula-parenthesis-input"
                ariaLabel="Isian u6 rumus kanan"
              />

              <span>)</span>
            </div>

            {/* u7 */}
            <div className="page-nine-right-row">
              <span>=</span>
              <span className="formula-red">&nbsp;2</span>
              <span>&nbsp;+&nbsp;</span>
              <span className="formula-blue">3</span>
              <span>&nbsp;·&nbsp;(</span>

              <FormulaInput
                value={rightFormulaAnswers.u7}
                onChange={(value) =>
                  updateRightFormula(
                    'u7',
                    value
                  )
                }
                cmsField="pageNine.rightFormula.u7"
                name="pageNineRightU7"
                className="formula-parenthesis-input"
                ariaLabel="Isian u7 rumus kanan"
              />

              <span>)</span>
            </div>

            {/* u8 */}
            <div className="page-nine-right-row">
              <span>=</span>
              <span className="formula-red">&nbsp;2</span>
              <span>&nbsp;+&nbsp;</span>
              <span className="formula-blue">3</span>
              <span>&nbsp;·&nbsp;(</span>

              <FormulaInput
                value={rightFormulaAnswers.u8}
                onChange={(value) =>
                  updateRightFormula(
                    'u8',
                    value
                  )
                }
                cmsField="pageNine.rightFormula.u8"
                name="pageNineRightU8"
                className="formula-parenthesis-input"
                ariaLabel="Isian u8 rumus kanan"
              />

              <span>)</span>
            </div>

          </div>


          {/* =================================================
              GENERAL FORMULA
              ================================================= */}

          <div className="page-nine-general-formula">

            <span className="formula-variable">
              uₙ
            </span>

            <span>&nbsp;=&nbsp;</span>

            <span className="formula-red">
              a
            </span>

            <span>&nbsp;+&nbsp;</span>

            <span className="formula-blue">
              b
            </span>

            <span>&nbsp;·&nbsp;(n − 1)</span>

          </div>


          {/* =================================================
              ATAU
              ================================================= */}

          <div className="page-nine-or">
            atau
          </div>


          {/* =================================================
              ALTERNATIVE FORMULA
              ================================================= */}

          <div className="page-nine-alternative-formula">

            <span className="formula-variable">
              uₙ
            </span>

            <span>&nbsp;=&nbsp;</span>

            <FormulaInput
              value={alternativeFormulaAnswers.first}
              onChange={(value) =>
                updateAlternativeFormula(
                  'first',
                  value
                )
              }
              cmsField="pageNine.alternativeFormula.first"
              name="pageNineAlternativeFirst"
              className="formula-alternative-input"
              ariaLabel="Bagian pertama rumus alternatif"
            />

            <span>&nbsp;+&nbsp;(</span>

            <FormulaInput
              value={alternativeFormulaAnswers.middle}
              onChange={(value) =>
                updateAlternativeFormula(
                  'middle',
                  value
                )
              }
              cmsField="pageNine.alternativeFormula.middle"
              name="pageNineAlternativeMiddle"
              className="formula-alternative-input formula-alternative-middle"
              ariaLabel="Bagian tengah rumus alternatif"
            />

            <span>)&nbsp;·&nbsp;</span>

            <FormulaInput
              value={alternativeFormulaAnswers.last}
              onChange={(value) =>
                updateAlternativeFormula(
                  'last',
                  value
                )
              }
              cmsField="pageNine.alternativeFormula.last"
              name="pageNineAlternativeLast"
              className="formula-alternative-input"
              ariaLabel="Bagian terakhir rumus alternatif"
            />

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
            name="pageNineMeaningA"
            data-cms-field="pageNine.meaning.a"
            aria-label="Arti a"
            autoComplete="off"
            spellCheck
            className="page-nine-meaning-overlay page-nine-meaning-a"
          />


          {/* =================================================
              TEXTBOX INPUT B
              ================================================= */}

          <input
            type="text"
            value={meaningAnswers.b}
            readOnly={submitted}
            onChange={(event) =>
              updateMeaning(
                'b',
                event.target.value
              )
            }
            name="pageNineMeaningB"
            data-cms-field="pageNine.meaning.b"
            aria-label="Arti b"
            autoComplete="off"
            spellCheck
            className="page-nine-meaning-overlay page-nine-meaning-b"
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
            name="pageNineMeaningN"
            data-cms-field="pageNine.meaning.n"
            aria-label="Arti n"
            autoComplete="off"
            spellCheck
            className="page-nine-meaning-overlay page-nine-meaning-n"
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
            aria-labelledby="page-nine-submit-title"
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
                id="page-nine-submit-title"
                style={{
                  margin: 0,
                  color: '#078b45',
                  fontFamily: "'Baloo 2', cursive",
                  fontSize: 'clamp(22px, 5.2cqw, 38px)',
                  fontWeight: 800,
                  lineHeight: 1.1,
                }}
              >
                Kumpulkan Barisan Aritmatika?
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
                Setelah dikumpulkan, jawaban Barisan Aritmatika tidak dapat diubah lagi.
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
          backHref="/page-8"
          backLabel="Kembali ke halaman sebelumnya"
          homeHref="/page-5"
          homeLabel="Selesai dan kembali ke menu utama"
          className="page-nine-nav"
          processTransparency={true}
          onBackClick={handleBack}
          onHomeClick={handleSubmitToMenu}
        />

        <PageFooter />

      </section>
    </main>
  )
}
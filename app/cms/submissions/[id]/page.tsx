'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { adminFetch } from '@/lib/cms-client'
import type {
  ArithmeticTableRow,
  EvaluationAnswers,
  GeometryTableRow,
  Page7Answers,
  Page8Answers,
  Page9Answers,
  Page10Answers,
  Page11Answers,
  Page12Answers,
} from '@/lib/types'
import styles from '../../cms.module.css'

type SerializedStatus = {
  submitted: boolean
  submittedAt: string | null
}

type SerializedSubmission = {
  id: string
  ownerUid: string
  groupName: string
  members: string
  className: string
  createdAt: string | null
  updatedAt: string | null
  arithmetic: {
    status: SerializedStatus
    page7: Page7Answers | null
    page8: Page8Answers | null
    page9: Page9Answers | null
  }
  geometry: {
    status: SerializedStatus
    page10: Page10Answers | null
    page11: Page11Answers | null
    page12: Page12Answers | null
  }
  evaluation: {
    status: SerializedStatus
    page13: EvaluationAnswers | null
  }
  retryFromSubmissionId?: string | null
}

type DetailResponse = {
  submission: SerializedSubmission
}

type RetryResponse = {
  retryToken: string
  retryUrl: string
  expiresAt: string
  groupName: string
  className: string
}

function formatDate(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function answerValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak'
  return String(value)
}

function joinNumbers(values: Array<number | null> | undefined) {
  if (!values) return '—'
  return values.map((value) => answerValue(value)).join(' · ')
}

function pageTitle(title: string, status: SerializedStatus) {
  return (
    <div className={styles.buttonRow} style={{ justifyContent: 'space-between' }}>
      <h2 className={styles.cardTitle}>{title}</h2>
      <span
        className={`${styles.statusChip} ${status.submitted ? styles.done : styles.progress}`}
      >
        {status.submitted ? 'Terkumpul' : 'Belum terkumpul'}
      </span>
    </div>
  )
}

function ArithmeticTable({ rows }: { rows: ArithmeticTableRow[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.answerTable}>
        <thead>
          <tr>
            <th>Tahap</th>
            <th>Jumlah Biji</th>
            <th>Selisih</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.stage}>
              <td>{row.stage}</td>
              <td>{answerValue(row.seedCount)}</td>
              <td>{answerValue(row.difference)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function GeometryTable({ rows }: { rows: GeometryTableRow[] }) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.answerTable}>
        <thead>
          <tr>
            <th>Minggu</th>
            <th>Jumlah Biji</th>
            <th>Rasio</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.week}>
              <td>{row.week}</td>
              <td>{answerValue(row.seedCount)}</td>
              <td>{answerValue(row.ratio)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function CmsSubmissionDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params.id

  const [submission, setSubmission] = useState<SerializedSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retrying, setRetrying] = useState(false)
  const [retryResult, setRetryResult] = useState<RetryResponse | null>(null)
  const [copied, setCopied] = useState(false)

  const loadSubmission = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await adminFetch<DetailResponse>(
        `/api/admin/submissions/${encodeURIComponent(id)}`
      )
      setSubmission(result.submission)
    } catch (error) {
      console.error('[POLARIA CMS Detail]', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Tidak dapat memuat detail submission.'
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadSubmission()
  }, [loadSubmission])

  const complete = useMemo(() => {
    if (!submission) return false

    return (
      submission.arithmetic.status.submitted &&
      submission.geometry.status.submitted &&
      submission.evaluation.status.submitted
    )
  }, [submission])

  const handleLogout = async () => {
    await signOut(auth)
  }

  const handleRetry = async () => {
    if (retrying) return

    setRetrying(true)
    setError('')
    setRetryResult(null)
    setCopied(false)

    try {
      const result = await adminFetch<RetryResponse>(
        `/api/admin/submissions/${encodeURIComponent(id)}/retry`,
        { method: 'POST' }
      )
      setRetryResult(result)
    } catch (error) {
      console.error('[POLARIA CMS Retry]', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Tidak dapat membuat sesi tes ulang.'
      )
    } finally {
      setRetrying(false)
    }
  }

  const handleCopyRetryLink = async () => {
    if (!retryResult) return

    try {
      await navigator.clipboard.writeText(retryResult.retryUrl)
      setCopied(true)
    } catch {
      setCopied(false)
      setError('Browser tidak mengizinkan penyalinan otomatis. Salin link secara manual.')
    }
  }

  if (loading && !submission) {
    return <div className={styles.loadingPage}>Memuat detail submission…</div>
  }

  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <header className={styles.headerRow}>
          <div>
            <div className={styles.buttonRow}>
              <Link className={styles.linkButton} href="/cms">
                ← Dashboard
              </Link>
              <button
                className={styles.secondaryButton}
                type="button"
                onClick={() => void loadSubmission()}
                disabled={loading}
              >
                {loading ? 'Memuat…' : 'Refresh'}
              </button>
            </div>
            <h1 className={styles.pageTitle} style={{ marginTop: 13 }}>
              {submission?.groupName || 'Submission'}
            </h1>
            <p className={styles.pageDescription}>
              Detail jawaban lengkap untuk satu sesi pengerjaan POLARIA.
            </p>
          </div>

          <div className={styles.buttonRow}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => void handleRetry()}
              disabled={retrying || !submission}
            >
              {retrying ? 'Membuat Link…' : 'Tes Ulang'}
            </button>
            <button
              className={styles.dangerButton}
              type="button"
              onClick={() => void handleLogout()}
            >
              Keluar
            </button>
          </div>
        </header>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {submission && (
          <>
            <section className={styles.detailCard}>
              <div className={styles.buttonRow} style={{ justifyContent: 'space-between' }}>
                <div>
                  <h2 className={styles.cardTitle}>Identitas Kelompok</h2>
                  <p className={styles.muted}>Status sesi: {complete ? 'Lengkap' : 'Masih berproses'}</p>
                </div>
                <div className={styles.statusLine}>
                  <span className={`${styles.statusChip} ${submission.arithmetic.status.submitted ? styles.done : styles.progress}`}>
                    A {submission.arithmetic.status.submitted ? '✓' : '…'}
                  </span>
                  <span className={`${styles.statusChip} ${submission.geometry.status.submitted ? styles.done : styles.progress}`}>
                    G {submission.geometry.status.submitted ? '✓' : '…'}
                  </span>
                  <span className={`${styles.statusChip} ${submission.evaluation.status.submitted ? styles.done : styles.progress}`}>
                    E {submission.evaluation.status.submitted ? '✓' : '…'}
                  </span>
                </div>
              </div>

              <div className={styles.identityGrid}>
                <div className={styles.identityValue}>
                  <strong>Nama Kelompok</strong>
                  {submission.groupName || '—'}
                </div>
                <div className={styles.identityValue}>
                  <strong>Kelas</strong>
                  {submission.className || '—'}
                </div>
                <div className={styles.identityValue}>
                  <strong>Submission ID</strong>
                  {submission.id}
                </div>
                <div className={styles.identityValue}>
                  <strong>Anggota</strong>
                  <span style={{ whiteSpace: 'pre-wrap' }}>{submission.members || '—'}</span>
                </div>
                <div className={styles.identityValue}>
                  <strong>Dibuat</strong>
                  {formatDate(submission.createdAt)}
                </div>
                <div className={styles.identityValue}>
                  <strong>Terakhir diubah</strong>
                  {formatDate(submission.updatedAt)}
                </div>
              </div>
            </section>

            {retryResult && (
              <section className={styles.detailCard} style={{ marginTop: 18 }}>
                <h2 className={styles.cardTitle}>Link Tes Ulang Siap</h2>
                <p className={styles.modalText}>
                  Kirim link ini ke kelompok. Ketika dibuka dari perangkat siswa,
                  POLARIA akan membuat sesi baru dengan identitas kelompok yang sama.
                  Link berlaku sampai {formatDate(retryResult.expiresAt)} dan hanya dapat digunakan satu kali.
                </p>
                <div className={styles.copyField}>
                  <input
                    className={styles.input}
                    value={retryResult.retryUrl}
                    readOnly
                    aria-label="Link tes ulang"
                  />
                  <button
                    className={styles.primaryButton}
                    type="button"
                    onClick={() => void handleCopyRetryLink()}
                  >
                    {copied ? 'Tersalin' : 'Salin Link'}
                  </button>
                </div>
                <p className={styles.muted}>
                  Token: {retryResult.retryToken}
                </p>
              </section>
            )}

            <div className={styles.detailGrid}>
              <section className={styles.detailCard}>
                {pageTitle('Page 7 — Ayo Memecahkan Masalah', submission.arithmetic.status)}
                <p className={styles.answerText}>
                  {submission.arithmetic.page7?.opinion || 'Belum ada jawaban.'}
                </p>
              </section>

              <section className={styles.detailCard}>
                {pageTitle('Page 8 — Mengamati Masalah', submission.arithmetic.status)}
                {submission.arithmetic.page8 ? (
                  <>
                    <ArithmeticTable rows={submission.arithmetic.page8.table ?? []} />
                    <dl className={styles.keyValue}>
                      <dt>Suku ke-8</dt>
                      <dd>{answerValue(submission.arithmetic.page8.stageEightSeedCount)}</dd>
                      <dt>Selisih sama?</dt>
                      <dd>{answerValue(submission.arithmetic.page8.sameDifference)}</dd>
                      <dt>Nilai selisih</dt>
                      <dd>{answerValue(submission.arithmetic.page8.differenceValue)}</dd>
                    </dl>
                  </>
                ) : (
                  <p className={styles.answerText}>Belum ada jawaban.</p>
                )}
              </section>

              <section className={styles.detailCard + ' ' + styles.full}>
                {pageTitle('Page 9 — Menemukan Rumus', submission.arithmetic.status)}
                {submission.arithmetic.page9 ? (
                  <div className={styles.detailGrid} style={{ marginTop: 0 }}>
                    <div>
                      <h3 className={styles.cardSubtitle}>Deret dan Pola</h3>
                      <dl className={styles.keyValue}>
                        <dt>u3</dt><dd>{joinNumbers(submission.arithmetic.page9.sequence.u3)}</dd>
                        <dt>u4</dt><dd>{joinNumbers(submission.arithmetic.page9.sequence.u4)}</dd>
                        <dt>u5</dt><dd>{joinNumbers(submission.arithmetic.page9.sequence.u5)}</dd>
                        <dt>u5 value</dt><dd>{answerValue(submission.arithmetic.page9.sequence.u5Value)}</dd>
                        <dt>u6</dt><dd>{joinNumbers(submission.arithmetic.page9.sequence.u6)}</dd>
                        <dt>u6 value</dt><dd>{answerValue(submission.arithmetic.page9.sequence.u6Value)}</dd>
                        <dt>u7</dt><dd>{joinNumbers(submission.arithmetic.page9.sequence.u7)}</dd>
                        <dt>u7 value</dt><dd>{answerValue(submission.arithmetic.page9.sequence.u7Value)}</dd>
                        <dt>u8</dt><dd>{joinNumbers(submission.arithmetic.page9.sequence.u8)}</dd>
                        <dt>u8 value</dt><dd>{answerValue(submission.arithmetic.page9.sequence.u8Value)}</dd>
                      </dl>
                    </div>
                    <div>
                      <h3 className={styles.cardSubtitle}>Rumus Suku ke-n</h3>
                      <dl className={styles.keyValue}>
                        <dt>u5</dt><dd>{answerValue(submission.arithmetic.page9.rightFormula.u5)}</dd>
                        <dt>u6</dt><dd>{answerValue(submission.arithmetic.page9.rightFormula.u6)}</dd>
                        <dt>u7</dt><dd>{answerValue(submission.arithmetic.page9.rightFormula.u7)}</dd>
                        <dt>u8</dt><dd>{answerValue(submission.arithmetic.page9.rightFormula.u8)}</dd>
                        <dt>a</dt><dd>{answerValue(submission.arithmetic.page9.meaning.a)}</dd>
                        <dt>b</dt><dd>{answerValue(submission.arithmetic.page9.meaning.b)}</dd>
                        <dt>n</dt><dd>{answerValue(submission.arithmetic.page9.meaning.n)}</dd>
                        <dt>Alternatif — first</dt><dd>{answerValue(submission.arithmetic.page9.alternativeFormula.first)}</dd>
                        <dt>Alternatif — middle</dt><dd>{answerValue(submission.arithmetic.page9.alternativeFormula.middle)}</dd>
                        <dt>Alternatif — last</dt><dd>{answerValue(submission.arithmetic.page9.alternativeFormula.last)}</dd>
                      </dl>
                    </div>
                  </div>
                ) : (
                  <p className={styles.answerText}>Belum ada jawaban.</p>
                )}
              </section>

              <section className={styles.detailCard}>
                {pageTitle('Page 10 — Ayo Memecahkan Masalah', submission.geometry.status)}
                <p className={styles.answerText}>
                  {submission.geometry.page10?.opinion || 'Belum ada jawaban.'}
                </p>
              </section>

              <section className={styles.detailCard}>
                {pageTitle('Page 11 — Mengamati Masalah', submission.geometry.status)}
                {submission.geometry.page11 ? (
                  <>
                    <GeometryTable rows={submission.geometry.page11.table ?? []} />
                    <dl className={styles.keyValue}>
                      <dt>Minggu ke-8</dt>
                      <dd>{answerValue(submission.geometry.page11.weekEightSeedCount)}</dd>
                      <dt>Rasio sama?</dt>
                      <dd>{answerValue(submission.geometry.page11.sameRatio)}</dd>
                      <dt>Nilai rasio</dt>
                      <dd>{answerValue(submission.geometry.page11.ratioValue)}</dd>
                    </dl>
                  </>
                ) : (
                  <p className={styles.answerText}>Belum ada jawaban.</p>
                )}
              </section>

              <section className={styles.detailCard + ' ' + styles.full}>
                {pageTitle('Page 12 — Menemukan Rumus', submission.geometry.status)}
                {submission.geometry.page12 ? (
                  <div className={styles.detailGrid} style={{ marginTop: 0 }}>
                    <div>
                      <h3 className={styles.cardSubtitle}>Deret dan Pola</h3>
                      <dl className={styles.keyValue}>
                        <dt>u3</dt><dd>{joinNumbers(submission.geometry.page12.sequence.u3)}</dd>
                        <dt>u4</dt><dd>{joinNumbers(submission.geometry.page12.sequence.u4)}</dd>
                        <dt>u5</dt><dd>{joinNumbers(submission.geometry.page12.sequence.u5)}</dd>
                        <dt>u5 value</dt><dd>{answerValue(submission.geometry.page12.sequence.u5Value)}</dd>
                        <dt>u6</dt><dd>{joinNumbers(submission.geometry.page12.sequence.u6)}</dd>
                        <dt>u6 value</dt><dd>{answerValue(submission.geometry.page12.sequence.u6Value)}</dd>
                        <dt>u7</dt><dd>{joinNumbers(submission.geometry.page12.sequence.u7)}</dd>
                        <dt>u7 value</dt><dd>{answerValue(submission.geometry.page12.sequence.u7Value)}</dd>
                        <dt>u8</dt><dd>{joinNumbers(submission.geometry.page12.sequence.u8)}</dd>
                        <dt>u8 value</dt><dd>{answerValue(submission.geometry.page12.sequence.u8Value)}</dd>
                      </dl>
                    </div>
                    <div>
                      <h3 className={styles.cardSubtitle}>Rumus Suku ke-n</h3>
                      <dl className={styles.keyValue}>
                        <dt>u3</dt><dd>{answerValue(submission.geometry.page12.rightFormula.u3)}</dd>
                        <dt>u4</dt><dd>{answerValue(submission.geometry.page12.rightFormula.u4)}</dd>
                        <dt>u5</dt><dd>{answerValue(submission.geometry.page12.rightFormula.u5)}</dd>
                        <dt>u6</dt><dd>{answerValue(submission.geometry.page12.rightFormula.u6)}</dd>
                        <dt>u7</dt><dd>{answerValue(submission.geometry.page12.rightFormula.u7)}</dd>
                        <dt>u8</dt><dd>{answerValue(submission.geometry.page12.rightFormula.u8)}</dd>
                        <dt>a</dt><dd>{answerValue(submission.geometry.page12.meaning.a)}</dd>
                        <dt>r</dt><dd>{answerValue(submission.geometry.page12.meaning.r)}</dd>
                        <dt>n</dt><dd>{answerValue(submission.geometry.page12.meaning.n)}</dd>
                        <dt>General — first</dt><dd>{answerValue(submission.geometry.page12.generalFormula.first)}</dd>
                        <dt>General — ratio</dt><dd>{answerValue(submission.geometry.page12.generalFormula.ratio)}</dd>
                      </dl>
                    </div>
                  </div>
                ) : (
                  <p className={styles.answerText}>Belum ada jawaban.</p>
                )}
              </section>

              <section className={styles.detailCard + ' ' + styles.full}>
                {pageTitle('Page 13 — Evaluasi', submission.evaluation.status)}
                <p className={styles.answerText}>
                  {submission.evaluation.page13?.experience || 'Belum ada jawaban.'}
                </p>
              </section>
            </div>

            <section className={styles.detailCard} style={{ marginTop: 18 }}>
              <h2 className={styles.cardTitle}>Data Mentah</h2>
              <div className={styles.jsonBox}>
                <pre>{JSON.stringify(submission, null, 2)}</pre>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}

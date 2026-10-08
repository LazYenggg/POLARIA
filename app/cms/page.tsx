'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { adminFetch } from '@/lib/cms-client'
import styles from './cms.module.css'

type CmsSummary = {
  id: string
  groupName: string
  members: string
  className: string
  ownerUid: string
  createdAt: string | null
  updatedAt: string | null
  arithmeticSubmitted: boolean
  geometrySubmitted: boolean
  evaluationSubmitted: boolean
}

type SummaryResponse = {
  submissions: CmsSummary[]
}

function formatDate(value: string | null) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function isComplete(item: CmsSummary) {
  return (
    item.arithmeticSubmitted &&
    item.geometrySubmitted &&
    item.evaluationSubmitted
  )
}

export default function CmsDashboardPage() {
  const [submissions, setSubmissions] = useState<CmsSummary[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'progress' | 'complete'>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSubmissions = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const result = await adminFetch<SummaryResponse>('/api/admin/submissions')
      setSubmissions(result.submissions)
    } catch (error) {
      console.error('[POLARIA CMS Dashboard]', error)
      setError(
        error instanceof Error
          ? error.message
          : 'Tidak dapat memuat submission.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSubmissions()
  }, [loadSubmissions])

  const filteredSubmissions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return submissions.filter((item) => {
      const matchesSearch = !normalizedSearch || [
        item.groupName,
        item.members,
        item.className,
        item.id,
      ].some((value) =>
        String(value).toLowerCase().includes(normalizedSearch)
      )

      if (!matchesSearch) return false

      if (filter === 'complete') return isComplete(item)
      if (filter === 'progress') return !isComplete(item)

      return true
    })
  }, [filter, search, submissions])

  const completeCount = submissions.filter(isComplete).length

  const handleLogout = async () => {
    await signOut(auth)
  }

  return (
    <main className={styles.shell}>
      <div className={styles.container}>
        <header className={styles.headerRow}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard POLARIA</h1>
            <p className={styles.pageDescription}>
              Lihat submission kelompok, cek jawaban lengkap, dan siapkan sesi tes ulang.
            </p>
          </div>

          <div className={styles.buttonRow}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => void loadSubmissions()}
              disabled={loading}
            >
              {loading ? 'Memuat…' : 'Refresh'}
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

        <section className={styles.metrics} aria-label="Ringkasan submission">
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Total Submission</div>
            <div className={styles.metricValue}>{submissions.length}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Lengkap</div>
            <div className={styles.metricValue}>{completeCount}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Masih Berproses</div>
            <div className={styles.metricValue}>{submissions.length - completeCount}</div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>Ditampilkan</div>
            <div className={styles.metricValue}>{filteredSubmissions.length}</div>
          </div>
        </section>

        <section className={styles.panel}>
          <div className={styles.toolbar}>
            <input
              className={styles.input}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari kelompok, anggota, kelas, atau submission ID…"
              aria-label="Cari submission"
            />

            <select
              className={styles.input}
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as typeof filter)
              }
              aria-label="Filter submission"
            >
              <option value="all">Semua status</option>
              <option value="progress">Masih berproses</option>
              <option value="complete">Sudah lengkap</option>
            </select>

            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() => {
                setSearch('')
                setFilter('all')
              }}
            >
              Reset Filter
            </button>
          </div>

          {error && (
            <p className={styles.error} role="alert">
              {error}
            </p>
          )}

          {loading && submissions.length === 0 ? (
            <div className={styles.emptyState}>Memuat submission…</div>
          ) : filteredSubmissions.length === 0 ? (
            <div className={styles.emptyState}>
              Belum ada submission yang cocok dengan filter saat ini.
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.cmsTable}>
                <thead>
                  <tr>
                    <th>Kelompok</th>
                    <th>Kelas</th>
                    <th>Status</th>
                    <th>Terakhir Diubah</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubmissions.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link
                          className={styles.groupLink}
                          href={`/cms/submissions/${item.id}`}
                        >
                          {item.groupName || 'Tanpa nama'}
                        </Link>
                        <div className={styles.muted}>
                          {item.members || '—'}
                        </div>
                      </td>
                      <td>{item.className || '—'}</td>
                      <td>
                        <div className={styles.statusLine}>
                          <span
                            className={`${styles.statusChip} ${item.arithmeticSubmitted ? styles.done : styles.progress}`}
                          >
                            A {item.arithmeticSubmitted ? '✓' : '…'}
                          </span>
                          <span
                            className={`${styles.statusChip} ${item.geometrySubmitted ? styles.done : styles.progress}`}
                          >
                            G {item.geometrySubmitted ? '✓' : '…'}
                          </span>
                          <span
                            className={`${styles.statusChip} ${item.evaluationSubmitted ? styles.done : styles.progress}`}
                          >
                            E {item.evaluationSubmitted ? '✓' : '…'}
                          </span>
                        </div>
                      </td>
                      <td>{formatDate(item.updatedAt)}</td>
                      <td>
                        <Link
                          className={styles.linkButton}
                          href={`/cms/submissions/${item.id}`}
                        >
                          Detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

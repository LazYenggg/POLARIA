'use client'

import { useState } from 'react'
import {
  clearCurrentSubmissionId,
  createSubmission,
  getSubmission,
} from '@/lib/submission'

export default function SubmissionTestPage() {
  const [status, setStatus] = useState('Belum dites.')
  const [submissionId, setSubmissionId] = useState('')
  const [result, setResult] = useState('')

  async function runSubmissionTest() {
    try {
      setStatus('Membuat submission percobaan...')
      setSubmissionId('')
      setResult('')

      const submission = await createSubmission({
        groupName: 'TEST GROUP',
        members: 'Anggota Test',
        className: 'TEST',
      })

      setSubmissionId(submission.id)

      setStatus('Membaca kembali submission dari Firestore...')

      const savedSubmission = await getSubmission(submission.id)

      if (!savedSubmission) {
        throw new Error(
          'Submission berhasil dibuat tetapi tidak ditemukan saat dibaca kembali.'
        )
      }

      setResult(
        JSON.stringify(
          {
            id: savedSubmission.id,
            ownerUid: savedSubmission.ownerUid,
            groupName: savedSubmission.groupName,
            members: savedSubmission.members,
            className: savedSubmission.className,
            arithmeticSubmitted:
              savedSubmission.arithmetic.status.submitted,
            geometrySubmitted:
              savedSubmission.geometry.status.submitted,
            evaluationSubmitted:
              savedSubmission.evaluation.status.submitted,
          },
          null,
          2
        )
      )

      /*
       * Penting:
       * createSubmission() menyimpan submissionId ke localStorage.
       * Kita hapus kembali ID tersebut setelah pengujian supaya
       * test ini tidak mengganggu alur Page 4 yang nanti akan dibuat.
       */
      clearCurrentSubmissionId()

      setStatus('createSubmission + getSubmission berhasil.')
    } catch (error) {
      console.error('[POLARIA Submission Test]', error)

      if (error instanceof Error) {
        setStatus(`Gagal: ${error.message}`)
      } else {
        setStatus('Gagal: unknown error')
      }
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '2rem',
        display: 'grid',
        placeItems: 'center',
        fontFamily: 'Times New Roman, serif',
      }}
    >
      <section
        style={{
          width: 'min(100%, 700px)',
          padding: '2rem',
          border: '1px solid #ccc',
          borderRadius: '16px',
        }}
      >
        <h1 style={{ marginBottom: '1rem' }}>
          POLARIA Submission Test
        </h1>

        <button
          type="button"
          onClick={runSubmissionTest}
          style={{
            padding: '0.8rem 1.2rem',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
        >
          Tes Submission
        </button>

        <p style={{ marginTop: '1.5rem' }}>
          <strong>Status:</strong>
        </p>

        <p>{status}</p>

        {submissionId && (
          <>
            <p>
              <strong>Submission ID:</strong>
            </p>

            <p
              style={{
                wordBreak: 'break-all',
                fontFamily: 'monospace',
              }}
            >
              {submissionId}
            </p>
          </>
        )}

        {result && (
          <>
            <p>
              <strong>Data yang dibaca kembali:</strong>
            </p>

            <pre
              style={{
                padding: '1rem',
                background: '#f5f5f5',
                borderRadius: '10px',
                overflowX: 'auto',
              }}
            >
              {result}
            </pre>
          </>
        )}
      </section>
    </main>
  )
}
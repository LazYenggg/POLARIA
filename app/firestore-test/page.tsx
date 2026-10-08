'use client'

import { useState } from 'react'
import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from '@/lib/firebase'
import { ensureAnonymousUser } from '@/lib/submission'

export default function FirestoreTestPage() {
  const [status, setStatus] = useState('Belum dites.')
  const [documentId, setDocumentId] = useState('')
  const [readResult, setReadResult] = useState('')

  async function runFirestoreTest() {
    try {
      setStatus('1. Memastikan Anonymous User...')
      setDocumentId('')
      setReadResult('')

      const user = await ensureAnonymousUser()

      setStatus('2. Menulis data percobaan ke Firestore...')

      const testData = {
        test: true,
        message: 'POLARIA Firestore connection test',
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      }

      const createdDoc = await addDoc(
        collection(db, 'firebase-tests'),
        testData
      )

      setDocumentId(createdDoc.id)

      setStatus('3. Membaca kembali data dari Firestore...')

      const snapshot = await getDoc(
        doc(db, 'firebase-tests', createdDoc.id)
      )

      if (!snapshot.exists()) {
        throw new Error(
          'Dokumen berhasil dibuat tetapi tidak ditemukan saat dibaca kembali.'
        )
      }

      const data = snapshot.data()

      setReadResult(
        JSON.stringify(
          {
            id: snapshot.id,
            test: data.test,
            message: data.message,
            ownerUid: data.ownerUid,
          },
          null,
          2
        )
      )

      setStatus('Firestore Read + Write berhasil.')
    } catch (error) {
      console.error('[POLARIA Firestore Test]', error)

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
          POLARIA Firestore Test
        </h1>

        <button
          type="button"
          onClick={runFirestoreTest}
          style={{
            padding: '0.8rem 1.2rem',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}
        >
          Tes Firestore
        </button>

        <p style={{ marginTop: '1.5rem' }}>
          <strong>Status:</strong>
        </p>

        <p>{status}</p>

        {documentId && (
          <>
            <p>
              <strong>Document ID:</strong>
            </p>

            <p
              style={{
                wordBreak: 'break-all',
                fontFamily: 'monospace',
              }}
            >
              {documentId}
            </p>
          </>
        )}

        {readResult && (
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
              {readResult}
            </pre>
          </>
        )}
      </section>
    </main>
  )
}
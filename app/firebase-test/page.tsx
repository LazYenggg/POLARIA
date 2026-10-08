'use client'

import { useEffect, useState } from 'react'
import { ensureAnonymousUser } from '@/lib/submission'

export default function FirebaseTestPage() {
  const [status, setStatus] = useState('Mencoba terhubung ke Firebase...')
  const [uid, setUid] = useState('')

  useEffect(() => {
    let active = true

    async function testFirebaseAuth() {
      try {
        const user = await ensureAnonymousUser()

        if (!active) return

        setUid(user.uid)
        setStatus(
          user.isAnonymous
            ? 'Anonymous Authentication berhasil.'
            : 'Firebase terhubung, tetapi user bukan anonymous.'
        )
      } catch (error) {
        if (!active) return

        console.error('[POLARIA Firebase Test]', error)

        setStatus('Gagal terhubung ke Firebase Authentication.')
      }
    }

    testFirebaseAuth()

    return () => {
      active = false
    }
  }, [])

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        fontFamily: 'Times New Roman, serif',
      }}
    >
      <section
        style={{
          width: 'min(100%, 600px)',
          padding: '2rem',
          border: '1px solid #ccc',
          borderRadius: '16px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ marginBottom: '1rem' }}>POLARIA Firebase Test</h1>

        <p>{status}</p>

        {uid && (
          <>
            <p style={{ marginTop: '1rem' }}>
              <strong>Anonymous UID:</strong>
            </p>

            <p
              style={{
                wordBreak: 'break-all',
                fontFamily: 'monospace',
              }}
            >
              {uid}
            </p>
          </>
        )}
      </section>
    </main>
  )
}
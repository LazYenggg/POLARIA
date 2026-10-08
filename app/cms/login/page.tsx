'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import styles from '../cms.module.css'

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase()
}

function getAllowedAdminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_POLARIA_ADMIN_EMAILS ?? ''

  return raw
    .split(',')
    .map((email) => normalizeEmail(email))
    .filter(Boolean)
}

function isAllowedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false

  const allowedEmails = getAllowedAdminEmails()

  return allowedEmails.includes(normalizeEmail(email))
}

export default function CmsLoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get('error')

    if (reason === 'not-admin') {
      setError('Akun ini tidak terdaftar sebagai admin CMS POLARIA.')
    } else if (reason === 'session') {
      setError('Sesi CMS tidak valid. Silakan login kembali.')
    }
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (loading || resetting) return

    setLoading(true)
    setError('')
    setMessage('')

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      )

      const normalizedEmail = normalizeEmail(
        credential.user.email ?? ''
      )

      if (!isAllowedAdminEmail(normalizedEmail)) {
        await auth.signOut()

        throw new Error(
          'Akun ini tidak terdaftar sebagai admin CMS POLARIA.'
        )
      }

      router.replace('/cms')
    } catch (error) {
      console.error('[POLARIA CMS Login]', error)

      const code =
        typeof error === 'object' &&
        error !== null &&
        'code' in error
          ? String((error as { code?: unknown }).code)
          : ''

      const messageFromError =
        error instanceof Error ? error.message : ''

      if (
        code.includes('auth/invalid-credential') ||
        code.includes('auth/user-not-found') ||
        code.includes('auth/wrong-password')
      ) {
        setError('Email atau password admin tidak cocok.')
      } else if (code.includes('auth/too-many-requests')) {
        setError(
          'Terlalu banyak percobaan login. Tunggu sebentar lalu coba lagi.'
        )
      } else {
        setError(
          messageFromError ||
            'Login gagal. Periksa koneksi dan konfigurasi Firebase.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (loading || resetting) return

    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      setError(
        'Isi email admin terlebih dahulu untuk reset password.'
      )
      return
    }

    setResetting(true)
    setError('')
    setMessage('')

    try {
      await sendPasswordResetEmail(auth, normalizedEmail)

      setMessage(
        'Email reset password sudah dikirim. Periksa inbox email admin.'
      )
    } catch (error) {
      console.error(
        '[POLARIA CMS Password Reset]',
        error
      )

      setError(
        'Reset password gagal. Pastikan email admin benar dan provider Email/Password aktif di Firebase.'
      )
    } finally {
      setResetting(false)
    }
  }

  return (
    <main className={styles.loginShell}>
      <section
        className={styles.loginCard}
        aria-label="Login CMS POLARIA"
      >
        <h1 className={styles.brand}>POLARIA CMS</h1>

        <p className={styles.subtitle}>
          Panel pengelolaan submission dan hasil pengerjaan kelompok.
        </p>

        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <label className={styles.field}>
            Email Admin

            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="admin@sekolah.sch.id"
              autoComplete="username"
              required
            />
          </label>

          <label className={styles.field}>
            Password

            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Masukkan password"
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p
              className={styles.error}
              role="alert"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              className={styles.muted}
              role="status"
            >
              {message}
            </p>
          )}

          <div className={styles.buttonRow}>
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={loading || resetting}
            >
              {loading
                ? 'Memeriksa…'
                : 'Masuk CMS'}
            </button>

            <button
              className={styles.secondaryButton}
              type="button"
              onClick={() =>
                void handlePasswordReset()
              }
              disabled={loading || resetting}
            >
              {resetting
                ? 'Mengirim…'
                : 'Lupa Password'}
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
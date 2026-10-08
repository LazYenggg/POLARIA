'use client'

import { auth } from '@/lib/firebase'

export async function adminFetch<T>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<T> {
  const user = auth.currentUser

  if (!user) {
    throw new Error('Sesi admin tidak ditemukan. Silakan login kembali.')
  }

  const makeRequest = async (forceRefresh: boolean) => {
    const token = await user.getIdToken(forceRefresh)
    const headers = new Headers(init.headers)

    headers.set('Authorization', `Bearer ${token}`)
    headers.set('Content-Type', 'application/json')

    return fetch(input, {
      ...init,
      headers,
      cache: 'no-store',
    })
  }

  let response = await makeRequest(false)

  // Satu kali retry dengan token baru untuk mengakomodasi custom claim
  // admin yang baru saja diperbarui.
  if (response.status === 401) {
    response = await makeRequest(true)
  }

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const message =
      payload && typeof payload.error === 'string'
        ? payload.error
        : `Request gagal (${response.status}).`

    throw new Error(message)
  }

  return payload as T
}

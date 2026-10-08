import { randomBytes } from 'node:crypto'
import type { DocumentReference } from 'firebase-admin/firestore'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuthErrorResponse, requireAdmin } from '@/lib/admin-auth'
import { adminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

const RETRY_TTL_MS = 24 * 60 * 60 * 1000

function getBaseUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (configured) {
    return configured.replace(/\/$/, '')
  }

  return new URL(request.url).origin
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const admin = await requireAdmin(request)
    const { id } = await context.params

    if (!id || id.length > 128) {
      return Response.json(
        { error: 'Submission ID tidak valid.' },
        { status: 400 }
      )
    }

    const originalSnapshot = await adminDb
      .collection('submissions')
      .doc(id)
      .get()

    if (!originalSnapshot.exists) {
      return Response.json(
        { error: 'Submission tidak ditemukan.' },
        { status: 404 }
      )
    }

    const original = originalSnapshot.data() ?? {}
    const groupName = String(original.groupName ?? '').trim()
    const members = String(original.members ?? '').trim()
    const className = String(original.className ?? '').trim()

    if (!groupName || !members || !className) {
      return Response.json(
        { error: 'Identitas kelompok pada submission tidak lengkap.' },
        { status: 422 }
      )
    }

    let token = ''
    let tokenRef: DocumentReference | null = null

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = randomBytes(24).toString('base64url')
      const candidateRef = adminDb
        .collection('retrySessions')
        .doc(candidate)
      const candidateSnapshot = await candidateRef.get()

      if (!candidateSnapshot.exists) {
        token = candidate
        tokenRef = candidateRef
        break
      }
    }

    if (!tokenRef || !token) {
      return Response.json(
        { error: 'Tidak dapat membuat kode tes ulang. Coba lagi.' },
        { status: 500 }
      )
    }

    const expiresAt = new Date(Date.now() + RETRY_TTL_MS)

    await tokenRef.set({
      originalSubmissionId: id,
      groupName,
      members,
      className,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
      createdByUid: admin.uid,
      usedAt: null,
      claimedByUid: null,
    })

    const retryUrl = `${getBaseUrl(request)}/page-4?retry=${encodeURIComponent(token)}`

    return Response.json({
      retryToken: token,
      retryUrl,
      expiresAt: expiresAt.toISOString(),
      groupName,
      className,
    })
  } catch (error) {
    return adminAuthErrorResponse(error)
  }
}

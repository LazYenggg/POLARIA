import { FieldValue } from 'firebase-admin/firestore'
import {
  AdminAuthError,
  adminAuthErrorResponse,
  verifyIdTokenFromRequest,
} from '@/lib/admin-auth'
import { adminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TOKEN_MAX_LENGTH = 100

export async function POST(request: Request) {
  try {
    const decoded = await verifyIdTokenFromRequest(request)

    if (decoded.firebase?.sign_in_provider !== 'anonymous') {
      throw new AdminAuthError(
        'Kode tes ulang hanya dapat digunakan dari sesi siswa.',
        403
      )
    }

    const body = await request.json().catch(() => null)
    const token =
      body && typeof body.token === 'string'
        ? body.token.trim()
        : ''

    if (!token || token.length > TOKEN_MAX_LENGTH) {
      return Response.json(
        { error: 'Kode tes ulang tidak valid.' },
        { status: 400 }
      )
    }

    const tokenRef = adminDb
      .collection('retrySessions')
      .doc(token)

    const newSubmissionRef = adminDb
      .collection('submissions')
      .doc()

    const claimed = await adminDb.runTransaction(async (transaction) => {
      const tokenSnapshot = await transaction.get(tokenRef)

      if (!tokenSnapshot.exists) {
        throw new AdminAuthError(
          'Kode tes ulang tidak ditemukan atau sudah tidak berlaku.',
          404
        )
      }

      const tokenData = tokenSnapshot.data() ?? {}

      if (tokenData.usedAt) {
        throw new AdminAuthError(
          'Kode tes ulang sudah digunakan.',
          409
        )
      }

      const expiresAt = tokenData.expiresAt
      const expiresAtDate =
        expiresAt && typeof expiresAt.toDate === 'function'
          ? expiresAt.toDate()
          : expiresAt instanceof Date
            ? expiresAt
            : null

      if (!expiresAtDate || expiresAtDate.getTime() <= Date.now()) {
        throw new AdminAuthError(
          'Kode tes ulang sudah kedaluwarsa.',
          410
        )
      }

      const groupName = String(tokenData.groupName ?? '').trim()
      const members = String(tokenData.members ?? '').trim()
      const className = String(tokenData.className ?? '').trim()

      if (!groupName || !members || !className) {
        throw new AdminAuthError(
          'Data kelompok pada kode tes ulang tidak lengkap.',
          422
        )
      }

      transaction.set(newSubmissionRef, {
        ownerUid: decoded.uid,
        groupName,
        members,
        className,
        arithmetic: {
          status: {
            submitted: false,
            submittedAt: null,
          },
          page7: null,
          page8: null,
          page9: null,
        },
        geometry: {
          status: {
            submitted: false,
            submittedAt: null,
          },
          page10: null,
          page11: null,
          page12: null,
        },
        evaluation: {
          status: {
            submitted: false,
            submittedAt: null,
          },
          page13: null,
        },
        retryFromSubmissionId: tokenData.originalSubmissionId ?? null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      })

      transaction.update(tokenRef, {
        usedAt: FieldValue.serverTimestamp(),
        claimedByUid: decoded.uid,
      })

      return {
        submissionId: newSubmissionRef.id,
        groupName,
        members,
        className,
      }
    })

    return Response.json(claimed)
  } catch (error) {
    return adminAuthErrorResponse(error)
  }
}

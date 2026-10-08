import type { DocumentData } from 'firebase-admin/firestore'
import { adminAuthErrorResponse, requireAdmin } from '@/lib/admin-auth'
import { adminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function timestampToIso(value: unknown): string | null {
  if (!value) return null

  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  ) {
    try {
      return (value as { toDate: () => Date }).toDate().toISOString()
    } catch {
      return null
    }
  }

  if (value instanceof Date) return value.toISOString()

  return null
}

function serializeSummary(
  id: string,
  data: DocumentData
) {
  const arithmetic = data.arithmetic ?? {}
  const geometry = data.geometry ?? {}
  const evaluation = data.evaluation ?? {}

  return {
    id,
    groupName: data.groupName ?? '',
    members: data.members ?? '',
    className: data.className ?? '',
    ownerUid: data.ownerUid ?? '',
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    arithmeticSubmitted: Boolean(arithmetic.status?.submitted),
    arithmeticSubmittedAt: timestampToIso(
      arithmetic.status?.submittedAt
    ),
    geometrySubmitted: Boolean(geometry.status?.submitted),
    geometrySubmittedAt: timestampToIso(
      geometry.status?.submittedAt
    ),
    evaluationSubmitted: Boolean(evaluation.status?.submitted),
    evaluationSubmittedAt: timestampToIso(
      evaluation.status?.submittedAt
    ),
  }
}

export async function GET(request: Request) {
  try {
    await requireAdmin(request)

    const snapshot = await adminDb.collection('submissions').get()

    const submissions = snapshot.docs
      .map((document) =>
        serializeSummary(document.id, document.data())
      )
      .sort((a, b) => {
        const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0
        const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0
        return bTime - aTime
      })

    return Response.json({ submissions })
  } catch (error) {
    return adminAuthErrorResponse(error)
  }
}

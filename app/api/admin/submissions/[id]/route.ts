import type { DocumentData } from 'firebase-admin/firestore'
import { adminAuthErrorResponse, requireAdmin } from '@/lib/admin-auth'
import { adminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{ id: string }>
}

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

function serializeSubmission(
  id: string,
  data: DocumentData
) {
  const arithmetic = data.arithmetic ?? {}
  const geometry = data.geometry ?? {}
  const evaluation = data.evaluation ?? {}

  return {
    ...data,
    id,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    arithmetic: {
      ...arithmetic,
      status: {
        ...(arithmetic.status ?? {}),
        submittedAt: timestampToIso(arithmetic.status?.submittedAt),
      },
    },
    geometry: {
      ...geometry,
      status: {
        ...(geometry.status ?? {}),
        submittedAt: timestampToIso(geometry.status?.submittedAt),
      },
    },
    evaluation: {
      ...evaluation,
      status: {
        ...(evaluation.status ?? {}),
        submittedAt: timestampToIso(evaluation.status?.submittedAt),
      },
    },
  }
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    await requireAdmin(request)

    const { id } = await context.params

    if (!id || id.length > 128) {
      return Response.json(
        { error: 'Submission ID tidak valid.' },
        { status: 400 }
      )
    }

    const snapshot = await adminDb
      .collection('submissions')
      .doc(id)
      .get()

    if (!snapshot.exists) {
      return Response.json(
        { error: 'Submission tidak ditemukan.' },
        { status: 404 }
      )
    }

    return Response.json({
      submission: serializeSubmission(
        snapshot.id,
        snapshot.data() ?? {}
      ),
    })
  } catch (error) {
    return adminAuthErrorResponse(error)
  }
}

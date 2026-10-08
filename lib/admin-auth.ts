import { adminAuth } from '@/lib/firebase-admin'
import type { DecodedIdToken } from 'firebase-admin/auth'

export class AdminAuthError extends Error {
  status: number

  constructor(
    message: string,
    status = 401
  ) {
    super(message)
    this.name = 'AdminAuthError'
    this.status = status
  }
}

function getAllowedAdminEmails(): string[] {
  const raw =
    process.env.POLARIA_ADMIN_EMAILS ??
    process.env.POLARIA_ADMIN_EMAIL ??
    ''

  return raw
    .split(',')
    .map((email) =>
      email.trim().toLowerCase()
    )
    .filter(Boolean)
}

export function isAllowedAdminEmail(
  email: string | null | undefined
): boolean {
  if (!email) return false

  const allowedEmails =
    getAllowedAdminEmails()

  if (allowedEmails.length === 0) {
    return false
  }

  return allowedEmails.includes(
    email.trim().toLowerCase()
  )
}

export function getBearerToken(
  request: Request
): string | null {
  const header =
    request.headers.get('authorization')

  if (!header) return null

  const [scheme, token] =
    header.split(' ')

  if (
    scheme !== 'Bearer' ||
    !token
  ) {
    return null
  }

  return token
}

export async function verifyIdTokenFromRequest(
  request: Request
): Promise<DecodedIdToken> {
  const token =
    getBearerToken(request)

  if (!token) {
    throw new AdminAuthError(
      'Authentication required.'
    )
  }

  try {
    return await adminAuth.verifyIdToken(
      token
    )
  } catch (error) {
    console.error(
      '[POLARIA Admin Auth] Token verification failed',
      error
    )

    throw new AdminAuthError(
      'Invalid or expired authentication token.'
    )
  }
}

export async function requireAdmin(
  request: Request
): Promise<DecodedIdToken> {
  const decoded =
    await verifyIdTokenFromRequest(request)

  if (
    !isAllowedAdminEmail(decoded.email)
  ) {
    throw new AdminAuthError(
      'Admin access required.',
      403
    )
  }

  return decoded
}

export function adminAuthErrorResponse(
  error: unknown
): Response {
  if (
    error instanceof AdminAuthError
  ) {
    return Response.json(
      {
        error: error.message,
      },
      {
        status: error.status,
      }
    )
  }

  console.error(
    '[POLARIA Admin Auth] Unexpected error',
    error
  )

  return Response.json(
    {
      error:
        'Internal authentication error.',
    },
    {
      status: 500,
    }
  )
}
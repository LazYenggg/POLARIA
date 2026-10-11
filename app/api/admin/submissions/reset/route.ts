
import {
  adminAuthErrorResponse,
  requireAdmin,
} from '@/lib/admin-auth'
import { adminDb } from '@/lib/firebase-admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const RESET_CONFIRMATION_PHRASE = 'HAPUS SEMUA DATA'
const BATCH_LIMIT = 400

/**
 * Menghapus seluruh dokumen dalam satu koleksi secara bertahap.
 *
 * Setiap batch dibatasi 400 dokumen agar tidak melewati batas
 * maksimum operasi tulis dalam satu batch Firestore.
 */
async function deleteCollection(collectionName: string): Promise<number> {
  let totalDeleted = 0

  while (true) {
    const snapshot = await adminDb
      .collection(collectionName)
      .limit(BATCH_LIMIT)
      .get()

    if (snapshot.empty) {
      break
    }

    const batch = adminDb.batch()

    for (const document of snapshot.docs) {
      batch.delete(document.ref)
    }

    await batch.commit()

    totalDeleted += snapshot.size

    // Jika batch tidak penuh, tidak ada dokumen lagi saat query ini
    // dilakukan, sehingga proses koleksi ini selesai.
    if (snapshot.size < BATCH_LIMIT) {
      break
    }
  }

  return totalDeleted
}

export async function POST(request: Request) {
  try {
    // Admin harus login dan terdaftar dalam whitelist email server.
    await requireAdmin(request)

    const body = await request.json().catch(() => null)

    const confirmation =
      body && typeof body.confirmation === 'string'
        ? body.confirmation.trim().toUpperCase()
        : ''

    // Proteksi tambahan di server, bukan hanya pada tombol UI.
    if (confirmation !== RESET_CONFIRMATION_PHRASE) {
      return Response.json(
        {
          error:
            `Konfirmasi tidak valid. Ketik "${RESET_CONFIRMATION_PHRASE}" untuk melanjutkan.`,
        },
        { status: 400 }
      )
    }

    // Hapus data kelompok dan token tes ulang.
    // Koleksi lain tidak disentuh.
    const [deletedSubmissions, deletedRetrySessions] =
      await Promise.all([
        deleteCollection('submissions'),
        deleteCollection('retrySessions'),
      ])

    console.info('[POLARIA CMS Reset]', {
      deletedSubmissions,
      deletedRetrySessions,
    })

    return Response.json({
      ok: true,
      deleted: {
        submissions: deletedSubmissions,
        retrySessions: deletedRetrySessions,
      },
    })
  } catch (error) {
    return adminAuthErrorResponse(error)
  }
}

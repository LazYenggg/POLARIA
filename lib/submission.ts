import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import {
  onAuthStateChanged,
  signInAnonymously,
  type User,
} from 'firebase/auth'

import { auth, db } from './firebase'
import type {
  EvaluationAnswers,
  GroupIdentity,
  Page7Answers,
  Page8Answers,
  Page9Answers,
  Page10Answers,
  Page11Answers,
  Page12Answers,
  SubmissionDocument,
} from './types'
import {
  POLARIA_GROUP_IDENTITY_KEY,
  POLARIA_SUBMISSION_ID_KEY,
} from './types'

const SUBMISSIONS_COLLECTION = 'submissions'


/* =========================================================
   AUTHENTICATION
   ========================================================= */

/**
 * Resolve the currently signed-in Firebase user.
 */
export function getCurrentUser(): User | null {
  return auth.currentUser
}

/**
 * Ensure the student has a Firebase anonymous account.
 *
 * This does not create a CMS account.
 */
export async function ensureAnonymousUser(): Promise<User> {
  const existingUser = auth.currentUser

  if (existingUser) {
    return existingUser
  }

  const credential = await signInAnonymously(auth)

  return credential.user
}

/**
 * Wait for Firebase to restore the current auth session.
 */
export function waitForAuthState(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}


/* =========================================================
   LOCAL SESSION ID
   ========================================================= */

export function getCurrentSubmissionId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(
    POLARIA_SUBMISSION_ID_KEY
  )
}

export function setCurrentSubmissionId(
  submissionId: string
): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(
    POLARIA_SUBMISSION_ID_KEY,
    submissionId
  )
}

export function clearCurrentSubmissionId(): void {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(
    POLARIA_SUBMISSION_ID_KEY
  )
}


/* =========================================================
   PAGE 4 LOCAL IDENTITY
   ========================================================= */

export function getLocalGroupIdentity(): GroupIdentity | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(
    POLARIA_GROUP_IDENTITY_KEY
  )

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GroupIdentity>

    return {
      groupName: parsed.groupName ?? '',
      members: parsed.members ?? '',
      className: parsed.className ?? '',
    }
  } catch {
    return null
  }
}


/* =========================================================
   CREATE SUBMISSION
   ========================================================= */

/**
 * Create the single Firestore document that represents one
 * student-group session.
 *
 * The visible identity is the group name. Firebase's generated
 * document ID is used only as the technical session ID.
 */
export async function createSubmission(
  identity: GroupIdentity
): Promise<string> {
  const user = await ensureAnonymousUser()

  const ref = await addDoc(
    collection(db, SUBMISSIONS_COLLECTION),
    {
      ownerUid: user.uid,

      groupName: identity.groupName.trim(),
      members: identity.members.trim(),
      className: identity.className.trim(),

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

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  )

  setCurrentSubmissionId(ref.id)

  return ref.id
}


/* =========================================================
   LOAD SUBMISSION
   ========================================================= */

export async function getSubmission(
  submissionId = getCurrentSubmissionId()
): Promise<SubmissionDocument | null> {
  if (!submissionId) {
    return null
  }

  const snapshot = await getDoc(
    doc(db, SUBMISSIONS_COLLECTION, submissionId)
  )

  if (!snapshot.exists()) {
    return null
  }

  return snapshot.data() as SubmissionDocument
}


/* =========================================================
   PAGE 4 / IDENTITY
   ========================================================= */

export async function updateGroupIdentity(
  identity: GroupIdentity,
  submissionId = getCurrentSubmissionId()
): Promise<void> {
  if (!submissionId) {
    throw new Error(
      '[POLARIA] Cannot update identity without a submission ID.'
    )
  }

  await updateDoc(
    doc(db, SUBMISSIONS_COLLECTION, submissionId),
    {
      groupName: identity.groupName.trim(),
      members: identity.members.trim(),
      className: identity.className.trim(),
      updatedAt: serverTimestamp(),
    }
  )
}


/* =========================================================
   ARITHMETIC PAGE SAVES
   ========================================================= */

export async function savePage7Answers(
  answers: Page7Answers,
  submissionId = getCurrentSubmissionId()
): Promise<void> {
  if (!submissionId) {
    throw new Error('[POLARIA] No active submission.')
  }

  await updateDoc(
    doc(db, SUBMISSIONS_COLLECTION, submissionId),
    {
      'arithmetic.page7': answers,
      updatedAt: serverTimestamp(),
    }
  )
}

export async function savePage8Answers(
  answers: Page8Answers,
  submissionId = getCurrentSubmissionId()
): Promise<void> {
  if (!submissionId) {
    throw new Error('[POLARIA] No active submission.')
  }

  await updateDoc(
    doc(db, SUBMISSIONS_COLLECTION, submissionId),
    {
      'arithmetic.page8': answers,
      updatedAt: serverTimestamp(),
    }
  )
}

export async function savePage9Answers(
  answers: Page9Answers,
  submissionId = getCurrentSubmissionId()
): Promise<void> {
  if (!submissionId) {
    throw new Error('[POLARIA] No active submission.')
  }

  await updateDoc(
    doc(db, SUBMISSIONS_COLLECTION, submissionId),
    {
      'arithmetic.page9': answers,
      updatedAt: serverTimestamp(),
    }
  )
}


/* =========================================================
   ARITHMETIC SUBMIT
   ========================================================= */

/**
 * Marks the complete Arithmetic section as submitted.
 * Page 9 will call this after confirmation.
 */
export async function submitArithmetic(
  answers: Page9Answers,
  submissionId = getCurrentSubmissionId()
): Promise<void> {
  if (!submissionId) {
    throw new Error('[POLARIA] No active submission.')
  }

  await updateDoc(
    doc(db, SUBMISSIONS_COLLECTION, submissionId),
    {
      'arithmetic.page9': answers,
      'arithmetic.status.submitted': true,
      'arithmetic.status.submittedAt': serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  )
}


/* =========================================================
   GEOMETRY PAGE SAVES
   ========================================================= */

export async function savePage10Answers(
  answers: Page10Answers,
  submissionId = getCurrentSubmissionId()
): Promise<void> {
  if (!submissionId) {
    throw new Error('[POLARIA] No active submission.')
  }

  await updateDoc(
    doc(db, SUBMISSIONS_COLLECTION, submissionId),
    {
      'geometry.page10': answers,
      updatedAt: serverTimestamp(),
    }
  )
}

export async function savePage11Answers(
  answers: Page11Answers,
  submissionId = getCurrentSubmissionId()
): Promise<void> {
  if (!submissionId) {
    throw new Error('[POLARIA] No active submission.')
  }

  await updateDoc(
    doc(db, SUBMISSIONS_COLLECTION, submissionId),
    {
      'geometry.page11': answers,
      updatedAt: serverTimestamp(),
    }
  )
}

export async function savePage12Answers(
  answers: Page12Answers,
  submissionId = getCurrentSubmissionId()
): Promise<void> {
  if (!submissionId) {
    throw new Error('[POLARIA] No active submission.')
  }

  await updateDoc(
    doc(db, SUBMISSIONS_COLLECTION, submissionId),
    {
      'geometry.page12': answers,
      updatedAt: serverTimestamp(),
    }
  )
}


/* =========================================================
   GEOMETRY SUBMIT
   ========================================================= */

/**
 * Marks the complete Geometry section as submitted.
 * Page 12 will call this after confirmation.
 */
export async function submitGeometry(
  answers: Page12Answers,
  submissionId = getCurrentSubmissionId()
): Promise<void> {
  if (!submissionId) {
    throw new Error('[POLARIA] No active submission.')
  }

  await updateDoc(
    doc(db, SUBMISSIONS_COLLECTION, submissionId),
    {
      'geometry.page12': answers,
      'geometry.status.submitted': true,
      'geometry.status.submittedAt': serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  )
}


/* =========================================================
   EVALUATION
   ========================================================= */

export async function saveEvaluationAnswers(
  answers: EvaluationAnswers,
  submissionId = getCurrentSubmissionId()
): Promise<void> {
  if (!submissionId) {
    throw new Error('[POLARIA] No active submission.')
  }

  await updateDoc(
    doc(db, SUBMISSIONS_COLLECTION, submissionId),
    {
      'evaluation.page13': answers,
      'evaluation.status.submitted': true,
      'evaluation.status.submittedAt': serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  )
}

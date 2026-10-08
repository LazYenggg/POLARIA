import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

/**
 * Firebase client configuration.
 *
 * Values come from the Web App configuration shown in:
 * Firebase Console → Project settings → Your apps → Web app.
 *
 * They are read from NEXT_PUBLIC_* environment variables so the same
 * code can be used locally and after deployment to Vercel.
 */
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const requiredConfig = [
  ['NEXT_PUBLIC_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  [
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    firebaseConfig.storageBucket,
  ],
  [
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    firebaseConfig.messagingSenderId,
  ],
  ['NEXT_PUBLIC_FIREBASE_APP_ID', firebaseConfig.appId],
] as const

for (const [name, value] of requiredConfig) {
  if (!value) {
    throw new Error(
      `[POLARIA Firebase] Missing environment variable: ${name}`
    )
  }
}

/**
 * Reuse the existing Firebase app during Next.js Fast Refresh.
 */
export const firebaseApp =
  getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)

/**
 * Firebase Authentication instance.
 * Students will use anonymous authentication.
 * CMS users will later use a permanent sign-in method.
 */
export const auth = getAuth(firebaseApp)

/**
 * Cloud Firestore instance.
 */
export const db = getFirestore(firebaseApp)

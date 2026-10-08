# POLARIA Firebase integration

## Included

- `lib/firebase.ts` initializes Firebase from `NEXT_PUBLIC_FIREBASE_*` environment variables.
- `lib/submission.ts` handles anonymous auth, group submission creation, answer saves, and section submission.
- `lib/types.ts` defines the Firestore data shapes.
- Pages 4, 7, 8, 9, 10, 11, 12, and 13 use the same technical `submissionId`.
- Submitted Arithmetic, Geometry, and Evaluation answers are loaded back and rendered read-only when those pages are reopened.
- `firestore.rules` contains owner-only access plus section-locking behavior.
- Firebase test routes are not included in this final build.

## Environment

Keep the existing `.env.local` in the project root. It is intentionally not included in this archive.

Use the `NEXT_PUBLIC_FIREBASE_*` values from the Firebase Web App configuration.

## Firestore structure

`submissions/{submissionId}`

- `ownerUid`
- `groupName`
- `members`
- `className`
- `arithmetic`
  - `status`
  - `page7`
  - `page8`
  - `page9`
- `geometry`
  - `status`
  - `page10`
  - `page11`
  - `page12`
- `evaluation`
  - `status`
  - `page13`
- `createdAt`
- `updatedAt`

## Student flow

Page 4 creates the submission document once and stores its technical ID locally.

Page 7 and Page 8 save their current answers before moving forward or backward.

Page 9 asks for confirmation, submits the Arithmetic section, locks all Arithmetic pages, and returns to Page 5.

Page 10 and Page 11 save their current answers before moving between pages.

Page 12 asks for confirmation, submits the Geometry section, locks all Geometry pages, and returns to Page 5.

Page 13 asks for confirmation, saves/submits the Evaluation, and returns to Page 5.

When a section is already submitted, its saved answers are loaded from Firestore and the relevant inputs are read-only/disabled.

## Security Rules

The final rules are in `firestore.rules`.

Publish the contents of that file in Firebase Console → Firestore Database → Rules before production use. The rules prevent a student from modifying a section after that section has been submitted.

## Dependency note

`package.json` includes Firebase `12.19.0`.

This archive intentionally does not overwrite the project's existing `pnpm-lock.yaml`, so an already Firebase-enabled lockfile on the current project is preserved. When starting from a fresh folder instead, run `pnpm install` once before `pnpm dev`.

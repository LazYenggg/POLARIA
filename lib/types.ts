import type { Timestamp } from 'firebase/firestore'

/* =========================================================
   SHARED PRIMITIVE TYPES
   ========================================================= */

/**
 * A numeric answer in Firestore is stored as a number.
 * Empty/unanswered numeric fields are stored as null.
 */
export type NumericAnswer = number | null

/**
 * Checkbox / yes-no answer.
 * null means the student has not selected an option yet.
 */
export type BooleanAnswer = boolean | null


/* =========================================================
   GROUP IDENTITY — PAGE 4
   ========================================================= */

export type GroupIdentity = {
  groupName: string
  members: string
  className: string
}


/* =========================================================
   ARITHMETIC — PAGE 7
   ========================================================= */

export type Page7Answers = {
  opinion: string
}


/* =========================================================
   ARITHMETIC — PAGE 8
   ========================================================= */

export type ArithmeticTableRow = {
  stage: number
  seedCount: NumericAnswer
  difference: NumericAnswer
}

export type Page8Answers = {
  table: ArithmeticTableRow[]
  stageEightSeedCount: NumericAnswer
  sameDifference: BooleanAnswer
  differenceValue: NumericAnswer
}


/* =========================================================
   ARITHMETIC — PAGE 9
   ========================================================= */

export type Page9SequenceAnswers = {
  u3: NumericAnswer[]
  u4: NumericAnswer[]

  u5Value: NumericAnswer
  u5: NumericAnswer[]

  u6Value: NumericAnswer
  u6: NumericAnswer[]

  u7Value: NumericAnswer
  u7: NumericAnswer[]

  u8Value: NumericAnswer
  u8: NumericAnswer[]
}

export type Page9RightFormulaAnswers = {
  u5: NumericAnswer
  u6: NumericAnswer
  u7: NumericAnswer
  u8: NumericAnswer
}

export type Page9MeaningAnswers = {
  a: string
  b: string
  n: string
}

export type Page9AlternativeFormulaAnswers = {
  first: NumericAnswer
  middle: NumericAnswer
  last: NumericAnswer
}

export type Page9Answers = {
  sequence: Page9SequenceAnswers
  rightFormula: Page9RightFormulaAnswers
  meaning: Page9MeaningAnswers
  alternativeFormula: Page9AlternativeFormulaAnswers
}


/* =========================================================
   GEOMETRY — PAGE 10
   ========================================================= */

export type Page10Answers = {
  opinion: string
}


/* =========================================================
   GEOMETRY — PAGE 11
   ========================================================= */

export type GeometryTableRow = {
  week: number
  seedCount: NumericAnswer
  ratio: NumericAnswer
}

export type Page11Answers = {
  table: GeometryTableRow[]
  weekEightSeedCount: NumericAnswer
  sameRatio: BooleanAnswer
  ratioValue: NumericAnswer
}


/* =========================================================
   GEOMETRY — PAGE 12
   ========================================================= */

export type Page12SequenceAnswers = {
  u3: NumericAnswer[]
  u4: NumericAnswer[]

  u5Value: NumericAnswer
  u5: NumericAnswer[]

  u6Value: NumericAnswer
  u6: NumericAnswer[]

  u7Value: NumericAnswer
  u7: NumericAnswer[]

  u8Value: NumericAnswer
  u8: NumericAnswer[]
}

export type Page12RightFormulaAnswers = {
  u3: NumericAnswer
  u4: NumericAnswer
  u5: NumericAnswer
  u6: NumericAnswer
  u7: NumericAnswer
  u8: NumericAnswer
}

export type Page12MeaningAnswers = {
  a: string
  r: string
  n: string
}

export type Page12GeneralFormulaAnswers = {
  first: NumericAnswer
  ratio: NumericAnswer
}

export type Page12Answers = {
  sequence: Page12SequenceAnswers
  rightFormula: Page12RightFormulaAnswers
  meaning: Page12MeaningAnswers
  generalFormula: Page12GeneralFormulaAnswers
}


/* =========================================================
   EVALUATION — PAGE 13
   ========================================================= */

export type EvaluationAnswers = {
  experience: string
}


/* =========================================================
   SECTION SUBMISSION STATUS
   ========================================================= */

export type SectionStatus = {
  submitted: boolean
  submittedAt: Timestamp | null
}


/* =========================================================
   FIRESTORE SUBMISSION DOCUMENT
   ========================================================= */

export type ArithmeticSubmission = {
  status: SectionStatus
  page7: Page7Answers | null
  page8: Page8Answers | null
  page9: Page9Answers | null
}

export type GeometrySubmission = {
  status: SectionStatus
  page10: Page10Answers | null
  page11: Page11Answers | null
  page12: Page12Answers | null
}

export type EvaluationSubmission = {
  status: SectionStatus
  page13: EvaluationAnswers | null
}

export type SubmissionDocument = GroupIdentity & {
  ownerUid: string

  arithmetic: ArithmeticSubmission
  geometry: GeometrySubmission
  evaluation: EvaluationSubmission

  createdAt: Timestamp | null
  updatedAt: Timestamp | null

  /** Present only for sessions created through the CMS retry flow. */
  retryFromSubmissionId?: string | null
}


/* =========================================================
   SESSION STORAGE KEYS
   ========================================================= */

export const POLARIA_SUBMISSION_ID_KEY =
  'polaria-submission-id'

export const POLARIA_GROUP_IDENTITY_KEY =
  'polaria-group-identity'

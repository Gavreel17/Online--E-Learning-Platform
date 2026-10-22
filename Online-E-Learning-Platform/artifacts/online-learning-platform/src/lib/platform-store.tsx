import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import {
  DEFAULT_SUBJECTS,
  DEFAULT_LESSONS,
  DEFAULT_QUIZZES,
  DEFAULT_QUESTIONS,
  getSubjectLessons as filterSubjectLessonsHelper,
  getSubjectQuestions as filterSubjectQuestionsHelper,
  isQuestionUsedInQuiz,
  questionBankItemToQuizQuestion,
} from './curriculum-data';

export {
  DEFAULT_SUBJECTS,
  DEFAULT_LESSONS,
  DEFAULT_QUIZZES,
  DEFAULT_QUESTIONS,
  filterSubjectLessonsHelper,
  filterSubjectQuestionsHelper,
  isQuestionUsedInQuiz,
  questionBankItemToQuizQuestion,
};

export interface SubjectItem {
  id: number;
  name: string;
  code: string;
  description: string;
  instructor?: string;
  instructorEmail?: string;
  department?: string;
  assignedTeacherIds?: string[];
  assignedTeacherEmails?: string[];
  lessonCount: number;
  quizCount: number;
  progress: number;
  status?: string;
}

export interface LessonItem {
  id: number;
  subjectId: number;
  subjectName: string;
  title: string;
  description: string;
  content: string;
  objectives: string[];
  completed: boolean;
  progress: number;
  published?: boolean;
  lessonType?: 'text' | 'pdf' | 'video';
  durationMinutes?: number;
  videoUrl?: string | null;
  materialUrl?: string | null;
  materialName?: string | null;
  materialSize?: string | null;
  materialType?: string | null;
  submissionName?: string | null;
  submissionUrl?: string | null;
  submissionSize?: string | null;
  submissionDate?: string | null;
  status?: string;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'identification' | 'essay';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type QuestionStatus = 'published' | 'draft';

export interface QuestionBankChoice {
  id: string;
  value: string;
  label: string;
}

export interface QuizQuestionItem {
  id: number;
  number?: number;
  questionBankId?: number;
  text: string;
  type?: QuestionType | string;
  points?: number;
  choices?: { id: string; value: string; label: string }[];
  correctAnswer?: string;
  acceptedAnswers?: string[];
  sampleAnswerRubric?: string;
  explanation?: string;
}

export interface QuizItem {
  id: number;
  subjectId: number;
  subjectName: string;
  title: string;
  description: string;
  questionCount: number;
  passingScore: number;
  timeLimit?: number;
  attempts: number;
  bestScore?: number | null;
  attachmentName?: string | null;
  attachmentUrl?: string | null;
  attachmentSize?: string | null;
  attachmentType?: string | null;
  status?: string;
  questions?: QuizQuestionItem[];
}

export interface QuestionBankItem {
  id: number;
  text: string;
  type: QuestionType;
  subjectId: number;
  subjectName: string;
  lessonId?: number | null;
  lessonTitle?: string | null;
  choices?: QuestionBankChoice[];
  correctAnswer?: string;
  acceptedAnswers?: string[];
  sampleAnswerRubric?: string;
  explanation?: string;
  points: number;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  createdAt?: string;
  updatedAt?: string;
  authorName?: string;
}

export interface StudentAnswerItem {
  questionId: number;
  questionText: string;
  questionType: QuestionType | string;
  studentAnswer: string;
  correctAnswer?: string;
  acceptedAnswers?: string[];
  sampleAnswerRubric?: string;
  pointsPossible: number;
  pointsAwarded: number;
  isCorrect?: boolean;
  status: 'graded' | 'pending_manual_grading';
  teacherFeedback?: string;
}

export interface QuizResultItem {
  id: number;
  quizId?: number;
  quizName: string;
  subjectName: string;
  studentName?: string;
  correctAnswers: number;
  incorrectAnswers: number;
  passed: boolean;
  percentage: number;
  dateTaken: string;
  startedAt?: string;
  submittedAt?: string;
  timeLimit?: number;
  timeSpentSeconds?: number;
  submissionStatus?: 'Submitted' | 'Auto-Submitted – Time Expired';
  submissionName?: string | null;
  submissionUrl?: string | null;
  submissionSize?: string | null;
  answersDetail?: StudentAnswerItem[];
  needsGrading?: boolean;
  gradedBy?: string;
  gradedAt?: string;
  passingScore?: number;
  totalPointsEarned?: number;
  totalPointsPossible?: number;
}

export interface ActiveQuizSession {
  quizId: number;
  studentEmail: string;
  studentName: string;
  startedAt: string;
  deadline: string;
  timeLimit: number; // in minutes
  answers: Record<number, string>;
  isSubmitted: boolean;
  submissionStatus?: 'Submitted' | 'Auto-Submitted – Time Expired';
}

export interface StudentRecord {
  id: number | string;
  fullName: string;
  studentId: string;
  email: string;
  username?: string;
  contactNumber?: string;
  password?: string;
  status: 'active' | 'inactive';
  progress: number;
  source?: 'online_registration' | 'admin_enrolled';
  registeredAt: string;
  lastLoginAt?: string | null;
  lastActive?: string;
}

export interface LoginActivityRecord {
  id: number | string;
  studentName: string;
  email: string;
  studentId: string;
  loginDate: string;
  loginTime: string;
  loginAt: string;
  timestamp: number;
  status: 'success';
}

export interface TeacherApplicationRecord {
  applicationId: string;
  userId: string;
  fullName: string;
  teacherId: string;
  email: string;
  username: string;
  contactNumber: string;
  department: string;
  credentialFile?: { name: string; url: string; size?: string; type?: string } | null;
  password?: string;
  applicationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
}

export type AssignmentSubmissionType =
  | 'video'
  | 'presentation'
  | 'pdf'
  | 'document'
  | 'image'
  | 'text'
  | 'code'
  | 'link';

export interface AssignmentItem {
  id: string;
  title: string;
  description: string;
  subjectId: number;
  subjectName: string;
  relatedLessonId?: number | null;
  relatedLessonTitle?: string | null;
  teacherId: string;
  teacherName: string;
  assignedClassOrStudents?: string;
  referenceMaterials?: { name: string; url: string; size?: string; type?: string }[];
  startDateTime: string;
  dueDateTime: string;
  maxScore: number;
  acceptedSubmissionTypes: AssignmentSubmissionType[];
  maxFileSizeMB: number;
  allowLateSubmissions: boolean;
  allowResubmission: boolean;
  status: 'draft' | 'published' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentSubmissionItem {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  subjectId: number;
  subjectName: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  submissionType: AssignmentSubmissionType;
  file?: { name: string; url: string; size?: string; type?: string } | null;
  textAnswer?: string;
  externalLink?: string;
  submittedAt: string;
  isLate: boolean;
  status: 'submitted' | 'graded' | 'returned_for_revision';
  score?: number | null;
  maxScore: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  version?: number;
  history?: {
    submittedAt: string;
    submissionType: AssignmentSubmissionType;
    fileName?: string;
    fileUrl?: string;
    textAnswer?: string;
    feedback?: string;
  }[];
}

export type AssignmentAuditEventType =
  | 'assignment_created'
  | 'assignment_published'
  | 'assignment_updated'
  | 'assignment_closed'
  | 'submission_received'
  | 'resubmission_received'
  | 'assignment_graded'
  | 'feedback_added'
  | 'returned_for_revision';

export interface AssignmentAuditEvent {
  id: string;
  eventType: AssignmentAuditEventType;
  userId: string;
  userName: string;
  userRole: 'teacher' | 'student' | 'admin';
  assignmentId: string;
  assignmentTitle: string;
  submissionId?: string;
  subjectId?: number;
  subjectName?: string;
  timestamp: string;
  details: string;
}

export interface ActivityItem {
  id: number;
  title: string;
  message: string;
}

interface PlatformStoreContextType {
  // Data
  subjects: SubjectItem[];
  lessons: LessonItem[];
  quizzes: QuizItem[];
  questions: QuestionBankItem[];
  results: QuizResultItem[];
  students: StudentRecord[];
  loginActivities: LoginActivityRecord[];
  recentActivity: ActivityItem[];
  teacherApplications: TeacherApplicationRecord[];
  assignments: AssignmentItem[];
  assignmentSubmissions: AssignmentSubmissionItem[];
  assignmentAuditLogs: AssignmentAuditEvent[];

  // Assignment Actions
  createAssignment: (data: Omit<AssignmentItem, 'id' | 'createdAt' | 'updatedAt'>) => AssignmentItem;
  updateAssignment: (id: string, data: Partial<AssignmentItem>) => void;
  publishAssignment: (id: string) => void;
  deleteAssignment: (id: string) => void;
  submitAssignment: (data: {
    assignmentId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    submissionType: AssignmentSubmissionType;
    file?: { name: string; url: string; size?: string; type?: string } | null;
    textAnswer?: string;
    externalLink?: string;
  }) => { success: boolean; message: string };
  gradeAssignmentSubmission: (
    submissionId: string,
    data: { score: number; feedback: string; status?: 'graded' | 'returned_for_revision'; teacherName: string }
  ) => void;
  returnSubmissionForRevision: (submissionId: string, data: { feedback: string; teacherName: string }) => void;

  // Teacher Application Actions
  addTeacherApplication: (data: {
    fullName: string;
    teacherId?: string;
    email: string;
    username: string;
    contactNumber: string;
    department: string;
    credentialFile?: { name: string; url: string; size?: string; type?: string } | null;
    password?: string;
  }) => TeacherApplicationRecord;
  approveTeacherApplication: (applicationId: string, adminName?: string) => void;
  rejectTeacherApplication: (applicationId: string, reason?: string, adminName?: string) => void;
  getTeacherApplication: (identifier: string) => TeacherApplicationRecord | undefined;

  // Student Actions
  completeLesson: (id: number) => void;
  resetLessonProgress: (id: number) => void;
  uploadLessonSubmission: (lessonId: number, data: { name: string; url: string; size?: string }) => void;
  removeLessonSubmission: (lessonId: number) => void;
  submitQuiz: (
    quizId: number,
    answers: Record<number, string>,
    studentName?: string,
    submission?: { name: string; url: string; size?: string } | null,
    isTimeExpired?: boolean,
    startedAt?: string
  ) => {
    percentage: number;
    correctAnswers: number;
    totalQuestions: number;
    passed: boolean;
    passingScore: number;
    submissionStatus: 'Submitted' | 'Auto-Submitted – Time Expired';
    timeSpentSeconds: number;
    timeLimit: number;
  };
  activeSessions: Record<string, ActiveQuizSession>;
  getActiveSession: (quizId: number, studentEmail: string) => ActiveQuizSession | null;
  startQuizSession: (quizId: number, studentEmail: string, studentName: string) => ActiveQuizSession;
  saveDraftAnswers: (quizId: number, studentEmail: string, answers: Record<number, string>) => void;
  clearActiveSession: (quizId: number, studentEmail: string) => void;

  // Student Registration & Synchronization & Login Activity
  addStudent: (data: {
    fullName: string;
    email: string;
    studentId?: string;
    username?: string;
    contactNumber?: string;
    password?: string;
    source?: 'online_registration' | 'admin_enrolled';
    progress?: number;
  }) => StudentRecord;
  syncCurrentStudent: (data: {
    fullName?: string;
    email?: string;
    studentId?: string;
    progress?: number;
    source?: 'online_registration' | 'admin_enrolled';
  }) => StudentRecord | null;
  recordStudentLogin: (email: string, fullName?: string, studentId?: string) => void;
  clearLoginActivities: () => void;
  deleteStudent: (id: number | string) => void;
  toggleStudentStatus: (id: number | string) => void;

  // Subject & Lesson Management
  addSubject: (data: { name: string; code: string; description: string; instructor?: string; department?: string }) => void;
  updateSubject: (id: number, data: Partial<SubjectItem>) => void;
  deleteSubject: (id: number) => void;
  addLesson: (data: {
    title: string;
    subjectId: number;
    description: string;
    content?: string;
    objectives?: string[];
    lessonType?: 'text' | 'pdf' | 'video';
    published?: boolean;
    durationMinutes?: number;
    videoUrl?: string | null;
    materialName?: string | null;
    materialUrl?: string | null;
    materialSize?: string | null;
    materialType?: string | null;
  }) => void;
  updateLesson: (id: number, data: Partial<LessonItem>) => void;
  toggleLessonPublish: (id: number) => void;
  deleteLesson: (id: number) => void;
  getSubjectLessons: (subjectId: number, onlyPublished?: boolean, search?: string) => LessonItem[];
  resetCurriculumToDefault: () => void;
  addQuiz: (data: {
    title: string;
    subjectId: number;
    description: string;
    passingScore: number;
    timeLimit?: number;
    attachmentName?: string | null;
    attachmentUrl?: string | null;
    attachmentSize?: string | null;
    attachmentType?: string | null;
    questions?: QuizQuestionItem[];
    questionCount?: number;
  }) => void;
  updateQuiz: (id: number, data: Partial<QuizItem>) => void;
  deleteQuiz: (id: number) => void;
  addQuestion: (data: {
    text: string;
    type: QuestionType;
    subjectId: number;
    lessonId?: number | null;
    choices?: QuestionBankChoice[];
    correctAnswer?: string;
    acceptedAnswers?: string[];
    sampleAnswerRubric?: string;
    explanation?: string;
    points?: number;
    difficulty?: DifficultyLevel;
    status?: QuestionStatus;
    authorName?: string;
  }) => QuestionBankItem;
  updateQuestion: (id: number, data: Partial<QuestionBankItem>) => void;
  deleteQuestion: (id: number) => { success: boolean; reason?: string };
  toggleQuestionPublish: (id: number) => void;
  gradeEssaySubmission: (
    resultId: number,
    questionIdOrScores: number | Record<number, number>,
    pointsAwardedOrFeedback?: number | string,
    feedback?: string,
    teacherName?: string
  ) => void;
  resetQuestionsToDefault: () => void;
  addManualResult: (data: {
    studentName: string;
    quizName: string;
    subjectName: string;
    percentage: number;
    passed: boolean;
    correctAnswers?: number;
    incorrectAnswers?: number;
    submissionName?: string | null;
  }) => void;
  deleteResult: (id: number) => void;

  // Computed & Aggregations
  studentStats: {
    progress: number;
    totalSubjects: number;
    lessonsCompleted: number;
    averageScore: number;
    quizzesTaken: number;
  };
  adminStats: {
    totalStudents: number;
    totalSubjects: number;
    totalLessons: number;
    totalAttempts: number;
    averageScore: number;
  };
  reportsData: any;
  resetAllToDefault: () => void;
}

const PlatformStoreContext = createContext<PlatformStoreContextType | undefined>(undefined);

const LS_PREFIX = 'lumenpath_store_';

function getInitial<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (raw !== null) {
      return JSON.parse(raw) as T;
    }
  } catch {
    // ignore
  }
  return fallback;
}

function setStorage<T>(key: string, val: T) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

const CURRICULUM_VERSION_KEY = 'lumenpath_curriculum_v6';
const QUESTION_BANK_VERSION_KEY = 'lumenpath_question_bank_v4';

try {
  const version = localStorage.getItem(QUESTION_BANK_VERSION_KEY);
  if (!version) {
    localStorage.setItem(LS_PREFIX + 'questions', JSON.stringify(DEFAULT_QUESTIONS));
    localStorage.setItem(LS_PREFIX + 'quizzes', JSON.stringify(DEFAULT_QUIZZES));
    localStorage.setItem(QUESTION_BANK_VERSION_KEY, '1');
  }
} catch {
  // ignore
}

// Ensure curriculum is initialized with the 4 subjects and 25 subject-specific lessons
try {
  const version = localStorage.getItem(CURRICULUM_VERSION_KEY);
  if (!version) {
    localStorage.setItem(LS_PREFIX + 'subjects', JSON.stringify(DEFAULT_SUBJECTS));
    localStorage.setItem(LS_PREFIX + 'lessons', JSON.stringify(DEFAULT_LESSONS));
    localStorage.setItem(LS_PREFIX + 'quizzes', JSON.stringify(DEFAULT_QUIZZES));
    localStorage.setItem(CURRICULUM_VERSION_KEY, '1');
  }
} catch {
  // ignore
}

export const DEFAULT_ASSIGNMENTS: AssignmentItem[] = [
  {
    id: 'asgn_1',
    title: 'Enterprise Relational Schema & Normalization Design',
    description: 'Design a comprehensive relational database schema in Third Normal Form (3NF) for a multi-tenant enterprise logistics platform. Provide entity-relationship diagrams (ERD), full SQL DDL script definitions with primary and foreign key constraints, or a recorded video explanation walking through your normalization decisions.',
    subjectId: 1,
    subjectName: 'Database Management',
    relatedLessonId: 1,
    relatedLessonTitle: 'Introduction to Relational Databases',
    teacherId: 'TCH-2024-002',
    teacherName: 'Prof. Sarah Jenkins',
    assignedClassOrStudents: 'All Enrolled Students',
    referenceMaterials: [
      { name: 'Relational_Schema_Specification_v3.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', size: '2.1 MB', type: 'application/pdf' },
      { name: 'Sample_Logistics_ERD_Template.pptx', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', size: '3.4 MB', type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
    ],
    startDateTime: '2026-10-18T08:00',
    dueDateTime: '2026-10-27T23:59',
    maxScore: 100,
    acceptedSubmissionTypes: ['pdf', 'presentation', 'video'],
    maxFileSizeMB: 100,
    allowLateSubmissions: true,
    allowResubmission: true,
    status: 'published',
    createdAt: 'Oct 18, 2026, 08:30 AM',
    updatedAt: 'Oct 18, 2026, 08:30 AM',
  },
  {
    id: 'asgn_2',
    title: 'Interactive E-Learning Dashboard UI Prototype',
    description: 'Construct a responsive, accessible learning dashboard using modern semantic HTML5, CSS Grid/Flexbox, and dynamic JavaScript components. Focus on interactive filters and mobile viewports. Submit your documented source code archive (ZIP), architecture PDF, or a video screen recording demonstrating your responsive layout.',
    subjectId: 2,
    subjectName: 'Web Development',
    relatedLessonId: 9,
    relatedLessonTitle: 'HTML5 Semantic Structure & Foundations',
    teacherId: 'tch_seed_2',
    teacherName: 'Dr. Eleanor Davies',
    assignedClassOrStudents: 'BSIT 3-A & Web Cohort',
    referenceMaterials: [
      { name: 'Design_System_Guidelines.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', size: '1.9 MB', type: 'application/pdf' },
    ],
    startDateTime: '2026-10-19T09:00',
    dueDateTime: '2026-10-25T23:59',
    maxScore: 100,
    acceptedSubmissionTypes: ['code', 'pdf', 'video'],
    maxFileSizeMB: 100,
    allowLateSubmissions: true,
    allowResubmission: true,
    status: 'published',
    createdAt: 'Oct 19, 2026, 09:15 AM',
    updatedAt: 'Oct 19, 2026, 09:15 AM',
  },
  {
    id: 'asgn_3',
    title: 'Dynamic Data Structures & Algorithm Optimization',
    description: 'Implement an AVL self-balancing binary search tree with rotation handling (LL, RR, LR, RL) in your chosen language. Benchmark insertion and search speed against standard binary trees. Upload your source code in a ZIP archive, or submit a technical video demonstration of your test cases.',
    subjectId: 3,
    subjectName: 'Programming',
    relatedLessonId: 15,
    relatedLessonTitle: 'Variables, Types, and Expressions',
    teacherId: 'TCH-2024-001',
    teacherName: 'Dr. Robert Vance',
    assignedClassOrStudents: 'CS Algorithms Class',
    referenceMaterials: [
      { name: 'AVL_Tree_Rubric_and_Test_Vectors.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', size: '1.5 MB', type: 'application/pdf' },
    ],
    startDateTime: '2026-10-17T10:00',
    dueDateTime: '2026-10-29T23:59',
    maxScore: 100,
    acceptedSubmissionTypes: ['code', 'video', 'text'],
    maxFileSizeMB: 50,
    allowLateSubmissions: true,
    allowResubmission: true,
    status: 'published',
    createdAt: 'Oct 17, 2026, 10:00 AM',
    updatedAt: 'Oct 17, 2026, 10:00 AM',
  },
  {
    id: 'asgn_4',
    title: 'Microprocessor Architecture & Cache Coherency Analysis',
    description: 'Investigate multi-core cache hierarchy performance under intensive spatial and temporal locality workloads. Submit a PowerPoint presentation, technical PDF summary, or system block diagrams depicting cache invalidation protocols.',
    subjectId: 4,
    subjectName: 'Computer Systems',
    relatedLessonId: 21,
    relatedLessonTitle: 'Computer Hardware Architecture & Von Neumann Model',
    teacherId: 'TCH-2024-003',
    teacherName: 'Engr. Marcus Sterling',
    assignedClassOrStudents: 'Hardware Engineering Cohort',
    referenceMaterials: [
      { name: 'MESI_Protocol_Reference.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', size: '2.8 MB', type: 'application/pdf' },
    ],
    startDateTime: '2026-10-16T08:00',
    dueDateTime: '2026-10-31T23:59',
    maxScore: 100,
    acceptedSubmissionTypes: ['pdf', 'presentation', 'image', 'video'],
    maxFileSizeMB: 50,
    allowLateSubmissions: false,
    allowResubmission: true,
    status: 'published',
    createdAt: 'Oct 16, 2026, 08:00 AM',
    updatedAt: 'Oct 16, 2026, 08:00 AM',
  },
  {
    id: 'asgn_5',
    title: 'Advanced SQL Execution Planning & Index Tuning',
    description: 'Examine query plans with EXPLAIN ANALYZE on high-volume tables. Create composite and partial indexes to eliminate sequential scans on multi-million row customer records.',
    subjectId: 1,
    subjectName: 'Database Management',
    relatedLessonId: 3,
    relatedLessonTitle: 'SQL Fundamentals: Queries & Filtering',
    teacherId: 'TCH-2024-002',
    teacherName: 'Prof. Sarah Jenkins',
    assignedClassOrStudents: 'All Enrolled Students',
    referenceMaterials: [],
    startDateTime: '2026-10-25T08:00',
    dueDateTime: '2026-11-05T23:59',
    maxScore: 100,
    acceptedSubmissionTypes: ['pdf', 'text', 'code'],
    maxFileSizeMB: 25,
    allowLateSubmissions: false,
    allowResubmission: true,
    status: 'draft',
    createdAt: 'Oct 21, 2026, 11:30 AM',
    updatedAt: 'Oct 21, 2026, 11:30 AM',
  },
];

export const DEFAULT_ASSIGNMENT_SUBMISSIONS: AssignmentSubmissionItem[] = [
  {
    id: 'sub_1',
    assignmentId: 'asgn_1',
    assignmentTitle: 'Enterprise Relational Schema & Normalization Design',
    subjectId: 1,
    subjectName: 'Database Management',
    studentId: 'STU-1001',
    studentName: 'Alex Morgan',
    studentEmail: 'alex.morgan@lumenpath.edu',
    submissionType: 'presentation',
    file: {
      name: 'Alex_Morgan_Logistics_ERD_Presentation.pptx',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      size: '5.8 MB',
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    },
    textAnswer: 'Attached presentation contains the complete 3NF normalization justification and ER diagrams.',
    submittedAt: 'Oct 20, 2026, 02:15 PM',
    isLate: false,
    status: 'graded',
    score: 95,
    maxScore: 100,
    feedback: 'Outstanding normalization breakdown and clearly structured relational keys. Great visual presentation slides!',
    gradedBy: 'Prof. Sarah Jenkins',
    gradedAt: 'Oct 21, 2026, 09:30 AM',
    version: 1,
  },
  {
    id: 'sub_2',
    assignmentId: 'asgn_2',
    assignmentTitle: 'Interactive E-Learning Dashboard UI Prototype',
    subjectId: 2,
    subjectName: 'Web Development',
    studentId: 'STU-1002',
    studentName: 'Jordan Lee',
    studentEmail: 'jordan.lee@lumenpath.edu',
    submissionType: 'video',
    file: {
      name: 'Jordan_Lee_WebDev_Demo.mp4',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      size: '18.4 MB',
      type: 'video/mp4',
    },
    textAnswer: 'Video walkthrough demonstrating mobile responsiveness, accessible keyboard navigation, and custom CSS theme switches.',
    submittedAt: 'Oct 21, 2026, 04:45 PM',
    isLate: false,
    status: 'submitted',
    score: null,
    maxScore: 100,
    version: 1,
  },
  {
    id: 'sub_3',
    assignmentId: 'asgn_3',
    assignmentTitle: 'Dynamic Data Structures & Algorithm Optimization',
    subjectId: 3,
    subjectName: 'Programming',
    studentId: 'STU-1003',
    studentName: 'Taylor Swift',
    studentEmail: 'taylor@lumenpath.edu',
    submissionType: 'code',
    file: {
      name: 'Taylor_AVL_Tree_Solution.zip',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      size: '1.2 MB',
      type: 'application/zip',
    },
    textAnswer: 'Implemented AVL balancing routines and benchmarked with 100k random integer insertions.',
    submittedAt: 'Oct 19, 2026, 10:10 AM',
    isLate: false,
    status: 'returned_for_revision',
    score: null,
    maxScore: 100,
    feedback: 'Please implement recursive re-balancing on delete operations as required by rubric section 3.2, then resubmit.',
    gradedBy: 'Dr. Robert Vance',
    gradedAt: 'Oct 20, 2026, 03:00 PM',
    version: 1,
  },
];

export const DEFAULT_ASSIGNMENT_AUDIT_LOGS: AssignmentAuditEvent[] = [
  {
    id: 'aud_1',
    eventType: 'assignment_graded',
    userId: 'TCH-2024-002',
    userName: 'Prof. Sarah Jenkins',
    userRole: 'teacher',
    assignmentId: 'asgn_1',
    assignmentTitle: 'Enterprise Relational Schema & Normalization Design',
    submissionId: 'sub_1',
    subjectId: 1,
    subjectName: 'Database Management',
    timestamp: 'Oct 21, 2026, 09:30 AM',
    details: 'Prof. Sarah Jenkins graded Alex Morgan\'s assignment "Enterprise Relational Schema & Normalization Design" (Score: 95/100).',
  },
  {
    id: 'aud_2',
    eventType: 'submission_received',
    userId: 'STU-1002',
    userName: 'Jordan Lee',
    userRole: 'student',
    assignmentId: 'asgn_2',
    assignmentTitle: 'Interactive E-Learning Dashboard UI Prototype',
    submissionId: 'sub_2',
    subjectId: 2,
    subjectName: 'Web Development',
    timestamp: 'Oct 21, 2026, 04:45 PM',
    details: 'Student Jordan Lee submitted a video demonstration for "Interactive E-Learning Dashboard UI Prototype" in Web Development.',
  },
  {
    id: 'aud_3',
    eventType: 'returned_for_revision',
    userId: 'TCH-2024-001',
    userName: 'Dr. Robert Vance',
    userRole: 'teacher',
    assignmentId: 'asgn_3',
    assignmentTitle: 'Dynamic Data Structures & Algorithm Optimization',
    submissionId: 'sub_3',
    subjectId: 3,
    subjectName: 'Programming',
    timestamp: 'Oct 20, 2026, 03:00 PM',
    details: 'Dr. Robert Vance returned assignment "Dynamic Data Structures & Algorithm Optimization" to Taylor Swift for revision.',
  },
  {
    id: 'aud_4',
    eventType: 'submission_received',
    userId: 'STU-1001',
    userName: 'Alex Morgan',
    userRole: 'student',
    assignmentId: 'asgn_1',
    assignmentTitle: 'Enterprise Relational Schema & Normalization Design',
    submissionId: 'sub_1',
    subjectId: 1,
    subjectName: 'Database Management',
    timestamp: 'Oct 20, 2026, 02:15 PM',
    details: 'Student Alex Morgan submitted a presentation for "Enterprise Relational Schema & Normalization Design" in Database Management.',
  },
  {
    id: 'aud_5',
    eventType: 'assignment_published',
    userId: 'TCH-2024-002',
    userName: 'Prof. Sarah Jenkins',
    userRole: 'teacher',
    assignmentId: 'asgn_1',
    assignmentTitle: 'Enterprise Relational Schema & Normalization Design',
    subjectId: 1,
    subjectName: 'Database Management',
    timestamp: 'Oct 18, 2026, 08:30 AM',
    details: 'Prof. Sarah Jenkins published assignment "Enterprise Relational Schema & Normalization Design" to students.',
  },
];

const ASSIGNMENTS_VERSION_KEY = 'lumenpath_assignments_v1';
try {
  const version = localStorage.getItem(ASSIGNMENTS_VERSION_KEY);
  if (!version) {
    localStorage.setItem(LS_PREFIX + 'assignments_v1', JSON.stringify(DEFAULT_ASSIGNMENTS));
    localStorage.setItem(LS_PREFIX + 'assignment_submissions_v1', JSON.stringify(DEFAULT_ASSIGNMENT_SUBMISSIONS));
    localStorage.setItem(LS_PREFIX + 'assignment_audit_logs_v1', JSON.stringify(DEFAULT_ASSIGNMENT_AUDIT_LOGS));
    localStorage.setItem(ASSIGNMENTS_VERSION_KEY, '1');
  }
} catch {
  // ignore
}

export function PlatformStoreProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<SubjectItem[]>(() => {
    const stored = getInitial<SubjectItem[]>('subjects', DEFAULT_SUBJECTS);
    return stored && stored.length > 0 ? stored : DEFAULT_SUBJECTS;
  });
  const [lessons, setLessons] = useState<LessonItem[]>(() => {
    const stored = getInitial<LessonItem[]>('lessons', DEFAULT_LESSONS);
    return stored && stored.length > 0 ? stored : DEFAULT_LESSONS;
  });
  const [quizzes, setQuizzes] = useState<QuizItem[]>(() => {
    const stored = getInitial<QuizItem[]>('quizzes', DEFAULT_QUIZZES);
    return stored && stored.length > 0 ? stored : DEFAULT_QUIZZES;
  });
  const [questions, setQuestions] = useState<QuestionBankItem[]>(() => {
    const stored = getInitial<QuestionBankItem[]>('questions', DEFAULT_QUESTIONS);
    return stored && stored.length > 0 ? stored : DEFAULT_QUESTIONS;
  });
  const [results, setResults] = useState<QuizResultItem[]>(() =>
    getInitial('results', [])
  );
  const [activeSessions, setActiveSessions] = useState<Record<string, ActiveQuizSession>>(() =>
    getInitial('active_sessions', {})
  );
  const [students, setStudents] = useState<StudentRecord[]>(() => {
    const initialList = getInitial<StudentRecord[]>('students', []);
    try {
      const regUsersRaw = localStorage.getItem('lumenpath_registered_users');
      if (regUsersRaw) {
        const regUsers = JSON.parse(regUsersRaw);
        if (Array.isArray(regUsers)) {
          for (const u of regUsers) {
            if (!initialList.some((s) => s.email?.toLowerCase() === u.email?.toLowerCase())) {
              initialList.push({
                id: u.id || Date.now(),
                fullName: u.fullName || 'Registered Student',
                studentId: u.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
                email: u.email,
                username: u.username || u.email?.split('@')[0],
                contactNumber: u.contactNumber,
                password: u.password,
                status: u.status || 'active',
                progress: u.progress || 0,
                source: u.source || 'online_registration',
                registeredAt: u.registeredAt || new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                lastLoginAt: u.lastLoginAt || null,
                lastActive: u.lastLoginAt ? 'Active' : 'Never',
              });
            }
          }
        }
      }
      const sessionRaw = localStorage.getItem('lumenpath_auth_session');
      if (sessionRaw) {
        const sess = JSON.parse(sessionRaw);
        if (sess && sess.role === 'student' && sess.email) {
          const existingIdx = initialList.findIndex((s) => s.email?.toLowerCase() === sess.email?.toLowerCase());
          if (existingIdx === -1) {
            const now = new Date();
            initialList.unshift({
              id: sess.id || Date.now(),
              fullName: sess.fullName || 'Registered Student',
              studentId: sess.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
              email: sess.email,
              username: sess.email.split('@')[0],
              status: 'active',
              progress: 0,
              source: 'online_registration',
              registeredAt: now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
              lastLoginAt: now.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
              lastActive: 'Just now',
            });
          }
        }
      }
    } catch {
      // ignore
    }
    return initialList;
  });

  const [loginActivities, setLoginActivities] = useState<LoginActivityRecord[]>(() =>
    getInitial<LoginActivityRecord[]>('login_activities', [])
  );
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>(() =>
    getInitial('activity', [])
  );
  const [teacherApplications, setTeacherApplications] = useState<TeacherApplicationRecord[]>(() =>
    getInitial<TeacherApplicationRecord[]>('teacher_applications', [
      {
        applicationId: 'APP-1001',
        userId: 'tch_seed_1',
        fullName: 'Dr. Robert Vance',
        teacherId: 'TCH-2024-001',
        email: 'robert.vance@lumenpath.edu',
        username: 'robert.vance',
        contactNumber: '+63 917 112 3344',
        department: 'Computer Science & AI',
        credentialFile: { name: 'Dr_Vance_PhD_Credentials.pdf', url: '#', size: '2.4 MB', type: 'application/pdf' },
        password: 'password123',
        applicationStatus: 'pending',
        submittedAt: 'Oct 20, 2026, 09:30 AM',
        reviewedAt: null,
        reviewedBy: null,
      },
      {
        applicationId: 'APP-1002',
        userId: 'tch_seed_2',
        fullName: 'Prof. Sarah Jenkins',
        teacherId: 'TCH-2024-002',
        email: 'sarah.jenkins@lumenpath.edu',
        username: 'sarah.jenkins',
        contactNumber: '+63 920 554 8899',
        department: 'Mathematics & Algorithms',
        credentialFile: { name: 'Jenkins_Faculty_Certification.pdf', url: '#', size: '1.8 MB', type: 'application/pdf' },
        password: 'password123',
        applicationStatus: 'approved',
        submittedAt: 'Oct 17, 2026, 02:15 PM',
        reviewedAt: 'Oct 18, 2026, 10:00 AM',
        reviewedBy: 'Administrator',
      },
      {
        applicationId: 'APP-1003',
        userId: 'tch_seed_3',
        fullName: 'Marcus Sterling',
        teacherId: 'TCH-2024-003',
        email: 'marcus.sterling@lumenpath.edu',
        username: 'marcus.sterling',
        contactNumber: '+63 919 778 2211',
        department: 'Physics & Engineering',
        credentialFile: null,
        password: 'password123',
        applicationStatus: 'rejected',
        rejectionReason: 'Incomplete teaching certification credentials. Please re-apply with official diploma or institutional endorsement.',
        submittedAt: 'Oct 18, 2026, 11:20 AM',
        reviewedAt: 'Oct 19, 2026, 03:45 PM',
        reviewedBy: 'Administrator',
      },
    ])
  );

  const [assignments, setAssignments] = useState<AssignmentItem[]>(() => {
    const stored = getInitial<AssignmentItem[]>('assignments_v1', DEFAULT_ASSIGNMENTS);
    return stored && stored.length > 0 ? stored : DEFAULT_ASSIGNMENTS;
  });
  const [assignmentSubmissions, setAssignmentSubmissions] = useState<AssignmentSubmissionItem[]>(() => {
    const stored = getInitial<AssignmentSubmissionItem[]>('assignment_submissions_v1', DEFAULT_ASSIGNMENT_SUBMISSIONS);
    return stored && stored.length > 0 ? stored : DEFAULT_ASSIGNMENT_SUBMISSIONS;
  });
  const [assignmentAuditLogs, setAssignmentAuditLogs] = useState<AssignmentAuditEvent[]>(() => {
    const stored = getInitial<AssignmentAuditEvent[]>('assignment_audit_logs_v1', DEFAULT_ASSIGNMENT_AUDIT_LOGS);
    return stored && stored.length > 0 ? stored : DEFAULT_ASSIGNMENT_AUDIT_LOGS;
  });

  // Sync to storage
  useEffect(() => setStorage('subjects', subjects), [subjects]);
  useEffect(() => setStorage('lessons', lessons), [lessons]);
  useEffect(() => setStorage('quizzes', quizzes), [quizzes]);
  useEffect(() => setStorage('questions', questions), [questions]);
  useEffect(() => setStorage('results', results), [results]);
  useEffect(() => setStorage('students', students), [students]);
  useEffect(() => setStorage('login_activities', loginActivities), [loginActivities]);
  useEffect(() => setStorage('activity', recentActivity), [recentActivity]);
  useEffect(() => setStorage('active_sessions', activeSessions), [activeSessions]);
  useEffect(() => setStorage('teacher_applications', teacherApplications), [teacherApplications]);
  useEffect(() => setStorage('assignments_v1', assignments), [assignments]);
  useEffect(() => setStorage('assignment_submissions_v1', assignmentSubmissions), [assignmentSubmissions]);
  useEffect(() => setStorage('assignment_audit_logs_v1', assignmentAuditLogs), [assignmentAuditLogs]);

  // Sync with Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function syncWithSupabase() {
      try {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'student')
          .order('created_at', { ascending: false });

        if (!error && profiles && profiles.length > 0 && isMounted) {
          setStudents((prev) => {
            const map = new Map<string, StudentRecord>();
            prev.forEach((s) => map.set(s.email.toLowerCase(), s));
            profiles.forEach((p) => {
              const emailKey = p.email.toLowerCase();
              const existing = map.get(emailKey);
              const d = p.created_at ? new Date(p.created_at) : new Date();
              const formattedReg = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
              const lastLoginFormatted = p.last_login_at
                ? new Date(p.last_login_at).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
                : (existing?.lastLoginAt ?? null);

              map.set(emailKey, {
                id: p.id,
                fullName: p.full_name,
                studentId: p.student_id || existing?.studentId || `STU-${String(p.id).slice(0, 4)}`,
                email: p.email,
                username: p.email.split('@')[0],
                status: (p.status as 'active' | 'inactive') || 'active',
                progress: existing?.progress || 0,
                source: (p.source as 'online_registration' | 'admin_enrolled') || 'online_registration',
                registeredAt: existing?.registeredAt || formattedReg,
                lastLoginAt: lastLoginFormatted,
                lastActive: lastLoginFormatted ? 'Recent' : 'Never',
              });
            });
            return Array.from(map.values());
          });
        }

        const { data: logs, error: logErr } = await supabase
          .from('login_activity')
          .select('*')
          .order('login_at', { ascending: false });

        if (!logErr && logs && logs.length > 0 && isMounted) {
          setLoginActivities((prev) => {
            const existingIds = new Set(prev.map((l) => String(l.id)));
            const incoming: LoginActivityRecord[] = [];
            logs.forEach((item) => {
              if (!existingIds.has(String(item.id))) {
                const t = new Date(item.login_at || Date.now());
                incoming.push({
                  id: item.id,
                  studentName: item.student_name,
                  email: item.email,
                  studentId: item.student_id || '',
                  loginDate: t.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
                  loginTime: t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }),
                  loginAt: t.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
                  timestamp: t.getTime(),
                  status: 'success',
                });
              }
            });
            return [...incoming, ...prev].sort((a, b) => b.timestamp - a.timestamp);
          });
        }
      } catch {
        // Ignore network / connection errors
      }
    }
    syncWithSupabase();
    return () => {
      isMounted = false;
    };
  }, []);

  const addActivity = (title: string, message: string) => {
    setRecentActivity((prev) => [{ id: Date.now(), title, message }, ...prev.slice(0, 9)]);
  };

  const logAssignmentEvent = (
    eventType: AssignmentAuditEventType,
    params: {
      userId: string;
      userName: string;
      userRole: 'teacher' | 'student' | 'admin';
      assignmentId: string;
      assignmentTitle: string;
      submissionId?: string;
      subjectId?: number;
      subjectName?: string;
      details: string;
    }
  ) => {
    const now = new Date();
    const formatted = `${now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    const event: AssignmentAuditEvent = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      eventType,
      userId: params.userId,
      userName: params.userName,
      userRole: params.userRole,
      assignmentId: params.assignmentId,
      assignmentTitle: params.assignmentTitle,
      submissionId: params.submissionId,
      subjectId: params.subjectId,
      subjectName: params.subjectName,
      timestamp: formatted,
      details: params.details,
    };
    setAssignmentAuditLogs((prev) => [event, ...prev]);

    // Also push to live platform-wide recentActivity so Admin and other dashboards reflect it live!
    addActivity(
      eventType === 'assignment_created' ? 'Assignment Created' :
      eventType === 'assignment_published' ? 'Assignment Published' :
      eventType === 'assignment_updated' ? 'Assignment Updated' :
      eventType === 'assignment_closed' ? 'Assignment Closed' :
      eventType === 'submission_received' ? 'Student Submission Received' :
      eventType === 'resubmission_received' ? 'Student Resubmission Received' :
      eventType === 'assignment_graded' ? 'Assignment Graded' :
      eventType === 'returned_for_revision' ? 'Assignment Returned for Revision' : 'Assignment Activity',
      params.details
    );

    // Optimistically sync event to supabase
    try {
      supabase.from('assignment_audit_logs').insert([{
        event_type: eventType,
        user_id: params.userId,
        user_name: params.userName,
        user_role: params.userRole,
        assignment_id: params.assignmentId,
        assignment_title: params.assignmentTitle,
        submission_id: params.submissionId || null,
        subject_id: params.subjectId || null,
        subject_name: params.subjectName || null,
        details: params.details,
        created_at: now.toISOString(),
      }]).then(() => {});
    } catch {
      // ignore
    }
  };

  const createAssignment = (data: Omit<AssignmentItem, 'id' | 'createdAt' | 'updatedAt'>): AssignmentItem => {
    const now = new Date();
    const formatted = `${now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    const newAssignment: AssignmentItem = {
      ...data,
      id: `asgn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: formatted,
      updatedAt: formatted,
    };

    setAssignments((prev) => [newAssignment, ...prev]);

    logAssignmentEvent(
      data.status === 'published' ? 'assignment_published' : 'assignment_created',
      {
        userId: data.teacherId,
        userName: data.teacherName,
        userRole: 'teacher',
        assignmentId: newAssignment.id,
        assignmentTitle: newAssignment.title,
        subjectId: data.subjectId,
        subjectName: data.subjectName,
        details: `${data.teacherName} ${data.status === 'published' ? 'published' : 'created'} assignment "${newAssignment.title}" for ${data.subjectName}.`,
      }
    );

    try {
      supabase.from('assignments').insert([{
        id: newAssignment.id,
        title: newAssignment.title,
        description: newAssignment.description,
        subject_id: newAssignment.subjectId,
        subject_name: newAssignment.subjectName,
        teacher_id: newAssignment.teacherId,
        teacher_name: newAssignment.teacherName,
        max_score: newAssignment.maxScore,
        status: newAssignment.status,
        due_date: newAssignment.dueDateTime,
      }]).then(() => {});
    } catch {
      // ignore
    }

    return newAssignment;
  };

  const updateAssignment = (id: string, data: Partial<AssignmentItem>) => {
    const now = new Date();
    const formatted = `${now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

    let updatedTarget: AssignmentItem | null = null;
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          updatedTarget = { ...a, ...data, updatedAt: formatted };
          return updatedTarget;
        }
        return a;
      })
    );

    if (updatedTarget) {
      logAssignmentEvent('assignment_updated', {
        userId: (updatedTarget as AssignmentItem).teacherId,
        userName: (updatedTarget as AssignmentItem).teacherName,
        userRole: 'teacher',
        assignmentId: (updatedTarget as AssignmentItem).id,
        assignmentTitle: (updatedTarget as AssignmentItem).title,
        subjectId: (updatedTarget as AssignmentItem).subjectId,
        subjectName: (updatedTarget as AssignmentItem).subjectName,
        details: `${(updatedTarget as AssignmentItem).teacherName} updated assignment "${(updatedTarget as AssignmentItem).title}".`,
      });
    }
  };

  const publishAssignment = (id: string) => {
    const now = new Date();
    const formatted = `${now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

    let publishedTarget: AssignmentItem | null = null;
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          publishedTarget = { ...a, status: 'published', updatedAt: formatted };
          return publishedTarget;
        }
        return a;
      })
    );

    if (publishedTarget) {
      logAssignmentEvent('assignment_published', {
        userId: (publishedTarget as AssignmentItem).teacherId,
        userName: (publishedTarget as AssignmentItem).teacherName,
        userRole: 'teacher',
        assignmentId: (publishedTarget as AssignmentItem).id,
        assignmentTitle: (publishedTarget as AssignmentItem).title,
        subjectId: (publishedTarget as AssignmentItem).subjectId,
        subjectName: (publishedTarget as AssignmentItem).subjectName,
        details: `${(publishedTarget as AssignmentItem).teacherName} published assignment "${(publishedTarget as AssignmentItem).title}" to students.`,
      });
    }
  };

  const deleteAssignment = (id: string) => {
    const target = assignments.find((a) => a.id === id);
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    setAssignmentSubmissions((prev) => prev.filter((s) => s.assignmentId !== id));

    if (target) {
      logAssignmentEvent('assignment_closed', {
        userId: target.teacherId,
        userName: target.teacherName,
        userRole: 'teacher',
        assignmentId: target.id,
        assignmentTitle: target.title,
        subjectId: target.subjectId,
        subjectName: target.subjectName,
        details: `${target.teacherName} removed assignment "${target.title}".`,
      });
    }
  };

  const submitAssignment = (data: {
    assignmentId: string;
    studentId: string;
    studentName: string;
    studentEmail: string;
    submissionType: AssignmentSubmissionType;
    file?: { name: string; url: string; size?: string; type?: string } | null;
    textAnswer?: string;
    externalLink?: string;
  }): { success: boolean; message: string } => {
    const targetAssignment = assignments.find((a) => a.id === data.assignmentId);
    if (!targetAssignment) {
      return { success: false, message: 'Assignment not found.' };
    }

    const now = new Date();
    const formatted = `${now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

    // Check deadline
    let isLate = false;
    try {
      const due = new Date(targetAssignment.dueDateTime);
      if (!isNaN(due.getTime()) && now.getTime() > due.getTime()) {
        isLate = true;
        if (!targetAssignment.allowLateSubmissions) {
          return { success: false, message: 'Submissions are closed for this assignment. Late submissions are not permitted.' };
        }
      }
    } catch {
      // ignore
    }

    // Check existing submission
    const existing = assignmentSubmissions.find(
      (s) => s.assignmentId === data.assignmentId && (s.studentEmail === data.studentEmail || s.studentId === data.studentId)
    );

    if (existing && !targetAssignment.allowResubmission && existing.status !== 'returned_for_revision') {
      return { success: false, message: 'Resubmissions are not permitted for this assignment.' };
    }

    const submissionId = existing ? existing.id : `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newVersion = (existing?.version || 1) + (existing ? 1 : 0);

    const historyEntry = existing ? {
      submittedAt: existing.submittedAt,
      submissionType: existing.submissionType,
      fileName: existing.file?.name,
      fileUrl: existing.file?.url,
      textAnswer: existing.textAnswer,
      feedback: existing.feedback,
    } : undefined;

    const submissionRecord: AssignmentSubmissionItem = {
      id: submissionId,
      assignmentId: targetAssignment.id,
      assignmentTitle: targetAssignment.title,
      subjectId: targetAssignment.subjectId,
      subjectName: targetAssignment.subjectName,
      studentId: data.studentId,
      studentName: data.studentName,
      studentEmail: data.studentEmail,
      submissionType: data.submissionType,
      file: data.file,
      textAnswer: data.textAnswer,
      externalLink: data.externalLink,
      submittedAt: formatted,
      isLate,
      status: 'submitted',
      score: null,
      maxScore: targetAssignment.maxScore,
      feedback: undefined,
      gradedBy: undefined,
      gradedAt: undefined,
      version: newVersion,
      history: historyEntry ? [...(existing?.history || []), historyEntry] : (existing?.history || []),
    };

    setAssignmentSubmissions((prev) => {
      const filtered = prev.filter((s) => s.id !== submissionId);
      return [submissionRecord, ...filtered];
    });

    const isResubmission = !!existing;
    logAssignmentEvent(
      isResubmission ? 'resubmission_received' : 'submission_received',
      {
        userId: data.studentId,
        userName: data.studentName,
        userRole: 'student',
        assignmentId: targetAssignment.id,
        assignmentTitle: targetAssignment.title,
        submissionId,
        subjectId: targetAssignment.subjectId,
        subjectName: targetAssignment.subjectName,
        details: `${data.studentName} ${isResubmission ? 'resubmitted' : 'submitted'} ${data.submissionType} for "${targetAssignment.title}" in ${targetAssignment.subjectName}${isLate ? ' (Late)' : ''}.`,
      }
    );

    return {
      success: true,
      message: 'Your assignment has been submitted successfully.',
    };
  };

  const gradeAssignmentSubmission = (
    submissionId: string,
    data: { score: number; feedback: string; status?: 'graded' | 'returned_for_revision'; teacherName: string }
  ) => {
    const now = new Date();
    const formatted = `${now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

    let targetSubmission: AssignmentSubmissionItem | null = null;
    const finalStatus = data.status || 'graded';

    setAssignmentSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id === submissionId) {
          targetSubmission = {
            ...sub,
            score: finalStatus === 'returned_for_revision' ? null : data.score,
            feedback: data.feedback,
            status: finalStatus,
            gradedBy: data.teacherName,
            gradedAt: formatted,
          };
          return targetSubmission;
        }
        return sub;
      })
    );

    if (targetSubmission) {
      const sub = targetSubmission as AssignmentSubmissionItem;
      logAssignmentEvent(
        finalStatus === 'returned_for_revision' ? 'returned_for_revision' : 'assignment_graded',
        {
          userId: sub.studentId,
          userName: sub.studentName,
          userRole: 'teacher',
          assignmentId: sub.assignmentId,
          assignmentTitle: sub.assignmentTitle,
          submissionId: sub.id,
          subjectId: sub.subjectId,
          subjectName: sub.subjectName,
          details: finalStatus === 'returned_for_revision'
            ? `${data.teacherName} returned ${sub.studentName}'s assignment "${sub.assignmentTitle}" for revision.`
            : `${data.teacherName} graded ${sub.studentName}'s assignment "${sub.assignmentTitle}" (Score: ${data.score}/${sub.maxScore}).`,
        }
      );
    }
  };

  const returnSubmissionForRevision = (submissionId: string, data: { feedback: string; teacherName: string }) => {
    gradeAssignmentSubmission(submissionId, {
      score: 0,
      feedback: data.feedback,
      status: 'returned_for_revision',
      teacherName: data.teacherName,
    });
  };

  // Student: complete lesson
  const completeLesson = (id: number) => {
    setLessons((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: true, progress: 100 } : item
      )
    );
    const target = lessons.find((l) => l.id === id);
    if (target) {
      addActivity('Lesson completed', `Learner completed "${target.title}" in ${target.subjectName}.`);
    }
  };

  const resetLessonProgress = (id: number) => {
    setLessons((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: false, progress: 0 } : item
      )
    );
  };

  const uploadLessonSubmission = (
    lessonId: number,
    data: { name: string; url: string; size?: string }
  ) => {
    setLessons((prev) =>
      prev.map((item) =>
        item.id === lessonId
          ? {
              ...item,
              submissionName: data.name,
              submissionUrl: data.url,
              submissionSize: data.size || '1.0 MB',
              submissionDate: new Date().toISOString(),
            }
          : item
      )
    );
    const target = lessons.find((l) => l.id === lessonId);
    addActivity('Assignment submitted', `Learner submitted work "${data.name}" for ${target?.title || 'Lesson'}.`);
  };

  const removeLessonSubmission = (lessonId: number) => {
    setLessons((prev) =>
      prev.map((item) =>
        item.id === lessonId
          ? {
              ...item,
              submissionName: null,
              submissionUrl: null,
              submissionSize: null,
              submissionDate: null,
            }
          : item
      )
    );
  };

  // Active Quiz Sessions & Timer Management
  const sessionKey = (quizId: number, email: string) => `${quizId}_${(email || 'student').trim().toLowerCase()}`;

  const getActiveSession = (quizId: number, email: string): ActiveQuizSession | null => {
    if (!email) return null;
    const key = sessionKey(quizId, email);
    const session = activeSessions[key];
    if (!session) return null;
    return session;
  };

  const startQuizSession = (quizId: number, email: string, studentName: string): ActiveQuizSession => {
    const cleanEmail = (email || 'student@lumenpath.local').trim().toLowerCase();
    const key = sessionKey(quizId, cleanEmail);
    const existing = activeSessions[key];
    if (existing && !existing.isSubmitted) {
      return existing;
    }
    const qz = quizzes.find((q) => q.id === quizId);
    const timeLimit = qz?.timeLimit || 15;
    const startedAt = new Date().toISOString();
    const deadline = new Date(Date.now() + timeLimit * 60 * 1000).toISOString();
    const newSession: ActiveQuizSession = {
      quizId,
      studentEmail: cleanEmail,
      studentName: studentName || 'Student',
      startedAt,
      deadline,
      timeLimit,
      answers: {},
      isSubmitted: false,
    };
    setActiveSessions((prev) => ({ ...prev, [key]: newSession }));
    return newSession;
  };

  const saveDraftAnswers = (quizId: number, email: string, draftAnswers: Record<number, string>) => {
    if (!email) return;
    const key = sessionKey(quizId, email);
    setActiveSessions((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return {
        ...prev,
        [key]: {
          ...existing,
          answers: { ...existing.answers, ...draftAnswers },
        },
      };
    });
  };

  const clearActiveSession = (quizId: number, email: string) => {
    if (!email) return;
    const key = sessionKey(quizId, email);
    setActiveSessions((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  // Student: submit quiz with objective automatic scoring and essay manual grading support
  const submitQuiz = (
    quizId: number,
    answers: Record<number, string>,
    studentName: string = 'Current Student',
    submission?: { name: string; url: string; size?: string } | null,
    isTimeExpired: boolean = false,
    startedAt?: string
  ) => {
    const quiz = quizzes.find((q) => q.id === quizId) || quizzes[0];
    const qList = quiz?.questions || [];

    const answersDetail: StudentAnswerItem[] = [];
    let totalPointsPossible = 0;
    let totalPointsEarned = 0;
    let correctCount = 0;
    let hasEssayPending = false;

    qList.forEach((q) => {
      const qPoints = q.points && q.points > 0 ? q.points : 1;
      totalPointsPossible += qPoints;
      const studentAns = (answers[q.id] || '').trim();
      const qType = (q.type || 'multiple_choice') as QuestionType;

      let isCorrect = false;
      let pointsAwarded = 0;
      let status: 'graded' | 'pending_manual_grading' = 'graded';

      if (qType === 'multiple_choice') {
        const correctVal = (q.correctAnswer || q.choices?.[0]?.value || 'a').toLowerCase().trim();
        const studentVal = studentAns.toLowerCase().trim();
        const matchedChoice = q.choices?.find(
          (c) => c.value.toLowerCase() === studentVal || c.id.toLowerCase() === studentVal || c.label.toLowerCase() === studentVal
        );
        const correctChoice = q.choices?.find(
          (c) => c.value.toLowerCase() === correctVal || c.id.toLowerCase() === correctVal || c.label.toLowerCase() === correctVal
        );

        if (
          (matchedChoice && correctChoice && matchedChoice.id === correctChoice.id) ||
          studentVal === correctVal
        ) {
          isCorrect = true;
          pointsAwarded = qPoints;
          correctCount++;
        }
      } else if (qType === 'true_false') {
        const correctVal = (q.correctAnswer || 'true').toLowerCase().trim();
        const studentVal = studentAns.toLowerCase().trim();
        if (studentVal === correctVal) {
          isCorrect = true;
          pointsAwarded = qPoints;
          correctCount++;
        }
      } else if (qType === 'identification') {
        const studentVal = studentAns.toLowerCase().trim();
        const correctVal = (q.correctAnswer || '').toLowerCase().trim();
        const accepted = (q.acceptedAnswers || []).map((a) => a.toLowerCase().trim());
        if (studentVal && (studentVal === correctVal || accepted.includes(studentVal))) {
          isCorrect = true;
          pointsAwarded = qPoints;
          correctCount++;
        }
      } else if (qType === 'essay') {
        status = 'pending_manual_grading';
        hasEssayPending = true;
        pointsAwarded = 0;
        isCorrect = false;
      }

      totalPointsEarned += pointsAwarded;

      answersDetail.push({
        questionId: q.id,
        questionText: q.text,
        questionType: qType,
        studentAnswer: studentAns,
        correctAnswer: q.correctAnswer,
        acceptedAnswers: q.acceptedAnswers,
        sampleAnswerRubric: q.sampleAnswerRubric,
        pointsPossible: qPoints,
        pointsAwarded,
        isCorrect,
        status,
      });
    });

    const totalPossible = Math.max(1, totalPointsPossible);
    const percentage = Math.round((totalPointsEarned / totalPossible) * 100);
    const passingScore = quiz?.passingScore ?? 70;
    const passed = percentage >= passingScore;
    const submissionStatus: 'Submitted' | 'Auto-Submitted – Time Expired' = isTimeExpired
      ? 'Auto-Submitted – Time Expired'
      : 'Submitted';

    const now = new Date();
    const startTimeDate = startedAt ? new Date(startedAt) : new Date(now.getTime() - (quiz?.timeLimit || 15) * 60 * 1000);
    const timeSpentSeconds = Math.max(0, Math.floor((now.getTime() - startTimeDate.getTime()) / 1000));

    const newResult: QuizResultItem = {
      id: Date.now(),
      quizId: quiz?.id || quizId,
      quizName: quiz?.title || 'Quiz Assessment',
      subjectName: quiz?.subjectName || 'General',
      studentName,
      correctAnswers: correctCount,
      incorrectAnswers: Math.max(0, qList.length - correctCount),
      passed,
      percentage,
      dateTaken: now.toISOString(),
      startedAt: startTimeDate.toISOString(),
      submittedAt: now.toISOString(),
      timeLimit: quiz?.timeLimit || 15,
      timeSpentSeconds,
      submissionStatus,
      submissionName: submission?.name || null,
      submissionUrl: submission?.url || null,
      submissionSize: submission?.size || null,
      answersDetail,
      needsGrading: hasEssayPending,
      totalPointsEarned,
      totalPointsPossible,
    };

    setResults((prev) => [newResult, ...prev]);

    // Update quiz attempts & best score
    if (quiz) {
      setQuizzes((prev) =>
        prev.map((q) => {
          if (q.id === quiz.id) {
            const newBest = q.bestScore == null ? percentage : Math.max(q.bestScore, percentage);
            return { ...q, attempts: (q.attempts || 0) + 1, bestScore: newBest };
          }
          return q;
        })
      );
    }

    // Clear active session upon submission
    clearActiveSession(quizId, studentName);

    addActivity(
      isTimeExpired ? 'Quiz auto-submitted (Time Expired)' : 'Quiz attempt submitted',
      `${studentName} ${isTimeExpired ? 'auto-submitted on time expiration' : 'scored'} ${percentage}% on "${quiz?.title || 'Quiz'}" (${submissionStatus}).`
    );

    return {
      percentage,
      correctAnswers: correctCount,
      totalQuestions: qList.length,
      passed,
      passingScore,
      submissionStatus,
      timeSpentSeconds,
      timeLimit: quiz?.timeLimit || 15,
    };
  };

  // Subjects
  const addSubject = (data: { name: string; code: string; description: string; instructor?: string; department?: string }) => {
    const newId = Date.now();
    const newSub: SubjectItem = {
      id: newId,
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description,
      instructor: data.instructor || 'Instructor',
      department: data.department,
      lessonCount: 0,
      quizCount: 0,
      progress: 0,
      status: 'published',
    };
    setSubjects((prev) => [...prev, newSub]);
    addActivity('New subject created', `Subject "${data.name}" (${data.code}) was added to curriculum.`);
  };

  const updateSubject = (id: number, data: Partial<SubjectItem>) => {
    setSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...data } : s))
    );
    if (data.name) {
      setLessons((prev) =>
        prev.map((l) => (l.subjectId === id ? { ...l, subjectName: data.name! } : l))
      );
    }
  };

  const deleteSubject = (id: number) => {
    const target = subjects.find((s) => s.id === id);
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setLessons((prev) => prev.filter((l) => l.subjectId !== id));
    if (target) {
      addActivity('Subject removed', `Subject "${target.name}" and its associated lessons were removed.`);
    }
  };

  // Lessons
  const addLesson = (data: {
    title: string;
    subjectId: number;
    description: string;
    content?: string;
    objectives?: string[];
    lessonType?: 'text' | 'pdf' | 'video';
    published?: boolean;
    durationMinutes?: number;
    videoUrl?: string | null;
    materialName?: string | null;
    materialUrl?: string | null;
    materialSize?: string | null;
    materialType?: string | null;
  }) => {
    const targetSubjectId = Number(data.subjectId);
    const parentSub = subjects.find((s) => s.id === targetSubjectId);
    const newId = Date.now();
    const newLes: LessonItem = {
      id: newId,
      subjectId: targetSubjectId,
      subjectName: parentSub ? parentSub.name : 'General',
      title: data.title,
      description: data.description,
      content:
        data.content ||
        `<p>${data.description}</p><p>Welcome to this lesson. Review the concepts and study materials below.</p>`,
      objectives:
        data.objectives && data.objectives.length > 0
          ? data.objectives
          : ['Understand core concepts', 'Apply knowledge to practice'],
      completed: false,
      progress: 0,
      published: data.published !== false,
      lessonType: data.lessonType || 'text',
      durationMinutes: data.durationMinutes || 25,
      videoUrl: data.videoUrl || null,
      materialName: data.materialName || null,
      materialUrl: data.materialUrl || null,
      materialSize: data.materialSize || null,
      materialType: data.materialType || null,
      status: 'published',
    };
    setLessons((prev) => [...prev, newLes]);
    // increment subject lesson count
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === targetSubjectId
          ? { ...s, lessonCount: (s.lessonCount || 0) + 1 }
          : s
      )
    );
    addActivity('Lesson added', `"${data.title}" was added under ${parentSub?.name ?? 'Subject'}.`);
  };

  const updateLesson = (id: number, data: Partial<LessonItem>) => {
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const updatedSubjectId = data.subjectId !== undefined ? Number(data.subjectId) : l.subjectId;
          const parentSub = subjects.find((s) => s.id === updatedSubjectId);
          return {
            ...l,
            ...data,
            subjectId: updatedSubjectId,
            subjectName: parentSub ? parentSub.name : (data.subjectName || l.subjectName),
          };
        }
        return l;
      })
    );
    addActivity('Lesson updated', `Lesson was updated successfully.`);
  };

  const toggleLessonPublish = (id: number) => {
    setLessons((prev) =>
      prev.map((l) => {
        if (l.id === id) {
          const nextPublished = l.published === false;
          return { ...l, published: nextPublished };
        }
        return l;
      })
    );
  };

  const deleteLesson = (id: number) => {
    const target = lessons.find((l) => l.id === id);
    setLessons((prev) => prev.filter((l) => l.id !== id));
    if (target) {
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === target.subjectId
            ? { ...s, lessonCount: Math.max(0, (s.lessonCount || 1) - 1) }
            : s
        )
      );
      addActivity('Lesson deleted', `Lesson "${target.title}" was deleted.`);
    }
  };

  const getSubjectLessons = (subjectId: number, onlyPublished?: boolean, search?: string) => {
    return filterSubjectLessonsHelper(lessons, subjectId, { onlyPublished, search });
  };

  const resetCurriculumToDefault = () => {
    setSubjects(DEFAULT_SUBJECTS);
    setLessons(DEFAULT_LESSONS);
    setQuizzes(DEFAULT_QUIZZES);
    localStorage.setItem(LS_PREFIX + 'subjects', JSON.stringify(DEFAULT_SUBJECTS));
    localStorage.setItem(LS_PREFIX + 'lessons', JSON.stringify(DEFAULT_LESSONS));
    localStorage.setItem(LS_PREFIX + 'quizzes', JSON.stringify(DEFAULT_QUIZZES));
    localStorage.setItem(CURRICULUM_VERSION_KEY, '1');
    addActivity('Curriculum reset', 'Default subjects and lessons restored.');
  };

  // Admin: Quizzes
  const addQuiz = (data: {
    title: string;
    subjectId: number;
    description: string;
    passingScore: number;
    timeLimit?: number;
    attachmentName?: string | null;
    attachmentUrl?: string | null;
    attachmentSize?: string | null;
    attachmentType?: string | null;
    questions?: QuizQuestionItem[];
    questionCount?: number;
  }) => {
    const parentSub = subjects.find((s) => s.id === Number(data.subjectId));
    const newId = Date.now();
    const newQz: QuizItem = {
      id: newId,
      subjectId: Number(data.subjectId),
      subjectName: parentSub ? parentSub.name : 'General',
      title: data.title,
      description: data.description,
      questionCount: data.questionCount || (data.questions ? data.questions.length : 1),
      passingScore: Number(data.passingScore) || 70,
      timeLimit: Number(data.timeLimit) || 15,
      attempts: 0,
      bestScore: null,
      attachmentName: data.attachmentName || null,
      attachmentUrl: data.attachmentUrl || null,
      attachmentSize: data.attachmentSize || null,
      attachmentType: data.attachmentType || null,
      status: 'published',
      questions: data.questions && data.questions.length > 0 ? data.questions : [
        {
          id: Date.now() + 1,
          number: 1,
          text: `Sample question for ${data.title}: Is this statement correct?`,
          choices: [
            { id: 'true', value: 'true', label: 'True / Yes' },
            { id: 'false', value: 'false', label: 'False / No' },
          ],
        },
      ],
    };
    setQuizzes((prev) => [...prev, newQz]);
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === Number(data.subjectId)
          ? { ...s, quizCount: (s.quizCount || 0) + 1 }
          : s
      )
    );
    addActivity('Quiz created', `Quiz "${data.title}" is now available (${Number(data.timeLimit) || 15} min limit).`);
  };

  const updateQuiz = (id: number, data: Partial<QuizItem>) => {
    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const parentSub = data.subjectId ? subjects.find((s) => s.id === Number(data.subjectId)) : undefined;
          return {
            ...q,
            ...data,
            subjectName: parentSub ? parentSub.name : (data.subjectName || q.subjectName),
            timeLimit: data.timeLimit !== undefined ? (Number(data.timeLimit) || 15) : q.timeLimit,
            passingScore: data.passingScore !== undefined ? (Number(data.passingScore) || 70) : q.passingScore,
          };
        }
        return q;
      })
    );
    const target = quizzes.find((q) => q.id === id);
    addActivity('Quiz updated', `Quiz "${data.title || target?.title || 'Quiz'}" configuration was updated by administrator.`);
  };

  const deleteQuiz = (id: number) => {
    const target = quizzes.find((q) => q.id === id);
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    if (target) {
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === target.subjectId
            ? { ...s, quizCount: Math.max(0, (s.quizCount || 1) - 1) }
            : s
        )
      );
      addActivity('Quiz deleted', `Quiz "${target.title}" was removed.`);
    }
  };

  // Question Bank Management
  const addQuestion = (data: {
    text: string;
    type: QuestionType;
    subjectId: number;
    lessonId?: number | null;
    choices?: QuestionBankChoice[];
    correctAnswer?: string;
    acceptedAnswers?: string[];
    sampleAnswerRubric?: string;
    explanation?: string;
    points?: number;
    difficulty?: DifficultyLevel;
    status?: QuestionStatus;
    authorName?: string;
  }): QuestionBankItem => {
    const parentSub = subjects.find((s) => s.id === Number(data.subjectId));
    const parentLesson = data.lessonId ? lessons.find((l) => l.id === Number(data.lessonId)) : null;
    const newId = Date.now();
    const newQ: QuestionBankItem = {
      id: newId,
      text: data.text.trim(),
      type: data.type || 'multiple_choice',
      subjectId: Number(data.subjectId),
      subjectName: parentSub ? parentSub.name : 'General',
      lessonId: data.lessonId ? Number(data.lessonId) : null,
      lessonTitle: parentLesson ? parentLesson.title : null,
      choices: data.choices || (data.type === 'true_false' ? [
        { id: 'true', value: 'true', label: 'True' },
        { id: 'false', value: 'false', label: 'False' }
      ] : []),
      correctAnswer: data.correctAnswer || (data.type === 'true_false' ? 'true' : ''),
      acceptedAnswers: data.acceptedAnswers || [],
      sampleAnswerRubric: data.sampleAnswerRubric || '',
      explanation: data.explanation || '',
      points: Number(data.points) > 0 ? Number(data.points) : 1,
      difficulty: data.difficulty || 'medium',
      status: data.status || 'published',
      createdAt: new Date().toISOString().split('T')[0],
      authorName: data.authorName || 'Instructor',
    };
    setQuestions((prev) => [newQ, ...prev]);
    addActivity('Question added', `New ${newQ.type.replace('_', ' ')} question added under ${newQ.subjectName}.`);
    return newQ;
  };

  const updateQuestion = (id: number, data: Partial<QuestionBankItem>) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const parentSub = data.subjectId ? subjects.find((s) => s.id === Number(data.subjectId)) : undefined;
          const parentLesson = data.lessonId !== undefined ? lessons.find((l) => l.id === Number(data.lessonId)) : undefined;
          return {
            ...q,
            ...data,
            subjectName: parentSub ? parentSub.name : (data.subjectName || q.subjectName),
            lessonTitle: parentLesson ? parentLesson.title : (data.lessonTitle || q.lessonTitle),
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return q;
      })
    );
    addActivity('Question updated', `Question #${id} was updated.`);
  };

  const deleteQuestion = (id: number): { success: boolean; reason?: string } => {
    const usage = isQuestionUsedInQuiz(quizzes, id);
    if (usage.used) {
      return {
        success: false,
        reason: `Cannot delete question: It is currently used in active quiz "${usage.quizTitles.join(', ')}". Unpublish or remove it from the quiz first to preserve student assessment records.`,
      };
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    addActivity('Question removed', `Question #${id} was deleted from question bank.`);
    return { success: true };
  };

  const toggleQuestionPublish = (id: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          const nextStatus: QuestionStatus = q.status === 'published' ? 'draft' : 'published';
          return { ...q, status: nextStatus };
        }
        return q;
      })
    );
  };

  const gradeEssaySubmission = (
    resultId: number,
    questionIdOrScores: number | Record<number, number>,
    pointsAwardedOrFeedback?: number | string,
    feedback?: string,
    teacherName?: string
  ) => {
    setResults((prev) =>
      prev.map((r) => {
        if (r.id !== resultId) return r;
        const isScoresMap = typeof questionIdOrScores === 'object' && questionIdOrScores !== null;
        const scoresMap = isScoresMap ? (questionIdOrScores as Record<number, number>) : null;
        const targetQId = !isScoresMap ? Number(questionIdOrScores) : null;
        const awarded = typeof pointsAwardedOrFeedback === 'number' ? pointsAwardedOrFeedback : 0;
        const generalFeedback = typeof pointsAwardedOrFeedback === 'string' ? pointsAwardedOrFeedback : feedback;

        const details = (r.answersDetail || []).map((ans) => {
          if (scoresMap && ans.questionId in scoresMap) {
            const pts = Math.max(0, Math.min(ans.pointsPossible, Number(scoresMap[ans.questionId])));
            return {
              ...ans,
              pointsAwarded: pts,
              isCorrect: pts >= ans.pointsPossible * 0.7,
              status: 'graded' as const,
              teacherFeedback: generalFeedback || ans.teacherFeedback,
            };
          }
          if (targetQId != null && ans.questionId === targetQId) {
            return {
              ...ans,
              pointsAwarded: Math.max(0, Math.min(ans.pointsPossible, Number(awarded))),
              isCorrect: Number(awarded) >= ans.pointsPossible * 0.7,
              status: 'graded' as const,
              teacherFeedback: generalFeedback || ans.teacherFeedback,
            };
          }
          return ans;
        });

        const totalPossible = details.reduce((sum, d) => sum + (d.pointsPossible || 1), 0);
        const totalEarned = details.reduce((sum, d) => sum + (d.pointsAwarded || 0), 0);
        const hasPending = details.some((d) => d.status === 'pending_manual_grading');
        const percentage = totalPossible > 0 ? Math.round((totalEarned / totalPossible) * 100) : 0;
        const passed = percentage >= (r.passingScore ?? 70);

        return {
          ...r,
          answersDetail: details,
          needsGrading: hasPending,
          totalPointsEarned: totalEarned,
          totalPointsPossible: totalPossible,
          percentage,
          passed,
          gradedBy: teacherName || 'Instructor',
          gradedAt: new Date().toISOString(),
        };
      })
    );
    addActivity('Essay Graded', `Instructor evaluated student response.`);
  };

  const resetQuestionsToDefault = () => {
    setQuestions(DEFAULT_QUESTIONS);
    localStorage.setItem(LS_PREFIX + 'questions', JSON.stringify(DEFAULT_QUESTIONS));
    localStorage.setItem(QUESTION_BANK_VERSION_KEY, '1');
    addActivity('Question Bank reset', 'Default curriculum questions restored.');
  };

  // Students: Registration, Synchronization & Login Activity Tracking
  const addStudent = (data: {
    fullName: string;
    email: string;
    studentId?: string;
    username?: string;
    contactNumber?: string;
    password?: string;
    source?: 'online_registration' | 'admin_enrolled';
    progress?: number;
  }) => {
    const newId = Date.now();
    const stuId = data.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const regDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const newStu: StudentRecord = {
      id: newId,
      fullName: data.fullName,
      studentId: stuId,
      email: data.email.trim(),
      username: data.username || data.fullName.toLowerCase().replace(/\s+/g, '.'),
      contactNumber: data.contactNumber,
      password: data.password,
      status: 'active',
      progress: data.progress ?? 0,
      source: data.source || 'online_registration',
      registeredAt: regDate,
      lastLoginAt: null,
      lastActive: 'Never',
    };

    setStudents((prev) => {
      const idx = prev.findIndex((s) => s.email.toLowerCase() === data.email.trim().toLowerCase());
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], ...newStu };
        return updated;
      }
      return [newStu, ...prev];
    });

    try {
      const regUsersRaw = localStorage.getItem('lumenpath_registered_users');
      const regUsers = regUsersRaw ? JSON.parse(regUsersRaw) : [];
      const matchIdx = regUsers.findIndex((u: any) => u.email?.toLowerCase() === data.email.trim().toLowerCase());
      if (matchIdx >= 0) {
        regUsers[matchIdx] = { ...regUsers[matchIdx], ...newStu };
      } else {
        regUsers.push(newStu);
      }
      localStorage.setItem('lumenpath_registered_users', JSON.stringify(regUsers));
    } catch {
      // ignore
    }

    addActivity(
      data.source === 'admin_enrolled' ? 'Student enrolled' : 'New student registration',
      `${data.fullName} (${stuId}) ${data.source === 'admin_enrolled' ? 'enrolled by administrator' : 'registered via student portal'}.`
    );

    try {
      supabase.from('profiles').insert([{
        full_name: data.fullName,
        email: data.email.trim(),
        role: 'student',
        status: 'active',
        student_id: stuId,
        source: data.source || 'online_registration',
        created_at: now.toISOString(),
      }]).then(() => {}, () => {});
    } catch {
      // ignore
    }

    return newStu;
  };

  const syncCurrentStudent = (data: {
    fullName?: string;
    email?: string;
    studentId?: string;
    progress?: number;
    source?: 'online_registration' | 'admin_enrolled';
  }) => {
    if (!data.email && !data.fullName) return null;
    const now = new Date();
    const regDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const stuId = data.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`;

    let result: StudentRecord | null = null;
    setStudents((prev) => {
      const matchIndex = prev.findIndex(
        (s) =>
          (data.email && s.email.toLowerCase() === data.email.toLowerCase()) ||
          (data.studentId && s.studentId === data.studentId)
      );
      if (matchIndex >= 0) {
        const updated = [...prev];
        const existing = updated[matchIndex];
        const newProgress = data.progress !== undefined ? data.progress : existing.progress;
        updated[matchIndex] = {
          ...existing,
          fullName: data.fullName || existing.fullName,
          studentId: data.studentId || existing.studentId,
          progress: newProgress,
        };
        result = updated[matchIndex];
        return updated;
      } else {
        const newStu: StudentRecord = {
          id: Date.now(),
          fullName: data.fullName || 'Registered Student',
          studentId: stuId,
          email: data.email || 'student@lumenpath.local',
          username: data.fullName?.toLowerCase().replace(/\s+/g, '.') || 'student',
          status: 'active',
          progress: data.progress || 0,
          source: data.source || 'online_registration',
          registeredAt: regDate,
          lastLoginAt: null,
          lastActive: 'Never',
        };
        result = newStu;
        addActivity('New student registration', `${newStu.fullName} (${newStu.studentId}) registered from student portal.`);
        return [newStu, ...prev];
      }
    });

    try {
      const regUsersRaw = localStorage.getItem('lumenpath_registered_users');
      const regUsers = regUsersRaw ? JSON.parse(regUsersRaw) : [];
      if (result && !regUsers.some((u: any) => u.email?.toLowerCase() === (result as StudentRecord).email.toLowerCase())) {
        regUsers.push(result);
        localStorage.setItem('lumenpath_registered_users', JSON.stringify(regUsers));
      }
    } catch {
      // ignore
    }

    return result;
  };

  const recordStudentLogin = (email: string, fullName?: string, studentId?: string) => {
    if (!email) return;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
    const fullDateTime = `${dateStr}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

    const resolvedName = fullName || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const resolvedStudentId = studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`;

    const activityItem: LoginActivityRecord = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentName: resolvedName,
      email: email.trim(),
      studentId: resolvedStudentId,
      loginDate: dateStr,
      loginTime: timeStr,
      loginAt: fullDateTime,
      timestamp: now.getTime(),
      status: 'success',
    };

    setLoginActivities((prev) => [activityItem, ...prev.slice(0, 199)]);

    setStudents((prev) => {
      const idx = prev.findIndex((s) => s.email.toLowerCase() === email.trim().toLowerCase());
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          fullName: resolvedName || updated[idx].fullName,
          studentId: studentId || updated[idx].studentId,
          lastLoginAt: fullDateTime,
          lastActive: 'Just now',
        };
        return updated;
      } else {
        const newStu: StudentRecord = {
          id: Date.now(),
          fullName: resolvedName,
          studentId: resolvedStudentId,
          email: email.trim(),
          username: email.split('@')[0],
          status: 'active',
          progress: 0,
          source: 'online_registration',
          registeredAt: dateStr,
          lastLoginAt: fullDateTime,
          lastActive: 'Just now',
        };
        return [newStu, ...prev];
      }
    });

    addActivity('Student logged in', `${resolvedName} successfully signed in at ${timeStr}.`);

    try {
      supabase.from('login_activity').insert([{
        student_name: resolvedName,
        email: email.trim(),
        student_id: resolvedStudentId,
        login_at: now.toISOString(),
        status: 'success',
      }]).then(() => {}, () => {});

      supabase.from('profiles').update({
        last_login_at: now.toISOString(),
      }).eq('email', email.trim()).then(() => {}, () => {});
    } catch {
      // ignore
    }
  };

  const clearLoginActivities = () => {
    setLoginActivities([]);
    addActivity('Activity cleared', 'Administrator cleared student login activity audit log.');
  };

  const deleteStudent = (id: number | string) => {
    const target = students.find((s) => String(s.id) === String(id));
    setStudents((prev) => prev.filter((s) => String(s.id) !== String(id)));
    if (target) {
      addActivity('Student removed', `Student record for ${target.fullName} was removed.`);
      try {
        const regUsersRaw = localStorage.getItem('lumenpath_registered_users');
        if (regUsersRaw) {
          const regUsers = JSON.parse(regUsersRaw).filter((u: any) => String(u.id) !== String(id) && u.email?.toLowerCase() !== target.email.toLowerCase());
          localStorage.setItem('lumenpath_registered_users', JSON.stringify(regUsers));
        }
      } catch {}
    }
  };

  const toggleStudentStatus = (id: number | string) => {
    setStudents((prev) =>
      prev.map((s) =>
        String(s.id) === String(id)
          ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' }
          : s
      )
    );
  };

  // Admin: Results & Grading
  const addManualResult = (data: {
    studentName: string;
    quizName: string;
    subjectName: string;
    percentage: number;
    passed: boolean;
    correctAnswers?: number;
    incorrectAnswers?: number;
    submissionName?: string | null;
  }) => {
    const newId = Date.now();
    const newRes: QuizResultItem = {
      id: newId,
      studentName: data.studentName,
      quizName: data.quizName,
      subjectName: data.subjectName,
      percentage: Number(data.percentage),
      passed: Boolean(data.passed),
      correctAnswers: data.correctAnswers ?? (data.passed ? 2 : 1),
      incorrectAnswers: data.incorrectAnswers ?? (data.passed ? 0 : 1),
      dateTaken: new Date().toISOString().slice(0, 10),
      submissionName: data.submissionName || null,
    };
    setResults((prev) => [newRes, ...prev]);
    addActivity('Result recorded', `Grade recorded for ${data.studentName} on ${data.quizName} (${data.percentage}%).`);
  };

  const deleteResult = (id: number) => {
    setResults((prev) => prev.filter((r) => r.id !== id));
    addActivity('Result removed', 'Assessment attempt record was removed.');
  };

  // Dynamic calculations
  const completedCount = lessons.filter((l) => l.completed).length;
  const totalLessonCount = Math.max(1, lessons.length);
  const overallProg = Math.round((completedCount / totalLessonCount) * 100);

  const avgQuizScore =
    results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / results.length)
      : 88;

  const studentStats = {
    progress: overallProg,
    totalSubjects: subjects.length,
    lessonsCompleted: completedCount,
    averageScore: avgQuizScore,
    quizzesTaken: results.length,
  };

  const adminStats = {
    totalStudents: students.length,
    totalSubjects: subjects.length,
    totalLessons: lessons.length,
    totalAttempts: results.length,
    averageScore: avgQuizScore,
  };

  // Reports compilation
  const reportsData = {
    studentPerformance: students.map((s) => {
      const studentResults = results.filter((r) => r.studentName === s.fullName);
      const avg = studentResults.length > 0
        ? Math.round(studentResults.reduce((acc, r) => acc + r.percentage, 0) / studentResults.length)
        : s.progress;
      const passedCount = studentResults.filter((r) => r.passed).length;
      return {
        studentName: s.fullName,
        totalQuizzes: studentResults.length,
        averageScore: avg,
        passed: `${passedCount} / ${studentResults.length || 0}`,
      };
    }),
    quizPerformance: quizzes.map((q) => {
      const qResults = results.filter((r) => r.quizId === q.id);
      const attempts = qResults.length || q.attempts || 0;
      const avg = qResults.length > 0
        ? Math.round(qResults.reduce((acc, r) => acc + r.percentage, 0) / qResults.length)
        : (q.bestScore || 0);
      const passedCount = qResults.filter((r) => r.passed).length;
      const passingRate = attempts > 0 ? Math.round((passedCount / attempts) * 100) : 0;
      return {
        quizName: q.title,
        attempts,
        averageScore: avg,
        passingRate,
      };
    }),
    learningProgress: subjects.map((sub) => {
      const subLessons = lessons.filter((l) => l.subjectId === sub.id);
      const subDone = subLessons.filter((l) => l.completed).length;
      const pct = subLessons.length > 0 ? Math.round((subDone / subLessons.length) * 100) : (sub.progress || 0);
      return {
        student: 'Active Cohort',
        subject: sub.name,
        lessonsCompleted: subDone,
        percentage: pct,
      };
    }),
  };

  const resetAllToDefault = () => {
    setSubjects([]);
    setLessons([]);
    setQuizzes([]);
    setQuestions([]);
    setResults([]);
    setStudents([]);
    setRecentActivity([]);
  };

  const addTeacherApplication = (data: {
    fullName: string;
    teacherId?: string;
    email: string;
    username: string;
    contactNumber: string;
    department: string;
    credentialFile?: { name: string; url: string; size?: string; type?: string } | null;
    password?: string;
  }) => {
    const appId = `APP-${Math.floor(1000 + Math.random() * 9000)}`;
    const tchId = data.teacherId || `TCH-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    const newApp: TeacherApplicationRecord = {
      applicationId: appId,
      userId: `user_tch_${Date.now()}`,
      fullName: data.fullName.trim(),
      teacherId: tchId,
      email: data.email.trim(),
      username: data.username.trim().toLowerCase(),
      contactNumber: data.contactNumber.trim(),
      department: data.department.trim(),
      credentialFile: data.credentialFile || null,
      password: data.password,
      applicationStatus: 'pending',
      submittedAt: `${dateStr}, ${timeStr}`,
      reviewedAt: null,
      reviewedBy: null,
    };

    setTeacherApplications((prev) => [newApp, ...prev]);

    addActivity(
      'New teacher application',
      `${data.fullName} applied for instructor position in ${data.department} (${tchId}).`
    );

    try {
      supabase.from('teacher_applications').insert([{
        application_id: appId,
        full_name: data.fullName,
        teacher_id: tchId,
        email: data.email,
        username: data.username,
        contact_number: data.contactNumber,
        department: data.department,
        application_status: 'pending',
        submitted_at: now.toISOString(),
      }]).then(() => {}, () => {});
    } catch {
      // ignore
    }

    return newApp;
  };

  const approveTeacherApplication = (applicationId: string, adminName: string = 'Administrator') => {
    const now = new Date();
    const reviewDate = `${now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

    let targetApp: TeacherApplicationRecord | null = null;
    setTeacherApplications((prev) =>
      prev.map((app) => {
        if (app.applicationId === applicationId) {
          targetApp = {
            ...app,
            applicationStatus: 'approved',
            reviewedAt: reviewDate,
            reviewedBy: adminName,
            rejectionReason: undefined,
          };
          return targetApp;
        }
        return app;
      })
    );

    if (targetApp) {
      addActivity(
        'Teacher application approved',
        `${(targetApp as TeacherApplicationRecord).fullName} (${(targetApp as TeacherApplicationRecord).teacherId}) was approved as instructor by ${adminName}.`
      );
    }
  };

  const rejectTeacherApplication = (applicationId: string, reason?: string, adminName: string = 'Administrator') => {
    const now = new Date();
    const reviewDate = `${now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}, ${now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

    let targetApp: TeacherApplicationRecord | null = null;
    setTeacherApplications((prev) =>
      prev.map((app) => {
        if (app.applicationId === applicationId) {
          targetApp = {
            ...app,
            applicationStatus: 'rejected',
            rejectionReason: reason || 'Application did not meet qualification requirements.',
            reviewedAt: reviewDate,
            reviewedBy: adminName,
          };
          return targetApp;
        }
        return app;
      })
    );

    if (targetApp) {
      addActivity(
        'Teacher application rejected',
        `Teacher application for ${(targetApp as TeacherApplicationRecord).fullName} was rejected by ${adminName}.`
      );
    }
  };

  const getTeacherApplication = (identifier: string) => {
    if (!identifier) return undefined;
    const q = identifier.trim().toLowerCase();
    return teacherApplications.find(
      (a) =>
        a.email.toLowerCase() === q ||
        a.username.toLowerCase() === q ||
        a.teacherId.toLowerCase() === q ||
        a.applicationId.toLowerCase() === q
    );
  };

  return (
    <PlatformStoreContext.Provider
      value={{
        subjects,
        lessons,
        quizzes,
        questions,
        results,
        students,
        loginActivities,
        recentActivity,
        teacherApplications,
        assignments,
        assignmentSubmissions,
        assignmentAuditLogs,
        createAssignment,
        updateAssignment,
        publishAssignment,
        deleteAssignment,
        submitAssignment,
        gradeAssignmentSubmission,
        returnSubmissionForRevision,
        completeLesson,
        resetLessonProgress,
        uploadLessonSubmission,
        removeLessonSubmission,
        submitQuiz,
        activeSessions,
        getActiveSession,
        startQuizSession,
        saveDraftAnswers,
        clearActiveSession,
        addSubject,
        updateSubject,
        deleteSubject,
        addLesson,
        updateLesson,
        toggleLessonPublish,
        deleteLesson,
        getSubjectLessons,
        resetCurriculumToDefault,
        addQuiz,
        updateQuiz,
        deleteQuiz,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        toggleQuestionPublish,
        gradeEssaySubmission,
        resetQuestionsToDefault,
        addStudent,
        syncCurrentStudent,
        recordStudentLogin,
        clearLoginActivities,
        deleteStudent,
        toggleStudentStatus,
        addTeacherApplication,
        approveTeacherApplication,
        rejectTeacherApplication,
        getTeacherApplication,
        addManualResult,
        deleteResult,
        studentStats,
        adminStats,
        reportsData,
        resetAllToDefault,
      }}
    >
      {children}
    </PlatformStoreContext.Provider>
  );
}

export function usePlatformStore() {
  const context = useContext(PlatformStoreContext);
  if (!context) {
    throw new Error('usePlatformStore must be used within a PlatformStoreProvider');
  }
  return context;
}

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

export interface SubjectItem {
  id: number;
  name: string;
  code: string;
  description: string;
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

export interface QuizQuestionItem {
  id: number;
  number?: number;
  text: string;
  type?: string;
  choices: { id: string; value: string; label: string }[];
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
  type: string;
  points: number;
  status: string;
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

  // Admin Actions
  addSubject: (data: { name: string; code: string; description: string }) => void;
  deleteSubject: (id: number) => void;
  addLesson: (data: {
    title: string;
    subjectId: number;
    description: string;
    content?: string;
    objectives?: string[];
    materialName?: string | null;
    materialUrl?: string | null;
    materialSize?: string | null;
    materialType?: string | null;
  }) => void;
  deleteLesson: (id: number) => void;
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
  }) => void;
  updateQuiz: (id: number, data: Partial<QuizItem>) => void;
  deleteQuiz: (id: number) => void;
  addQuestion: (data: { text: string; type: string; points: number }) => void;
  deleteQuestion: (id: number) => void;
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

export const DEFAULT_SUBJECTS: SubjectItem[] = [];

export const DEFAULT_LESSONS: LessonItem[] = [];

export const DEFAULT_QUIZZES: QuizItem[] = [];

// One-time migration: clear any old cached demo data so platform starts empty
try {
  const cleared = localStorage.getItem('lumenpath_demo_cleared_v2');
  if (!cleared) {
    localStorage.removeItem('lumenpath_store_subjects');
    localStorage.removeItem('lumenpath_store_lessons');
    localStorage.removeItem('lumenpath_store_quizzes');
    localStorage.removeItem('lumenpath_store_questions');
    localStorage.removeItem('lumenpath_store_results');
    localStorage.removeItem('lumenpath_store_activity');
    localStorage.removeItem('lumenpath_store_active_sessions');
    localStorage.setItem('lumenpath_demo_cleared_v2', '1');
  }
} catch {
  // ignore
}

export function PlatformStoreProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<SubjectItem[]>(() =>
    getInitial<SubjectItem[]>('subjects', [])
  );
  const [lessons, setLessons] = useState<LessonItem[]>(() =>
    getInitial<LessonItem[]>('lessons', [])
  );
  const [quizzes, setQuizzes] = useState<QuizItem[]>(() =>
    getInitial<QuizItem[]>('quizzes', [])
  );
  const [questions, setQuestions] = useState<QuestionBankItem[]>(() =>
    getInitial('questions', [])
  );
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

  // Student: submit quiz
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
    let correct = 0;

    qList.forEach((q) => {
      const choice = q.choices?.[0]?.value || 'a';
      const ans = answers[q.id];
      if (ans && (ans === choice || ans === 'true' || ans === 'a')) {
        correct++;
      }
    });

    const total = Math.max(1, qList.length);
    const percentage = Math.round((correct / total) * 100);
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
      correctAnswers: correct,
      incorrectAnswers: total - correct,
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
      correctAnswers: correct,
      totalQuestions: total,
      passed,
      passingScore,
      submissionStatus,
      timeSpentSeconds,
      timeLimit: quiz?.timeLimit || 15,
    };
  };

  // Admin: Subjects
  const addSubject = (data: { name: string; code: string; description: string }) => {
    const newId = Date.now();
    const newSub: SubjectItem = {
      id: newId,
      name: data.name,
      code: data.code.toUpperCase(),
      description: data.description,
      lessonCount: 0,
      quizCount: 0,
      progress: 0,
      status: 'published',
    };
    setSubjects((prev) => [...prev, newSub]);
    addActivity('New subject created', `Subject "${data.name}" (${data.code}) was added to curriculum.`);
  };

  const deleteSubject = (id: number) => {
    const target = subjects.find((s) => s.id === id);
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    if (target) {
      addActivity('Subject removed', `Subject "${target.name}" was removed from the catalog.`);
    }
  };

  // Admin: Lessons
  const addLesson = (data: {
    title: string;
    subjectId: number;
    description: string;
    content?: string;
    objectives?: string[];
    materialName?: string | null;
    materialUrl?: string | null;
    materialSize?: string | null;
    materialType?: string | null;
  }) => {
    const parentSub = subjects.find((s) => s.id === Number(data.subjectId));
    const newId = Date.now();
    const newLes: LessonItem = {
      id: newId,
      subjectId: Number(data.subjectId),
      subjectName: parentSub ? parentSub.name : 'General',
      title: data.title,
      description: data.description,
      content:
        data.content ||
        `<p>${data.description}</p><p>Welcome to this lesson. Review the concepts and download any attached materials below.</p>`,
      objectives:
        data.objectives && data.objectives.length > 0
          ? data.objectives
          : ['Understand key concepts', 'Apply knowledge to practice'],
      completed: false,
      progress: 0,
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
        s.id === Number(data.subjectId)
          ? { ...s, lessonCount: (s.lessonCount || 0) + 1 }
          : s
      )
    );
    addActivity('Lesson published', `"${data.title}" was added under ${parentSub?.name ?? 'General'}.`);
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
  }) => {
    const parentSub = subjects.find((s) => s.id === Number(data.subjectId));
    const newId = Date.now();
    const newQz: QuizItem = {
      id: newId,
      subjectId: Number(data.subjectId),
      subjectName: parentSub ? parentSub.name : 'General',
      title: data.title,
      description: data.description,
      questionCount: 1,
      passingScore: Number(data.passingScore) || 70,
      timeLimit: Number(data.timeLimit) || 15,
      attempts: 0,
      bestScore: null,
      attachmentName: data.attachmentName || null,
      attachmentUrl: data.attachmentUrl || null,
      attachmentSize: data.attachmentSize || null,
      attachmentType: data.attachmentType || null,
      status: 'published',
      questions: [
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

  // Admin: Questions
  const addQuestion = (data: { text: string; type: string; points: number }) => {
    const newId = Date.now();
    const newQ: QuestionBankItem = {
      id: newId,
      text: data.text,
      type: data.type || 'multiple_choice',
      points: Number(data.points) || 1,
      status: 'Published',
    };
    setQuestions((prev) => [...prev, newQ]);
    addActivity('Question added', `New question added to bank: "${data.text.slice(0, 30)}..."`);
  };

  const deleteQuestion = (id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    addActivity('Question removed', 'Question was deleted from question bank.');
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
        deleteSubject,
        addLesson,
        deleteLesson,
        addQuiz,
        updateQuiz,
        deleteQuiz,
        addQuestion,
        deleteQuestion,
        addStudent,
        syncCurrentStudent,
        recordStudentLogin,
        clearLoginActivities,
        deleteStudent,
        toggleStudentStatus,
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

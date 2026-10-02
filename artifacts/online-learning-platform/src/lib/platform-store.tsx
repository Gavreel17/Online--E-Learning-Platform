import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  DEMO_SUBJECTS,
  DEMO_LESSONS,
  DEMO_QUIZZES,
  DEMO_RESULTS,
  DEMO_ADMIN_STUDENTS,
  DEMO_ADMIN_QUESTIONS,
} from '@/lib/mock-data';

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
  submissionName?: string | null;
  submissionUrl?: string | null;
  submissionSize?: string | null;
}

export interface StudentRecord {
  id: number;
  fullName: string;
  studentId: string;
  email: string;
  username?: string;
  status: 'active' | 'inactive';
  progress: number;
  source?: 'online_registration' | 'admin_enrolled' | 'demo';
  registeredAt?: string;
  lastActive?: string;
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
    submission?: { name: string; url: string; size?: string } | null
  ) => {
    percentage: number;
    correctAnswers: number;
    totalQuestions: number;
    passed: boolean;
    passingScore: number;
  };

  // Student Registration & Synchronization
  addStudent: (data: {
    fullName: string;
    email: string;
    studentId?: string;
    username?: string;
    source?: 'online_registration' | 'admin_enrolled';
    progress?: number;
  }) => StudentRecord;
  syncCurrentStudent: (data: {
    fullName?: string;
    email?: string;
    studentId?: string;
    progress?: number;
  }) => void;
  deleteStudent: (id: number) => void;
  toggleStudentStatus: (id: number) => void;

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
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as T;
      if (!Array.isArray(parsed) && parsed != null) return parsed as T;
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

export function PlatformStoreProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState<SubjectItem[]>(() =>
    getInitial('subjects', DEMO_SUBJECTS as SubjectItem[])
  );
  const [lessons, setLessons] = useState<LessonItem[]>(() =>
    getInitial('lessons', DEMO_LESSONS as LessonItem[])
  );
  const [quizzes, setQuizzes] = useState<QuizItem[]>(() =>
    getInitial('quizzes', DEMO_QUIZZES as unknown as QuizItem[])
  );
  const [questions, setQuestions] = useState<QuestionBankItem[]>(() =>
    getInitial('questions', DEMO_ADMIN_QUESTIONS as QuestionBankItem[])
  );
  const [results, setResults] = useState<QuizResultItem[]>(() =>
    getInitial('results', DEMO_RESULTS as unknown as QuizResultItem[])
  );
  const [students, setStudents] = useState<StudentRecord[]>(() =>
    getInitial('students', DEMO_ADMIN_STUDENTS as unknown as StudentRecord[])
  );
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>(() =>
    getInitial('activity', [
      { id: 1, title: 'New student registration', message: 'Maya Chen registered via Student Portal.' },
      { id: 2, title: 'Quiz milestone reached', message: 'Computer Fundamentals passed 80 attempts.' },
      { id: 3, title: 'Lesson published', message: 'Web accessibility is now available to students.' },
    ])
  );

  // Sync to storage
  useEffect(() => setStorage('subjects', subjects), [subjects]);
  useEffect(() => setStorage('lessons', lessons), [lessons]);
  useEffect(() => setStorage('quizzes', quizzes), [quizzes]);
  useEffect(() => setStorage('questions', questions), [questions]);
  useEffect(() => setStorage('results', results), [results]);
  useEffect(() => setStorage('students', students), [students]);
  useEffect(() => setStorage('activity', recentActivity), [recentActivity]);

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

  // Student: submit quiz
  const submitQuiz = (
    quizId: number,
    answers: Record<number, string>,
    studentName: string = 'Current Student',
    submission?: { name: string; url: string; size?: string } | null
  ) => {
    const quiz = quizzes.find((q) => q.id === quizId) || DEMO_QUIZZES[0];
    const qList = quiz.questions || [];
    let correct = 0;

    qList.forEach((q) => {
      const choice = q.choices?.[0]?.value || 'a';
      const ans = answers[q.id];
      if (ans === choice || ans === 'true' || ans === 'a') {
        correct++;
      }
    });

    const total = Math.max(1, qList.length);
    const percentage = Math.round((correct / total) * 100);
    const passingScore = quiz.passingScore ?? 70;
    const passed = percentage >= passingScore;

    const newResult: QuizResultItem = {
      id: Date.now(),
      quizId,
      quizName: quiz.title,
      subjectName: quiz.subjectName,
      studentName,
      correctAnswers: correct,
      incorrectAnswers: total - correct,
      passed,
      percentage,
      dateTaken: new Date().toISOString(),
      submissionName: submission?.name || null,
      submissionUrl: submission?.url || null,
      submissionSize: submission?.size || null,
    };

    setResults((prev) => [newResult, ...prev]);

    // Update quiz attempts & best score
    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id === quizId) {
          const newBest = q.bestScore == null ? percentage : Math.max(q.bestScore, percentage);
          return { ...q, attempts: (q.attempts || 0) + 1, bestScore: newBest };
        }
        return q;
      })
    );

    addActivity(
      'Quiz attempt submitted',
      `${studentName} scored ${percentage}% on "${quiz.title}"${submission?.name ? ` with attachment "${submission.name}"` : ''}.`
    );

    return {
      percentage,
      correctAnswers: correct,
      totalQuestions: total,
      passed,
      passingScore,
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
    addActivity('Quiz created', `Quiz "${data.title}" is now available.`);
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

  // Students: Registration & Synchronization
  const addStudent = (data: {
    fullName: string;
    email: string;
    studentId?: string;
    username?: string;
    source?: 'online_registration' | 'admin_enrolled';
    progress?: number;
  }) => {
    const newId = Date.now();
    const stuId = data.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`;
    const newStu: StudentRecord = {
      id: newId,
      fullName: data.fullName,
      studentId: stuId,
      email: data.email,
      username: data.username || data.fullName.toLowerCase().replace(/\s+/g, '.'),
      status: 'active',
      progress: data.progress ?? 0,
      source: data.source || 'admin_enrolled',
      registeredAt: 'Just now',
      lastActive: 'Just now',
    };
    setStudents((prev) => [newStu, ...prev]);
    addActivity(
      data.source === 'online_registration' ? 'New student registration' : 'Student enrolled',
      `${data.fullName} (${stuId}) ${data.source === 'online_registration' ? 'registered via student portal' : 'enrolled by administrator'}.`
    );
    return newStu;
  };

  const syncCurrentStudent = (data: {
    fullName?: string;
    email?: string;
    studentId?: string;
    progress?: number;
  }) => {
    if (!data.email && !data.fullName) return;
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
        if (existing.progress !== newProgress || (data.fullName && existing.fullName !== data.fullName)) {
          updated[matchIndex] = {
            ...existing,
            fullName: data.fullName || existing.fullName,
            progress: newProgress,
            lastActive: 'Just now',
          };
          return updated;
        }
        return prev;
      } else {
        const newStu: StudentRecord = {
          id: Date.now(),
          fullName: data.fullName || 'Registered Student',
          studentId: data.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`,
          email: data.email || 'student@lumenpath.local',
          username: data.fullName?.toLowerCase().replace(/\s+/g, '.') || 'student',
          status: 'active',
          progress: data.progress || 0,
          source: 'online_registration',
          registeredAt: 'Just now',
          lastActive: 'Just now',
        };
        addActivity('New student registration', `${newStu.fullName} (${newStu.studentId}) registered from student dashboard.`);
        return [newStu, ...prev];
      }
    });
  };

  const deleteStudent = (id: number) => {
    const target = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (target) {
      addActivity('Student removed', `Student record for ${target.fullName} was removed.`);
    }
  };

  const toggleStudentStatus = (id: number) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
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
    totalAttempts: results.length + 580,
    averageScore: avgQuizScore,
  };

  // Reports compilation
  const reportsData = {
    studentPerformance: students.map((s) => ({
      studentName: s.fullName,
      totalQuizzes: Math.floor(2 + (s.id % 4)),
      averageScore: s.progress > 50 ? 92 : 78,
      passed: s.progress > 50 ? '3 / 3' : '2 / 3',
    })),
    quizPerformance: quizzes.map((q) => ({
      quizName: q.title,
      attempts: (q.attempts || 1) * 12 + 15,
      averageScore: q.bestScore || 85,
      passingRate: 88,
    })),
    learningProgress: subjects.map((sub) => {
      const subLessons = lessons.filter((l) => l.subjectId === sub.id);
      const subDone = subLessons.filter((l) => l.completed).length;
      const pct = subLessons.length > 0 ? Math.round((subDone / subLessons.length) * 100) : sub.progress;
      return {
        student: 'Active Cohort',
        subject: sub.name,
        lessonsCompleted: subDone || 3,
        percentage: pct || sub.progress,
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
        recentActivity,
        completeLesson,
        resetLessonProgress,
        uploadLessonSubmission,
        removeLessonSubmission,
        submitQuiz,
        addSubject,
        deleteSubject,
        addLesson,
        deleteLesson,
        addQuiz,
        deleteQuiz,
        addQuestion,
        deleteQuestion,
        addStudent,
        syncCurrentStudent,
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

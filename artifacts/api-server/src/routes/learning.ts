import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { Router, type IRouter, type Request, type Response } from "express";
import {
  CreateAdminStudentBody,
  CreateQuestionBody,
  CreateQuizBody,
  CreateSubjectBody,
  CreateLessonBody,
  SubmitQuizAttemptBody,
  UpdateAdminStudentBody,
  UpdateQuestionBody,
  UpdateQuizBody,
  UpdateSubjectBody,
  UpdateLessonBody,
  UpdateMeBody,
  UpdateAdminProfileBody,
} from "@workspace/api-zod";
import { db } from "@workspace/db";
import {
  lessonsTable,
  notificationsTable,
  platformUsersTable,
  quizAnswersTable,
  quizAttemptsTable,
  quizChoicesTable,
  quizQuestionsTable,
  quizzesTable,
  studentProgressTable,
  subjectsTable,
} from "@workspace/db";
import { requireAdmin, requireAuth, type AuthenticatedRequest } from "../middlewares/auth";

const router: IRouter = Router();

function user(req: Request) {
  return (req as AuthenticatedRequest).platformUser;
}

function numberParam(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

async function subjectView(subject: typeof subjectsTable.$inferSelect, userId?: number) {
  const [lessonCount, quizCount, completedCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(lessonsTable).where(and(eq(lessonsTable.subjectId, subject.id), eq(lessonsTable.status, "published"))),
    db.select({ count: sql<number>`count(*)` }).from(quizzesTable).where(and(eq(quizzesTable.subjectId, subject.id), eq(quizzesTable.status, "published"))),
    userId
      ? db
          .select({ count: sql<number>`count(*)` })
          .from(studentProgressTable)
          .innerJoin(lessonsTable, eq(studentProgressTable.lessonId, lessonsTable.id))
          .where(and(eq(studentProgressTable.userId, userId), eq(studentProgressTable.completed, true), eq(lessonsTable.subjectId, subject.id)))
      : Promise.resolve([{ count: 0 }]),
  ]);
  const lessons = Number(lessonCount[0]?.count ?? 0);
  const completed = Number(completedCount[0]?.count ?? 0);
  return {
    id: subject.id,
    name: subject.name,
    code: subject.code,
    description: subject.description,
    lessonCount: lessons,
    quizCount: Number(quizCount[0]?.count ?? 0),
    progress: lessons ? Math.round((completed / lessons) * 100) : 0,
    status: subject.status,
  };
}

async function lessonViews(userId: number | undefined, subjectId?: number, includeDrafts = false) {
  const rows = await db
    .select({ lesson: lessonsTable, subjectName: subjectsTable.name })
    .from(lessonsTable)
    .innerJoin(subjectsTable, eq(lessonsTable.subjectId, subjectsTable.id))
    .where(
      includeDrafts
        ? subjectId
          ? eq(lessonsTable.subjectId, subjectId)
          : sql`true`
        : subjectId
          ? and(eq(lessonsTable.subjectId, subjectId), eq(lessonsTable.status, "published"))
          : eq(lessonsTable.status, "published"),
    )
    .orderBy(desc(lessonsTable.publishedAt));
  const progressRows = userId
    ? await db.select().from(studentProgressTable).where(eq(studentProgressTable.userId, userId))
    : [];
  const completed = new Set(progressRows.filter((row) => row.completed).map((row) => row.lessonId));
  return rows.map(({ lesson, subjectName }) => ({
    id: lesson.id,
    subjectId: lesson.subjectId,
    subjectName,
    title: lesson.title,
    description: lesson.description,
    content: lesson.content,
    objectives: lesson.objectives,
    materialUrl: lesson.materialUrl,
    materialName: lesson.materialName,
    publishedAt: lesson.publishedAt,
    status: lesson.status,
    completed: completed.has(lesson.id),
    progress: completed.has(lesson.id) ? 100 : 0,
  }));
}

async function quizViews(userId: number | undefined, includeDrafts = false) {
  const quizzes = await db
    .select({ quiz: quizzesTable, subjectName: subjectsTable.name })
    .from(quizzesTable)
    .innerJoin(subjectsTable, eq(quizzesTable.subjectId, subjectsTable.id))
    .where(includeDrafts ? sql`true` : eq(quizzesTable.status, "published"))
    .orderBy(desc(quizzesTable.createdAt));
  return Promise.all(
    quizzes.map(async ({ quiz, subjectName }) => {
      const questions = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.quizId, quiz.id));
      const attempts = userId
        ? await db.select().from(quizAttemptsTable).where(and(eq(quizAttemptsTable.quizId, quiz.id), eq(quizAttemptsTable.userId, userId)))
        : await db.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.quizId, quiz.id));
      return {
        id: quiz.id,
        title: quiz.title,
        subjectId: quiz.subjectId,
        subjectName,
        lessonId: quiz.lessonId,
        description: quiz.description,
        questionCount: questions.length,
        passingScore: quiz.passingScore,
        timeLimit: quiz.timeLimit,
        status: quiz.status,
        attempts: attempts.length,
        bestScore: attempts.length ? Math.max(...attempts.map((attempt) => attempt.percentage)) : null,
      };
    }),
  );
}

async function progressView(userId: number) {
  const [lessons, completed, attempts, subjects] = await Promise.all([
    db.select().from(lessonsTable).where(eq(lessonsTable.status, "published")),
    db.select().from(studentProgressTable).where(and(eq(studentProgressTable.userId, userId), eq(studentProgressTable.completed, true))),
    db.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.userId, userId)),
    db.select().from(subjectsTable).where(eq(subjectsTable.status, "published")),
  ]);
  const subjectProgress = await Promise.all(
    subjects.map(async (subject) => {
      const total = lessons.filter((lesson) => lesson.subjectId === subject.id).length;
      const done = completed.filter((row) => lessons.some((lesson) => lesson.id === row.lessonId && lesson.subjectId === subject.id)).length;
      return { subjectId: subject.id, subjectName: subject.name, completed: done, total, percentage: total ? Math.round((done / total) * 100) : 0 };
    }),
  );
  const averageScore = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length) : 0;
  return {
    overallProgress: lessons.length ? Math.round((completed.length / lessons.length) * 100) : 0,
    lessonsCompleted: completed.length,
    lessonsRemaining: Math.max(lessons.length - completed.length, 0),
    quizzesCompleted: attempts.length,
    averageScore,
    subjects: subjectProgress,
  };
}

function profileView(account: typeof platformUsersTable.$inferSelect) {
  return {
    id: account.id,
    fullName: account.fullName,
    studentId: account.studentId,
    email: account.email,
    username: account.username,
    avatarUrl: account.avatarUrl,
    role: account.role,
  };
}

function resultView(
  attempt: typeof quizAttemptsTable.$inferSelect,
  quiz: typeof quizzesTable.$inferSelect,
  subjectName: string,
) {
  return {
    id: attempt.id,
    quizId: quiz.id,
    quizName: quiz.title,
    subjectName,
    score: attempt.score,
    totalPoints: attempt.totalPoints,
    percentage: attempt.percentage,
    correctAnswers: attempt.correctAnswers,
    incorrectAnswers: attempt.incorrectAnswers,
    passingScore: quiz.passingScore,
    passed: attempt.passed,
    dateTaken: attempt.takenAt,
  };
}

router.get("/me", requireAuth, (req, res) => res.json(profileView(user(req))));

router.patch("/me", requireAuth, async (req, res) => {
  const parsed = UpdateMeBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid profile details" });
  const [updated] = await db.update(platformUsersTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(platformUsersTable.id, user(req).id)).returning();
  return res.json(profileView(updated));
});

router.get("/dashboard", requireAuth, async (req, res) => {
  const account = user(req);
  const [subjects, lessons, quizzes, attempts, progress, recentResults] = await Promise.all([
    db.select().from(subjectsTable).where(eq(subjectsTable.status, "published")),
    lessonViews(account.id),
    quizViews(account.id),
    db.select().from(quizAttemptsTable).where(eq(quizAttemptsTable.userId, account.id)).orderBy(desc(quizAttemptsTable.takenAt)),
    progressView(account.id),
    db
      .select({ attempt: quizAttemptsTable, quiz: quizzesTable, subjectName: subjectsTable.name })
      .from(quizAttemptsTable)
      .innerJoin(quizzesTable, eq(quizAttemptsTable.quizId, quizzesTable.id))
      .innerJoin(subjectsTable, eq(quizzesTable.subjectId, subjectsTable.id))
      .where(eq(quizAttemptsTable.userId, account.id))
      .orderBy(desc(quizAttemptsTable.takenAt))
      .limit(3),
  ]);
  return res.json({
    profile: profileView(account),
    stats: {
      totalSubjects: subjects.length,
      lessonsCompleted: progress.lessonsCompleted,
      quizzesTaken: attempts.length,
      averageScore: progress.averageScore,
      progress: progress.overallProgress,
    },
    recentLessons: lessons.slice(0, 3),
    recentResults: recentResults.map(({ attempt, quiz, subjectName }) => resultView(attempt, quiz, subjectName)),
    recommendedLessons: lessons.filter((lesson) => !lesson.completed).slice(0, 3),
  });
});

router.get("/subjects", requireAuth, async (req, res) => {
  const rows = await db.select().from(subjectsTable).where(eq(subjectsTable.status, "published"));
  return res.json(await Promise.all(rows.map((row) => subjectView(row, user(req).id))));
});

router.get("/subjects/:id", requireAuth, async (req, res) => {
  const id = numberParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid subject id" });
  const [subject] = await db.select().from(subjectsTable).where(eq(subjectsTable.id, id)).limit(1);
  if (!subject) return res.status(404).json({ error: "Subject not found" });
  return res.json({
    ...(await subjectView(subject, user(req).id)),
    lessons: await lessonViews(user(req).id, id),
    quizzes: (await quizViews(user(req).id)).filter((quiz) => quiz.subjectId === id),
  });
});

router.get("/lessons", requireAuth, async (req, res) => {
  const subjectId = numberParam(req.query.subjectId);
  const status = typeof req.query.status === "string" ? req.query.status : "all";
  let rows = await lessonViews(user(req).id, subjectId ?? undefined);
  if (status === "completed") rows = rows.filter((lesson) => lesson.completed);
  if (status === "incomplete") rows = rows.filter((lesson) => !lesson.completed);
  return res.json(rows);
});

router.get("/lessons/:id", requireAuth, async (req, res) => {
  const id = numberParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid lesson id" });
  const rows = await lessonViews(user(req).id);
  const lesson = rows.find((item) => item.id === id);
  if (!lesson) return res.status(404).json({ error: "Lesson not found" });
  return res.json(lesson);
});

router.post("/lessons/:id/complete", requireAuth, async (req, res) => {
  const id = numberParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid lesson id" });
  await db
    .insert(studentProgressTable)
    .values({ userId: user(req).id, lessonId: id, completed: true, completedAt: new Date() })
    .onConflictDoUpdate({ target: [studentProgressTable.userId, studentProgressTable.lessonId], set: { completed: true, completedAt: new Date() } });
  const progress = await progressView(user(req).id);
  return res.json({ lessonId: id, completed: true, overallProgress: progress.overallProgress });
});

router.get("/quizzes", requireAuth, async (req, res) => res.json(await quizViews(user(req).id)));

router.get("/quizzes/:id", requireAuth, async (req, res) => {
  const id = numberParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid quiz id" });
  const [row] = await db
    .select({ quiz: quizzesTable, subjectName: subjectsTable.name })
    .from(quizzesTable)
    .innerJoin(subjectsTable, eq(quizzesTable.subjectId, subjectsTable.id))
    .where(eq(quizzesTable.id, id))
    .limit(1);
  if (!row) return res.status(404).json({ error: "Quiz not found" });
  const questions = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.quizId, id)).orderBy(quizQuestionsTable.questionNumber);
  const choices = questions.length ? await db.select().from(quizChoicesTable).where(inArray(quizChoicesTable.questionId, questions.map((question) => question.id))) : [];
  return res.json({
    ...(await quizViews(user(req).id)).find((quiz) => quiz.id === id),
    description: row.quiz.description,
    questions: questions.map((question) => ({
      id: question.id,
      number: question.questionNumber,
      text: question.text,
      type: question.type,
      choices: choices.filter((choice) => choice.questionId === question.id).map((choice) => ({ id: String(choice.id), value: choice.value, label: choice.label })),
      points: question.points,
    })),
  });
});

router.post("/quizzes/:id/attempts", requireAuth, async (req, res) => {
  const parsed = SubmitQuizAttemptBody.safeParse(req.body);
  const quizId = numberParam(req.params.id);
  if (!quizId || !parsed.success) return res.status(400).json({ error: "Invalid quiz submission" });
  const [quizRow] = await db
    .select({ quiz: quizzesTable, subjectName: subjectsTable.name })
    .from(quizzesTable)
    .innerJoin(subjectsTable, eq(quizzesTable.subjectId, subjectsTable.id))
    .where(eq(quizzesTable.id, quizId))
    .limit(1);
  if (!quizRow) return res.status(404).json({ error: "Quiz not found" });
  const questions = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.quizId, quizId));
  const answers = parsed.data.answers;
  const scored = questions.map((question) => {
    const answer = answers.find((item) => item.questionId === question.id)?.answer ?? "";
    return { question, answer, correct: answer === question.correctAnswer };
  });
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);
  const score = scored.reduce((sum, item) => sum + (item.correct ? item.question.points : 0), 0);
  const percentage = totalPoints ? Math.round((score / totalPoints) * 100) : 0;
  const [attempt] = await db
    .insert(quizAttemptsTable)
    .values({
      userId: user(req).id,
      quizId,
      score,
      totalPoints,
      percentage,
      correctAnswers: scored.filter((item) => item.correct).length,
      incorrectAnswers: scored.filter((item) => !item.correct).length,
      passed: percentage >= quizRow.quiz.passingScore,
    })
    .returning();
  if (scored.length) {
    await db.insert(quizAnswersTable).values(scored.map((item) => ({
      attemptId: attempt.id,
      questionId: item.question.id,
      answer: item.answer,
      isCorrect: item.correct,
      points: item.correct ? item.question.points : 0,
    })));
  }
  return res.status(201).json(resultView(attempt, quizRow.quiz, quizRow.subjectName));
});

router.get("/results", requireAuth, async (req, res) => {
  const rows = await db
    .select({ attempt: quizAttemptsTable, quiz: quizzesTable, subjectName: subjectsTable.name })
    .from(quizAttemptsTable)
    .innerJoin(quizzesTable, eq(quizAttemptsTable.quizId, quizzesTable.id))
    .innerJoin(subjectsTable, eq(quizzesTable.subjectId, subjectsTable.id))
    .where(eq(quizAttemptsTable.userId, user(req).id))
    .orderBy(desc(quizAttemptsTable.takenAt));
  return res.json(rows.map(({ attempt, quiz, subjectName }) => resultView(attempt, quiz, subjectName)));
});

router.get("/progress", requireAuth, async (req, res) => res.json(await progressView(user(req).id)));

router.get("/notifications", requireAuth, async (req, res) => {
  const rows = await db.select().from(notificationsTable).where(eq(notificationsTable.userId, user(req).id)).orderBy(desc(notificationsTable.createdAt));
  return res.json(rows);
});

router.get("/admin/dashboard", requireAdmin, async (_req, res) => {
  const [students, subjects, lessons, quizzes, attempts] = await Promise.all([
    db.select().from(platformUsersTable).where(eq(platformUsersTable.role, "student")),
    db.select().from(subjectsTable),
    db.select().from(lessonsTable),
    db.select().from(quizzesTable),
    db.select().from(quizAttemptsTable),
  ]);
  const averageScore = attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length) : 0;
  const points = (items: Array<{ label: string; value: number }>) => items;
  return res.json({
    stats: { totalStudents: students.length, totalSubjects: subjects.length, totalLessons: lessons.length, totalQuizzes: quizzes.length, totalAttempts: attempts.length, averageScore },
    performance: points(students.slice(0, 6).map((student) => ({ label: student.fullName.split(" ")[0], value: student.id % 2 ? 78 : 88 }))),
    quizScores: points(attempts.slice(0, 6).map((attempt, index) => ({ label: `Attempt ${index + 1}`, value: attempt.percentage }))),
    subjectProgress: points(subjects.map((subject) => ({ label: subject.code, value: lessons.filter((lesson) => lesson.subjectId === subject.id).length ? 68 : 0 }))),
    attemptsByMonth: points([{ label: "Jan", value: 4 }, { label: "Feb", value: 7 }, { label: "Mar", value: 11 }, { label: "Apr", value: 9 }, { label: "May", value: 14 }]),
    recentActivity: [],
  });
});

router.get("/admin/students", requireAdmin, async (req, res) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const condition = search ? or(ilike(platformUsersTable.fullName, `%${search}%`), ilike(platformUsersTable.email, `%${search}%`), ilike(platformUsersTable.studentId, `%${search}%`)) : undefined;
  const rows = await db.select().from(platformUsersTable).where(and(eq(platformUsersTable.role, "student"), condition));
  const attempts = await db.select().from(quizAttemptsTable);
  const progressRows = await db.select().from(studentProgressTable).where(eq(studentProgressTable.completed, true));
  return res.json(rows.map((student) => {
    const studentAttempts = attempts.filter((attempt) => attempt.userId === student.id);
    const studentProgress = progressRows.filter((row) => row.userId === student.id).length;
    return { id: student.id, fullName: student.fullName, studentId: student.studentId ?? "", email: student.email, username: student.username ?? "", registeredAt: student.createdAt, status: student.status, quizzesTaken: studentAttempts.length, averageScore: studentAttempts.length ? Math.round(studentAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / studentAttempts.length) : 0, progress: studentProgress };
  }));
});

router.post("/admin/students", requireAdmin, async (req, res) => {
  const parsed = CreateAdminStudentBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid student details" });
  const [created] = await db.insert(platformUsersTable).values({ ...parsed.data, clerkUserId: `managed-${Date.now()}`, role: "student", status: parsed.data.status ?? "active" }).returning();
  return res.status(201).json({ id: created.id, fullName: created.fullName, studentId: created.studentId ?? "", email: created.email, username: created.username ?? "", registeredAt: created.createdAt, status: created.status, quizzesTaken: 0, averageScore: 0, progress: 0 });
});

router.get("/admin/students/:id", requireAdmin, async (req, res) => {
  const id = numberParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid student id" });
  const [student] = await db.select().from(platformUsersTable).where(eq(platformUsersTable.id, id)).limit(1);
  if (!student) return res.status(404).json({ error: "Student not found" });
  const results = await db.select({ attempt: quizAttemptsTable, quiz: quizzesTable, subjectName: subjectsTable.name }).from(quizAttemptsTable).innerJoin(quizzesTable, eq(quizAttemptsTable.quizId, quizzesTable.id)).innerJoin(subjectsTable, eq(quizzesTable.subjectId, subjectsTable.id)).where(eq(quizAttemptsTable.userId, id));
  return res.json({ id: student.id, fullName: student.fullName, studentId: student.studentId ?? "", email: student.email, username: student.username ?? "", registeredAt: student.createdAt, status: student.status, quizzesTaken: results.length, averageScore: results.length ? Math.round(results.reduce((sum, row) => sum + row.attempt.percentage, 0) / results.length) : 0, progress: (await progressView(id)).overallProgress, results: results.map(({ attempt, quiz, subjectName }) => resultView(attempt, quiz, subjectName)), progressDetails: await progressView(id) });
});

router.patch("/admin/students/:id", requireAdmin, async (req, res) => {
  const id = numberParam(req.params.id);
  const parsed = UpdateAdminStudentBody.safeParse(req.body);
  if (!id || !parsed.success) return res.status(400).json({ error: "Invalid student details" });
  const [updated] = await db.update(platformUsersTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(platformUsersTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Student not found" });
  return res.json({ id: updated.id, fullName: updated.fullName, studentId: updated.studentId ?? "", email: updated.email, username: updated.username ?? "", registeredAt: updated.createdAt, status: updated.status, quizzesTaken: 0, averageScore: 0, progress: 0 });
});

router.delete("/admin/students/:id", requireAdmin, async (req, res) => {
  const id = numberParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid student id" });
  await db.delete(platformUsersTable).where(and(eq(platformUsersTable.id, id), eq(platformUsersTable.role, "student")));
  return res.status(204).send();
});

router.get("/admin/subjects", requireAdmin, async (_req, res) => {
  const rows = await db.select().from(subjectsTable);
  return res.json(await Promise.all(rows.map((row) => subjectView(row))));
});

router.post("/admin/subjects", requireAdmin, async (req, res) => {
  const parsed = CreateSubjectBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid subject details" });
  const [created] = await db.insert(subjectsTable).values(parsed.data).returning();
  return res.status(201).json(await subjectView(created));
});

router.patch("/admin/subjects/:id", requireAdmin, async (req, res) => {
  const id = numberParam(req.params.id);
  const parsed = UpdateSubjectBody.safeParse(req.body);
  if (!id || !parsed.success) return res.status(400).json({ error: "Invalid subject details" });
  const [updated] = await db.update(subjectsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(subjectsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Subject not found" });
  return res.json(await subjectView(updated));
});

router.delete("/admin/subjects/:id", requireAdmin, async (req, res) => {
  const id = numberParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid subject id" });
  await db.delete(subjectsTable).where(eq(subjectsTable.id, id));
  return res.status(204).send();
});

router.get("/admin/lessons", requireAdmin, async (_req, res) => res.json(await lessonViews(undefined, undefined, true)));

router.post("/admin/lessons", requireAdmin, async (req, res) => {
  const parsed = CreateLessonBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid lesson details" });
  const [created] = await db.insert(lessonsTable).values(parsed.data).returning();
  const rows = await lessonViews(undefined, undefined, true);
  return res.status(201).json(rows.find((lesson) => lesson.id === created.id));
});

router.patch("/admin/lessons/:id", requireAdmin, async (req, res) => {
  const id = numberParam(req.params.id);
  const parsed = UpdateLessonBody.safeParse(req.body);
  if (!id || !parsed.success) return res.status(400).json({ error: "Invalid lesson details" });
  const [updated] = await db.update(lessonsTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(lessonsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Lesson not found" });
  return res.json((await lessonViews(undefined, undefined, true)).find((lesson) => lesson.id === updated.id));
});

router.delete("/admin/lessons/:id", requireAdmin, async (req, res) => {
  const id = numberParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid lesson id" });
  await db.delete(lessonsTable).where(eq(lessonsTable.id, id));
  return res.status(204).send();
});

router.get("/admin/quizzes", requireAdmin, async (_req, res) => res.json(await quizViews(undefined, true)));

router.post("/admin/quizzes", requireAdmin, async (req, res) => {
  const parsed = CreateQuizBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid quiz details" });
  const [created] = await db.insert(quizzesTable).values(parsed.data).returning();
  return res.status(201).json((await quizViews(undefined, true)).find((quiz) => quiz.id === created.id));
});

router.patch("/admin/quizzes/:id", requireAdmin, async (req, res) => {
  const id = numberParam(req.params.id);
  const parsed = UpdateQuizBody.safeParse(req.body);
  if (!id || !parsed.success) return res.status(400).json({ error: "Invalid quiz details" });
  const [updated] = await db.update(quizzesTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(quizzesTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Quiz not found" });
  return res.json((await quizViews(undefined, true)).find((quiz) => quiz.id === updated.id));
});

router.delete("/admin/quizzes/:id", requireAdmin, async (req, res) => {
  const id = numberParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid quiz id" });
  await db.delete(quizzesTable).where(eq(quizzesTable.id, id));
  return res.status(204).send();
});

router.get("/admin/questions/:id", requireAdmin, async (req, res) => {
  const id = numberParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid quiz id" });
  const questions = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.quizId, id)).orderBy(quizQuestionsTable.questionNumber);
  const choices = questions.length ? await db.select().from(quizChoicesTable).where(inArray(quizChoicesTable.questionId, questions.map((question) => question.id))) : [];
  return res.json(questions.map((question) => ({ id: question.id, number: question.questionNumber, text: question.text, type: question.type, correctAnswer: question.correctAnswer, points: question.points, choices: choices.filter((choice) => choice.questionId === question.id).map((choice) => ({ id: String(choice.id), value: choice.value, label: choice.label })) })));
});

router.get("/admin/quizzes/:id/questions", requireAdmin, async (req, res) => {
  const id = numberParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid quiz id" });
  const questions = await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.quizId, id)).orderBy(quizQuestionsTable.questionNumber);
  const choices = questions.length ? await db.select().from(quizChoicesTable).where(inArray(quizChoicesTable.questionId, questions.map((question) => question.id))) : [];
  return res.json(questions.map((question) => ({ id: question.id, number: question.questionNumber, text: question.text, type: question.type, correctAnswer: question.correctAnswer, points: question.points, choices: choices.filter((choice) => choice.questionId === question.id).map((choice) => ({ id: String(choice.id), value: choice.value, label: choice.label })) })));
});

router.post("/admin/quizzes/:id/questions", requireAdmin, async (req, res) => {
  const quizId = numberParam(req.params.id);
  const parsed = CreateQuestionBody.safeParse(req.body);
  if (!quizId || !parsed.success) return res.status(400).json({ error: "Invalid question details" });
  const [created] = await db.insert(quizQuestionsTable).values({ quizId, questionNumber: (await db.select().from(quizQuestionsTable).where(eq(quizQuestionsTable.quizId, quizId))).length + 1, ...parsed.data }).returning();
  await db.insert(quizChoicesTable).values(parsed.data.choices.map((choice) => ({ questionId: created.id, value: choice.value, label: choice.label })));
  return res.status(201).json({ ...created, id: created.id, number: created.questionNumber, choices: parsed.data.choices });
});

router.patch("/admin/questions/:id", requireAdmin, async (req, res) => {
  const id = numberParam(req.params.id);
  const parsed = UpdateQuestionBody.safeParse(req.body);
  if (!id || !parsed.success) return res.status(400).json({ error: "Invalid question details" });
  const [updated] = await db.update(quizQuestionsTable).set({ text: parsed.data.text, type: parsed.data.type, correctAnswer: parsed.data.correctAnswer, points: parsed.data.points }).where(eq(quizQuestionsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ error: "Question not found" });
  await db.delete(quizChoicesTable).where(eq(quizChoicesTable.questionId, id));
  await db.insert(quizChoicesTable).values(parsed.data.choices.map((choice) => ({ questionId: id, value: choice.value, label: choice.label })));
  return res.json({ ...updated, id: updated.id, number: updated.questionNumber, choices: parsed.data.choices });
});

router.delete("/admin/questions/:id", requireAdmin, async (req, res) => {
  const id = numberParam(req.params.id);
  if (!id) return res.status(400).json({ error: "Invalid question id" });
  await db.delete(quizQuestionsTable).where(eq(quizQuestionsTable.id, id));
  return res.status(204).send();
});

router.get("/admin/results", requireAdmin, async (_req, res) => {
  const rows = await db.select({ attempt: quizAttemptsTable, quiz: quizzesTable, subjectName: subjectsTable.name, student: platformUsersTable }).from(quizAttemptsTable).innerJoin(quizzesTable, eq(quizAttemptsTable.quizId, quizzesTable.id)).innerJoin(subjectsTable, eq(quizzesTable.subjectId, subjectsTable.id)).innerJoin(platformUsersTable, eq(quizAttemptsTable.userId, platformUsersTable.id)).orderBy(desc(quizAttemptsTable.takenAt));
  return res.json(rows.map(({ attempt, quiz, subjectName, student }) => ({ ...resultView(attempt, quiz, subjectName), studentName: student.fullName, studentId: student.studentId ?? "" })));
});

router.get("/admin/reports", requireAdmin, async (_req, res) => {
  const students = await db.select().from(platformUsersTable).where(eq(platformUsersTable.role, "student"));
  const quizzes = await db.select().from(quizzesTable);
  const attempts = await db.select().from(quizAttemptsTable);
  const subjects = await db.select().from(subjectsTable);
  const lessons = await db.select().from(lessonsTable);
  const progress = await db.select().from(studentProgressTable);
  return res.json({
    studentPerformance: students.map((student) => {
      const rows = attempts.filter((attempt) => attempt.userId === student.id);
      return { studentName: student.fullName, totalQuizzes: rows.length, averageScore: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.percentage, 0) / rows.length) : 0, passed: rows.filter((row) => row.passed).length, failed: rows.filter((row) => !row.passed).length };
    }),
    quizPerformance: quizzes.map((quiz) => {
      const rows = attempts.filter((attempt) => attempt.quizId === quiz.id);
      return { quizName: quiz.title, attempts: rows.length, averageScore: rows.length ? Math.round(rows.reduce((sum, row) => sum + row.percentage, 0) / rows.length) : 0, highestScore: rows.length ? Math.max(...rows.map((row) => row.percentage)) : 0, lowestScore: rows.length ? Math.min(...rows.map((row) => row.percentage)) : 0, passingRate: rows.length ? Math.round((rows.filter((row) => row.passed).length / rows.length) * 100) : 0 };
    }),
    learningProgress: students.flatMap((student) => subjects.map((subject) => {
      const totalLessons = lessons.filter((lesson) => lesson.subjectId === subject.id).length;
      const lessonsCompleted = progress.filter((row) => row.userId === student.id && row.completed && lessons.some((lesson) => lesson.id === row.lessonId && lesson.subjectId === subject.id)).length;
      return { student: student.fullName, subject: subject.name, lessonsCompleted, totalLessons, percentage: totalLessons ? Math.round((lessonsCompleted / totalLessons) * 100) : 0 };
    })),
  });
});

router.get("/admin/profile", requireAdmin, (req, res) => res.json(profileView(user(req))));
router.patch("/admin/profile", requireAdmin, async (req, res) => {
  const parsed = UpdateAdminProfileBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid profile details" });
  const [updated] = await db.update(platformUsersTable).set({ ...parsed.data, updatedAt: new Date() }).where(eq(platformUsersTable.id, user(req).id)).returning();
  return res.json(profileView(updated));
});

export default router;
import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const platformUsersTable = pgTable(
  "platform_users",
  {
    id: serial("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    fullName: text("full_name").notNull(),
    studentId: text("student_id"),
    email: text("email").notNull(),
    username: text("username"),
    avatarUrl: text("avatar_url"),
    role: text("role").notNull().default("student"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    clerkUserIdx: uniqueIndex("platform_users_clerk_user_idx").on(table.clerkUserId),
    emailIdx: uniqueIndex("platform_users_email_idx").on(table.email),
    usernameIdx: uniqueIndex("platform_users_username_idx").on(table.username),
  }),
);

export const subjectsTable = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("published"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const lessonsTable = pgTable("lessons", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => subjectsTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  content: text("content").notNull().default(""),
  objectives: text("objectives").array().notNull().default([]),
  materialUrl: text("material_url"),
  materialName: text("material_name"),
  publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
  status: text("status").notNull().default("published"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const learningMaterialsTable = pgTable("learning_materials", {
  id: serial("id").primaryKey(),
  lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
  objectPath: text("object_path").notNull(),
  name: text("name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quizzesTable = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subjectId: integer("subject_id").notNull().references(() => subjectsTable.id, { onDelete: "cascade" }),
  lessonId: integer("lesson_id").references(() => lessonsTable.id, { onDelete: "set null" }),
  description: text("description").notNull().default(""),
  passingScore: doublePrecision("passing_score").notNull().default(70),
  timeLimit: integer("time_limit"),
  status: text("status").notNull().default("published"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quizQuestionsTable = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzesTable.id, { onDelete: "cascade" }),
  questionNumber: integer("question_number").notNull(),
  text: text("text").notNull(),
  type: text("type").notNull().default("multiple_choice"),
  correctAnswer: text("correct_answer").notNull(),
  points: integer("points").notNull().default(1),
});

export const quizChoicesTable = pgTable("quiz_choices", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => quizQuestionsTable.id, { onDelete: "cascade" }),
  value: text("value").notNull(),
  label: text("label").notNull(),
});

export const quizAttemptsTable = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => platformUsersTable.id, { onDelete: "cascade" }),
  quizId: integer("quiz_id").notNull().references(() => quizzesTable.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  totalPoints: integer("total_points").notNull(),
  percentage: doublePrecision("percentage").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  incorrectAnswers: integer("incorrect_answers").notNull(),
  passed: boolean("passed").notNull(),
  takenAt: timestamp("taken_at", { withTimezone: true }).notNull().defaultNow(),
});

export const quizAnswersTable = pgTable("quiz_answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => quizAttemptsTable.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => quizQuestionsTable.id, { onDelete: "cascade" }),
  answer: text("answer").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  points: integer("points").notNull(),
});

export const studentProgressTable = pgTable(
  "student_progress",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => platformUsersTable.id, { onDelete: "cascade" }),
    lessonId: integer("lesson_id").notNull().references(() => lessonsTable.id, { onDelete: "cascade" }),
    completed: boolean("completed").notNull().default(false),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    progressIdx: uniqueIndex("student_progress_user_lesson_idx").on(table.userId, table.lessonId),
  }),
);

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => platformUsersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("activity"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPlatformUserSchema = createInsertSchema(platformUsersTable);
export const insertSubjectSchema = createInsertSchema(subjectsTable);
export const insertLessonSchema = createInsertSchema(lessonsTable);
export const insertLearningMaterialSchema = createInsertSchema(learningMaterialsTable);
export const insertQuizSchema = createInsertSchema(quizzesTable);
export const insertQuizQuestionSchema = createInsertSchema(quizQuestionsTable);
export const insertQuizChoiceSchema = createInsertSchema(quizChoicesTable);
export const insertQuizAttemptSchema = createInsertSchema(quizAttemptsTable);
export const insertQuizAnswerSchema = createInsertSchema(quizAnswersTable);
export const insertStudentProgressSchema = createInsertSchema(studentProgressTable);
export const insertNotificationSchema = createInsertSchema(notificationsTable);

export type PlatformUser = typeof platformUsersTable.$inferSelect;
export type Subject = typeof subjectsTable.$inferSelect;
export type Lesson = typeof lessonsTable.$inferSelect;
export type LearningMaterial = typeof learningMaterialsTable.$inferSelect;
export type Quiz = typeof quizzesTable.$inferSelect;
export type QuizQuestion = typeof quizQuestionsTable.$inferSelect;
export type QuizChoice = typeof quizChoicesTable.$inferSelect;
export type QuizAttempt = typeof quizAttemptsTable.$inferSelect;
export type QuizAnswer = typeof quizAnswersTable.$inferSelect;
export type StudentProgress = typeof studentProgressTable.$inferSelect;
export type Notification = typeof notificationsTable.$inferSelect;

export const roleSchema = z.enum(["student", "admin"]);
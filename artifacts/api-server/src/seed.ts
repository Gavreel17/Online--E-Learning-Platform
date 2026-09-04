import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  lessonsTable,
  platformUsersTable,
  quizAnswersTable,
  quizAttemptsTable,
  quizChoicesTable,
  quizQuestionsTable,
  quizzesTable,
  studentProgressTable,
  subjectsTable,
} from "@workspace/db";

export async function seedDemoData() {
  const subjectRows = await db.select().from(subjectsTable).limit(1);
  if (subjectRows.length > 0) {
    const [seededStudent] = await db
      .select()
      .from(platformUsersTable)
      .where(eq(platformUsersTable.clerkUserId, "seed-student"))
      .limit(1);
    const [seededQuiz] = await db.select().from(quizzesTable).limit(1);
    if (seededStudent && seededQuiz) {
      const existingAttempt = await db
        .select()
        .from(quizAttemptsTable)
        .where(eq(quizAttemptsTable.userId, seededStudent.id))
        .limit(1);
      if (!existingAttempt[0]) {
        const [seededLesson] = await db.select().from(lessonsTable).limit(1);
        const [firstQuestion, secondQuestion] = await db
          .select()
          .from(quizQuestionsTable)
          .where(eq(quizQuestionsTable.quizId, seededQuiz.id))
          .limit(2);
        if (seededLesson && firstQuestion && secondQuestion) {
          await db.insert(studentProgressTable).values({
            userId: seededStudent.id,
            lessonId: seededLesson.id,
            completed: true,
            completedAt: new Date(),
          });
          const [attempt] = await db
            .insert(quizAttemptsTable)
            .values({
              userId: seededStudent.id,
              quizId: seededQuiz.id,
              score: 2,
              totalPoints: 2,
              percentage: 100,
              correctAnswers: 2,
              incorrectAnswers: 0,
              passed: true,
            })
            .returning();
          await db.insert(quizAnswersTable).values([
            { attemptId: attempt.id, questionId: firstQuestion.id, answer: firstQuestion.correctAnswer, isCorrect: true, points: firstQuestion.points },
            { attemptId: attempt.id, questionId: secondQuestion.id, answer: secondQuestion.correctAnswer, isCorrect: true, points: secondQuestion.points },
          ]);
        }
      }
    }
    return;
  }

  const subjects = await db
    .insert(subjectsTable)
    .values([
      {
        name: "IT Fundamentals",
        code: "IT101",
        description: "Build a strong foundation in the concepts behind modern technology.",
      },
      {
        name: "Computer Programming",
        code: "CS102",
        description: "Learn to break down problems and express solutions with code.",
      },
      {
        name: "Database Management",
        code: "DB201",
        description: "Understand how structured data is designed, queried, and protected.",
      },
      {
        name: "Web Development",
        code: "WD210",
        description: "Create accessible, responsive experiences for the modern web.",
      },
    ])
    .returning();

  const [fundamentals, programming, database, web] = subjects;
  const lessons = await db
    .insert(lessonsTable)
    .values([
      {
        subjectId: fundamentals.id,
        title: "How computers think",
        description: "A friendly introduction to hardware, software, and the systems between them.",
        content:
          "Every digital experience is built from a small set of ideas: information is represented as data, instructions transform that data, and hardware carries out those instructions. In this lesson, we will connect the components you see every day to the invisible systems that make them useful.",
        objectives: ["Explain the difference between hardware and software", "Identify the main components of a computer"],
      },
      {
        subjectId: programming.id,
        title: "Thinking in algorithms",
        description: "Turn a big problem into a sequence of small, testable steps.",
        content:
          "An algorithm is a repeatable process for reaching a result. Before writing syntax, describe the inputs, the transformation, and the expected output. Clear steps make code easier to test, explain, and improve.",
        objectives: ["Describe an algorithm in plain language", "Recognize inputs and outputs"],
      },
      {
        subjectId: database.id,
        title: "Tables, keys, and relationships",
        description: "Learn the building blocks of a reliable relational database.",
        content:
          "Relational databases organize information into tables. Keys identify records, while relationships connect facts without unnecessary duplication. A thoughtful data model makes reporting and updates safer.",
        objectives: ["Define a primary key", "Explain why relationships prevent duplicate data"],
      },
      {
        subjectId: web.id,
        title: "The anatomy of a web page",
        description: "See how structure, presentation, and behavior work together.",
        content:
          "The web is a conversation between a browser and a server. HTML describes structure, CSS describes presentation, and JavaScript adds behavior. Together they create experiences that can adapt to different people and screens.",
        objectives: ["Describe the role of HTML, CSS, and JavaScript", "Explain responsive design"],
      },
    ])
    .returning();

  const quizzes = await db
    .insert(quizzesTable)
    .values([
      {
        title: "Computer Fundamentals Check-in",
        subjectId: fundamentals.id,
        lessonId: lessons[0].id,
        description: "A quick confidence check on the foundations of computing.",
        passingScore: 70,
      },
      {
        title: "Algorithm Thinking Quiz",
        subjectId: programming.id,
        lessonId: lessons[1].id,
        description: "Practice recognizing the shape of a good algorithm.",
        passingScore: 75,
      },
      {
        title: "Web Foundations Quiz",
        subjectId: web.id,
        lessonId: lessons[3].id,
        description: "Test your understanding of the pieces that make up the web.",
        passingScore: 70,
      },
    ])
    .returning();

  const questions = await db
    .insert(quizQuestionsTable)
    .values([
      {
        quizId: quizzes[0].id,
        questionNumber: 1,
        text: "What does CPU stand for?",
        type: "multiple_choice",
        correctAnswer: "a",
        points: 1,
      },
      {
        quizId: quizzes[0].id,
        questionNumber: 2,
        text: "Which part stores data temporarily while programs run?",
        type: "multiple_choice",
        correctAnswer: "b",
        points: 1,
      },
      {
        quizId: quizzes[1].id,
        questionNumber: 1,
        text: "A clear algorithm should be made of steps that can be repeated.",
        type: "true_false",
        correctAnswer: "true",
        points: 1,
      },
      {
        quizId: quizzes[2].id,
        questionNumber: 1,
        text: "Which technology describes the structure of a web page?",
        type: "multiple_choice",
        correctAnswer: "a",
        points: 1,
      },
    ])
    .returning();

  await db.insert(quizChoicesTable).values([
    { questionId: questions[0].id, value: "a", label: "Central Processing Unit" },
    { questionId: questions[0].id, value: "b", label: "Computer Personal Unit" },
    { questionId: questions[0].id, value: "c", label: "Central Program Utility" },
    { questionId: questions[0].id, value: "d", label: "Control Processing User" },
    { questionId: questions[1].id, value: "a", label: "Hard drive" },
    { questionId: questions[1].id, value: "b", label: "RAM" },
    { questionId: questions[1].id, value: "c", label: "Monitor" },
    { questionId: questions[1].id, value: "d", label: "Keyboard" },
    { questionId: questions[2].id, value: "true", label: "True" },
    { questionId: questions[2].id, value: "false", label: "False" },
    { questionId: questions[3].id, value: "a", label: "HTML" },
    { questionId: questions[3].id, value: "b", label: "CSS" },
    { questionId: questions[3].id, value: "c", label: "SQL" },
  ]);

  await db
    .insert(platformUsersTable)
    .values({
      clerkUserId: "seed-admin",
      fullName: "Platform Administrator",
      email: "admin@learnspace.app",
      username: "admin",
      role: "admin",
      status: "active",
    })
    .onConflictDoNothing({ target: platformUsersTable.clerkUserId });
  await db
    .insert(platformUsersTable)
    .values({
      clerkUserId: "seed-student",
      fullName: "Jordan Lee",
      studentId: "STU-1048",
      email: "jordan@learnspace.app",
      username: "jordan.lee",
      role: "student",
      status: "active",
    })
    .onConflictDoNothing({ target: platformUsersTable.clerkUserId });

  const seededStudent = await db
    .select()
    .from(platformUsersTable)
    .where(eq(platformUsersTable.clerkUserId, "seed-student"))
    .limit(1);
  if (seededStudent[0]) {
    await db.insert(studentProgressTable).values({
      userId: seededStudent[0].id,
      lessonId: lessons[0].id,
      completed: true,
      completedAt: new Date(),
    });
    const [attempt] = await db
      .insert(quizAttemptsTable)
      .values({
        userId: seededStudent[0].id,
        quizId: quizzes[0].id,
        score: 2,
        totalPoints: 2,
        percentage: 100,
        correctAnswers: 2,
        incorrectAnswers: 0,
        passed: true,
      })
      .returning();
    await db.insert(quizAnswersTable).values([
      { attemptId: attempt.id, questionId: questions[0].id, answer: "a", isCorrect: true, points: 1 },
      { attemptId: attempt.id, questionId: questions[1].id, answer: "b", isCorrect: true, points: 1 },
    ]);
  }
}
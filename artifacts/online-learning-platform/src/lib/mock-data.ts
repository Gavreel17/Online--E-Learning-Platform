export const DEMO_STUDENT_DASHBOARD = {
  profile: {
    fullName: 'Maya Chen',
    studentId: 'STU-1042',
    email: 'maya.chen@lumenpath.local',
  },
  stats: {
    progress: 68,
    totalSubjects: 4,
    lessonsCompleted: 14,
    averageScore: 92,
    quizzesTaken: 5,
  },
  recentLessons: [
    {
      id: 1,
      subjectName: 'IT Fundamentals',
      title: 'How computers think',
      progress: 100,
      completed: true,
    },
    {
      id: 2,
      subjectName: 'Computer Programming',
      title: 'Thinking in algorithms',
      progress: 80,
      completed: false,
    },
    {
      id: 3,
      subjectName: 'Database Management',
      title: 'Tables, keys, and relationships',
      progress: 45,
      completed: false,
    },
    {
      id: 4,
      subjectName: 'Web Development',
      title: 'The anatomy of a web page',
      progress: 20,
      completed: false,
    },
  ],
  recommendedLessons: [
    {
      id: 2,
      title: 'Thinking in algorithms · Computer Programming',
    },
  ],
};

export const DEMO_SUBJECTS = [
  {
    id: 1,
    name: 'IT Fundamentals',
    code: 'IT101',
    description: 'Build a strong foundation in the concepts behind modern technology.',
    lessonCount: 6,
    quizCount: 2,
    progress: 85,
  },
  {
    id: 2,
    name: 'Computer Programming',
    code: 'CS102',
    description: 'Learn to break down problems and express solutions with code.',
    lessonCount: 8,
    quizCount: 3,
    progress: 60,
  },
  {
    id: 3,
    name: 'Database Management',
    code: 'DB201',
    description: 'Understand how structured data is designed, queried, and protected.',
    lessonCount: 5,
    quizCount: 2,
    progress: 40,
  },
  {
    id: 4,
    name: 'Web Development',
    code: 'WD210',
    description: 'Create accessible, responsive experiences for the modern web.',
    lessonCount: 7,
    quizCount: 2,
    progress: 25,
  },
];

export const DEMO_LESSONS = [
  {
    id: 1,
    subjectId: 1,
    subjectName: 'IT Fundamentals',
    title: 'How computers think',
    description: 'A friendly introduction to hardware, software, and the systems between them.',
    content:
      '<p>Every digital experience is built from a small set of ideas: information is represented as data, instructions transform that data, and hardware carries out those instructions.</p><p>In this lesson, we connect the components you see every day to the invisible systems that make them useful.</p>',
    objectives: [
      'Explain the difference between hardware and software',
      'Identify the main components of a computer (CPU, RAM, Storage)',
      'Understand how instructions are executed',
    ],
    completed: true,
    progress: 100,
    materialUrl: null,
    materialName: 'IT101-Computer-Hardware-Architecture-Guide.pdf',
    materialSize: '2.4 MB',
    materialType: 'application/pdf',
  },
  {
    id: 2,
    subjectId: 2,
    subjectName: 'Computer Programming',
    title: 'Thinking in algorithms',
    description: 'Turn a big problem into a sequence of small, testable steps.',
    content:
      '<p>An algorithm is a repeatable process for reaching a result. Before writing syntax, describe the inputs, the transformation, and the expected output.</p><p>Clear steps make code easier to test, explain, and improve across any programming language.</p>',
    objectives: [
      'Describe an algorithm in plain language',
      'Recognize inputs, transformations, and outputs',
      'Break complex tasks into small logical units',
    ],
    completed: false,
    progress: 80,
    materialUrl: null,
    materialName: 'CS102-Algorithm-Design-Patterns.pdf',
    materialSize: '1.8 MB',
    materialType: 'application/pdf',
  },
  {
    id: 3,
    subjectId: 3,
    subjectName: 'Database Management',
    title: 'Tables, keys, and relationships',
    description: 'Learn the building blocks of a reliable relational database.',
    content:
      '<p>Relational databases organize information into tables. Keys identify records, while relationships connect facts without unnecessary duplication.</p><p>A thoughtful data model makes reporting and updates safer and faster.</p>',
    objectives: [
      'Define primary keys and foreign keys',
      'Explain why relationships prevent duplicate data',
      'Design a normalized two-table relational schema',
    ],
    completed: false,
    progress: 45,
    materialUrl: null,
    materialName: 'DB201-Relational-Schema-Cheatsheet.pdf',
    materialSize: '3.1 MB',
    materialType: 'application/pdf',
  },
  {
    id: 4,
    subjectId: 4,
    subjectName: 'Web Development',
    title: 'The anatomy of a web page',
    description: 'See how structure, presentation, and behavior work together.',
    content:
      '<p>The web is a conversation between a browser and a server. HTML describes structure, CSS describes presentation, and JavaScript adds behavior.</p><p>Together they create experiences that can adapt to different devices and users seamlessly.</p>',
    objectives: [
      'Describe the complementary roles of HTML, CSS, and JavaScript',
      'Understand the DOM tree representation',
      'Apply core principles of responsive layout',
    ],
    completed: false,
    progress: 20,
    materialUrl: null,
    materialName: 'WD210-Semantic-HTML-Starter.zip',
    materialSize: '4.2 MB',
    materialType: 'application/zip',
  },
];

export const DEMO_QUIZZES = [
  {
    id: 1,
    subjectId: 1,
    subjectName: 'IT Fundamentals',
    title: 'Computer Fundamentals Check-in',
    description: 'A quick confidence check on the foundations of computing hardware and memory.',
    questionCount: 2,
    passingScore: 70,
    timeLimit: 15,
    attempts: 2,
    bestScore: 100,
    attachmentName: 'IT101-Hardware-Formula-Reference.pdf',
    attachmentSize: '1.2 MB',
    attachmentType: 'application/pdf',
    attachmentUrl: null,
    questions: [
      {
        id: 101,
        number: 1,
        text: 'What does CPU stand for?',
        choices: [
          { id: 'a', value: 'a', label: 'Central Processing Unit' },
          { id: 'b', value: 'b', label: 'Computer Personal Unit' },
          { id: 'c', value: 'c', label: 'Central Program Utility' },
          { id: 'd', value: 'd', label: 'Control Processing User' },
        ],
      },
      {
        id: 102,
        number: 2,
        text: 'Which component stores data temporarily while active programs run?',
        choices: [
          { id: 'a', value: 'a', label: 'Hard drive / SSD' },
          { id: 'b', value: 'b', label: 'RAM (Random Access Memory)' },
          { id: 'c', value: 'c', label: 'Graphics Card' },
          { id: 'd', value: 'd', label: 'Power Supply' },
        ],
      },
    ],
  },
  {
    id: 2,
    subjectId: 2,
    subjectName: 'Computer Programming',
    title: 'Algorithm Thinking Quiz',
    description: 'Practice recognizing the shape of a good algorithm and logic flows.',
    questionCount: 1,
    passingScore: 75,
    timeLimit: 10,
    attempts: 1,
    bestScore: 85,
    attachmentName: 'CS102-Logic-Symbols-Sheet.pdf',
    attachmentSize: '850 KB',
    attachmentType: 'application/pdf',
    attachmentUrl: null,
    questions: [
      {
        id: 201,
        number: 1,
        text: 'A clear algorithm must consist of unambiguous, repeatable steps.',
        choices: [
          { id: 'true', value: 'true', label: 'True' },
          { id: 'false', value: 'false', label: 'False' },
        ],
      },
    ],
  },
  {
    id: 3,
    subjectId: 4,
    subjectName: 'Web Development',
    title: 'Web Foundations Quiz',
    description: 'Test your understanding of the core languages powering modern browsers.',
    questionCount: 1,
    passingScore: 70,
    timeLimit: 10,
    attempts: 0,
    bestScore: null,
    attachmentName: 'WD210-DOM-Tree-Diagram.png',
    attachmentSize: '620 KB',
    attachmentType: 'image/png',
    attachmentUrl: null,
    questions: [
      {
        id: 301,
        number: 1,
        text: 'Which technology is primarily responsible for the semantic structure of a web document?',
        choices: [
          { id: 'a', value: 'a', label: 'HTML (HyperText Markup Language)' },
          { id: 'b', value: 'b', label: 'CSS (Cascading Style Sheets)' },
          { id: 'c', value: 'c', label: 'SQL (Structured Query Language)' },
        ],
      },
    ],
  },
];

export const DEMO_RESULTS = [
  {
    id: 1,
    quizName: 'Computer Fundamentals Check-in',
    subjectName: 'IT Fundamentals',
    correctAnswers: 2,
    incorrectAnswers: 0,
    passed: true,
    percentage: 100,
    dateTaken: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    quizName: 'Algorithm Thinking Quiz',
    subjectName: 'Computer Programming',
    correctAnswers: 1,
    incorrectAnswers: 0,
    passed: true,
    percentage: 100,
    dateTaken: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

export const DEMO_PROGRESS = {
  overallProgress: 68,
  lessonsCompleted: 14,
  lessonsRemaining: 8,
  quizzesCompleted: 5,
  averageScore: 92,
  subjects: [
    { subjectId: 1, subjectName: 'IT Fundamentals', percentage: 85, completed: 5, total: 6 },
    { subjectId: 2, subjectName: 'Computer Programming', percentage: 60, completed: 5, total: 8 },
    { subjectId: 3, subjectName: 'Database Management', percentage: 40, completed: 2, total: 5 },
    { subjectId: 4, subjectName: 'Web Development', percentage: 25, completed: 2, total: 7 },
  ],
};

export const DEMO_ADMIN_DASHBOARD = {
  stats: { totalStudents: 248, totalSubjects: 4, totalLessons: 26, totalAttempts: 614, averageScore: 82 },
  performance: [
    { label: 'Nov', value: 64 },
    { label: 'Dec', value: 71 },
    { label: 'Jan', value: 78 },
    { label: 'Feb', value: 74 },
    { label: 'Mar', value: 86 },
    { label: 'Apr', value: 91 },
  ],
  recentActivity: [
    { id: 1, title: 'New student registration', message: 'Maya Chen joined the learning platform.' },
    { id: 2, title: 'Quiz milestone reached', message: 'Computer Fundamentals passed 80 attempts.' },
    { id: 3, title: 'Lesson published', message: 'Web accessibility is now available to students.' },
  ],
};

export const DEMO_ADMIN_STUDENTS = [
  { id: 1, fullName: 'Maya Chen', studentId: 'STU-1042', email: 'maya.chen@lumenpath.local', status: 'active', progress: 68, source: 'online_registration', registeredAt: '2026-09-28', lastActive: 'Today' },
  { id: 2, fullName: 'Jordan Lee', studentId: 'STU-1048', email: 'jordan@lumenpath.local', status: 'active', progress: 92, source: 'online_registration', registeredAt: '2026-09-29', lastActive: 'Yesterday' },
  { id: 3, fullName: 'Samira Patel', studentId: 'STU-1053', email: 'samira@lumenpath.local', status: 'active', progress: 45, source: 'admin_enrolled', registeredAt: '2026-09-30', lastActive: '3 days ago' },
  { id: 4, fullName: 'Lucas Gomez', studentId: 'STU-1059', email: 'lucas@lumenpath.local', status: 'active', progress: 78, source: 'admin_enrolled', registeredAt: '2026-10-01', lastActive: '5 days ago' },
];

export const DEMO_ADMIN_QUESTIONS = [
  { id: 1, text: 'What does CPU stand for?', type: 'multiple_choice', points: 1, status: 'Published' },
  { id: 2, text: 'Which component stores data temporarily while active programs run?', type: 'multiple_choice', points: 1, status: 'Published' },
  { id: 3, text: 'A clear algorithm must consist of unambiguous steps.', type: 'true_false', points: 1, status: 'Published' },
  { id: 4, text: 'Which technology describes the semantic structure of a web page?', type: 'multiple_choice', points: 1, status: 'Published' },
];

export const DEMO_ADMIN_REPORTS = {
  studentPerformance: [
    { studentName: 'Maya Chen', totalQuizzes: 5, averageScore: 92, passed: '5 / 5' },
    { studentName: 'Jordan Lee', totalQuizzes: 4, averageScore: 96, passed: '4 / 4' },
    { studentName: 'Samira Patel', totalQuizzes: 3, averageScore: 78, passed: '2 / 3' },
    { studentName: 'Lucas Gomez', totalQuizzes: 4, averageScore: 84, passed: '3 / 4' },
  ],
  quizPerformance: [
    { quizName: 'Computer Fundamentals', attempts: 84, averageScore: 88, passingRate: 94 },
    { quizName: 'Algorithm Thinking', attempts: 62, averageScore: 79, passingRate: 85 },
    { quizName: 'Web Foundations', attempts: 51, averageScore: 82, passingRate: 88 },
  ],
  learningProgress: [
    { student: 'Maya Chen', subject: 'IT Fundamentals', lessonsCompleted: 5, percentage: 85 },
    { student: 'Maya Chen', subject: 'Computer Programming', lessonsCompleted: 5, percentage: 60 },
    { student: 'Jordan Lee', subject: 'Web Development', lessonsCompleted: 6, percentage: 86 },
  ],
};

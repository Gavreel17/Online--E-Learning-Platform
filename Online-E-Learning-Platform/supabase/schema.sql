-- ==========================================
-- LumenPath Online E-Learning Platform
-- Supabase Database Schema
-- ==========================================

-- Drop existing tables and policies to ensure a clean slate
DROP POLICY IF EXISTS "Allow public read/write on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public read/write on subjects" ON public.subjects;
DROP POLICY IF EXISTS "Allow public read/write on lessons" ON public.lessons;
DROP POLICY IF EXISTS "Allow public read/write on quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Allow public read/write on questions" ON public.questions;
DROP POLICY IF EXISTS "Allow public read/write on quiz_results" ON public.quiz_results;
DROP POLICY IF EXISTS "Allow public read/write on lesson_progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Allow public read/write on login_activity" ON public.login_activity;

DROP TABLE IF EXISTS public.login_activity CASCADE;
DROP TABLE IF EXISTS public.lesson_progress CASCADE;
DROP TABLE IF EXISTS public.quiz_results CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.quizzes CASCADE;
DROP TABLE IF EXISTS public.lessons CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. Users / Students Profiles Table
CREATE TABLE public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  source TEXT DEFAULT 'online_registration' CHECK (source IN ('online_registration', 'admin_enrolled')),
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Subjects Table
CREATE TABLE public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Lessons Table
CREATE TABLE public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  objectives JSONB, -- Array of strings
  material_name TEXT,
  material_url TEXT,
  material_size TEXT,
  material_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Quizzes Table
CREATE TABLE public.quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 75,
  time_limit INTEGER, -- in minutes
  attachment_name TEXT,
  attachment_url TEXT,
  attachment_size TEXT,
  attachment_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Questions Table
CREATE TABLE public.questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT DEFAULT 'multiple-choice',
  choices JSONB NOT NULL, -- Array of objects: { id: string, value: string, label: string, isCorrect: boolean }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Quiz Results / Attempts Table
CREATE TABLE public.quiz_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  correct_answers INTEGER NOT NULL,
  incorrect_answers INTEGER NOT NULL,
  percentage INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  date_taken TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Lesson Progress (To track if a student finished a lesson)
CREATE TABLE public.lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT false,
  submission_url TEXT,
  submission_name TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(lesson_id, student_id)
);

-- 8. Login Activity Table
CREATE TABLE public.login_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  student_name TEXT NOT NULL,
  email TEXT NOT NULL,
  student_id TEXT,
  login_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  status TEXT DEFAULT 'success',
  ip_address TEXT,
  device_info TEXT
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- For testing purposes initially, we can allow anon access or setup policies later.
-- For now, let's enable RLS and just allow public access to get it working, 
-- we will secure it properly once Auth is fully integrated.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all for now (Testing Phase)
CREATE POLICY "Allow public read/write on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on lessons" ON public.lessons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on quizzes" ON public.quizzes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on questions" ON public.questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on quiz_results" ON public.quiz_results FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on lesson_progress" ON public.lesson_progress FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on login_activity" ON public.login_activity FOR ALL USING (true) WITH CHECK (true);

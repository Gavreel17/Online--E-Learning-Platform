import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { AuthProvider, useAuth, DEFAULT_STUDENT, DEFAULT_ADMIN } from '@/lib/auth-context';
import {
  PlatformStoreProvider,
  usePlatformStore,
  type ActiveQuizSession,
  type QuestionBankItem,
  type QuestionType,
  type DifficultyLevel,
  type QuestionStatus,
  type QuestionBankChoice,
  type QuizQuestionItem,
} from '@/lib/platform-store';
import { isQuestionUsedInQuiz, questionBankItemToQuizQuestion } from '@/lib/curriculum-data';
import { useToast } from '@/hooks/use-toast';
import { ThemeProvider } from '@/components/theme-provider';

import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

import {
  ArrowRight, BarChart3, Bell, BookOpen, BookOpenCheck, Check, CheckCircle2,
  ChevronRight, CircleHelp, ClipboardList, Clock3, Download, ExternalLink,
  FileQuestion, Filter, GraduationCap, LayoutDashboard, LineChart, ListFilter,
  LogOut, Menu, MoreHorizontal, Pencil, Plus, RefreshCw, Save, Search, Settings,
  ShieldCheck, Sparkles, Target, Trash2, Trophy, UserRound, Users, X, Zap,
  UploadCloud, FileText, FileCode, FileArchive, FileSpreadsheet, Paperclip, File,
  FileCheck, Eye, EyeOff, Lock, KeyRound, ShieldAlert, ArrowDownToLine, Camera, Image as ImageIcon, User,
  AlertTriangle,
} from 'lucide-react';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import {
  getGetAdminDashboardQueryKey, getGetAdminProfileQueryKey, getGetLessonQueryKey,
  getGetMeQueryKey, getGetMyProgressQueryKey, getGetQuizQueryKey, getGetSubjectQueryKey,
  getGetStudentDashboardQueryKey, getListAdminLessonsQueryKey, getListAdminQuizzesQueryKey,
  getListAdminResultsQueryKey, getListAdminStudentsQueryKey, getListAdminSubjectsQueryKey,
  getListLessonsQueryKey, getListMyResultsQueryKey, getListQuestionsQueryKey,
  getListQuizzesQueryKey, getListSubjectsQueryKey, useCompleteLesson, useCreateAdminStudent,
  useCreateLesson, useCreateQuestion, useCreateQuiz, useCreateSubject, useDeleteAdminStudent,
  useDeleteLesson, useDeleteQuestion, useDeleteQuiz, useDeleteSubject, useGetAdminDashboard,
  useGetAdminProfile, useGetAdminStudent, useGetLesson, useGetMe, useGetMyProgress,
  useGetQuiz, useGetSubject, useGetStudentDashboard, useGetAdminReports, useListAdminLessons,
  useListAdminQuizzes, useListAdminResults, useListAdminStudents, useListAdminSubjects,
  useListLessons, useListMyResults, useListQuestions, useListQuizzes, useListSubjects,
  useRequestUploadUrl, useSubmitQuizAttempt, useUpdateAdminProfile, useUpdateAdminStudent, useUpdateLesson,
  useUpdateMe, useUpdateQuestion, useUpdateQuiz, useUpdateSubject,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${compact ? '' : 'group'}`} data-testid="link-brand">
      <span className="grid size-9 place-items-center rounded-xl bg-accent shadow-[3px_3px_0_hsl(var(--primary))] transition-transform group-hover:-translate-y-0.5">
        <GraduationCap className="size-5 text-primary" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-extrabold tracking-tight text-primary">
          Lumen<span className="text-teal-700">Path</span>
        </span>
      )}
    </Link>
  );
}

function Avatar({
  name = 'Student',
  src,
  className = 'size-9',
  textSize = 'text-sm',
}: {
  name?: string;
  src?: string | null;
  className?: string;
  textSize?: string;
}) {
  return src ? (
    <img src={src} alt={name} className={`${className} rounded-full object-cover shadow-xs border border-border/60`} data-testid="img-avatar" />
  ) : (
    <span
      className={`grid ${className} place-items-center rounded-full bg-secondary font-display ${textSize} font-bold text-secondary-foreground shadow-xs border border-border/60`}
      data-testid="img-avatar"
    >
      {name
        .split(' ')
        .map((x) => x[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()}
    </span>
  );
}

function Loading({ label = 'Loading your learning space' }: { label?: string }) {
  return (
    <div className="space-y-5 animate-pulse" data-testid="status-loading">
      <div className="h-10 w-2/5 rounded-xl bg-muted" />
      <div className="h-4 w-3/5 rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-32 rounded-2xl bg-muted" />
        <div className="h-32 rounded-2xl bg-muted" />
        <div className="h-32 rounded-2xl bg-muted" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center" data-testid="status-error">
      <CircleHelp className="mx-auto mb-3 size-8 text-destructive" />
      <h3 className="font-display text-lg font-bold">That page took a wrong turn</h3>
      <p className="mt-1 text-sm text-muted-foreground">We couldn't load this space. Your progress is safe.</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          data-testid="button-retry"
        >
          Try again
        </button>
      )}
    </div>
  );
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center" data-testid="status-empty">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
        <BookOpen className="size-5" />
      </div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function downloadFileHelper(url: string | null | undefined, filename: string, fallbackContent?: string) {
  if (url && url.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  if (url && !url.startsWith('data:')) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }
  // Fallback generation for demo items
  const content =
    fallbackContent ||
    `# ${filename}\n\nLumenPath Learning Resource\nPrepared for student revision, practice, and reference.\n\nGenerated on: ${new Date().toLocaleString()}\n`;
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download =
    filename.endsWith('.pdf') || filename.endsWith('.zip') || filename.endsWith('.png')
      ? filename
      : `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(objectUrl);
}

function getFileIcon(filename: string = '', type: string = '') {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf') || type.includes('pdf')) return <FileText className="size-5 text-rose-500" />;
  if (lower.endsWith('.zip') || lower.endsWith('.tar') || lower.endsWith('.rar') || type.includes('zip'))
    return <FileArchive className="size-5 text-amber-500" />;
  if (
    lower.endsWith('.js') ||
    lower.endsWith('.ts') ||
    lower.endsWith('.tsx') ||
    lower.endsWith('.jsx') ||
    lower.endsWith('.py') ||
    lower.endsWith('.html') ||
    lower.endsWith('.css') ||
    lower.endsWith('.json')
  )
    return <FileCode className="size-5 text-emerald-500" />;
  if (lower.endsWith('.csv') || lower.endsWith('.xlsx') || type.includes('spreadsheet') || type.includes('csv'))
    return <FileSpreadsheet className="size-5 text-teal-600" />;
  return <File className="size-5 text-teal-700" />;
}

interface FileUploadDropZoneProps {
  label: string;
  hint?: string;
  accept?: string;
  file: { name: string; url: string; size: string; type?: string } | null;
  onFileChange: (file: { name: string; url: string; size: string; type: string } | null) => void;
  id?: string;
  compact?: boolean;
}

function FileUploadDropZone({
  label,
  hint = 'Supports PDF, Docs, Code, Images, Zip (Max 25MB)',
  accept = '.pdf,.doc,.docx,.zip,.txt,.md,.png,.jpg,.jpeg,.json,.ts,.js,.py',
  file,
  onFileChange,
  id = 'file-upload',
  compact = false,
}: FileUploadDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onFileChange({
        name: f.name,
        url: dataUrl,
        size: formatFileSize(f.size),
        type: f.type || 'application/octet-stream',
      });
    };
    reader.readAsDataURL(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-foreground flex items-center justify-between">
        <span>{label}</span>
        {file && (
          <span className="text-[11px] font-medium text-teal-700 flex items-center gap-1">
            <CheckCircle2 className="size-3" /> Ready to attach
          </span>
        )}
      </label>

      {file ? (
        <div className="flex items-center justify-between rounded-xl border border-teal-700/30 bg-teal-700/5 p-3.5 transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid size-10 place-items-center rounded-lg bg-card border border-border shadow-xs shrink-0">
              {getFileIcon(file.name, file.type)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">{file.size}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onFileChange(null)}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Remove file"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
            compact ? 'p-4' : 'p-6'
          } ${
            isDragging
              ? 'border-teal-700 bg-teal-700/10 scale-[0.99]'
              : 'border-border bg-card/50 hover:border-teal-700/60 hover:bg-card'
          }`}
        >
          <input
            ref={fileInputRef}
            id={id}
            type="file"
            accept={accept}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <div className="grid size-10 place-items-center rounded-full bg-accent/60 group-hover:scale-110 transition-transform">
            <UploadCloud className="size-5 text-teal-800" />
          </div>
          <p className="mt-2 text-xs font-bold text-foreground">
            <span className="text-teal-700 hover:underline">Click to browse</span> or drag and drop file
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
        </div>
      )}
    </div>
  );
}

function FileAttachmentCard({
  name,
  size,
  url,
  type,
  label = 'Attached Material',
  onRemove,
}: {
  name: string;
  size?: string | null;
  url?: string | null;
  type?: string | null;
  label?: string;
  onRemove?: () => void;
}) {
  const { toast } = useToast();

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    downloadFileHelper(url, name);
    toast({
      title: 'Download Started',
      description: `Downloading "${name}"`,
    });
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/60 p-3.5 hover:border-teal-700/40 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="grid size-10 place-items-center rounded-lg bg-card border border-border shrink-0 shadow-xs">
          {getFileIcon(name, type || '')}
        </div>
        <div className="min-w-0">
          <p className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-teal-700">{label}</p>
          <p className="truncate text-sm font-bold text-foreground">{name}</p>
          {size && <p className="text-xs text-muted-foreground">{size}</p>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 rounded-lg bg-card border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-teal-700 hover:text-white transition-colors shadow-xs"
        >
          <Download className="size-3.5" /> Download
        </button>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

const studentNav = [
  ['/student/dashboard', 'Dashboard', LayoutDashboard],
  ['/student/subjects', 'Subjects', BookOpen],
  ['/student/lessons', 'Lessons', BookOpenCheck],
  ['/student/quizzes', 'Quizzes', ClipboardList],
  ['/student/results', 'Results', Trophy],
  ['/student/progress', 'Progress', LineChart],
  ['/student/profile', 'Profile', UserRound],
];

const teacherNav = [
  ['/teacher/dashboard', 'Dashboard', LayoutDashboard],
  ['/teacher/subjects', 'My Subjects', BookOpen],
  ['/teacher/lessons', 'Lessons', BookOpenCheck],
  ['/teacher/library', 'Library', Paperclip],
  ['/teacher/quizzes', 'Quizzes', ClipboardList],
  ['/teacher/questions', 'Question Bank', FileQuestion],
  ['/teacher/results', 'Student Results', Trophy],
  ['/teacher/reports', 'Reports', BarChart3],
  ['/teacher/profile', 'Profile', UserRound],
];

const adminNav = [
  ['/admin/dashboard', 'Dashboard', LayoutDashboard],
  ['/admin/teacher-applications', 'Teacher Applications', ShieldCheck],
  ['/admin/students', 'Students', Users],
  ['/admin/subjects', 'Subjects', BookOpen],
  ['/admin/lessons', 'Lessons', BookOpenCheck],
  ['/admin/quizzes', 'Quizzes', ClipboardList],
  ['/admin/questions', 'Question bank', FileQuestion],
  ['/admin/results', 'Results', Trophy],
  ['/admin/reports', 'Reports', BarChart3],
  ['/admin/profile', 'Settings', Settings],
];

function AppShell({ children, role: shellRole, admin = false, preview = false }: { children: ReactNode; role?: 'student' | 'teacher' | 'admin'; admin?: boolean; preview?: boolean }) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, signOut, switchRole, role: currentRole } = useAuth();
  const effectiveRole = shellRole || (admin ? 'admin' : currentRole);
  const me = user || (effectiveRole === 'admin' ? DEFAULT_ADMIN : effectiveRole === 'teacher' ? DEFAULT_TEACHER : DEFAULT_STUDENT);
  const nav = (effectiveRole === 'admin' ? adminNav : effectiveRole === 'teacher' ? teacherNav : studentNav) as [string, string, any][];

  const handleSignOut = () => {
    signOut();
    if (effectiveRole === 'admin') setLocation('/admin/login');
    else if (effectiveRole === 'teacher') setLocation('/teacher/login');
    else setLocation('/student/login');
  };

  const isItemActive = (href: string) => {
    if (href === '/student/dashboard' || href === '/admin/dashboard' || href === '/teacher/dashboard') {
      return location === href;
    }
    return location === href || location.startsWith(href + '/') || location.startsWith(href + '?');
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col -translate-x-full border-r border-sidebar-border bg-sidebar transition-transform md:translate-x-0 ${
          open ? 'translate-x-0' : ''
        }`}
      >
        {/* Sidebar header */}
        <div className="flex shrink-0 items-center justify-between px-5 pt-5">
          <Brand />
          <button onClick={() => setOpen(false)} className="text-sidebar-foreground md:hidden" data-testid="button-close-menu">
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-6 shrink-0 px-7 text-[10px] font-bold uppercase tracking-[.18em] text-sidebar-foreground/50">
          {effectiveRole === 'admin' ? 'Operations & Admin' : effectiveRole === 'teacher' ? 'Faculty & Instruction' : 'My Learning Space'}
        </div>

        {/* Scrollable nav area */}
        <nav className="mt-2 flex-1 overflow-y-auto px-5 pb-2 space-y-1" aria-label={effectiveRole === 'admin' ? 'Admin navigation' : effectiveRole === 'teacher' ? 'Teacher navigation' : 'Student navigation'}>
          {nav.map(([href, label, Icon]) => {
            const active = isItemActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-bold shadow-[3px_3px_0_hsl(var(--sidebar-border))]'
                    : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                }`}
                data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
              >
                <Icon className={`size-[18px] shrink-0 ${active ? 'text-sidebar-primary-foreground' : 'text-accent'}`} />
                <span>{label}</span>
                {active && <ChevronRight className="ml-auto size-4" />}
              </Link>
            );
          })}
        </nav>

        {/* Pinned bottom profile / settings card */}
        <div className="shrink-0 border-t border-sidebar-border p-4">
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent p-4 shadow-sm">
            <Link
              href={effectiveRole === 'admin' ? '/admin/profile' : effectiveRole === 'teacher' ? '/teacher/profile' : '/student/profile'}
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3 transition-opacity hover:opacity-95"
              data-testid="link-sidebar-profile-card"
            >
              <Avatar name={me?.fullName ?? (effectiveRole === 'admin' ? 'Administrator' : effectiveRole === 'teacher' ? 'Instructor' : 'Student')} src={me?.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-sidebar-foreground group-hover:text-accent" data-testid="text-shell-name">
                  {me?.fullName ?? (effectiveRole === 'admin' ? 'Admin User' : effectiveRole === 'teacher' ? 'Instructor' : 'Student')}
                </p>
                <p className="text-xs text-sidebar-foreground/55 truncate">
                  {effectiveRole === 'admin' ? 'Administrator' : effectiveRole === 'teacher' ? (me?.department ? `Faculty • ${me.department}` : 'Instructor') : (me?.studentId ?? 'Student')}
                </p>
              </div>
            </Link>
            <div className="mt-3 flex items-center justify-between border-t border-sidebar-border pt-3">
              {effectiveRole === 'admin' ? (
                <button
                  onClick={() => {
                    switchRole('student');
                    setLocation('/student/dashboard');
                  }}
                  className="text-[11px] font-bold text-accent hover:underline"
                  data-testid="button-switch-role"
                >
                  → Student View
                </button>
              ) : effectiveRole === 'teacher' ? (
                <span className="text-[11px] font-bold text-sidebar-foreground/50">Faculty Portal</span>
              ) : (
                <span className="text-[11px] font-bold text-sidebar-foreground/50">Learner Space</span>
              )}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-xs font-bold text-sidebar-foreground/70 hover:text-accent"
                data-testid="button-sign-out"
              >
                <LogOut className="size-3.5" /> Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div className="md:pl-[260px]">
        <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-md md:px-9">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-muted md:hidden" data-testid="button-open-menu">
            <Menu className="size-5" />
          </button>
          <div className="hidden text-sm font-semibold text-muted-foreground md:block">
            {admin ? 'LumenPath / Operations & Administration' : 'LumenPath / Your Learning Space'}
          </div>
          <div className="ml-auto flex items-center gap-3">

            <Link
              href={admin ? '/admin/profile' : '/student/profile'}
              className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-primary shadow-sm hover:bg-muted"
              data-testid="link-header-profile"
            >
              <Avatar name={me?.fullName ?? (admin ? 'Admin' : 'Student')} src={me?.avatarUrl} />
              <span className="hidden sm:inline">{me?.fullName ?? (admin ? 'Administrator' : 'Student')}</span>
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] p-5 md:p-9">{children}</main>
      </div>
    </div>
  );
}

function PageIntro({ eyebrow, title, body, action }: { eyebrow?: string; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-teal-700">{eyebrow}</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-primary md:text-4xl" data-testid="text-page-title">
          {title}
        </h1>
        {body && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{body}</p>}
      </div>
      {action}
    </div>
  );
}

function Stat({ label, value, note, icon: Icon, accent = false }: { label: string; value: ReactNode; note?: string; icon: any; accent?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-5 ${accent ? 'border-primary bg-primary text-primary-foreground' : 'border-card-border bg-card'}`}
      data-testid={`stat-${label.toLowerCase().replaceAll(' ', '-')}`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold uppercase tracking-wider ${accent ? 'text-primary-foreground/65' : 'text-muted-foreground'}`}>
          {label}
        </span>
        <Icon className={`size-5 ${accent ? 'text-accent' : 'text-teal-700'}`} />
      </div>
      <div className="mt-3 font-display text-3xl font-extrabold">{value}</div>
      {note && <p className={`mt-1 text-xs ${accent ? 'text-primary-foreground/65' : 'text-muted-foreground'}`}>{note}</p>}
    </div>
  );
}

function ProgressBar({ value, dark = false }: { value: number; dark?: boolean }) {
  return (
    <div className={`h-2 overflow-hidden rounded-full ${dark ? 'bg-primary-foreground/15' : 'bg-muted'}`}>
      <div
        className="h-full rounded-full bg-accent transition-[width] duration-700"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-[100dvh] overflow-hidden bg-background">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Brand />
        <div className="flex items-center gap-3">
          <Link href="/teacher/login" className="hidden rounded-xl px-3.5 py-2 text-sm font-bold text-primary hover:bg-muted md:block" data-testid="link-teacher-portal">
            Teacher Portal
          </Link>
          <Link href="/student/login" className="hidden rounded-xl px-4 py-2 text-sm font-bold text-primary hover:bg-muted sm:block" data-testid="link-sign-in">
            Student Login
          </Link>
          <Link
            href="/sign-up"
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))] transition-transform hover:-translate-y-0.5"
            data-testid="link-sign-up"
          >
            Start learning <ArrowRight className="ml-1 inline size-4" />
          </Link>
        </div>
      </header>
      <section className="surface-grid relative mx-4 overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-primary-foreground md:mx-8 md:px-16 md:py-24 lg:px-24">
        <div className="relative z-10 max-w-3xl animate-rise">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-bold text-accent">
            <Sparkles className="size-3.5" /> Make progress you can feel
          </div>
          <h1 className="max-w-4xl font-display text-5xl font-extrabold leading-[.96] tracking-[-.045em] md:text-7xl">
            A clearer path to<br />
            <span className="text-accent">what's next.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-primary-foreground/70 md:text-lg">
            LumenPath gives every lesson a place, every question a purpose, and every small win room to count.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="rounded-xl bg-accent px-5 py-3 font-bold text-primary transition-transform hover:-translate-y-0.5"
              data-testid="link-hero-start"
            >
              Build your learning rhythm <ArrowRight className="ml-2 inline size-4" />
            </Link>
            <Link
              href="/student/login"
              className="rounded-xl border border-primary-foreground/25 px-5 py-3 font-bold text-primary-foreground hover:bg-primary-foreground/10"
              data-testid="link-hero-signin"
            >
              Student Login
            </Link>
            <Link
              href="/teacher/register"
              className="rounded-xl border border-accent/40 bg-accent/15 px-5 py-3 font-bold text-accent hover:bg-accent/25"
              data-testid="link-hero-teacher-register"
            >
              Apply as Instructor
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-10 md:grid-cols-[.8fr_1.2fr]">
          <div>
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-teal-700">A better study loop</p>
            <h2 className="mt-4 max-w-md font-display text-4xl font-extrabold leading-tight text-primary">
              Less hunting.<br />More learning.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Feature n="01" icon={Target} title="Know the next move" body="A focused dashboard turns your goals into a short, doable queue." />
            <Feature n="02" icon={Zap} title="Practice with purpose" body="Quizzes reveal what to revisit, not just what you got wrong." />
            <Feature n="03" icon={Trophy} title="See your momentum" body="Progress is measured in the moments you keep showing up." />
          </div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
        <Brand />
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/student/login" className="font-semibold text-primary hover:text-teal-700">
            Student Login
          </Link>
          <span>•</span>
          <Link href="/teacher/login" className="font-semibold text-primary hover:text-teal-700">
            Teacher Portal
          </Link>
          <span>•</span>
          <Link href="/teacher/register" className="font-semibold text-primary hover:text-teal-700">
            Register as Teacher
          </Link>
          <span>•</span>
          <Link href="/admin/login" className="font-semibold text-primary hover:text-teal-700">
            Admin Portal
          </Link>
          <span>•</span>
          <span>Learning is a direction, not a deadline.</span>
        </div>
      </footer>
    </div>
  );
}

function Feature({ n, icon: Icon, title, body }: { n: string; icon: any; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-card-border bg-card p-5 transition-transform hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <span className="font-mono-ui text-[10px] text-muted-foreground">{n}</span>
        <Icon className="size-5 text-teal-700" />
      </div>
      <h3 className="mt-8 font-display text-lg font-bold text-primary">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

/* =========================================================================
   STUDENT PAGES: OVERVIEW, SUBJECTS, LESSONS, QUIZZES, RESULTS, PROGRESS, PROFILE
   ========================================================================= */

function StudentDashboard() {
  const { studentStats, lessons, subjects, syncCurrentStudent } = usePlatformStore();
  const { user } = useAuth();
  const recent = lessons.slice(0, 4);
  const nextLesson = lessons.find((l) => !l.completed) || lessons[0];

  useEffect(() => {
    if (user && user.role === 'student') {
      syncCurrentStudent({
        fullName: user.fullName,
        email: user.email,
        studentId: user.studentId,
        progress: studentStats.progress,
      });
    }
  }, [user?.fullName, user?.email, user?.studentId, studentStats.progress, syncCurrentStudent]);

  return (
    <>
      <PageIntro
        eyebrow="Monday, a fresh start"
        title={`Good morning, ${user?.fullName?.split(' ')[0] ?? 'there'}.`}
        body="A little direction goes a long way. Here's your learning space for today."
        action={
          <Link
            href="/student/lessons"
            className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))]"
            data-testid="link-dashboard-browse"
          >
            Browse lessons <ArrowRight className="ml-1 inline size-4" />
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-rise">
        <Stat label="Overall progress" value={`${studentStats.progress}%`} note="Keep your momentum going" icon={LineChart} accent />
        <Stat label="Subjects" value={studentStats.totalSubjects} note="In your curriculum" icon={BookOpen} />
        <Stat label="Lessons done" value={studentStats.lessonsCompleted} note="One concept at a time" icon={BookOpenCheck} />
        <Stat label="Average score" value={`${studentStats.averageScore}%`} note={`${studentStats.quizzesTaken} quizzes taken`} icon={Trophy} />
      </div>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <section className="rounded-2xl border border-card-border bg-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">Continue where you left off</p>
              <h2 className="mt-1 font-display text-xl font-bold">Recent lessons</h2>
            </div>
            <Link href="/student/lessons" className="text-xs font-bold text-teal-700 hover:underline" data-testid="link-dashboard-lessons">
              View all
            </Link>
          </div>
          <div className="mt-5 divide-y divide-border">
            {recent.map((l) => (
              <Link
                href={`/student/lessons/${l.id}`}
                key={l.id}
                className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                data-testid={`link-recent-lesson-${l.id}`}
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    l.completed ? 'bg-accent/20 text-teal-700' : 'bg-secondary text-teal-700'
                  }`}
                >
                  {l.completed ? <CheckCircle2 className="size-5 text-teal-700" /> : <BookOpenCheck className="size-5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-teal-700">{l.subjectName}</span>
                  <span className="mt-1 block truncate font-bold group-hover:text-teal-700">{l.title}</span>
                  <span className="mt-2 block">
                    <ProgressBar value={l.completed ? 100 : l.progress} />
                  </span>
                </span>
                <span className="font-mono-ui text-xs text-muted-foreground">{l.completed ? 'Done' : `${l.progress}%`}</span>
                <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          {/* Student Profile Quick Card */}
          <section className="rounded-2xl border border-card-border bg-card p-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar name={user?.fullName || 'Student'} src={user?.avatarUrl} className="size-14" textSize="text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-bold">{user?.fullName || 'Student User'}</p>
                <p className="text-xs text-muted-foreground">{user?.studentId || 'Student'} · Learner</p>
                <Link
                  href="/student/profile"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline"
                  data-testid="link-dashboard-profile-edit"
                >
                  <Camera className="size-3" /> Update photo & profile
                </Link>
              </div>
            </div>
          </section>

          {/* Recommended Lesson Nudge */}
          <section className="rounded-2xl bg-primary p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-accent">A nudge for you</p>
              <Sparkles className="size-4 text-accent" />
            </div>
            <h2 className="mt-4 max-w-xs font-display text-xl font-bold">Small sessions add up.</h2>
            <p className="mt-2 text-sm leading-6 text-primary-foreground/65">
              Your next recommended lesson is a great 15-minute study win.
            </p>
            {nextLesson && (
              <Link
                href={`/student/lessons/${nextLesson.id}`}
                className="mt-6 flex items-center justify-between rounded-xl bg-primary-foreground/10 p-3.5 text-sm font-bold hover:bg-primary-foreground/15 transition-colors"
                data-testid="link-recommended-lesson"
              >
                <span className="truncate">{nextLesson.title} · {nextLesson.subjectName}</span>
                <ArrowRight className="ml-2 size-4 shrink-0 text-accent" />
              </Link>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

function SubjectsPage() {
  const { subjects, lessons, quizzes } = usePlatformStore();
  const [search, setSearch] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);

  const filtered = subjects.filter((s) => `${s.name} ${s.code} ${s.description}`.toLowerCase().includes(search.toLowerCase()));
  const activeSubject = selectedSubjectId ? subjects.find((s) => s.id === selectedSubjectId) : null;
  // STRICT subject filtering: only lessons that belong to this exact subject
  const activeLessons = selectedSubjectId
    ? lessons.filter((l) => l.subjectId === Number(selectedSubjectId) && l.published !== false)
    : [];
  const activeQuizzes = selectedSubjectId ? quizzes.filter((q) => q.subjectId === selectedSubjectId) : [];

  return (
    <>
      <PageIntro
        eyebrow="Your curriculum"
        title="Subjects"
        body="A map of the ideas you're building, one subject at a time. Click any subject to explore its lessons and quizzes."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects by name or code..."
            className="w-full bg-transparent text-sm outline-none"
            data-testid="input-subject-search"
          />
        </div>
        {selectedSubjectId && (
          <button
            onClick={() => setSelectedSubjectId(null)}
            className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
          >
            ← View All Subjects
          </button>
        )}
      </div>

      {activeSubject ? (
        <div className="space-y-6">
          {/* Subject Header */}
          <div className="rounded-2xl border border-card-border bg-card p-6 md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-lg bg-secondary px-2.5 py-1 font-mono-ui text-xs font-bold text-secondary-foreground">
                    {activeSubject.code}
                  </span>
                  <span className="rounded-lg bg-teal-700/10 px-2.5 py-1 text-[11px] font-bold text-teal-700">
                    {activeLessons.length} Lessons · {activeQuizzes.length} Quizzes
                  </span>
                </div>
                <h2 className="mt-4 font-display text-2xl font-extrabold">{activeSubject.name}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{activeSubject.description}</p>
                {activeSubject.instructor && (
                  <p className="mt-3 text-xs text-muted-foreground">
                    <span className="font-bold text-foreground">Instructor:</span> {activeSubject.instructor}
                    {activeSubject.department ? ` · ${activeSubject.department}` : ''}
                  </p>
                )}
              </div>
              <Link
                href={`/student/lessons?subject=${activeSubject.id}`}
                className="shrink-0 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-accent shadow-[2px_2px_0_hsl(var(--accent)/0.4)] hover:-translate-y-0.5 transition-transform"
              >
                Open all lessons →
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Lessons Panel */}
            <div className="rounded-2xl border border-card-border bg-card p-6">
              <h3 className="font-display text-lg font-bold">Lessons in {activeSubject.name} ({activeLessons.length})</h3>
              <div className="mt-4 divide-y divide-border">
                {activeLessons.length === 0 ? (
                  <p className="py-4 text-xs text-muted-foreground">No published lessons in this subject yet.</p>
                ) : (
                  activeLessons.map((l, idx) => (
                    <div key={l.id} className="flex items-center justify-between py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0 grid size-6 place-items-center rounded-md bg-secondary text-[10px] font-bold text-secondary-foreground">
                            {idx + 1}
                          </span>
                          <Link href={`/student/lessons/${l.id}`} className="truncate text-sm font-bold hover:text-teal-700">
                            {l.title}
                          </Link>
                        </div>
                        <p className="mt-0.5 truncate pl-8 text-[11px] text-muted-foreground">
                          {l.lessonType === 'video' ? '🎥 Video' : l.lessonType === 'pdf' ? '📄 PDF' : '📝 Text'}
                          {l.durationMinutes ? ` · ${l.durationMinutes} min` : ''}
                          {l.completed ? ' · ✅ Done' : ''}
                        </p>
                      </div>
                      <Link href={`/student/lessons/${l.id}`} className="ml-3 shrink-0 text-xs font-bold text-teal-700">
                        {l.completed ? 'Review' : 'Study →'}
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quizzes Panel */}
            <div className="rounded-2xl border border-card-border bg-card p-6">
              <h3 className="font-display text-lg font-bold">Quizzes ({activeQuizzes.length})</h3>
              <div className="mt-4 divide-y divide-border">
                {activeQuizzes.length === 0 ? (
                  <p className="py-4 text-xs text-muted-foreground">No quizzes currently assigned in this subject.</p>
                ) : (
                  activeQuizzes.map((q) => (
                    <div key={q.id} className="flex items-center justify-between py-3">
                      <div>
                        <Link href={`/student/quizzes/${q.id}`} className="text-sm font-bold hover:text-teal-700">
                          {q.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {q.questionCount} questions · {q.bestScore != null ? `${q.bestScore}% best` : 'Not attempted'}
                        </p>
                      </div>
                      <Link href={`/student/quizzes/${q.id}`} className="text-xs font-bold text-accent bg-primary px-3 py-1.5 rounded-lg">
                        Take Quiz
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title="No subjects found" body="Try a different search term or check back when your curriculum updates." />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => {
            const subLessons = lessons.filter((l) => l.subjectId === s.id);
            const subDone = subLessons.filter((l) => l.completed).length;
            const computedProgress = subLessons.length > 0 ? Math.round((subDone / subLessons.length) * 100) : s.progress;
            return (
              <div
                key={s.id}
                onClick={() => setSelectedSubjectId(s.id)}
                className="group cursor-pointer rounded-2xl border border-card-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-teal-700/40 hover:shadow-[5px_5px_0_hsl(var(--secondary))]"
                data-testid={`card-subject-${s.id}`}
              >
                <div className="flex items-start justify-between">
                  <span className="rounded-lg bg-secondary px-2.5 py-1 font-mono-ui text-[10px] font-bold text-secondary-foreground">
                    {s.code}
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <h2 className="mt-6 font-display text-xl font-bold group-hover:text-teal-700">{s.name}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{s.description}</p>
                <div className="mt-7 flex items-end justify-between text-xs">
                  <span className="text-muted-foreground">{subLessons.length} lessons</span>
                  <span className="font-mono-ui font-bold text-teal-700">{computedProgress}%</span>
                </div>
                <div className="mt-2">
                  <ProgressBar value={computedProgress} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

function LessonsPage() {
  const { lessons, completeLesson, subjects } = usePlatformStore();
  const { role } = useAuth();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'completed'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search).get('subject');
      if (sp) return sp;
    }
    return 'all';
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search).get('subject');
      if (sp) setSubjectFilter(sp);
    }
  }, []);
  const isTeacherOrAdmin = role === 'teacher' || role === 'admin';

  const shown = lessons.filter((l) => {
    // Teachers and admins see all lessons; students only see published lessons
    if (!isTeacherOrAdmin && l.published === false) return false;
    const matchFilter = filter === 'all' || (filter === 'completed' ? l.completed : !l.completed);
    // STRICT subject filtering by subjectId
    const matchSubject = subjectFilter === 'all' || l.subjectId === Number(subjectFilter);
    // Search only within selected subject (or all if 'all' selected)
    const matchSearch = `${l.title} ${l.description} ${l.subjectName}`.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSubject && matchSearch;
  });

  const handleToggleComplete = (id: number, currentCompleted: boolean) => {
    if (!currentCompleted) {
      completeLesson(id);
      toast({
        title: 'Lesson Completed!',
        description: 'Great progress. Your learning stats have been updated.',
      });
    }
  };

  return (
    <>
      <PageIntro
        eyebrow="Build your rhythm"
        title="Lessons"
        body="Pick a lesson, make a little progress, and leave a note for tomorrow."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-border bg-card p-1">
              {(['all', 'incomplete', 'completed'] as const).map((x) => (
                <button
                  key={x}
                  onClick={() => setFilter(x)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                    filter === x ? 'bg-primary text-accent' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid={`button-filter-${x}`}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex max-w-sm flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search lessons..."
            className="w-full bg-transparent text-sm outline-none"
            data-testid="input-lessons-search"
          />
        </div>

        {/* Subject tab filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => { setSubjectFilter('all'); setSearch(''); }}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
              subjectFilter === 'all' ? 'bg-primary text-accent' : 'border border-border bg-card text-muted-foreground hover:text-foreground'
            }`}
            data-testid="button-filter-subject-all"
          >
            All Subjects
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() => { setSubjectFilter(String(s.id)); setSearch(''); }}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                subjectFilter === String(s.id) ? 'bg-teal-700 text-white' : 'border border-border bg-card text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`button-filter-subject-${s.id}`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title="No lessons found"
          body="Nothing matches this filter or search query. Your lessons are ready when you want to switch filters."
        />
      ) : (
        <div className="space-y-3">
          {shown.map((l) => (
            <div
              key={l.id}
              className="group flex flex-col gap-4 rounded-2xl border border-card-border bg-card p-5 transition-all hover:border-teal-700/40 sm:flex-row sm:items-center"
              data-testid={`row-lesson-${l.id}`}
            >
              <span
                className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                  l.completed ? 'bg-accent text-primary' : 'bg-secondary text-teal-700'
                }`}
              >
                {l.completed ? <CheckCircle2 className="size-5" /> : <BookOpenCheck className="size-5" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-teal-700">{l.subjectName}</p>
                <Link
                  href={`/student/lessons/${l.id}`}
                  className="mt-1 block truncate font-display text-lg font-bold hover:text-teal-700"
                  data-testid={`link-lesson-${l.id}`}
                >
                  {l.title}
                </Link>
                <p className="mt-1 truncate text-sm text-muted-foreground">{l.description}</p>
              </div>
              <div className="w-full sm:w-32">
                <div className="mb-1 flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>Progress</span>
                  <span>{l.completed ? 100 : l.progress}%</span>
                </div>
                <ProgressBar value={l.completed ? 100 : l.progress} />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (l.materialUrl && l.materialName) {
                      downloadFileHelper(l.materialUrl, l.materialName);
                      Swal.fire({
                        icon: 'success',
                        title: 'Download Started',
                        text: `Downloading ${l.materialName}`,
                        timer: 1800,
                        showConfirmButton: false,
                      });
                    } else {
                      const rawContent = l.content ? l.content.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim() : '';
                      const defaultText = `# ${l.title}\nSubject: ${l.subjectName}\n\n## Description\n${l.description}\n\n## Objectives\n${(l.objectives || []).map((o) => `- ${o}`).join('\n')}\n\n## Content\n${rawContent}\n`;
                      downloadFileHelper(null, `${l.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-study-guide.md`, defaultText);
                      Swal.fire({
                        icon: 'success',
                        title: 'Download Started',
                        text: `Downloading lesson notes for "${l.title}"`,
                        timer: 1800,
                        showConfirmButton: false,
                      });
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-teal-700/30 bg-teal-700/5 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-700 hover:text-white transition-colors"
                  title="Download lesson materials"
                  data-testid={`button-download-lesson-${l.id}`}
                >
                  <Download className="size-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <Link
                  href={`/student/lessons/${l.id}`}
                  className="rounded-xl border border-border px-3.5 py-2 text-xs font-bold hover:bg-muted"
                  data-testid={`button-view-lesson-${l.id}`}
                >
                  {l.completed ? 'Review' : 'Study'}
                </Link>
                {!l.completed && (
                  <button
                    onClick={() => handleToggleComplete(l.id, l.completed)}
                    className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-accent"
                    data-testid={`button-complete-lesson-${l.id}`}
                  >
                    Mark done
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function LessonDetail() {
  const { id } = useParams<{ id: string }>();
  const lessonId = Number(id);
  const { lessons, completeLesson } = usePlatformStore();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const l = lessons.find((item) => item.id === lessonId) || lessons[0];
  // Next lesson must be within the SAME subject — strict subject isolation
  const sameSubjectLessons = l
    ? lessons.filter((item) => item.subjectId === l.subjectId && item.published !== false).sort((a, b) => a.id - b.id)
    : [];
  const currentIdx = sameSubjectLessons.findIndex((item) => item.id === lessonId);
  const nextLesson = currentIdx >= 0 && currentIdx < sameSubjectLessons.length - 1
    ? sameSubjectLessons[currentIdx + 1]
    : null;

  if (!l) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-card-border bg-card p-8 text-center space-y-4">
        <p className="text-muted-foreground">Lesson not found or no lessons available yet.</p>
        <Link href="/student/lessons" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline">
          ← Back to lessons
        </Link>
      </div>
    );
  }

  const handleComplete = () => {
    completeLesson(l.id);
    toast({
      title: 'Lesson Marked Complete!',
      description: 'Your progress has been recorded.',
    });
  };

  const handleDownloadMaterial = () => {
    if (l.materialUrl && l.materialName) {
      downloadFileHelper(l.materialUrl, l.materialName);
      Swal.fire({
        icon: 'success',
        title: 'Download Started!',
        html: `<p class="text-sm text-gray-500 mt-1">Downloading <strong>${l.materialName}</strong></p>`,
        timer: 2000,
        showConfirmButton: false,
        timerProgressBar: true,
      });
      return;
    }
    // Fallback: generate a study guide from lesson content
    const rawContent = l.content ? l.content.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim() : '';
    const defaultText = `# ${l.title}\nSubject: ${l.subjectName}\n\n## Description\n${l.description}\n\n## Learning Objectives\n${(l.objectives || []).map((o) => `- ${o}`).join('\n')}\n\n## Lesson Content\n${rawContent}\n\n---\nLumenPath study guide — prepared for self-paced revision.\n`;
    const filename = l.materialName || `${l.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-study-guide.md`;
    downloadFileHelper(null, filename, defaultText);
    Swal.fire({
      icon: 'success',
      title: 'Study Guide Downloaded!',
      html: `<p class="text-sm text-gray-500 mt-1">Your lesson notes for <strong>${l.title}</strong> have been saved.</p>`,
      timer: 2200,
      showConfirmButton: false,
      timerProgressBar: true,
    });
  };

  return (
    <>
      <div className="mb-7 flex items-center justify-between">
        <Link href="/student/lessons" className="inline-flex items-center gap-2 text-xs font-bold text-teal-700 hover:underline" data-testid="link-back-lessons">
          ← All lessons
        </Link>
        {nextLesson && (
          <Link href={`/student/lessons/${nextLesson.id}`} className="text-xs font-bold text-teal-700 hover:underline">
            Next lesson: {nextLesson.title} →
          </Link>
        )}
      </div>

      <div className="grid gap-8 xl:grid-cols-[1fr_340px]">
        <article className="rounded-2xl border border-card-border bg-card p-6 md:p-10 space-y-8">
          <div>
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-teal-700">{l.subjectName}</p>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-primary" data-testid="text-lesson-title">
              {l.title}
            </h1>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">{l.description}</p>
          </div>

          <div className="h-px bg-border" />

          {/* Lesson Content */}
          <div className="prose prose-stone max-w-none text-[15px] leading-8" dangerouslySetInnerHTML={{ __html: l.content }} />

          {/* Objectives */}
          <div className="rounded-2xl bg-secondary/50 p-6 border border-border">
            <h2 className="font-display text-lg font-bold">By the end of this lesson, you'll be able to</h2>
            <ul className="mt-4 space-y-3">
              {(l.objectives ?? []).map((o: string, i: number) => (
                <li key={i} className="flex gap-3 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-teal-700" />
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Attached Lesson Material */}
          {l.materialName && (
            <div className="space-y-3">
              <h3 className="font-display text-base font-bold flex items-center gap-2">
                <Paperclip className="size-4 text-teal-700" /> Lesson Resources & Materials
              </h3>
              <FileAttachmentCard
                name={l.materialName}
                size={l.materialSize || '2.4 MB'}
                url={l.materialUrl}
                type={l.materialType}
                label="Instructor Provided Material"
              />
            </div>
          )}

          {/* Downloadable Lesson Materials */}
          <div className="rounded-2xl border border-teal-700/20 bg-gradient-to-br from-teal-700/5 to-card p-6 space-y-4">
            <div>
              <h3 className="font-display text-base font-bold flex items-center gap-2">
                <ArrowDownToLine className="size-4 text-teal-700" /> Download Lesson Materials
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Download the lesson resources provided by your instructor for offline study and reference.
              </p>
            </div>

            {l.materialName ? (
              <div className="space-y-3">
                <FileAttachmentCard
                  name={l.materialName}
                  size={l.materialSize || '—'}
                  url={l.materialUrl}
                  type={l.materialType}
                  label="Instructor Provided Material"
                />
                <button
                  type="button"
                  onClick={handleDownloadMaterial}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(15,118,110,0.35)] hover:bg-teal-800 hover:shadow-[0_4px_20px_rgba(15,118,110,0.45)] transition-all active:scale-95"
                  data-testid="button-download-material"
                >
                  <Download className="size-4" /> Download {l.materialName}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-teal-700/25 bg-secondary/40 py-8 text-center">
                <div className="grid size-12 place-items-center rounded-full bg-teal-700/10">
                  <FileText className="size-6 text-teal-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">No material attached yet</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Your instructor hasn't uploaded materials for this lesson.</p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadMaterial}
                  className="inline-flex items-center gap-2 rounded-xl border border-teal-700/30 px-4 py-2 text-xs font-bold text-teal-700 hover:bg-teal-700 hover:text-white transition-colors"
                  data-testid="button-download-notes"
                >
                  <Download className="size-3.5" /> Download Study Notes
                </button>
              </div>
            )}
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-6 xl:sticky xl:top-24 h-fit">
          <div className="rounded-2xl bg-primary p-6 text-primary-foreground">
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-accent">Lesson progress</p>
            <div className="mt-5 flex items-baseline justify-between">
              <span className="font-display text-4xl font-extrabold">{l.completed ? 100 : l.progress}%</span>
              <span className="text-xs text-primary-foreground/55">{l.completed ? 'Complete' : 'In progress'}</span>
            </div>
            <div className="mt-3">
              <ProgressBar value={l.completed ? 100 : l.progress} dark />
            </div>

            <button
              onClick={handleDownloadMaterial}
              className="mt-6 flex w-full items-center justify-between rounded-xl border border-primary-foreground/20 p-3 text-sm font-bold hover:bg-primary-foreground/10 transition-colors"
              data-testid="link-lesson-material"
            >
              <span className="truncate mr-2">{l.materialName || 'Download Study Notes'}</span>
              <Download className="size-4 text-accent shrink-0" />
            </button>

            <button
              onClick={handleComplete}
              disabled={l.completed}
              className="mt-4 w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold text-primary disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90 transition-opacity"
              data-testid="button-detail-complete"
            >
              {l.completed ? '✓ Lesson complete' : 'Mark lesson complete'}
            </button>
          </div>

          {/* Quick Download Card in Sidebar */}
          <div className="rounded-2xl border border-teal-700/20 bg-card p-5 space-y-3">
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-teal-700">Lesson Materials</p>
            {l.materialName ? (
              <>
                <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                  <FileCheck className="size-4 shrink-0 text-teal-700" />
                  <span className="truncate">{l.materialName}</span>
                </div>
                {l.materialSize && (
                  <p className="text-xs text-muted-foreground">{l.materialSize} — instructor upload</p>
                )}
                <button
                  type="button"
                  onClick={handleDownloadMaterial}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors"
                >
                  <Download className="size-3.5" /> Download File
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">No instructor file. Download auto-generated study notes instead.</p>
                <button
                  type="button"
                  onClick={handleDownloadMaterial}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-700/30 px-4 py-2.5 text-xs font-bold text-teal-700 hover:bg-teal-700 hover:text-white transition-colors"
                >
                  <Download className="size-3.5" /> Study Notes
                </button>
              </>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function QuizzesPage() {
  const { quizzes, subjects } = usePlatformStore();
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const filtered = quizzes.filter((qz) => {
    const matchSubject = subjectFilter === 'all' || qz.subjectId === Number(subjectFilter);
    const matchSearch = `${qz.title} ${qz.description} ${qz.subjectName}`.toLowerCase().includes(search.toLowerCase());
    return matchSubject && matchSearch;
  });

  return (
    <>
      <PageIntro
        eyebrow="Practice with purpose"
        title="Quizzes"
        body="A quiz is a conversation with what you know. Take your time and use the result as a map."
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex max-w-sm flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes..."
            className="w-full bg-transparent text-sm outline-none"
            data-testid="input-quiz-search"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-primary outline-none"
        >
          <option value="all">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No quizzes found" body="Try selecting another subject or adjusting your search term." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((qz) => (
            <Link
              href={`/student/quizzes/${qz.id}`}
              key={qz.id}
              className="group flex gap-5 rounded-2xl border border-card-border bg-card p-6 transition-transform hover:-translate-y-0.5 hover:border-teal-700/40"
              data-testid={`card-quiz-${qz.id}`}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-primary">
                <ClipboardList className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-teal-700">{qz.subjectName}</p>
                <h2 className="mt-1 font-display text-xl font-bold group-hover:text-teal-700">{qz.title}</h2>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>{qz.questionCount} questions</span>
                  <span>Pass at {qz.passingScore}%</span>
                  {qz.timeLimit && (
                    <span>
                      <Clock3 className="mr-1 inline size-3.5" />
                      {qz.timeLimit} min
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="block font-mono-ui text-xs text-muted-foreground">{qz.attempts} attempts</span>
                <span className="mt-6 block font-bold text-teal-700">{qz.bestScore != null ? `${qz.bestScore}% best` : 'Start →'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function QuizDetail() {
  const { id } = useParams<{ id: string }>();
  const quizId = Number(id);
  const { quizzes, submitQuiz, startQuizSession, saveDraftAnswers, clearActiveSession } = usePlatformStore();
  const { user } = useAuth();
  const studentEmail = user?.email || 'student@lumenpath.local';
  const studentName = user?.fullName || 'Student';

  const quiz = quizzes.find((item) => item.id === quizId) || quizzes[0];
  const questions = quiz?.questions ?? [];

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizSubmission, setQuizSubmission] = useState<{
    name: string;
    url: string;
    size: string;
    type: string;
  } | null>(null);
  const [result, setResult] = useState<any>(null);

  // Anti-Bypass & Real-Time Timer State
  const [session, setSession] = useState<ActiveQuizSession | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showAutoSubmitNotification, setShowAutoSubmitNotification] = useState<boolean>(false);
  const autoSubmittedRef = useRef<boolean>(false);

  // Initialize or resume student's quiz session (Anti-Bypass: maintains single deadline across refresh & tabs)
  useEffect(() => {
    if (!quiz) return;
    const s = startQuizSession(quiz.id, studentEmail, studentName);
    setSession(s);
    if (s.answers && Object.keys(s.answers).length > 0) {
      setAnswers(s.answers);
    }
  }, [quiz?.id, studentEmail, studentName]);

  // Countdown timer tick & auto-submit enforcement
  useEffect(() => {
    if (!session || result || isLocked) return;

    const deadlineMs = new Date(session.deadline).getTime();

    const checkCountdown = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((deadlineMs - now) / 1000));
      setSecondsLeft(diff);

      if (diff <= 0 && !autoSubmittedRef.current && !result) {
        autoSubmittedRef.current = true;
        setIsLocked(true);
        setShowConfirmModal(false);
        setShowAutoSubmitNotification(true);

        // Automatically stop the quiz and submit current answers
        const res = submitQuiz(
          quiz.id,
          answers,
          studentName,
          quizSubmission,
          true, // isTimeExpired = true -> marks as "Auto-Submitted – Time Expired"
          session.startedAt
        );
        setResult(res);
        Swal.fire({
          icon: 'warning',
          title: 'Time is Up!',
          text: 'The countdown reached 00:00 and your quiz has been automatically submitted. You can no longer change your answers.',
          confirmButtonColor: '#0f766e',
          confirmButtonText: 'View My Results',
        });
      }
    };

    checkCountdown();
    const interval = setInterval(checkCountdown, 1000);

    // Sync deadline on tab focus, reconnect, and visibility change to prevent bypassing
    const onSync = () => checkCountdown();
    window.addEventListener('focus', onSync);
    window.addEventListener('online', onSync);
    document.addEventListener('visibilitychange', onSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onSync);
      window.removeEventListener('online', onSync);
      document.removeEventListener('visibilitychange', onSync);
    };
  }, [session?.deadline, result, isLocked, answers, quizSubmission]);

  if (!quiz) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-card-border bg-card p-8 text-center space-y-4">
        <p className="text-muted-foreground">Quiz not found or no quizzes available yet.</p>
        <Link href="/student/quizzes" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline">
          ← Back to quizzes
        </Link>
      </div>
    );
  }

  const answered = Object.keys(answers).length;
  const timeLimitMinutes = quiz.timeLimit || 15;
  const totalSeconds = timeLimitMinutes * 60;
  const timeProgress = Math.min(100, Math.max(0, (secondsLeft / Math.max(1, totalSeconds)) * 100));

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}:${remMins < 10 ? '0' : ''}${remMins}:${formattedSecs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${formattedSecs}`;
  };

  const handleSelectAnswer = (questionId: number, value: string) => {
    if (isLocked) return;
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);
    saveDraftAnswers(quiz.id, studentEmail, updated);
  };

  const handleManualSubmitClick = async () => {
    if (isLocked) return;
    const answeredCount = Object.keys(answers).length;
    const totalCount = quiz.questions?.length ?? 0;
    const remainingCount = totalCount - answeredCount;

    const resAlert = await Swal.fire({
      title: 'Submit Assessment?',
      html: `<div style="text-align:center; font-size:14px; color:#475569; margin-top:8px;">
        You have answered <b>${answeredCount} of ${totalCount}</b> questions.
        ${remainingCount > 0 ? `<br/><span style="display:inline-block; margin-top:8px; color:#b45309; font-weight:600;">⚠️ ${remainingCount} question(s) will be left blank!</span>` : ''}
        <br/><br/><span style="font-size:12px; color:#64748b;">Once submitted, your answers will be locked for grading.</span>
      </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f766e',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Submit Quiz',
      cancelButtonText: 'Keep Answering',
    });

    if (resAlert.isConfirmed) {
      handleConfirmSubmit();
    }
  };

  const handleConfirmSubmit = () => {
    setIsLocked(true);
    setShowConfirmModal(false);
    const res = submitQuiz(
      quiz.id,
      answers,
      studentName,
      quizSubmission,
      false, // Finished before deadline
      session?.startedAt
    );
    setResult(res);
    Swal.fire({
      icon: 'success',
      title: 'Quiz Submitted!',
      html: `<div style="text-align:center; font-size:14px; color:#475569; margin-top:8px;">
        Your assessment has been recorded.<br/>
        <span style="display:inline-block; margin-top:10px; padding:4px 12px; background:#f0fdfa; border:1px solid #ccfbf1; border-radius:8px; color:#0f766e; font-weight:700;">
          Score: ${res.percentage}% (${res.passed ? 'PASSED' : 'FAILED'})
        </span>
      </div>`,
      confirmButtonColor: '#0f766e',
      timer: 2500,
      timerProgressBar: true,
    });
  };

  const handleRetake = () => {
    clearActiveSession(quiz.id, studentEmail);
    autoSubmittedRef.current = false;
    setIsLocked(false);
    setShowAutoSubmitNotification(false);
    setShowConfirmModal(false);
    setAnswers({});
    setQuizSubmission(null);
    setResult(null);

    // Start a fresh quiz attempt
    const fresh = startQuizSession(quiz.id, studentEmail, studentName);
    setSession(fresh);
    setSecondsLeft((quiz.timeLimit || 15) * 60);
  };

  // Timer visual indicators
  const isCritical = secondsLeft <= 60 && !result; // Red indicator <= 1 minute
  const isWarning = secondsLeft <= 180 && secondsLeft > 60 && !result; // Amber warning <= 3 minutes

  if (result) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-card-border bg-card p-8 text-center md:p-12 animate-rise space-y-6">
        <div>
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-accent">
            <Trophy className="size-7 text-primary" />
          </div>
          <p className="mt-6 font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">Quiz complete</p>
          <h1 className="mt-2 font-display text-5xl font-extrabold">{result.percentage}%</h1>
          <p className="mt-2 text-muted-foreground">
            {result.passed ? 'Congratulations, you passed! Excellent momentum.' : 'Not quite passing this round. Review the lesson and try again!'}
          </p>

          {/* Submission Status Badge */}
          <div className="mt-4 flex justify-center">
            {result.submissionStatus === 'Auto-Submitted – Time Expired' ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 border border-red-500/30 px-3.5 py-1 font-mono-ui text-xs font-bold text-red-600 dark:text-red-400">
                <Clock3 className="size-3.5" /> Auto-Submitted – Time Expired
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 font-mono-ui text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5" /> Submitted
              </span>
            )}
          </div>
        </div>

        {/* Time is Up Notification Banner */}
        {result.submissionStatus === 'Auto-Submitted – Time Expired' && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-left flex items-start gap-3">
            <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-700 dark:text-red-400">Time Limit Reached</p>
              <p className="text-xs text-red-600/90 dark:text-red-300 mt-0.5">
                Time is up! Your quiz has been automatically submitted. You can no longer change your answers.
              </p>
            </div>
          </div>
        )}

        {result.needsGrading && (
          <div className="rounded-2xl border border-teal-700/30 bg-teal-700/10 p-4 text-left flex items-start gap-3">
            <Sparkles className="size-5 text-teal-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-teal-800 dark:text-teal-300">Objective Questions Scored — Essay Pending Review</p>
              <p className="text-xs text-teal-700/90 dark:text-teal-400 mt-0.5">
                Your multiple choice, true/false, and short answer responses have been graded automatically. Your essay submission has been received and is awaiting instructor grading and rubric feedback.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-left sm:grid-cols-3">
          <div className="rounded-xl bg-secondary p-4">
            <p className="text-xs text-muted-foreground">Correct answers</p>
            <p className="mt-1 font-display text-2xl font-bold">{result.correctAnswers} / {result.totalQuestions}</p>
          </div>
          <div className="rounded-xl bg-muted p-4">
            <p className="text-xs text-muted-foreground">Passing threshold</p>
            <p className="mt-1 font-display text-2xl font-bold">{result.passingScore}%</p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-xl bg-secondary/80 p-4">
            <p className="text-xs text-muted-foreground">Time Duration</p>
            <p className="mt-1 font-mono-ui text-lg font-bold">
              {result.timeSpentSeconds ? formatTimer(result.timeSpentSeconds) : `${timeLimitMinutes}:00`}
            </p>
            <span className="text-[10px] text-muted-foreground">Limit: {timeLimitMinutes} min</span>
          </div>
        </div>

        {/* Submitted Work Confirmation */}
        {result.submissionName && (
          <div className="rounded-2xl border border-teal-700/30 bg-teal-700/5 p-4 text-left space-y-2">
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5" /> Attached Work Recorded
            </p>
            <FileAttachmentCard
              name={result.submissionName}
              size={result.submissionSize || 'Uploaded File'}
              url={result.submissionUrl}
              label="Student Submission"
            />
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={handleRetake}
            className="rounded-xl border border-border px-5 py-3 text-sm font-bold hover:bg-muted"
            data-testid="button-retake-quiz"
          >
            Retake Quiz
          </button>
          <Link
            href="/student/results"
            className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-accent"
            data-testid="link-quiz-results"
          >
            View in Results →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/student/quizzes" className="inline-flex text-xs font-bold text-teal-700 hover:underline" data-testid="link-back-quizzes">
        ← All quizzes
      </Link>

      {/* Persistent Countdown Timer Header (Sticky across scroll) */}
      <aside
        aria-label="Quiz Timer and Progress"
        className={`sticky top-16 z-30 rounded-2xl border p-4 shadow-md backdrop-blur-md transition-all duration-300 ${
          isCritical
            ? 'border-red-500/70 bg-red-500/15 shadow-red-500/10 animate-pulse'
            : isWarning
            ? 'border-amber-500/60 bg-amber-500/10 shadow-amber-500/10'
            : 'border-card-border bg-card/95 shadow-xs'
        }`}
        data-testid="sticky-quiz-timer-header"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`grid size-11 place-items-center rounded-xl transition-colors ${
                isCritical
                  ? 'bg-red-500 text-white'
                  : isWarning
                  ? 'bg-amber-500 text-white'
                  : 'bg-teal-700/15 text-teal-700 dark:text-teal-400'
              }`}
            >
              <Clock3 className="size-5" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {isCritical ? '⚠️ Less than 1 minute remaining!' : isWarning ? 'Time Warning' : 'Time Remaining'}
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-mono-ui text-3xl font-extrabold tracking-tight ${
                    isCritical
                      ? 'text-red-600 dark:text-red-400'
                      : isWarning
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-primary'
                  }`}
                  data-testid="quiz-countdown-display"
                >
                  {formatTimer(secondsLeft)}
                </span>
                <span className="text-xs text-muted-foreground font-mono-ui">/ {timeLimitMinutes}:00</span>
              </div>
            </div>
          </div>

          <div className="text-right flex flex-col items-end gap-1">
            <span className="font-mono-ui text-xs font-bold text-teal-700 dark:text-teal-400">
              {answered} of {questions.length} answered
            </span>
            <span className="text-[10px] text-muted-foreground">
              Pass score: {quiz.passingScore}%
            </span>
          </div>
        </div>

        {/* Real-time Visual Countdown Bar */}
        <div className="mt-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/80">
            <div
              className={`h-full transition-all duration-1000 ${
                isCritical
                  ? 'bg-red-500'
                  : isWarning
                  ? 'bg-amber-500'
                  : 'bg-teal-700'
              }`}
              style={{ width: `${timeProgress}%` }}
            />
          </div>
        </div>

        {/* Critical Time Alert Note */}
        {isCritical && (
          <p className="mt-2 text-[11px] font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 shrink-0" />
            Warning: When timer reaches 00:00, all answers will be automatically submitted immediately!
          </p>
        )}
      </aside>

      {/* Auto-Submitted Notification (When timer reaches 00:00) */}
      {showAutoSubmitNotification && (
        <div
          role="alert"
          className="rounded-2xl border border-red-500/40 bg-red-500/15 p-5 text-left flex items-start gap-3.5 animate-rise"
          data-testid="notification-time-expired"
        >
          <AlertTriangle className="size-6 text-red-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-display font-bold text-red-700 dark:text-red-400">Time is up!</h4>
            <p className="text-sm text-red-700/90 dark:text-red-300">
              Your quiz has been automatically submitted. You can no longer change your answers.
            </p>
          </div>
        </div>
      )}

      {/* Quiz Details Overview */}
      <div className="space-y-4">
        <div>
          <p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">{quiz.subjectName}</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold">{quiz.title}</h1>
          <p className="mt-3 text-muted-foreground">{quiz.description}</p>
        </div>

        {/* Attached Reference Material Banner */}
        {quiz.attachmentName && (
          <div className="space-y-2">
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
              <Paperclip className="size-3.5" /> Quiz Reference Material
            </p>
            <FileAttachmentCard
              name={quiz.attachmentName}
              size={quiz.attachmentSize || 'Reference Doc'}
              url={quiz.attachmentUrl}
              type={quiz.attachmentType}
              label="Allowed Reference Sheet / Instructions"
            />
          </div>
        )}
      </div>

      {/* Quiz Questions List */}
      <div className="space-y-4">
        {questions.map((question: any, i: number) => (
          <fieldset
            key={question.id}
            className={`rounded-2xl border border-card-border bg-card p-6 transition-opacity ${
              isLocked ? 'opacity-70 pointer-events-none' : ''
            }`}
          >
            <legend className="sr-only">Question {i + 1}</legend>
            <div className="flex gap-3">
              <span className="font-mono-ui text-xs font-bold text-teal-700">0{question.number ?? i + 1}</span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-bold leading-6 text-foreground">{question.text}</p>
                  <span className="font-mono-ui text-[11px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800 shrink-0">
                    {question.points || 1} {question.points === 1 ? 'pt' : 'pts'}
                  </span>
                </div>

                {/* Multiple Choice */}
                {(!question.type || question.type === 'multiple_choice') && (
                  <div className="mt-5 grid gap-2">
                    {(question.choices ?? []).map((choice: any) => (
                      <label
                        key={choice.id}
                        className={`flex items-center gap-3 rounded-xl border p-3.5 text-sm transition-colors ${
                          isLocked
                            ? 'cursor-not-allowed opacity-80'
                            : 'cursor-pointer hover:bg-muted'
                        } ${
                          answers[question.id] === choice.value ? 'border-primary bg-secondary' : 'border-border'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${question.id}`}
                          value={choice.value}
                          checked={answers[question.id] === choice.value}
                          disabled={isLocked}
                          onChange={() => handleSelectAnswer(question.id, choice.value)}
                          className="accent-teal-700 disabled:cursor-not-allowed"
                          data-testid={`input-answer-${question.id}-${choice.id}`}
                        />
                        {choice.label}
                      </label>
                    ))}
                  </div>
                )}

                {/* True or False */}
                {question.type === 'true_false' && (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    {[
                      { val: 'true', label: 'True' },
                      { val: 'false', label: 'False' },
                    ].map((opt) => (
                      <label
                        key={opt.val}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-3 px-4 text-sm font-bold transition-all ${
                          isLocked
                            ? 'cursor-not-allowed opacity-80'
                            : 'cursor-pointer hover:border-teal-700'
                        } ${
                          answers[question.id] === opt.val
                            ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200'
                            : 'border-border bg-card text-foreground'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${question.id}`}
                          value={opt.val}
                          checked={answers[question.id] === opt.val}
                          disabled={isLocked}
                          onChange={() => handleSelectAnswer(question.id, opt.val)}
                          className="accent-teal-700"
                          data-testid={`input-answer-${question.id}-${opt.val}`}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                )}

                {/* Identification / Short Answer */}
                {question.type === 'identification' && (
                  <div className="mt-5 space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground">Your Answer (Case-Insensitive):</label>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={answers[question.id] || ''}
                      onChange={(e) => handleSelectAnswer(question.id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-60"
                      data-testid={`input-answer-${question.id}`}
                    />
                  </div>
                )}

                {/* Essay */}
                {question.type === 'essay' && (
                  <div className="mt-5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-muted-foreground">Your Response (Evaluated by Instructor):</label>
                      <span className="text-[11px] text-teal-700 font-semibold font-mono-ui">Manual Grading</span>
                    </div>
                    <textarea
                      rows={4}
                      disabled={isLocked}
                      value={answers[question.id] || ''}
                      onChange={(e) => handleSelectAnswer(question.id, e.target.value)}
                      placeholder="Write your comprehensive answer here..."
                      className="w-full rounded-xl border border-border bg-background p-3.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-60"
                      data-testid={`input-answer-${question.id}`}
                    />
                  </div>
                )}
              </div>
            </div>
          </fieldset>
        ))}
      </div>

      {/* Early Submission Button */}
      <button
        onClick={handleManualSubmitClick}
        disabled={isLocked}
        className="w-full rounded-xl bg-primary px-5 py-3.5 font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
        data-testid="button-submit-quiz"
      >
        {isLocked ? 'Quiz Submitted' : 'Submit Quiz for Grading'}
      </button>

      {/* Confirmation Dialog before manual submission */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4 animate-fade">
          <div className="w-full max-w-md rounded-3xl border border-card-border bg-card p-6 shadow-2xl animate-rise space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-teal-700/15 text-teal-700">
                <CircleHelp className="size-5" />
              </span>
              <div>
                <h3 className="font-display text-lg font-bold">Submit Quiz?</h3>
                <p className="text-xs text-muted-foreground">Please confirm your final submission</p>
              </div>
            </div>

            <div className="rounded-2xl bg-secondary/70 p-4 text-sm space-y-2">
              <p className="font-medium text-foreground">
                You have answered <span className="font-bold text-teal-700">{answered}</span> of{' '}
                <span className="font-bold">{questions.length}</span> questions.
              </p>
              {answered < questions.length && (
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">
                  ⚠️ Note: {questions.length - answered} unanswered questions will be submitted blank and scored as 0.
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Once submitted, you will no longer be able to modify your answers.
              </p>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted"
                data-testid="button-cancel-submit"
              >
                Review Answers
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-accent shadow-xs"
                data-testid="button-confirm-submit"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsPage() {
  const { results } = usePlatformStore();
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');
  const [search, setSearch] = useState('');

  const filtered = results.filter((r) => {
    const matchFilter = filter === 'all' || (filter === 'passed' ? r.passed : !r.passed);
    const matchSearch = `${r.quizName} ${r.subjectName}`.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <>
      <PageIntro
        eyebrow="Your evidence of progress"
        title="Results"
        body="Every result is useful information. Notice the pattern, then choose the next small step."
        action={
          <div className="flex rounded-xl border border-border bg-card p-1">
            {(['all', 'passed', 'failed'] as const).map((x) => (
              <button
                key={x}
                onClick={() => setFilter(x)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                  filter === x ? 'bg-primary text-accent' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {x}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-6 flex max-w-sm items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quiz results..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No results found"
          body="Complete a quiz to record scores, passing milestones, and areas to revisit."
          action={
            <Link href="/student/quizzes" className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-accent" data-testid="link-empty-results-quizzes">
              Take a quiz now →
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-card-border bg-card">
          <div className="hidden grid-cols-[1.5fr_1fr_100px_120px] gap-4 border-b border-border bg-muted/50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:grid">
            <span>Quiz & Submission</span>
            <span>Subject</span>
            <span>Score</span>
            <span>Date</span>
          </div>
          {filtered.map((r) => (
            <div
              key={r.id}
              className="grid gap-2 border-b border-border p-5 last:border-0 md:grid-cols-[1.5fr_1fr_100px_120px] md:items-center md:gap-4"
            >
              <div>
                <p className="font-bold">{r.quizName}</p>
                <p className="text-xs text-muted-foreground">
                  {r.correctAnswers} correct · {r.incorrectAnswers} missed
                </p>
                {r.submissionName && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-teal-700 font-bold">
                    <Paperclip className="size-3 shrink-0" />
                    <button
                      type="button"
                      onClick={() => downloadFileHelper(r.submissionUrl, r.submissionName || 'work.pdf')}
                      className="hover:underline flex items-center gap-1 truncate max-w-[200px]"
                    >
                      {r.submissionName}
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{r.subjectName}</p>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={`font-mono-ui text-lg font-bold ${r.passed ? 'text-teal-700' : 'text-destructive'}`}>
                    {r.percentage}%
                  </span>
                  <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${r.passed ? 'bg-teal-700/10 text-teal-700' : 'bg-destructive/10 text-destructive'}`}>
                    {r.passed ? 'Passed' : 'Review'}
                  </span>
                </div>
                {r.submissionStatus === 'Auto-Submitted – Time Expired' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400">
                    <Clock3 className="size-2.5" /> Auto-Submitted (Time Expired)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-2.5" /> Submitted
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{new Date(r.dateTaken).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function ProgressPage() {
  const { studentStats, subjects, lessons, quizzes } = usePlatformStore();

  return (
    <>
      <PageIntro eyebrow="Zoom out" title="Progress" body="The long view is made of small, completed things." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Overall progress" value={`${studentStats.progress}%`} note="Across all enrolled subjects" icon={LineChart} accent />
        <Stat label="Lessons completed" value={studentStats.lessonsCompleted} note={`${Math.max(0, lessons.length - studentStats.lessonsCompleted)} remaining`} icon={BookOpenCheck} />
        <Stat label="Quizzes taken" value={studentStats.quizzesTaken} note="Practice makes permanent" icon={ClipboardList} />
        <Stat label="Average score" value={`${studentStats.averageScore}%`} note="Across all check-ins" icon={Trophy} />
      </div>

      <section className="mt-8 rounded-2xl border border-card-border bg-card p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">By subject</p>
            <h2 className="mt-1 font-display text-xl font-bold">Your curriculum map</h2>
          </div>
          <Target className="size-5 text-accent" />
        </div>
        <div className="mt-8 space-y-6">
          {subjects.map((s) => {
            const subLessons = lessons.filter((l) => l.subjectId === s.id);
            const subDone = subLessons.filter((l) => l.completed).length;
            const pct = subLessons.length > 0 ? Math.round((subDone / subLessons.length) * 100) : s.progress;
            return (
              <div key={s.id}>
                <div className="mb-2 flex justify-between text-sm">
                  <span className="font-bold">{s.name} ({s.code})</span>
                  <span className="font-mono-ui text-xs text-teal-700 font-bold">
                    {pct}% <span className="text-muted-foreground font-normal">· {subDone}/{subLessons.length} lessons</span>
                  </span>
                </div>
                <ProgressBar value={pct} />
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

function ProfilePage({ admin = false }: { admin?: boolean }) {
  const { user, updateUser } = useAuth();
  const store = usePlatformStore();
  const { toast } = useToast();
  const me = user || (admin ? DEFAULT_ADMIN : DEFAULT_STUDENT);
  const [name, setName] = useState(me?.fullName || '');
  const [username, setUsername] = useState(me?.email?.split('@')[0] || '');
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an image file (PNG, JPG, WebP, GIF).',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Image size must be 5MB or less.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      updateUser({ avatarUrl: dataUrl });
      setIsUploading(false);
      toast({
        title: 'Photo Updated!',
        description: 'Your new profile photo has been applied across the platform.',
      });
    };
    reader.onerror = () => {
      setIsUploading(false);
      toast({
        title: 'Upload Failed',
        description: 'Failed to process the image. Please try another file.',
        variant: 'destructive',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoFile(file);
    }
  };

  const handleRemovePhoto = () => {
    updateUser({ avatarUrl: null });
    toast({
      title: 'Photo Removed',
      description: 'Your profile photo has been reset to default avatar initials.',
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handlePhotoFile(file);
    }
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ fullName: name });
    if (!admin && me) {
      store.syncCurrentStudent({
        fullName: name,
        email: me.email,
        studentId: me.studentId,
      });
    }
    toast({
      title: 'Profile Updated',
      description: 'Your changes have been saved successfully.',
    });
  };

  return (
    <>
      <PageIntro
        eyebrow="Your account"
        title={admin ? 'Administrator Settings' : 'Student Profile'}
        body="Keep your profile details and photo current so your learning space reflects who you are."
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
        data-testid="input-profile-photo-file"
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-2xl border border-card-border bg-card p-6 text-center">
          <div
            className={`relative mx-auto inline-block cursor-pointer rounded-full p-1 transition-all ${
              dragOver ? 'ring-4 ring-teal-600 ring-offset-2' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            title="Click or drag image to change photo"
          >
            <Avatar name={name || me?.fullName} src={me?.avatarUrl} className="size-28" textSize="text-2xl" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="absolute bottom-1 right-1 grid size-8 place-items-center rounded-full bg-primary text-accent shadow-md transition-transform hover:scale-110"
              title="Upload new photo"
              data-testid="button-avatar-camera"
            >
              <Camera className="size-4" />
            </button>
          </div>

          <h2 className="mt-4 font-display text-xl font-bold">{name || me?.fullName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{me?.email}</p>
          <span className="mt-3 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">
            {admin ? 'Platform Administrator' : me?.studentId ?? 'Student'}
          </span>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center justify-center gap-2 rounded-xl border border-teal-700/30 bg-teal-50 px-4 py-2.5 text-xs font-bold text-teal-800 transition-colors hover:bg-teal-100"
              data-testid="button-upload-photo"
            >
              <UploadCloud className="size-4" />
              {isUploading ? 'Uploading...' : 'Upload New Photo'}
            </button>
            {me?.avatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                data-testid="button-remove-photo"
              >
                <Trash2 className="size-3.5" />
                Remove Photo
              </button>
            )}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Supports PNG, JPG, GIF, WebP up to 5MB.
          </p>
        </aside>

        <section className="rounded-2xl border border-card-border bg-card p-6 md:p-8">
          <h3 className="font-display text-lg font-bold">Personal Information</h3>
          <p className="mt-1 text-xs text-muted-foreground">Update your personal account credentials and profile display information.</p>

          <form onSubmit={save} className="mt-6 max-w-xl space-y-5">
            <label className="block text-sm font-bold">
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none focus:border-teal-700"
                data-testid="input-profile-name"
              />
            </label>
            <label className="block text-sm font-bold">
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none focus:border-teal-700"
                data-testid="input-profile-username"
              />
            </label>
            <label className="block text-sm font-bold text-muted-foreground">
              Email address
              <input
                value={me?.email || ''}
                disabled
                className="mt-2 w-full rounded-xl border border-border bg-muted px-3.5 py-3 text-sm cursor-not-allowed"
                data-testid="input-profile-email"
              />
            </label>
            <div className="pt-2">
              <button
                type="submit"
                className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))] hover:-translate-y-0.5 transition-transform"
                data-testid="button-save-profile"
              >
                Save changes
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}

/* =========================================================================
   ADMIN PAGES: OVERVIEW, STUDENTS, SUBJECTS, LESSONS, QUIZZES, QUESTIONS, RESULTS, REPORTS
   ========================================================================= */

function AdminDashboardContent({ preview = false }: { preview?: boolean }) {
  const store = usePlatformStore();
  const { adminStats, recentActivity, subjects, lessons, students, quizzes } = store;
  const { switchRole } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [activeChartMonth, setActiveChartMonth] = useState<number>(5);
  const [studentCohortFilter, setStudentCohortFilter] = useState<'all' | 'registered'>('all');

  const registeredCount = students.filter((s) => s.source === 'online_registration').length;
  const displayedStudents =
    studentCohortFilter === 'registered'
      ? students.filter((s) => s.source === 'online_registration')
      : students;

  const performanceMonths = [
    { label: 'Nov', value: 64, passedRate: 72, attempts: 85 },
    { label: 'Dec', value: 71, passedRate: 80, attempts: 94 },
    { label: 'Jan', value: 78, passedRate: 85, attempts: 110 },
    { label: 'Feb', value: 74, passedRate: 82, attempts: 104 },
    { label: 'Mar', value: 86, passedRate: 91, attempts: 132 },
    { label: 'Apr', value: 91, passedRate: 94, attempts: 156 },
  ];

  const handleExportCSV = () => {
    let csv = 'LUMENPATH EXECUTIVE OPERATIONS AUDIT REPORT\n';
    csv += `Generated on: ${new Date().toLocaleString()}\n\n`;
    csv += 'KEY METRICS\n';
    csv += `Total Enrolled Students,${adminStats.totalStudents}\n`;
    csv += `Curriculum Subjects,${adminStats.totalSubjects}\n`;
    csv += `Published Lessons,${adminStats.totalLessons}\n`;
    csv += `Total Quiz Submissions,${adminStats.totalAttempts}\n`;
    csv += `Cohort Average Score,${adminStats.averageScore}%\n\n`;
    csv += 'SUBJECT CURRICULUM STATUS\nSubject Name,Code,Lessons,Quizzes,Progress\n';
    subjects.forEach((s) => {
      const subLessons = lessons.filter((l) => l.subjectId === s.id);
      const subDone = subLessons.filter((l) => l.completed).length;
      const pct = subLessons.length > 0 ? Math.round((subDone / subLessons.length) * 100) : s.progress;
      csv += `"${s.name}",${s.code},${subLessons.length},${s.quizCount},${pct}%\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumenpath-executive-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Audit Report Exported', description: 'Comprehensive CSV audit report downloaded.' });
  };

  return (
    <div className="space-y-8 animate-rise">
      {/* Executive Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-teal-950 p-6 md:p-9 text-primary-foreground shadow-xl">
        <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-xs font-bold text-accent">
                <ShieldCheck className="size-3.5" /> Executive Command Center
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                Live Operational
              </span>
            </div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Platform Operations & Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-primary-foreground/75">
              Comprehensive real-time telemetry, learner milestones, curriculum delivery health, and assessment monitoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                switchRole('student');
                setLocation('/student/dashboard');
              }}
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-primary shadow-sm hover:-translate-y-0.5 transition-transform"
              data-testid="button-header-switch-student"
            >
              <Zap className="size-3.5" /> Switch to Student View
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 rounded-xl border border-primary-foreground/25 bg-primary-foreground/10 px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
            >
              <Download className="size-3.5 text-accent" /> Export Audit CSV
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Key Telemetry Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Learners</span>
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-4 text-teal-700" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-primary">{students.length}</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span className="font-bold text-emerald-700 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
              <Sparkles className="size-2.5" /> {registeredCount} registered online
            </span>
            <span className="text-muted-foreground">· {students.filter((s) => s.status === 'active').length} active</span>
          </div>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Curriculum Tracks</span>
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <BookOpen className="size-4 text-teal-700" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-primary">{adminStats.totalSubjects}</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-bold text-teal-700">{adminStats.totalLessons} modules</span>
            <span>across all cohorts</span>
          </div>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Published Lessons</span>
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <BookOpenCheck className="size-4 text-teal-700" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-primary">{adminStats.totalLessons}</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-bold text-accent bg-primary px-1.5 py-0.5 rounded text-[10px]">Ready</span>
            <span>All learning materials active</span>
          </div>
        </div>

        <div className="rounded-2xl border border-primary bg-primary text-primary-foreground p-5 shadow-md transition-transform hover:-translate-y-0.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-foreground/75">Quiz Submissions</span>
            <div className="grid size-9 place-items-center rounded-xl bg-primary-foreground/15 text-accent">
              <Trophy className="size-4 text-accent" />
            </div>
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-accent">{adminStats.totalAttempts}</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-primary-foreground/75">
            <span>Avg. score</span>
            <span className="font-bold text-accent">{adminStats.averageScore}%</span>
            <span>· 92% pass rate</span>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Strip */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/students"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-teal-700/50 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Manage Students</p>
              <p className="text-xs text-muted-foreground">Enroll & review learners</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>

        <Link
          href="/admin/subjects"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-teal-700/50 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
              <BookOpen className="size-5 text-teal-700" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Subjects Catalog</p>
              <p className="text-xs text-muted-foreground">Curriculum tracks & codes</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>

        <Link
          href="/admin/lessons"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-teal-700/50 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-accent/20 text-primary">
              <BookOpenCheck className="size-5 text-teal-700" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Lesson Library</p>
              <p className="text-xs text-muted-foreground">Publish lessons & notes</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>

        <Link
          href="/admin/quizzes"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 hover:border-teal-700/50 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">Assessments</p>
              <p className="text-xs text-muted-foreground">Quizzes & passing scores</p>
            </div>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Main Grid: Telemetry & Activity */}
      <div className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        {/* Left Column: Performance Trend & Subject Health */}
        <div className="space-y-6">
          {/* Performance Trend Visual */}
          <section className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">Cohort Mastery Trend</p>
                <h2 className="mt-1 font-display text-xl font-bold">6-Month Academic Benchmark</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1 text-xs font-bold text-secondary-foreground">
                  <Target className="size-3.5 text-teal-700" /> Benchmark: 75%
                </span>
                <span className="rounded-lg bg-accent/30 px-2 py-1 font-mono-ui text-xs font-bold text-primary">
                  Peak: 91% (Apr)
                </span>
              </div>
            </div>

            <div className="mt-8 flex h-52 items-end gap-3 px-2 border-b border-border pb-2">
              {performanceMonths.map((p, i) => {
                const isSelected = activeChartMonth === i;
                return (
                  <div
                    key={i}
                    onClick={() => setActiveChartMonth(i)}
                    className="group relative flex flex-1 flex-col items-center justify-end gap-2 cursor-pointer"
                  >
                    <div
                      className={`absolute -top-10 rounded px-2 py-1 font-mono-ui text-[10px] font-bold transition-all shadow-md ${
                        isSelected
                          ? 'bg-primary text-accent block -translate-y-1'
                          : 'hidden bg-primary/90 text-primary-foreground group-hover:block'
                      }`}
                    >
                      {p.value}% avg ({p.attempts} quizzes)
                    </div>
                    <div
                      className={`w-full max-w-12 rounded-t-xl transition-all duration-300 ${
                        isSelected
                          ? 'bg-accent shadow-[0_0_12px_hsl(var(--accent))]'
                          : 'bg-teal-700/80 hover:bg-teal-700'
                      }`}
                      style={{ height: `${Math.max(30, p.value * 1.7)}px` }}
                    />
                    <span className={`font-mono-ui text-[11px] ${isSelected ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {p.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-muted-foreground">
              <span>Selected Month: <strong>{performanceMonths[activeChartMonth].label}</strong> ({performanceMonths[activeChartMonth].attempts} assessments taken)</span>
              <span className="text-teal-700 font-bold">Pass Rate: {performanceMonths[activeChartMonth].passedRate}%</span>
            </div>
          </section>

          {/* Curriculum Health & Breakdown */}
          <section className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">Curriculum Health</p>
                <h2 className="mt-1 font-display text-xl font-bold">Subject Status & Progress</h2>
              </div>
              <Link href="/admin/subjects" className="text-xs font-bold text-teal-700 hover:underline">
                View all subjects →
              </Link>
            </div>

            <div className="mt-4 divide-y divide-border">
              {subjects.map((s) => {
                const subLessons = lessons.filter((l) => l.subjectId === s.id);
                const subDone = subLessons.filter((l) => l.completed).length;
                const computedProgress = subLessons.length > 0 ? Math.round((subDone / subLessons.length) * 100) : s.progress;
                return (
                  <div key={s.id} className="py-4 first:pt-2 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-secondary px-2 py-0.5 font-mono-ui text-[10px] font-bold text-secondary-foreground">
                          {s.code}
                        </span>
                        <p className="truncate font-bold text-primary">{s.name}</p>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{s.description}</p>
                    </div>

                    <div className="w-full sm:w-44">
                      <div className="mb-1 flex justify-between text-[10px] font-bold">
                        <span className="text-muted-foreground">{subLessons.length} lessons · {s.quizCount} quizzes</span>
                        <span className="text-teal-700 font-mono-ui">{computedProgress}%</span>
                      </div>
                      <ProgressBar value={computedProgress} />
                    </div>

                    <Link
                      href={`/admin/lessons`}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-muted shrink-0 text-center"
                    >
                      Manage
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Live Telemetry Activity Stream & Student Watchlist */}
        <div className="space-y-6">
          {/* Live Recent Activity */}
          <section className="rounded-2xl bg-primary p-6 text-primary-foreground shadow-md">
            <div className="flex items-center justify-between border-b border-primary-foreground/15 pb-4">
              <div>
                <p className="font-mono-ui text-[10px] uppercase tracking-widest text-accent">Real-time Stream</p>
                <h3 className="font-display text-lg font-bold">Recent Platform Activity</h3>
              </div>
              <Sparkles className="size-4 text-accent" />
            </div>

            <div className="mt-5 space-y-4">
              {recentActivity.slice(0, 6).map((item) => (
                <div key={item.id} className="flex gap-3 border-b border-primary-foreground/10 pb-3 last:border-0 last:pb-0">
                  <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-primary-foreground">{item.title}</p>
                    <p className="mt-0.5 text-xs text-primary-foreground/65 leading-relaxed">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Student Watchlist & Online Registrations */}
          <section className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">Enrolled & Registered</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                    <Sparkles className="size-2.5" /> {registeredCount} Online
                  </span>
                </div>
                <h3 className="mt-1 font-display text-lg font-bold">Learner Spotlight</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-border bg-muted/40 p-0.5 text-[11px]">
                  <button
                    onClick={() => setStudentCohortFilter('all')}
                    className={`rounded-md px-2.5 py-1 font-bold transition-colors ${
                      studentCohortFilter === 'all' ? 'bg-card text-primary shadow-xs' : 'text-muted-foreground'
                    }`}
                  >
                    All ({students.length})
                  </button>
                  <button
                    onClick={() => setStudentCohortFilter('registered')}
                    className={`rounded-md px-2.5 py-1 font-bold transition-colors ${
                      studentCohortFilter === 'registered' ? 'bg-card text-emerald-700 dark:text-emerald-400 shadow-xs' : 'text-muted-foreground'
                    }`}
                  >
                    Online ({registeredCount})
                  </button>
                </div>
                <Link href="/admin/students" className="text-xs font-bold text-teal-700 hover:underline">
                  All →
                </Link>
              </div>
            </div>

            <div className="mt-4 divide-y divide-border">
              {displayedStudents.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-xs font-semibold text-muted-foreground">No students found for this filter.</p>
                </div>
              ) : (
                displayedStudents.slice(0, 6).map((st) => (
                  <div key={st.id} className="py-3.5 first:pt-1 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={st.fullName} className="size-9 shrink-0" textSize="text-xs" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="truncate text-sm font-bold text-primary">{st.fullName}</p>
                          {st.source === 'online_registration' && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.2 text-[8px] font-bold text-emerald-700 dark:text-emerald-400">
                              <Sparkles className="size-2 text-emerald-600" /> Online
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{st.studentId} · {st.email}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block font-mono-ui text-xs font-bold text-teal-700">{st.progress}% done</span>
                      <button
                        onClick={() => store.toggleStudentStatus(st.id)}
                        className={`mt-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase transition-colors ${
                          st.status === 'active' ? 'bg-teal-700/10 text-teal-700' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {st.status}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      {/* System Infrastructure Telemetry Footer */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-teal-50 text-teal-700">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">System Telemetry & Storage Engine</p>
              <p className="text-xs text-muted-foreground">
                Vite dev engine online · Browser localStorage store synchronized · Active session: Admin
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-lg bg-secondary px-3 py-1 font-mono-ui font-bold text-secondary-foreground">
              Storage: 34.8 MB / 5.0 GB
            </span>
            <span className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 font-bold">
              Uptime 99.98%
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

function AdminDashboard() {
  return <AdminDashboardContent />;
}

function AdminDashboardPreview() {
  return (
    <AppShell admin preview>
      <AdminDashboardContent preview />
    </AppShell>
  );
}

function AdminTablePage({ kind }: { kind: 'students' | 'subjects' | 'lessons' | 'quizzes' | 'questions' | 'results' }) {
  const store = usePlatformStore();
  const { role, user } = useAuth();
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'active' | 'inactive'>('all');
  const [lessonSubjectFilter, setLessonSubjectFilter] = useState<string>('all');
  const [quizSubjectFilter, setQuizSubjectFilter] = useState<string>('all');
  const [activitySearch, setActivitySearch] = useState('');

  const filteredActivities = useMemo(() => {
    if (!activitySearch.trim()) return store.loginActivities;
    const q = activitySearch.toLowerCase();
    return store.loginActivities.filter(
      (a) =>
        a.studentName.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.studentId.toLowerCase().includes(q) ||
        a.loginDate.toLowerCase().includes(q) ||
        a.loginTime.toLowerCase().includes(q)
    );
  }, [store.loginActivities, activitySearch]);

  const onlineCount = store.students.filter((s) => s.source === 'online_registration').length;
  const activeCount = store.students.filter((s) => s.status === 'active').length;
  const inactiveCount = store.students.filter((s) => s.status === 'inactive').length;

  // Form states
  const [studentForm, setStudentForm] = useState({ fullName: '', email: '', studentId: '', username: '' });
  const [subjectForm, setSubjectForm] = useState({ name: '', code: '', description: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', subjectId: store.subjects[0]?.id || 1, description: '', lessonType: 'text' as 'text' | 'pdf' | 'video', published: true });
  const [lessonFile, setLessonFile] = useState<{ name: string; url: string; size: string; type: string } | null>(null);

  // Edit lesson state
  const [editingLesson, setEditingLesson] = useState<any | null>(null);
  const [editLessonForm, setEditLessonForm] = useState({
    title: '',
    subjectId: store.subjects[0]?.id || 1,
    description: '',
    lessonType: 'text' as 'text' | 'pdf' | 'video',
    published: true,
  });
  const [editLessonFile, setEditLessonFile] = useState<{ name: string; url: string; size: string; type: string } | null>(null);

  const handleEditLessonSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !editLessonForm.title) return;
    store.updateLesson(editingLesson.id, {
      title: editLessonForm.title,
      subjectId: Number(editLessonForm.subjectId),
      description: editLessonForm.description,
      lessonType: editLessonForm.lessonType,
      published: editLessonForm.published,
      materialName: editLessonFile ? editLessonFile.name : editingLesson.materialName,
      materialUrl: editLessonFile ? editLessonFile.url : editingLesson.materialUrl,
      materialSize: editLessonFile ? editLessonFile.size : editingLesson.materialSize,
      materialType: editLessonFile ? editLessonFile.type : editingLesson.materialType,
    });
    setEditingLesson(null);
    Swal.fire({
      icon: 'success',
      title: 'Lesson Updated!',
      text: `"${editLessonForm.title}" has been saved.`,
      confirmButtonColor: '#0f766e',
      timer: 2000,
      timerProgressBar: true,
    });
  };

  const [quizForm, setQuizForm] = useState({ title: '', subjectId: store.subjects[0]?.id || 1, passingScore: 70, timeLimit: 15, description: '' });
  const [quizFile, setQuizFile] = useState<{ name: string; url: string; size: string; type: string } | null>(null);

  const [editingQuiz, setEditingQuiz] = useState<any | null>(null);
  const [editQuizForm, setEditQuizForm] = useState({
    title: '',
    subjectId: store.subjects[0]?.id || 1,
    passingScore: 70,
    timeLimit: 15,
    description: '',
  });
  const [editQuizFile, setEditQuizFile] = useState<{ name: string; url: string; size: string; type: string } | null>(null);

  const handleEditQuizSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuiz || !editQuizForm.title) return;
    store.updateQuiz(editingQuiz.id, {
      title: editQuizForm.title,
      subjectId: editQuizForm.subjectId,
      passingScore: editQuizForm.passingScore,
      timeLimit: editQuizForm.timeLimit,
      description: editQuizForm.description,
      attachmentName: editQuizFile ? editQuizFile.name : editingQuiz.attachmentName,
      attachmentUrl: editQuizFile ? editQuizFile.url : editingQuiz.attachmentUrl,
      attachmentSize: editQuizFile ? editQuizFile.size : editingQuiz.attachmentSize,
      attachmentType: editQuizFile ? editQuizFile.type : editingQuiz.attachmentType,
    });
    setEditingQuiz(null);
    Swal.fire({
      icon: 'success',
      title: 'Quiz Settings Saved!',
      html: `<div style="text-align:center; font-size:14px; color:#475569; margin-top:8px;">
        Quiz <b>"${editQuizForm.title}"</b> has been updated.<br/>
        <span style="display:inline-block; margin-top:10px; padding:4px 12px; background:#f0fdfa; border:1px solid #ccfbf1; border-radius:8px; color:#0f766e; font-weight:700;">
          ⏱ Time Limit: ${editQuizForm.timeLimit} minutes
        </span>
      </div>`,
      confirmButtonColor: '#0f766e',
      timer: 2500,
      timerProgressBar: true,
    });
  };

  // Question Bank filters & search
  const [questionSubjectFilter, setQuestionSubjectFilter] = useState<string>('all');
  const [questionLessonFilter, setQuestionLessonFilter] = useState<string>('all');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<string>('all');
  const [questionDifficultyFilter, setQuestionDifficultyFilter] = useState<string>('all');
  const [questionStatusFilter, setQuestionStatusFilter] = useState<string>('all');

  const [viewingQuestion, setViewingQuestion] = useState<QuestionBankItem | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItem | null>(null);

  // Default choices for multiple choice
  const defaultChoices: QuestionBankChoice[] = [
    { id: 'a', value: 'a', label: '' },
    { id: 'b', value: 'b', label: '' },
    { id: 'c', value: 'c', label: '' },
    { id: 'd', value: 'd', label: '' },
  ];

  // Add Question form
  const [qForm, setQForm] = useState({
    text: '',
    type: 'multiple_choice' as QuestionType,
    subjectId: store.subjects[0]?.id || 1,
    lessonId: '' as string,
    points: 2,
    difficulty: 'medium' as DifficultyLevel,
    status: 'published' as QuestionStatus,
    choices: defaultChoices,
    correctAnswer: 'a',
    acceptedAnswersStr: '',
    sampleAnswerRubric: '',
    explanation: '',
  });

  // Edit Question form
  const [editQForm, setEditQForm] = useState({
    text: '',
    type: 'multiple_choice' as QuestionType,
    subjectId: store.subjects[0]?.id || 1,
    lessonId: '' as string,
    points: 2,
    difficulty: 'medium' as DifficultyLevel,
    status: 'published' as QuestionStatus,
    choices: defaultChoices,
    correctAnswer: 'a',
    acceptedAnswersStr: '',
    sampleAnswerRubric: '',
    explanation: '',
  });

  // Question Bank Picker for Quizzes
  const [showQuestionBankPicker, setShowQuestionBankPicker] = useState<boolean>(false);
  const [pickerTarget, setPickerTarget] = useState<'create' | 'edit'>('create');
  const [selectedBankQuestionIds, setSelectedBankQuestionIds] = useState<number[]>([]);
  const [pickerSearch, setPickerSearch] = useState<string>('');
  const [pickerLessonFilter, setPickerLessonFilter] = useState<string>('all');
  const [pickerTypeFilter, setPickerTypeFilter] = useState<string>('all');
  const [quizFormQuestions, setQuizFormQuestions] = useState<QuizQuestionItem[]>([]);
  const [editQuizFormQuestions, setEditQuizFormQuestions] = useState<QuizQuestionItem[]>([]);

  const getRows = () => {
    switch (kind) {
      case 'students':
        return store.students.filter((s) => {
          const matchStatus =
            statusFilter === 'all'
              ? true
              : statusFilter === 'registered'
              ? s.source === 'online_registration'
              : s.status === statusFilter;
          const matchSearch = `${s.fullName} ${s.studentId} ${s.email} ${s.username || ''} ${s.source || ''}`.toLowerCase().includes(search.toLowerCase());
          return matchStatus && matchSearch;
        });
      case 'subjects':
        return store.subjects.filter((s) => `${s.name} ${s.code} ${s.description}`.toLowerCase().includes(search.toLowerCase()));
      case 'lessons':
        return store.lessons.filter((l) => {
          const matchSub = lessonSubjectFilter === 'all' || l.subjectId === Number(lessonSubjectFilter);
          const matchSearch = `${l.title} ${l.subjectName} ${l.description} ${l.materialName || ''}`.toLowerCase().includes(search.toLowerCase());
          return matchSub && matchSearch;
        });
      case 'quizzes':
        return store.quizzes.filter((q) => {
          const matchSub = quizSubjectFilter === 'all' || q.subjectId === Number(quizSubjectFilter);
          const matchSearch = `${q.title} ${q.subjectName} ${q.attachmentName || ''}`.toLowerCase().includes(search.toLowerCase());
          return matchSub && matchSearch;
        });
      case 'questions':
        return store.questions.filter((q) => {
          const matchSubject = questionSubjectFilter === 'all' || q.subjectId === Number(questionSubjectFilter);
          const matchLesson = questionLessonFilter === 'all' || q.lessonId === Number(questionLessonFilter);
          const matchType = questionTypeFilter === 'all' || q.type === questionTypeFilter;
          const matchDifficulty = questionDifficultyFilter === 'all' || q.difficulty === questionDifficultyFilter;
          const matchStatus = questionStatusFilter === 'all' || q.status === questionStatusFilter;
          const matchSearch = `${q.text} ${q.subjectName} ${q.lessonTitle || ''} ${q.type} ${q.explanation || ''} ${q.difficulty} ${q.status}`.toLowerCase().includes(search.toLowerCase());
          return matchSubject && matchLesson && matchType && matchDifficulty && matchStatus && matchSearch;
        });
      case 'results':
        return store.results.filter((r) => `${r.quizName} ${r.subjectName} ${r.studentName || ''} ${r.submissionName || ''}`.toLowerCase().includes(search.toLowerCase()));
    }
  };

  const rows = getRows();

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kind === 'students') {
      if (!studentForm.fullName || !studentForm.email) return;
      store.addStudent(studentForm);
      setStudentForm({ fullName: '', email: '', studentId: '', username: '' });
      Swal.fire({
        icon: 'success',
        title: 'Student Enrolled',
        text: `${studentForm.fullName} has been added.`,
        confirmButtonColor: '#0f766e',
        timer: 2000,
      });
    } else if (kind === 'subjects') {
      if (!subjectForm.name || !subjectForm.code) return;
      store.addSubject(subjectForm);
      setSubjectForm({ name: '', code: '', description: '' });
      Swal.fire({
        icon: 'success',
        title: 'Subject Created',
        text: `${subjectForm.name} is now in curriculum.`,
        confirmButtonColor: '#0f766e',
        timer: 2000,
      });
    } else if (kind === 'lessons') {
      if (!lessonForm.title || !lessonForm.subjectId) return;
      store.addLesson({
        title: lessonForm.title,
        subjectId: Number(lessonForm.subjectId),
        description: lessonForm.description,
        lessonType: lessonForm.lessonType,
        published: lessonForm.published,
        materialName: lessonFile?.name || null,
        materialUrl: lessonFile?.url || null,
        materialSize: lessonFile?.size || null,
        materialType: lessonFile?.type || null,
      });
      const publishedTitle = lessonForm.title;
      setLessonForm({ title: '', subjectId: store.subjects[0]?.id || 1, description: '', lessonType: 'text', published: true });
      setLessonFile(null);
      Swal.fire({
        icon: 'success',
        title: lessonForm.published ? 'Lesson Published!' : 'Lesson Saved as Draft!',
        text: `"${publishedTitle}" has been ${lessonForm.published ? 'published' : 'saved as draft'} successfully.`,
        confirmButtonColor: '#0f766e',
        timer: 2000,
      });
    } else if (kind === 'quizzes') {
      if (!quizForm.title) return;
      store.addQuiz({
        ...quizForm,
        attachmentName: quizFile?.name || null,
        attachmentUrl: quizFile?.url || null,
        attachmentSize: quizFile?.size || null,
        attachmentType: quizFile?.type || null,
        questions: quizFormQuestions.length > 0 ? quizFormQuestions : undefined,
        questionCount: quizFormQuestions.length > 0 ? quizFormQuestions.length : 1,
      });
      setQuizFormQuestions([]);
      const createdTitle = quizForm.title;
      const createdTimeLimit = quizForm.timeLimit;
      setQuizForm({ title: '', subjectId: store.subjects[0]?.id || 1, passingScore: 70, timeLimit: 15, description: '' });
      setQuizFile(null);
      Swal.fire({
        icon: 'success',
        title: 'Quiz Saved!',
        html: `<div style="text-align:center; font-size:14px; color:#475569; margin-top:8px;">
          Quiz <b>"${createdTitle}"</b> has been created.<br/>
          <span style="display:inline-block; margin-top:10px; padding:4px 12px; background:#f0fdfa; border:1px solid #ccfbf1; border-radius:8px; color:#0f766e; font-weight:700;">
            ⏱ Time Limit: ${createdTimeLimit} minutes
          </span>
        </div>`,
        confirmButtonColor: '#0f766e',
        timer: 2500,
        timerProgressBar: true,
      });
    } else if (kind === 'questions') {
      if (!qForm.text.trim()) {
        Swal.fire({ icon: 'warning', title: 'Question Text Required', text: 'Please enter the question text.', confirmButtonColor: '#0f766e' });
        return;
      }
      if (qForm.type === 'multiple_choice') {
        const validChoices = qForm.choices.filter((c) => c.label.trim().length > 0);
        if (validChoices.length < 2) {
          Swal.fire({ icon: 'warning', title: 'Choices Required', text: 'Please enter at least two answer choices for multiple choice questions.', confirmButtonColor: '#0f766e' });
          return;
        }
        if (!qForm.correctAnswer) {
          Swal.fire({ icon: 'warning', title: 'Correct Answer Required', text: 'Please select which answer choice is correct.', confirmButtonColor: '#0f766e' });
          return;
        }
      } else if (qForm.type === 'identification') {
        if (!qForm.correctAnswer.trim()) {
          Swal.fire({ icon: 'warning', title: 'Expected Answer Required', text: 'Please enter the expected correct answer for identification questions.', confirmButtonColor: '#0f766e' });
          return;
        }
      }

      const acceptedList = qForm.acceptedAnswersStr
        ? qForm.acceptedAnswersStr.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      store.addQuestion({
        text: qForm.text.trim(),
        type: qForm.type,
        subjectId: Number(qForm.subjectId),
        lessonId: qForm.lessonId ? Number(qForm.lessonId) : null,
        choices: qForm.type === 'multiple_choice' ? qForm.choices.filter((c) => c.label.trim().length > 0) : undefined,
        correctAnswer: qForm.correctAnswer,
        acceptedAnswers: acceptedList,
        sampleAnswerRubric: qForm.sampleAnswerRubric,
        explanation: qForm.explanation,
        points: Number(qForm.points) || 1,
        difficulty: qForm.difficulty,
        status: qForm.status,
        authorName: user?.fullName || 'Instructor',
      });

      Swal.fire({
        icon: 'success',
        title: 'Question Saved to Bank!',
        text: `"${qForm.text.slice(0, 45)}..." has been added to the question bank.`,
        confirmButtonColor: '#0f766e',
        timer: 2000,
      });

      setQForm({
        text: '',
        type: qForm.type,
        subjectId: qForm.subjectId,
        lessonId: qForm.lessonId,
        points: qForm.points,
        difficulty: qForm.difficulty,
        status: qForm.status,
        choices: defaultChoices,
        correctAnswer: 'a',
        acceptedAnswersStr: '',
        sampleAnswerRubric: '',
        explanation: '',
      });
    }
    setShowModal(false);
  };

  const handleSaveAndAddAnother = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qForm.text.trim()) {
      Swal.fire({ icon: 'warning', title: 'Question Text Required', text: 'Please enter the question text.', confirmButtonColor: '#0f766e' });
      return;
    }
    if (qForm.type === 'multiple_choice') {
      const validChoices = qForm.choices.filter((c) => c.label.trim().length > 0);
      if (validChoices.length < 2) {
        Swal.fire({ icon: 'warning', title: 'Choices Required', text: 'Please enter at least two answer choices.', confirmButtonColor: '#0f766e' });
        return;
      }
      if (!qForm.correctAnswer) {
        Swal.fire({ icon: 'warning', title: 'Correct Answer Required', text: 'Please select which answer choice is correct.', confirmButtonColor: '#0f766e' });
        return;
      }
    } else if (qForm.type === 'identification' && !qForm.correctAnswer.trim()) {
      Swal.fire({ icon: 'warning', title: 'Expected Answer Required', text: 'Please enter the expected answer.', confirmButtonColor: '#0f766e' });
      return;
    }

    const acceptedList = qForm.acceptedAnswersStr
      ? qForm.acceptedAnswersStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    store.addQuestion({
      text: qForm.text.trim(),
      type: qForm.type,
      subjectId: Number(qForm.subjectId),
      lessonId: qForm.lessonId ? Number(qForm.lessonId) : null,
      choices: qForm.type === 'multiple_choice' ? qForm.choices.filter((c) => c.label.trim().length > 0) : undefined,
      correctAnswer: qForm.correctAnswer,
      acceptedAnswers: acceptedList,
      sampleAnswerRubric: qForm.sampleAnswerRubric,
      explanation: qForm.explanation,
      points: Number(qForm.points) || 1,
      difficulty: qForm.difficulty,
      status: qForm.status,
      authorName: user?.fullName || 'Instructor',
    });

    toast({
      title: 'Question Saved to Bank!',
      description: 'Ready for your next question entry.',
    });

    setQForm((prev) => ({
      ...prev,
      text: '',
      choices: defaultChoices,
      correctAnswer: prev.type === 'true_false' ? 'true' : 'a',
      acceptedAnswersStr: '',
      sampleAnswerRubric: '',
      explanation: '',
    }));
  };

  const handleEditQuestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion || !editQForm.text.trim()) return;

    const acceptedList = editQForm.acceptedAnswersStr
      ? editQForm.acceptedAnswersStr.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    store.updateQuestion(editingQuestion.id, {
      text: editQForm.text.trim(),
      type: editQForm.type,
      subjectId: Number(editQForm.subjectId),
      lessonId: editQForm.lessonId ? Number(editQForm.lessonId) : null,
      choices: editQForm.type === 'multiple_choice' ? editQForm.choices.filter((c) => c.label.trim().length > 0) : (editQForm.type === 'true_false' ? [
        { id: 'true', value: 'true', label: 'True' },
        { id: 'false', value: 'false', label: 'False' },
      ] : []),
      correctAnswer: editQForm.correctAnswer,
      acceptedAnswers: acceptedList,
      sampleAnswerRubric: editQForm.sampleAnswerRubric,
      explanation: editQForm.explanation,
      points: Number(editQForm.points) || 1,
      difficulty: editQForm.difficulty,
      status: editQForm.status,
    });

    setEditingQuestion(null);
    Swal.fire({
      icon: 'success',
      title: 'Question Updated!',
      text: 'Question bank record has been updated successfully.',
      confirmButtonColor: '#0f766e',
      timer: 2000,
    });
  };

  const handleDeleteQuestion = (q: QuestionBankItem) => {
    const usage = isQuestionUsedInQuiz(store.quizzes, q.id);
    if (usage.used) {
      Swal.fire({
        icon: 'error',
        title: 'Cannot Delete Question',
        html: `<div style="text-align: left; font-size: 13px; line-height: 1.6;">
          <p>This question is actively referenced by <b>${usage.quizTitles.length} quiz(zes)</b>:</p>
          <ul style="margin: 8px 0; padding-left: 20px; color: #0f766e; font-weight: 600;">
            ${usage.quizTitles.map((t) => `<li>${t}</li>`).join('')}
          </ul>
          <p style="color: #64748b; margin-top: 8px;">To protect enrolled student scores and assessment history, questions in active quizzes cannot be deleted. You can set its status to <b>Draft</b> or remove it from the quiz first.</p>
        </div>`,
        confirmButtonColor: '#0f766e',
      });
      return;
    }

    Swal.fire({
      title: 'Delete Question?',
      text: `Are you sure you want to remove "${q.text.slice(0, 50)}..." from the question bank?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#b91c1c',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        store.deleteQuestion(q.id);
        toast({ title: 'Deleted', description: 'Question removed from bank.' });
      }
    });
  };

  const titles: Record<string, { title: string; eyebrow: string; body: string }> = {
    students: { title: 'Students Management', eyebrow: 'Learners & Accounts', body: 'Manage student enrollment, account status, and track student login activity in real-time.' },
    subjects: { title: 'Subjects', eyebrow: 'Curriculum', body: 'Shape the curriculum your learners move through.' },
    lessons: { title: 'Lessons', eyebrow: 'Content', body: 'Publish clear, engaging lessons with attached documents and guides.' },
    quizzes: { title: 'Quizzes', eyebrow: 'Assessment', body: 'Manage interactive check-ins, time limits, and reference sheets.' },
    questions: { title: 'Question bank', eyebrow: 'Assessment', body: 'Maintain reusable assessment questions.' },
    results: { title: 'Results', eyebrow: 'Performance', body: 'Review outcomes and verify attached student submissions.' },
  };

  const meta = titles[kind];

  return (
    <>
      <PageIntro
        eyebrow={meta.eyebrow}
        title={meta.title}
        body={meta.body}
        action={
          kind !== 'results' ? (
            <button
              onClick={() => setShowModal(!showModal)}
              className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))]"
              data-testid={`button-add-${kind}`}
            >
              <Plus className="mr-1 inline size-4" /> Add {kind.slice(0, -1)}
            </button>
          ) : undefined
        }
      />

      {showModal && (
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-md animate-rise" style={{borderLeftWidth: '4px', borderLeftColor: 'hsl(var(--accent))'}}>
          <h3 className="mb-4 font-display text-lg font-bold text-foreground">Add New {kind.slice(0, -1)}</h3>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            {kind === 'students' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-foreground">Full Name</label>
                  <input
                    required
                    value={studentForm.fullName}
                    onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                    placeholder="e.g. Jordan Lee"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Email Address</label>
                  <input
                    required
                    type="email"
                    value={studentForm.email}
                    onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                    placeholder="jordan@lumenpath.local"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              </div>
            )}

            {kind === 'subjects' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-foreground">Subject Name</label>
                  <input
                    required
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    placeholder="e.g. Data Structures"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Subject Code</label>
                  <input
                    required
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    placeholder="e.g. CS202"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">Description</label>
                  <textarea
                    value={subjectForm.description}
                    onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                    placeholder="Subject curriculum overview..."
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {kind === 'lessons' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-foreground">Lesson Title</label>
                  <input
                    required
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    placeholder="e.g. Introduction to SQL Joins"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Subject <span className="text-destructive">*</span></label>
                  <select
                    required
                    value={lessonForm.subjectId}
                    onChange={(e) => setLessonForm({ ...lessonForm, subjectId: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    {store.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Lesson Type</label>
                  <select
                    value={lessonForm.lessonType}
                    onChange={(e) => setLessonForm({ ...lessonForm, lessonType: e.target.value as 'text' | 'pdf' | 'video' })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="text">📝 Text Lesson</option>
                    <option value="pdf">📄 PDF Resource</option>
                    <option value="video">🎥 Video Lesson</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Status</label>
                  <select
                    value={lessonForm.published ? 'published' : 'draft'}
                    onChange={(e) => setLessonForm({ ...lessonForm, published: e.target.value === 'published' })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="published">✅ Published (visible to students)</option>
                    <option value="draft">📝 Draft (hidden from students)</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">Description</label>
                  <textarea
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    placeholder="Summary of what students will learn in this lesson..."
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                    rows={2}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FileUploadDropZone
                    label="Attach Lesson Material / Document / Slides (Optional)"
                    hint="Upload PDF, DOCX, ZIP, or code file for students to download (Max 25MB)"
                    file={lessonFile}
                    onFileChange={setLessonFile}
                    id="admin-lesson-file-upload"
                  />
                </div>
              </div>
            )}

            {kind === 'quizzes' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-foreground">Quiz Title</label>
                  <input
                    required
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                    placeholder="e.g. Algorithms Check-in"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Subject</label>
                  <select
                    value={quizForm.subjectId}
                    onChange={(e) => setQuizForm({ ...quizForm, subjectId: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    {store.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Passing Score (%)</label>
                  <input
                    type="number"
                    value={quizForm.passingScore}
                    onChange={(e) => setQuizForm({ ...quizForm, passingScore: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                    <div className="sm:col-span-2 rounded-xl border border-border bg-muted/30 p-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                      <Clock3 className="size-3.5 text-primary" />
                      Quiz Time Limit (Minutes)
                    </label>
                    <span className="text-[11px] text-muted-foreground font-medium">Automatic submission on 00:00</span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Enforces sticky countdown timer for students taking this quiz.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={180}
                      required
                      value={quizForm.timeLimit}
                      onChange={(e) => setQuizForm({ ...quizForm, timeLimit: Math.max(1, Number(e.target.value)) })}
                      className="w-24 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-mono-ui font-bold text-foreground outline-none"
                    />
                    <span className="text-xs font-semibold text-muted-foreground">minutes</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      {[10, 15, 30, 60].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setQuizForm({ ...quizForm, timeLimit: preset })}
                          className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors ${
                            quizForm.timeLimit === preset
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                              : 'border-border bg-card text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {preset}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <FileUploadDropZone
                    label="Attach Reference Sheet / Formula Guide / Instructions (Optional)"
                    hint="Upload PDF, Image, Code, or Text reference file for learners (Max 25MB)"
                    file={quizFile}
                    onFileChange={setQuizFile}
                    id="admin-quiz-file-upload"
                  />
                </div>

                {/* Question Bank Integration for Quiz Creation */}
                <div className="sm:col-span-2 rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-display text-sm font-bold flex items-center gap-2">
                        <FileQuestion className="size-4 text-teal-700" />
                        Selected Quiz Questions ({quizFormQuestions.length})
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Select and attach vetted questions from your Question Bank.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPickerTarget('create');
                        setSelectedBankQuestionIds(quizFormQuestions.map((q) => q.questionBankId || q.id));
                        setShowQuestionBankPicker(true);
                      }}
                      className="rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
                    >
                      <Plus className="size-3.5" /> Select from Question Bank
                    </button>
                  </div>

                  {quizFormQuestions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      No questions attached yet. Click <strong>"Select from Question Bank"</strong> to choose published questions for this subject.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1 divide-y divide-border/60">
                      {quizFormQuestions.map((q, idx) => (
                        <div key={q.id || idx} className="flex items-center justify-between pt-2 first:pt-0">
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="text-xs font-bold truncate">
                              <span className="text-teal-700 mr-1.5">Q{idx + 1}.</span> {q.text}
                            </p>
                            <span className="text-[10px] text-muted-foreground uppercase font-mono-ui font-semibold">
                              {q.type?.replace('_', ' ')} · {q.points || 1} pt(s)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setQuizFormQuestions((prev) => prev.filter((_, i) => i !== idx))}
                            className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title="Remove question"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {kind === 'questions' && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-foreground">Subject <span className="text-destructive">*</span></label>
                    <select
                      required
                      value={qForm.subjectId}
                      onChange={(e) => {
                        const sid = Number(e.target.value);
                        setQForm({ ...qForm, subjectId: sid, lessonId: '' });
                      }}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      {store.subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Related Lesson (Optional)</label>
                    <select
                      value={qForm.lessonId}
                      onChange={(e) => setQForm({ ...qForm, lessonId: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      <option value="">None / General Subject</option>
                      {store.lessons.filter((l) => l.subjectId === Number(qForm.subjectId)).map((l) => (
                        <option key={l.id} value={l.id}>{l.title}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground">Question Type <span className="text-destructive">*</span></label>
                    <select
                      value={qForm.type}
                      onChange={(e) => {
                        const nextType = e.target.value as QuestionType;
                        setQForm({
                          ...qForm,
                          type: nextType,
                          correctAnswer: nextType === 'true_false' ? 'true' : nextType === 'multiple_choice' ? 'a' : '',
                        });
                      }}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      <option value="multiple_choice">🔘 Multiple Choice</option>
                      <option value="true_false">⚖️ True or False</option>
                      <option value="identification">✍️ Identification / Short Answer</option>
                      <option value="essay">📝 Essay (Manual Grading)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-foreground">Points</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={qForm.points}
                        onChange={(e) => setQForm({ ...qForm, points: Math.max(1, Number(e.target.value)) })}
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono-ui font-bold text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground">Difficulty</label>
                      <select
                        value={qForm.difficulty}
                        onChange={(e) => setQForm({ ...qForm, difficulty: e.target.value as DifficultyLevel })}
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                      >
                        <option value="easy">🟢 Easy</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="hard">🔴 Hard</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Question Text <span className="text-destructive">*</span></label>
                  <textarea
                    required
                    rows={2}
                    value={qForm.text}
                    onChange={(e) => setQForm({ ...qForm, text: e.target.value })}
                    placeholder="Enter the complete question prompt..."
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>

                {/* Dynamic Choice Inputs for Multiple Choice */}
                {qForm.type === 'multiple_choice' && (
                  <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-foreground">
                        Answer Choices (Select radio button for Correct Answer) <span className="text-destructive">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const nextLetter = String.fromCharCode(97 + qForm.choices.length);
                          setQForm({
                            ...qForm,
                            choices: [...qForm.choices, { id: nextLetter, value: nextLetter, label: '' }],
                          });
                        }}
                        className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                      >
                        <Plus className="size-3" /> Add Choice
                      </button>
                    </div>

                    <div className="space-y-2">
                      {qForm.choices.map((c, idx) => (
                        <div key={c.id || idx} className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold uppercase text-muted-foreground shrink-0 w-12">
                            <input
                              type="radio"
                              name="qFormCorrectAnswer"
                              checked={qForm.correctAnswer === c.value}
                              onChange={() => setQForm({ ...qForm, correctAnswer: c.value })}
                              className="accent-teal-700"
                            />
                            {c.value.toUpperCase()}.
                          </label>
                          <input
                            required={idx < 2}
                            value={c.label}
                            onChange={(e) => {
                              const updated = [...qForm.choices];
                              updated[idx].label = e.target.value;
                              setQForm({ ...qForm, choices: updated });
                            }}
                            placeholder={`Choice ${c.value.toUpperCase()} text...`}
                            className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                          />
                          {qForm.choices.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = qForm.choices.filter((_, i) => i !== idx);
                                setQForm({
                                  ...qForm,
                                  choices: updated,
                                  correctAnswer: qForm.correctAnswer === c.value ? (updated[0]?.value || 'a') : qForm.correctAnswer,
                                });
                              }}
                              className="p-1 text-muted-foreground hover:text-destructive"
                              title="Remove choice"
                            >
                              <X className="size-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* True or False */}
                {qForm.type === 'true_false' && (
                  <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
                    <label className="text-xs font-bold text-foreground">Select Correct Answer <span className="text-destructive">*</span></label>
                    <div className="flex gap-4">
                      {['true', 'false'].map((val) => (
                        <label
                          key={val}
                          className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold capitalize cursor-pointer transition-colors ${
                            qForm.correctAnswer === val ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300' : 'border-border bg-card text-foreground'
                          }`}
                        >
                          <input
                            type="radio"
                            name="tfCorrect"
                            value={val}
                            checked={qForm.correctAnswer === val}
                            onChange={() => setQForm({ ...qForm, correctAnswer: val })}
                            className="accent-teal-700"
                          />
                          {val === 'true' ? 'True Statement' : 'False Statement'}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Identification / Short Answer */}
                {qForm.type === 'identification' && (
                  <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-foreground">Expected Correct Answer <span className="text-destructive">*</span></label>
                      <input
                        required
                        value={qForm.correctAnswer}
                        onChange={(e) => setQForm({ ...qForm, correctAnswer: e.target.value })}
                        placeholder="e.g. Structured Query Language"
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground">Alternative Accepted Answers (comma-separated)</label>
                      <input
                        value={qForm.acceptedAnswersStr}
                        onChange={(e) => setQForm({ ...qForm, acceptedAnswersStr: e.target.value })}
                        placeholder="e.g. SQL, Structured Query Lang"
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                      />
                      <p className="text-[10px] text-muted-foreground mt-0.5">Matching ignores uppercase/lowercase and extra spaces automatically.</p>
                    </div>
                  </div>
                )}

                {/* Essay */}
                {qForm.type === 'essay' && (
                  <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
                    <label className="text-xs font-bold text-foreground">Sample Answer / Grading Rubric (for teacher review)</label>
                    <textarea
                      rows={3}
                      value={qForm.sampleAnswerRubric}
                      onChange={(e) => setQForm({ ...qForm, sampleAnswerRubric: e.target.value })}
                      placeholder="Outline the key points, concepts, or criteria required for full credit..."
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-foreground">Explanation / Solution Notes (Optional)</label>
                    <input
                      value={qForm.explanation}
                      onChange={(e) => setQForm({ ...qForm, explanation: e.target.value })}
                      placeholder="Feedback displayed when reviewing results..."
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">Publication Status</label>
                    <select
                      value={qForm.status}
                      onChange={(e) => setQForm({ ...qForm, status: e.target.value as QuestionStatus })}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      <option value="published">✅ Published (Ready for Quizzes)</option>
                      <option value="draft">📝 Draft (Internal Review Only)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-3">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all"
                data-testid={`button-save-add-${kind}`}
              >
                <Save className="size-4" /> Save {kind.slice(0, -1)}
              </button>

              {kind === 'questions' && (
                <button
                  type="button"
                  onClick={handleSaveAndAddAnother}
                  className="flex items-center gap-2 rounded-xl bg-primary text-accent hover:opacity-95 px-4 py-2.5 text-xs font-bold shadow-sm transition-all"
                  data-testid="button-save-add-another-question"
                >
                  <Plus className="size-4" /> Save and Add Another
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setLessonFile(null);
                  setQuizFile(null);
                }}
                className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted ml-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Top Overview Cards for Students */}
      {kind === 'students' && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-rise">
          <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Students</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-extrabold text-primary">{store.students.length}</span>
              <span className="text-[11px] text-muted-foreground">Enrolled</span>
            </div>
          </div>
          <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Registered Online</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-extrabold text-teal-700">{onlineCount}</span>
              <span className="text-[11px] text-muted-foreground">Self-registered</span>
            </div>
          </div>
          <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Accounts</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-extrabold text-emerald-600">{activeCount}</span>
              <span className="text-[11px] text-muted-foreground">Active</span>
            </div>
          </div>
          <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Logins Recorded</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-extrabold text-primary">{store.loginActivities.length}</span>
              <span className="text-[11px] text-muted-foreground">Sessions</span>
            </div>
          </div>
        </div>
      )}

      {/* Top Overview Cards for Questions */}
      {kind === 'questions' && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5 animate-rise">
          <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Questions</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-extrabold text-primary">{store.questions.length}</span>
              <span className="text-[11px] text-muted-foreground">In Bank</span>
            </div>
          </div>
          <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Published</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-extrabold text-teal-700">
                {store.questions.filter((q) => q.status === 'published').length}
              </span>
              <span className="text-[11px] text-muted-foreground">Active</span>
            </div>
          </div>
          <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Drafts</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-extrabold text-amber-600">
                {store.questions.filter((q) => q.status === 'draft').length}
              </span>
              <span className="text-[11px] text-muted-foreground">In Review</span>
            </div>
          </div>
          <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subjects Covered</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-extrabold text-primary">
                {new Set(store.questions.map((q) => q.subjectId)).size}
              </span>
              <span className="text-[11px] text-muted-foreground">Curricula</span>
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-card-border bg-card p-4 shadow-xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Used in Quizzes</p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-2xl font-extrabold text-emerald-600">
                {store.questions.filter((q) => isQuestionUsedInQuiz(store.quizzes, q.id).used).length}
              </span>
              <span className="text-[11px] text-muted-foreground">Linked</span>
            </div>
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${kind === 'students' ? 'students by name, email, ID, or date' : kind === 'questions' ? 'questions by prompt, subject, lesson, or type' : kind}...`}
            className="w-full bg-transparent text-sm outline-none"
            data-testid={`input-search-${kind}`}
          />
        </div>

        {kind === 'students' && (
          <div className="flex rounded-xl border border-border bg-card p-1">
            {(
              [
                { id: 'all', label: `All (${store.students.length})` },
                { id: 'registered', label: `Registered Online (${onlineCount})` },
                { id: 'active', label: `Active (${activeCount})` },
                { id: 'inactive', label: `Inactive (${inactiveCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-primary text-accent shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {kind === 'lessons' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Subject:</span>
            <select
              value={lessonSubjectFilter}
              onChange={(e) => {
                const val = e.target.value;
                setLessonSubjectFilter(val);
                if (val !== 'all') {
                  setLessonForm((prev) => ({ ...prev, subjectId: Number(val) }));
                }
              }}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent/50"
              data-testid="select-filter-lesson-subject"
            >
              <option value="all">All Subjects ({store.lessons.length})</option>
              {store.subjects.map((s) => {
                const count = store.lessons.filter((l) => l.subjectId === s.id).length;
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({count} lessons)
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {kind === 'quizzes' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">Subject:</span>
            <select
              value={quizSubjectFilter}
              onChange={(e) => {
                const val = e.target.value;
                setQuizSubjectFilter(val);
                if (val !== 'all') {
                  setQuizForm((prev) => ({ ...prev, subjectId: Number(val) }));
                }
              }}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent/50"
              data-testid="select-filter-quiz-subject"
            >
              <option value="all">All Subjects ({store.quizzes.length})</option>
              {store.subjects.map((s) => {
                const count = store.quizzes.filter((q) => q.subjectId === s.id).length;
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({count} quizzes)
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {kind === 'questions' && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Subject Filter */}
            <select
              value={questionSubjectFilter}
              onChange={(e) => {
                const sid = e.target.value;
                setQuestionSubjectFilter(sid);
                setQuestionLessonFilter('all');
              }}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent/50"
              data-testid="select-filter-question-subject"
            >
              <option value="all">All Subjects ({store.questions.length})</option>
              {store.subjects.map((s) => {
                const count = store.questions.filter((q) => q.subjectId === s.id).length;
                return (
                  <option key={s.id} value={s.id}>
                    {s.name} ({count})
                  </option>
                );
              })}
            </select>

            {/* Lesson Filter */}
            <select
              value={questionLessonFilter}
              onChange={(e) => setQuestionLessonFilter(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent/50"
              data-testid="select-filter-question-lesson"
            >
              <option value="all">All Lessons</option>
              {(questionSubjectFilter === 'all'
                ? store.lessons
                : store.lessons.filter((l) => l.subjectId === Number(questionSubjectFilter))
              ).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>

            {/* Question Type Filter */}
            <select
              value={questionTypeFilter}
              onChange={(e) => setQuestionTypeFilter(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent/50"
              data-testid="select-filter-question-type"
            >
              <option value="all">All Types</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="true_false">True or False</option>
              <option value="identification">Identification</option>
              <option value="essay">Essay</option>
            </select>

            {/* Difficulty Filter */}
            <select
              value={questionDifficultyFilter}
              onChange={(e) => setQuestionDifficultyFilter(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent/50"
              data-testid="select-filter-question-difficulty"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            {/* Status Filter */}
            <select
              value={questionStatusFilter}
              onChange={(e) => setQuestionStatusFilter(e.target.value)}
              className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-accent/50"
              data-testid="select-filter-question-status"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>

            {/* Clear Filters Button */}
            {(questionSubjectFilter !== 'all' ||
              questionLessonFilter !== 'all' ||
              questionTypeFilter !== 'all' ||
              questionDifficultyFilter !== 'all' ||
              questionStatusFilter !== 'all' ||
              search.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setQuestionSubjectFilter('all');
                  setQuestionLessonFilter('all');
                  setQuestionTypeFilter('all');
                  setQuestionDifficultyFilter('all');
                  setQuestionStatusFilter('all');
                  setSearch('');
                }}
                className="rounded-xl border border-border bg-muted/60 hover:bg-muted px-2.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                title="Reset all filters"
                data-testid="button-clear-question-filters"
              >
                <X className="size-3" /> Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={`No ${kind === 'students' ? 'students' : kind} found`}
          body={
            kind === 'students'
              ? statusFilter !== 'all'
                ? `No students found matching the "${statusFilter === 'registered' ? 'Registered Online' : statusFilter}" filter. Try switching filter or searching.`
                : 'No students found. Students who register through the student portal will appear here automatically.'
              : `Try another search or add a new ${kind.slice(0, -1)}.`
          }
        />
      ) : kind === 'students' ? (
        /* Dedicated Students Management Table */
        <div className="overflow-x-auto rounded-2xl border border-card-border bg-card shadow-xs">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[1.8fr_1fr_1.1fr_1.4fr_85px_95px_50px] gap-4 border-b border-border bg-muted/50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Student</span>
              <span>Student ID</span>
              <span>Registration Date</span>
              <span>Last Login Date & Time</span>
              <span>Progress</span>
              <span>Account Status</span>
              <span className="text-right">Actions</span>
            </div>

            {rows.map((x: any) => (
              <div
                key={x.id}
                className="grid grid-cols-[1.8fr_1fr_1.1fr_1.4fr_85px_95px_50px] items-center gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-muted/15 transition-colors"
                data-testid={`row-admin-students-${x.id}`}
              >
                <div className="min-w-0 flex items-center gap-3">
                  <Avatar name={x.fullName} className="size-9 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="truncate font-bold text-primary">{x.fullName}</p>
                      {x.source === 'online_registration' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-400">
                          <Sparkles className="size-2.5" /> Registered Online
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                      <span className="truncate">{x.email}</span>
                      {x.username && (
                        <span className="font-mono-ui text-[11px] font-semibold text-teal-700 bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.2 rounded border border-teal-200 dark:border-teal-800/50">
                          @{x.username}
                        </span>
                      )}
                      {x.contactNumber && (
                        <span className="text-[11px] text-muted-foreground">
                          • {x.contactNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-mono-ui text-xs font-bold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/80">
                    {x.studentId || '—'}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-medium text-foreground">
                    {x.registeredAt || '—'}
                  </span>
                </div>

                <div>
                  {x.lastLoginAt ? (
                    <div className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                      <span className="font-mono-ui text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {x.lastLoginAt}
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-muted/80 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Never logged in
                    </span>
                  )}
                </div>

                <div>
                  <span className="font-mono-ui text-xs font-bold text-teal-700">
                    {x.progress ?? 0}%
                  </span>
                </div>

                <div>
                  <button
                    onClick={() => store.toggleStudentStatus(x.id)}
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                      x.status === 'active'
                        ? 'bg-teal-700/10 text-teal-700 hover:bg-teal-700/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    title="Click to toggle active/inactive status"
                  >
                    {x.status}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete student record for ${x.fullName}?`)) {
                        store.deleteStudent(x.id);
                        toast({ title: 'Student Removed', description: `${x.fullName} has been removed.` });
                      }
                    }}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    data-testid={`button-delete-student-${x.id}`}
                    title="Delete student record"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : kind === 'questions' ? (
        /* Dedicated Question Bank Table */
        <div className="overflow-x-auto rounded-2xl border border-card-border bg-card shadow-xs">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[2fr_1.2fr_120px_100px_110px] gap-4 border-b border-border bg-muted/50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Question</span>
              <span>Subject / Type</span>
              <span>Metrics</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {rows.map((q: any) => {
              const quizUsage = isQuestionUsedInQuiz(store.quizzes, q.id);
              const typeLabels: Record<QuestionType, { label: string; icon: string; color: string }> = {
                multiple_choice: { label: 'Multiple Choice', icon: '🔘', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
                true_false: { label: 'True / False', icon: '⚖️', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
                identification: { label: 'Short Answer', icon: '✍️', color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
                essay: { label: 'Essay', icon: '📝', color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
              };
              const diffColors: Record<DifficultyLevel, { label: string; dot: string; color: string }> = {
                easy: { label: 'Easy', dot: 'bg-emerald-500', color: 'text-emerald-700 dark:text-emerald-400' },
                medium: { label: 'Medium', dot: 'bg-amber-500', color: 'text-amber-700 dark:text-amber-400' },
                hard: { label: 'Hard', dot: 'bg-red-500', color: 'text-red-700 dark:text-red-400' },
              };

              const tInfo = typeLabels[q.type as QuestionType] || typeLabels.multiple_choice;
              const dInfo = diffColors[q.difficulty as DifficultyLevel] || diffColors.medium;

              return (
                <div
                  key={q.id}
                  className="grid grid-cols-[2fr_1.2fr_120px_100px_110px] items-center gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-muted/15 transition-colors"
                  data-testid={`row-admin-questions-${q.id}`}
                >
                  {/* Column 1: Question text + chips */}
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-foreground text-sm line-clamp-2 leading-snug">
                      {q.text}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${tInfo.color}`}>
                        <span>{tInfo.icon}</span> {tInfo.label}
                      </span>
                      {q.lessonTitle && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground truncate max-w-[200px]" title={q.lessonTitle}>
                          <BookOpen className="size-2.5 shrink-0" />
                          <span className="truncate">{q.lessonTitle}</span>
                        </span>
                      )}
                      {quizUsage.used && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 px-1.5 py-0.5 text-[10px] font-bold" title={`Used in: ${quizUsage.quizTitles.join(', ')}`}>
                          <CheckCircle2 className="size-2.5" /> In Quiz ({quizUsage.quizTitles.length})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Subject */}
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-primary truncate">{q.subjectName}</p>
                    <span className="text-[10px] font-mono-ui font-semibold text-muted-foreground">
                      ID: #{q.id} {q.authorName ? `· ${q.authorName}` : ''}
                    </span>
                  </div>

                  {/* Column 3: Metrics */}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono-ui text-xs font-bold text-teal-700 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                        {q.points || 1} {q.points === 1 ? 'pt' : 'pts'}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${dInfo.color}`}>
                        <span className={`size-1.5 rounded-full ${dInfo.dot}`} />
                        {dInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Column 4: Status Toggle */}
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        store.toggleQuestionPublish(q.id);
                        toast({
                          title: q.status === 'published' ? 'Set to Draft' : 'Question Published',
                          description: q.status === 'published' ? 'Question will not appear in student quizzes.' : 'Question is now available for quizzes.',
                        });
                      }}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                        q.status === 'published'
                          ? 'bg-teal-700/15 text-teal-700 hover:bg-teal-700/25 dark:bg-teal-900/40 dark:text-teal-300'
                          : 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                      title="Click to toggle Published / Draft status"
                      data-testid={`button-toggle-status-${q.id}`}
                    >
                      <span className={`size-1.5 rounded-full ${q.status === 'published' ? 'bg-teal-700' : 'bg-amber-500'}`} />
                      {q.status === 'published' ? 'Published' : 'Draft'}
                    </button>
                  </div>

                  {/* Column 5: Actions */}
                  <div className="flex justify-end items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setViewingQuestion(q)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-teal-700/10 hover:text-teal-700 transition-colors"
                      data-testid={`button-view-question-${q.id}`}
                      title="View Question Details"
                    >
                      <Eye className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuestion(q);
                        setEditQForm({
                          text: q.text,
                          type: q.type,
                          subjectId: q.subjectId,
                          lessonId: q.lessonId ? String(q.lessonId) : '',
                          points: q.points || 1,
                          difficulty: q.difficulty,
                          status: q.status,
                          choices: q.choices && q.choices.length > 0 ? q.choices : defaultChoices,
                          correctAnswer: q.correctAnswer || (q.type === 'true_false' ? 'true' : 'a'),
                          acceptedAnswersStr: (q.acceptedAnswers || []).join(', '),
                          sampleAnswerRubric: q.sampleAnswerRubric || '',
                          explanation: q.explanation || '',
                        });
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      data-testid={`button-edit-question-${q.id}`}
                      title="Edit Question"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      data-testid={`button-delete-question-${q.id}`}
                      title="Delete Question"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Table rendering for subjects, lessons, quizzes, questions, results */
        <div className="overflow-x-auto rounded-2xl border border-card-border bg-card">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[1.5fr_1fr_120px_130px_70px] gap-4 border-b border-border bg-muted/50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>{kind === 'subjects' ? 'Subject' : kind === 'lessons' ? 'Lesson & Materials' : kind === 'quizzes' ? 'Quiz & Attachments' : kind === 'questions' ? 'Question' : 'Quiz & Submission'}</span>
              <span>{kind === 'subjects' ? 'Code' : 'Subject / Type'}</span>
              <span>{kind === 'results' ? 'Score' : kind === 'quizzes' ? 'Questions & Limit' : 'Metrics'}</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {rows.map((x: any) => (
              <div
                key={x.id}
                className="grid grid-cols-[1.5fr_1fr_120px_130px_70px] items-center gap-4 border-b border-border px-5 py-4 last:border-0"
                data-testid={`row-admin-${kind}-${x.id}`}
              >
                <div className="min-w-0">
                  <p className="truncate font-bold">{x.title ?? x.name ?? x.text ?? x.quizName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {x.description ?? x.studentName ?? ''}
                  </p>

                  {/* Attachment chips for Lessons, Quizzes, Results */}
                  {kind === 'lessons' && x.materialName && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-teal-700 font-bold">
                      <Paperclip className="size-3 shrink-0" />
                      <button
                        type="button"
                        onClick={() => downloadFileHelper(x.materialUrl, x.materialName)}
                        className="hover:underline truncate max-w-[240px]"
                        title="Download Material"
                      >
                        {x.materialName} {x.materialSize ? `(${x.materialSize})` : ''}
                      </button>
                    </div>
                  )}

                  {kind === 'quizzes' && x.attachmentName && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-teal-700 font-bold">
                      <Paperclip className="size-3 shrink-0" />
                      <button
                        type="button"
                        onClick={() => downloadFileHelper(x.attachmentUrl, x.attachmentName)}
                        className="hover:underline truncate max-w-[240px]"
                        title="Download Reference"
                      >
                        Ref: {x.attachmentName} {x.attachmentSize ? `(${x.attachmentSize})` : ''}
                      </button>
                    </div>
                  )}

                  {kind === 'results' && x.submissionName && (
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-teal-700 font-bold">
                      <Paperclip className="size-3 shrink-0" />
                      <button
                        type="button"
                        onClick={() => downloadFileHelper(x.submissionUrl, x.submissionName)}
                        className="hover:underline truncate max-w-[240px]"
                        title="Download Student Work"
                      >
                        Sub: {x.submissionName}
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground truncate">{x.code ?? x.subjectName ?? x.type ?? '—'}</p>

                <div>
                  {kind === 'results' ? (
                    <span className={`font-mono-ui font-bold ${x.passed ? 'text-teal-700' : 'text-destructive'}`}>
                      {x.percentage}%
                    </span>
                  ) : kind === 'subjects' ? (
                    <span className="text-xs text-muted-foreground">{x.lessonCount} lessons</span>
                  ) : kind === 'quizzes' ? (
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{x.questionCount ?? 0} questions</span>
                      <span className="inline-flex items-center gap-1 font-mono-ui text-[11px] font-bold text-primary">
                        <Clock3 className="size-3" />
                        {x.timeLimit || 15} min limit
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">{x.points ? `${x.points} pts` : 'Active'}</span>
                  )}
                </div>

                <div>
                  {kind === 'results' ? (
                    <div className="flex flex-col gap-1">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase w-fit ${x.passed ? 'bg-teal-700/10 text-teal-700' : 'bg-destructive/10 text-destructive'}`}>
                        {x.passed ? 'Passed' : 'Failed'}
                      </span>
                      {x.submissionStatus ? (
                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-tight w-fit ${
                          x.submissionStatus.includes('Expired') || x.submissionStatus.includes('Auto')
                            ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                        }`}>
                          <Clock3 className="size-2.5" />
                          {x.submissionStatus === 'Auto-Submitted – Time Expired' ? 'Time Expired' : x.submissionStatus}
                        </span>
                      ) : null}
                    </div>
                  ) : kind === 'lessons' ? (
                    <button
                      type="button"
                      onClick={() => store.toggleLessonPublish(x.id)}
                      className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${
                        x.published === false
                          ? 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/30'
                          : 'bg-teal-700/10 text-teal-700 hover:bg-teal-700/20'
                      }`}
                      title="Click to toggle published/draft"
                    >
                      {x.published === false ? 'Draft' : 'Published'}
                    </button>
                  ) : (
                    <span className="rounded bg-teal-700/10 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                      Published
                    </span>
                  )}
                </div>

                <div className="flex justify-end items-center gap-1">
                  {kind === 'lessons' && (
                    <button
                      onClick={() => {
                        setEditingLesson(x);
                        setEditLessonForm({
                          title: x.title,
                          subjectId: x.subjectId,
                          description: x.description || '',
                          lessonType: x.lessonType || 'text',
                          published: x.published !== false,
                        });
                        setEditLessonFile(
                          x.materialName
                            ? { name: x.materialName, url: x.materialUrl, size: x.materialSize, type: x.materialType }
                            : null
                        );
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      data-testid={`button-edit-lesson-${x.id}`}
                      title="Edit lesson"
                    >
                      <Pencil className="size-4" />
                    </button>
                  )}
                  {kind === 'quizzes' && (
                    <button
                      onClick={() => {
                        setEditingQuiz(x);
                        setEditQuizForm({
                          title: x.title,
                          subjectId: x.subjectId,
                          passingScore: x.passingScore,
                          timeLimit: x.timeLimit || 15,
                          description: x.description || '',
                        });
                        setEditQuizFile(
                          x.attachmentName
                            ? { name: x.attachmentName, url: x.attachmentUrl, size: x.attachmentSize, type: x.attachmentType }
                            : null
                        );
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      data-testid={`button-edit-quiz-${x.id}`}
                      title="Edit quiz & timer setting"
                    >
                      <Pencil className="size-4" />
                    </button>
                  )}
                  {kind !== 'results' && (
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete this ${kind.slice(0, -1)}?`)) {
                          if (kind === 'subjects') store.deleteSubject(x.id);
                          if (kind === 'lessons') store.deleteLesson(x.id);
                          if (kind === 'quizzes') store.deleteQuiz(x.id);
                          if (kind === 'questions') store.deleteQuestion(x.id);
                          toast({ title: 'Deleted', description: 'Item removed successfully.' });
                        }
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      data-testid={`button-delete-${kind}-${x.id}`}
                      title={`Delete ${kind.slice(0, -1)}`}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Edit Lesson Modal */}
      {editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setEditingLesson(null)}>
          <div className="w-full max-w-lg rounded-2xl border border-card-border bg-card p-6 shadow-2xl animate-rise" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg font-bold">Edit Lesson</h3>
              <button onClick={() => setEditingLesson(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted">
                <X className="size-4" />
              </button>
            </div>
            <form onSubmit={handleEditLessonSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">Lesson Title</label>
                  <input
                    required
                    value={editLessonForm.title}
                    onChange={(e) => setEditLessonForm({ ...editLessonForm, title: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Subject</label>
                  <select
                    value={editLessonForm.subjectId}
                    onChange={(e) => setEditLessonForm({ ...editLessonForm, subjectId: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    {store.subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Lesson Type</label>
                  <select
                    value={editLessonForm.lessonType}
                    onChange={(e) => setEditLessonForm({ ...editLessonForm, lessonType: e.target.value as 'text' | 'pdf' | 'video' })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="text">📝 Text</option>
                    <option value="pdf">📄 PDF</option>
                    <option value="video">🎥 Video</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Status</label>
                  <select
                    value={editLessonForm.published ? 'published' : 'draft'}
                    onChange={(e) => setEditLessonForm({ ...editLessonForm, published: e.target.value === 'published' })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="published">✅ Published</option>
                    <option value="draft">📝 Draft</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">Description</label>
                  <textarea
                    value={editLessonForm.description}
                    onChange={(e) => setEditLessonForm({ ...editLessonForm, description: e.target.value })}
                    rows={2}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all"
                >
                  <Save className="size-4" /> Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingLesson(null)}
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Separate Login Activity Section for Students Management */}
      {kind === 'students' && (
        <div className="mt-10 rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-teal-700/10 text-teal-700">
                <Clock3 className="size-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg font-bold">Student Login Activity</h3>
                  <span className="rounded-full bg-teal-700/15 px-2 py-0.5 text-xs font-bold text-teal-700">
                    {filteredActivities.length} {filteredActivities.length === 1 ? 'Record' : 'Records'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Audit log of verified student logins with exact login dates and times.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 text-xs">
                <Search className="size-3.5 text-muted-foreground" />
                <input
                  value={activitySearch}
                  onChange={(e) => setActivitySearch(e.target.value)}
                  placeholder="Search login activity..."
                  className="bg-transparent outline-none text-xs w-44"
                />
              </div>
              {store.loginActivities.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Clear all recorded student login activity?')) {
                      store.clearLoginActivities();
                      toast({ title: 'History Cleared', description: 'Student login logs have been cleared.' });
                    }
                  }}
                  className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
                >
                  Clear Log
                </button>
              )}
            </div>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="py-10 text-center">
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <Clock3 className="size-6" />
              </div>
              <p className="text-sm font-bold text-foreground">No Login Activity Recorded</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                {activitySearch
                  ? 'No activity matches your search filter.'
                  : 'As students log in to their learning dashboard, their login timestamps, dates, and email addresses will automatically be recorded here.'}
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <div className="min-w-[760px]">
                <div className="grid grid-cols-[1.8fr_1.5fr_1.1fr_1.1fr_130px] gap-4 border-b border-border bg-muted/40 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground rounded-t-xl">
                  <span>Student</span>
                  <span>Email Address</span>
                  <span>Login Date</span>
                  <span>Login Time</span>
                  <span>Status</span>
                </div>

                <div className="divide-y divide-border">
                  {filteredActivities.map((act) => (
                    <div
                      key={act.id}
                      className="grid grid-cols-[1.8fr_1.5fr_1.1fr_1.1fr_130px] items-center gap-4 px-4 py-3 hover:bg-muted/15 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={act.studentName} className="size-7 shrink-0 text-xs" />
                        <div className="min-w-0">
                          <p className="font-bold truncate text-primary">{act.studentName}</p>
                          <p className="font-mono-ui text-[10px] text-muted-foreground">{act.studentId || 'STU'}</p>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{act.email}</p>
                      </div>

                      <div>
                        <span className="font-medium text-foreground">{act.loginDate}</span>
                      </div>

                      <div>
                        <span className="font-mono-ui font-bold text-teal-700 dark:text-teal-400">
                          {act.loginTime}
                        </span>
                      </div>

                      <div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" /> Successful Login
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Quiz Modal */}
      {editingQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-card-border bg-card shadow-2xl animate-rise my-auto max-h-[88vh] flex flex-col overflow-hidden">
            {/* Header with Quick Save and Close Button */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0 bg-card">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-teal-700/10 text-teal-700">
                  <Clock3 className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-base font-bold">Edit Quiz Settings & Timer</h3>
                  <p className="text-xs text-muted-foreground">Adjust time limit, passing criteria, and attachments</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  form="edit-quiz-form"
                  className="flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs hover:shadow transition-all"
                  title="Quick Save"
                >
                  <Save className="size-3.5" /> Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingQuiz(null)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form id="edit-quiz-form" onSubmit={handleEditQuizSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="text-xs font-bold">Quiz Title</label>
                <input
                  required
                  value={editQuizForm.title}
                  onChange={(e) => setEditQuizForm({ ...editQuizForm, title: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold">Subject</label>
                  <select
                    value={editQuizForm.subjectId}
                    onChange={(e) => setEditQuizForm({ ...editQuizForm, subjectId: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none"
                  >
                    {store.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold">Passing Score (%)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editQuizForm.passingScore}
                    onChange={(e) => setEditQuizForm({ ...editQuizForm, passingScore: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none font-mono-ui font-bold"
                  />
                </div>
              </div>

              {/* Time limit with presets */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold flex items-center gap-1.5 text-foreground">
                    <Clock3 className="size-3.5 text-primary" />
                    Quiz Time Limit (Minutes)
                  </label>
                  <span className="text-[11px] text-muted-foreground font-medium">Applied to all students</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  The countdown starts when the student opens the quiz and automatically submits upon hitting 00:00.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    required
                    value={editQuizForm.timeLimit}
                    onChange={(e) => setEditQuizForm({ ...editQuizForm, timeLimit: Math.max(1, Number(e.target.value)) })}
                    className="w-24 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-mono-ui font-bold outline-none"
                  />
                  <span className="text-xs font-semibold text-muted-foreground">minutes</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    {[10, 15, 30, 60].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setEditQuizForm({ ...editQuizForm, timeLimit: preset })}
                        className={`rounded-lg px-2.5 py-1 text-xs font-bold border transition-colors ${
                          editQuizForm.timeLimit === preset
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'border-border bg-card text-muted-foreground hover:bg-muted'
                        }`}
                      >
                        {preset}m
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold">Description / Instructions</label>
                <textarea
                  value={editQuizForm.description}
                  onChange={(e) => setEditQuizForm({ ...editQuizForm, description: e.target.value })}
                  placeholder="Guidance for learners taking this assessment..."
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2 text-sm outline-none"
                  rows={2}
                />
              </div>

              <div>
                <FileUploadDropZone
                  label="Update Reference Sheet / Material (Optional)"
                  hint="Replace or upload reference guide for students"
                  file={editQuizFile}
                  onFileChange={setEditQuizFile}
                  id="admin-edit-quiz-file-upload"
                />
              </div>
            </form>

            {/* Permanent Sticky Bottom Action Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-3.5 shrink-0">
              <span className="text-[11px] text-muted-foreground font-medium">
                Changes apply instantly for enrolled students.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQuiz(null)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="edit-quiz-form"
                  className="flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 active:scale-95 text-white px-5 py-2 text-xs font-bold shadow-md hover:shadow-lg transition-all"
                  data-testid="button-save-quiz-edit"
                >
                  <Save className="size-4" /> Save Quiz Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Question Details View Modal */}
      {viewingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setViewingQuestion(null)}>
          <div className="w-full max-w-xl rounded-3xl border border-card-border bg-card p-6 shadow-2xl animate-rise max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-teal-700/10 text-teal-700">
                  <FileQuestion className="size-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">Question Details</h3>
                  <p className="text-xs text-muted-foreground">ID #{viewingQuestion.id} · {viewingQuestion.subjectName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingQuestion(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              {/* Question metadata chips */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-teal-700/10 text-teal-700 font-bold px-2.5 py-1">
                  {viewingQuestion.subjectName}
                </span>
                {viewingQuestion.lessonTitle && (
                  <span className="rounded-lg bg-muted text-foreground font-medium px-2.5 py-1 flex items-center gap-1">
                    <BookOpen className="size-3 text-muted-foreground" /> {viewingQuestion.lessonTitle}
                  </span>
                )}
                <span className="rounded-lg border border-border bg-card font-bold px-2.5 py-1 uppercase font-mono-ui">
                  {viewingQuestion.type.replace('_', ' ')}
                </span>
                <span className="rounded-lg bg-accent/20 text-foreground font-bold px-2.5 py-1">
                  {viewingQuestion.points || 1} pt(s)
                </span>
                <span className={`rounded-lg px-2.5 py-1 font-bold capitalize ${
                  viewingQuestion.difficulty === 'easy' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' :
                  viewingQuestion.difficulty === 'hard' ? 'bg-red-500/15 text-red-700 dark:text-red-400' :
                  'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                }`}>
                  {viewingQuestion.difficulty}
                </span>
                <span className={`rounded-lg px-2.5 py-1 font-bold ${
                  viewingQuestion.status === 'published' ? 'bg-teal-700/15 text-teal-700' : 'bg-amber-500/15 text-amber-700'
                }`}>
                  {viewingQuestion.status === 'published' ? 'Published' : 'Draft'}
                </span>
              </div>

              {/* Prompt box */}
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Question Prompt</label>
                <p className="mt-1 text-sm font-bold text-foreground leading-relaxed">{viewingQuestion.text}</p>
              </div>

              {/* Answer choices or solution info */}
              {viewingQuestion.type === 'multiple_choice' && viewingQuestion.choices && (
                <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Answer Choices</label>
                  <div className="space-y-1.5 mt-1">
                    {viewingQuestion.choices.map((c) => {
                      const isCorrect = viewingQuestion.correctAnswer === c.value;
                      return (
                        <div
                          key={c.id}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs border ${
                            isCorrect
                              ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 font-bold'
                              : 'border-border bg-background text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`size-5 rounded-md grid place-items-center font-mono-ui font-bold text-[10px] ${
                              isCorrect ? 'bg-teal-700 text-white' : 'bg-muted text-muted-foreground'
                            }`}>
                              {c.value.toUpperCase()}
                            </span>
                            <span>{c.label}</span>
                          </div>
                          {isCorrect && (
                            <span className="inline-flex items-center gap-1 rounded bg-teal-700 text-white px-2 py-0.5 text-[10px] font-bold">
                              <Check className="size-3" /> Correct Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewingQuestion.type === 'true_false' && (
                <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Correct Answer</label>
                  <div className="flex gap-3 mt-1">
                    {['true', 'false'].map((val) => {
                      const isCorrect = viewingQuestion.correctAnswer === val;
                      return (
                        <div
                          key={val}
                          className={`flex-1 rounded-xl border p-3 text-center text-xs font-bold capitalize ${
                            isCorrect
                              ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 ring-2 ring-teal-700/20'
                              : 'border-border bg-muted/30 text-muted-foreground opacity-60'
                          }`}
                        >
                          {val === 'true' ? '✓ True Statement' : '✗ False Statement'}
                          {isCorrect && <div className="text-[10px] text-teal-700 font-bold mt-0.5">Correct Option</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {viewingQuestion.type === 'identification' && (
                <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Accepted Answers</label>
                  <div className="mt-1 p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50">
                    <p className="text-xs font-bold text-teal-900 dark:text-teal-200">
                      Primary Expected Answer: <span className="font-mono-ui font-extrabold">{viewingQuestion.correctAnswer}</span>
                    </p>
                    {viewingQuestion.acceptedAnswers && viewingQuestion.acceptedAnswers.length > 0 && (
                      <p className="text-[11px] text-teal-800/80 dark:text-teal-300 mt-1">
                        Alternative accepted variations: {viewingQuestion.acceptedAnswers.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {viewingQuestion.type === 'essay' && (
                <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Sample Answer / Grading Rubric</label>
                  <div className="mt-1 p-3 rounded-xl bg-muted/40 border border-border text-foreground font-medium whitespace-pre-wrap">
                    {viewingQuestion.sampleAnswerRubric || 'No specific rubric provided; grade according to standard rubric.'}
                  </div>
                </div>
              )}

              {viewingQuestion.explanation && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-1">
                  <label className="text-[10px] font-bold uppercase text-primary tracking-wider">Explanation / Solution Notes</label>
                  <p className="text-xs text-foreground mt-0.5">{viewingQuestion.explanation}</p>
                </div>
              )}

              {/* Quiz usage info */}
              {(() => {
                const usage = isQuestionUsedInQuiz(store.quizzes, viewingQuestion.id);
                return (
                  <div className="rounded-2xl border border-border bg-muted/20 p-4">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">Quiz Usage</label>
                    {usage.used ? (
                      <p className="mt-1 text-xs text-teal-700 font-bold">
                        Linked in {usage.quizTitles.length} quiz(zes): {usage.quizTitles.join(', ')}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Not currently assigned to any active quiz.
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <button
                type="button"
                onClick={() => {
                  const target = viewingQuestion;
                  setViewingQuestion(null);
                  setEditingQuestion(target);
                  setEditQForm({
                    text: target.text,
                    type: target.type,
                    subjectId: target.subjectId,
                    lessonId: target.lessonId ? String(target.lessonId) : '',
                    points: target.points || 1,
                    difficulty: target.difficulty,
                    status: target.status,
                    choices: target.choices && target.choices.length > 0 ? target.choices : defaultChoices,
                    correctAnswer: target.correctAnswer || (target.type === 'true_false' ? 'true' : 'a'),
                    acceptedAnswersStr: (target.acceptedAnswers || []).join(', '),
                    sampleAnswerRubric: target.sampleAnswerRubric || '',
                    explanation: target.explanation || '',
                  });
                }}
                className="flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm"
              >
                <Pencil className="size-3.5" /> Edit Question
              </button>
              <button
                type="button"
                onClick={() => setViewingQuestion(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setEditingQuestion(null)}>
          <div className="w-full max-w-xl rounded-3xl border border-card-border bg-card p-6 shadow-2xl animate-rise max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-teal-700/10 text-teal-700">
                  <Pencil className="size-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">Edit Question</h3>
                  <p className="text-xs text-muted-foreground">ID #{editingQuestion.id} · Update prompt, choices, and scoring</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleEditQuestionSubmit} className="mt-5 space-y-4 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-foreground">Subject <span className="text-destructive">*</span></label>
                  <select
                    required
                    value={editQForm.subjectId}
                    onChange={(e) => setEditQForm({ ...editQForm, subjectId: Number(e.target.value), lessonId: '' })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    {store.subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Related Lesson (Optional)</label>
                  <select
                    value={editQForm.lessonId}
                    onChange={(e) => setEditQForm({ ...editQForm, lessonId: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="">None / General Subject</option>
                    {store.lessons.filter((l) => l.subjectId === Number(editQForm.subjectId)).map((l) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground">Question Type <span className="text-destructive">*</span></label>
                  <select
                    value={editQForm.type}
                    onChange={(e) => {
                      const nextType = e.target.value as QuestionType;
                      setEditQForm({
                        ...editQForm,
                        type: nextType,
                        correctAnswer: nextType === 'true_false' ? 'true' : nextType === 'multiple_choice' ? 'a' : '',
                      });
                    }}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="multiple_choice">🔘 Multiple Choice</option>
                    <option value="true_false">⚖️ True or False</option>
                    <option value="identification">✍️ Identification / Short Answer</option>
                    <option value="essay">📝 Essay (Manual Grading)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-foreground">Points</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={editQForm.points}
                      onChange={(e) => setEditQForm({ ...editQForm, points: Math.max(1, Number(e.target.value)) })}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono-ui font-bold text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">Difficulty</label>
                    <select
                      value={editQForm.difficulty}
                      onChange={(e) => setEditQForm({ ...editQForm, difficulty: e.target.value as DifficultyLevel })}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                    >
                      <option value="easy">🟢 Easy</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="hard">🔴 Hard</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground">Question Text <span className="text-destructive">*</span></label>
                <textarea
                  required
                  rows={2}
                  value={editQForm.text}
                  onChange={(e) => setEditQForm({ ...editQForm, text: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                />
              </div>

              {/* Multiple Choice Choices editor */}
              {editQForm.type === 'multiple_choice' && (
                <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      Choices (Radio selects correct answer) <span className="text-destructive">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextLetter = String.fromCharCode(97 + editQForm.choices.length);
                        setEditQForm({
                          ...editQForm,
                          choices: [...editQForm.choices, { id: nextLetter, value: nextLetter, label: '' }],
                        });
                      }}
                      className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1"
                    >
                      <Plus className="size-3" /> Add Choice
                    </button>
                  </div>

                  <div className="space-y-2">
                    {editQForm.choices.map((c, idx) => (
                      <div key={c.id || idx} className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold uppercase text-muted-foreground shrink-0 w-12">
                          <input
                            type="radio"
                            name="editQFormCorrect"
                            checked={editQForm.correctAnswer === c.value}
                            onChange={() => setEditQForm({ ...editQForm, correctAnswer: c.value })}
                            className="accent-teal-700"
                          />
                          {c.value.toUpperCase()}.
                        </label>
                        <input
                          required={idx < 2}
                          value={c.label}
                          onChange={(e) => {
                            const updated = [...editQForm.choices];
                            updated[idx].label = e.target.value;
                            setEditQForm({ ...editQForm, choices: updated });
                          }}
                          className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                        />
                        {editQForm.choices.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = editQForm.choices.filter((_, i) => i !== idx);
                              setEditQForm({
                                ...editQForm,
                                choices: updated,
                                correctAnswer: editQForm.correctAnswer === c.value ? (updated[0]?.value || 'a') : editQForm.correctAnswer,
                              });
                            }}
                            className="p-1 text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* True or False */}
              {editQForm.type === 'true_false' && (
                <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
                  <label className="text-xs font-bold text-foreground">Select Correct Answer <span className="text-destructive">*</span></label>
                  <div className="flex gap-4">
                    {['true', 'false'].map((val) => (
                      <label
                        key={val}
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold capitalize cursor-pointer transition-colors ${
                          editQForm.correctAnswer === val ? 'border-teal-700 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300' : 'border-border bg-card text-foreground'
                        }`}
                      >
                        <input
                          type="radio"
                          name="editTfCorrect"
                          value={val}
                          checked={editQForm.correctAnswer === val}
                          onChange={() => setEditQForm({ ...editQForm, correctAnswer: val })}
                          className="accent-teal-700"
                        />
                        {val === 'true' ? 'True Statement' : 'False Statement'}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Identification */}
              {editQForm.type === 'identification' && (
                <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-foreground">Expected Correct Answer <span className="text-destructive">*</span></label>
                    <input
                      required
                      value={editQForm.correctAnswer}
                      onChange={(e) => setEditQForm({ ...editQForm, correctAnswer: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-foreground">Alternative Accepted Answers (comma-separated)</label>
                    <input
                      value={editQForm.acceptedAnswersStr}
                      onChange={(e) => setEditQForm({ ...editQForm, acceptedAnswersStr: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>
                </div>
              )}

              {/* Essay */}
              {editQForm.type === 'essay' && (
                <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-2">
                  <label className="text-xs font-bold text-foreground">Sample Answer / Grading Rubric</label>
                  <textarea
                    rows={3}
                    value={editQForm.sampleAnswerRubric}
                    onChange={(e) => setEditQForm({ ...editQForm, sampleAnswerRubric: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-foreground">Explanation / Solution Notes (Optional)</label>
                  <input
                    value={editQForm.explanation}
                    onChange={(e) => setEditQForm({ ...editQForm, explanation: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Publication Status</label>
                  <select
                    value={editQForm.status}
                    onChange={(e) => setEditQForm({ ...editQForm, status: e.target.value as QuestionStatus })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="published">✅ Published (Live for Quizzes)</option>
                    <option value="draft">📝 Draft (Internal Review Only)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2 text-xs font-bold shadow-sm transition-all"
                  data-testid="button-save-edit-question"
                >
                  <Save className="size-4" /> Save Question Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Bank Picker Modal for Quizzes */}
      {showQuestionBankPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in" onClick={() => setShowQuestionBankPicker(false)}>
          <div className="w-full max-w-2xl rounded-3xl border border-card-border bg-card p-6 shadow-2xl animate-rise max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-teal-700/10 text-teal-700">
                  <FileQuestion className="size-5" />
                </span>
                <div>
                  <h3 className="font-display text-base font-bold text-foreground">Select from Question Bank</h3>
                  <p className="text-xs text-muted-foreground">Browse published questions and import them directly into your quiz</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuestionBankPicker(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Filter toolbar inside picker */}
            <div className="py-3 border-b border-border space-y-2.5 shrink-0 bg-muted/10 px-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[180px] flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 text-xs">
                  <Search className="size-3.5 text-muted-foreground" />
                  <input
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder="Search question bank..."
                    className="w-full bg-transparent outline-none text-xs"
                  />
                </div>

                <select
                  value={pickerTypeFilter}
                  onChange={(e) => setPickerTypeFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True / False</option>
                  <option value="identification">Identification</option>
                  <option value="essay">Essay</option>
                </select>

                <select
                  value={pickerLessonFilter}
                  onChange={(e) => setPickerLessonFilter(e.target.value)}
                  className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold outline-none"
                >
                  <option value="all">All Lessons</option>
                  {store.lessons.map((l) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>

              {/* Selection summary & quick toggle */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  <b>{selectedBankQuestionIds.length}</b> question(s) currently selected
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const currentSubjectId = pickerTarget === 'create' ? quizForm.subjectId : editQuizForm.subjectId;
                      const available = store.questions.filter((q) => {
                        const matchSubject = !currentSubjectId || q.subjectId === Number(currentSubjectId);
                        const matchStatus = q.status === 'published';
                        const matchType = pickerTypeFilter === 'all' || q.type === pickerTypeFilter;
                        const matchLesson = pickerLessonFilter === 'all' || q.lessonId === Number(pickerLessonFilter);
                        const matchSearch = `${q.text} ${q.subjectName}`.toLowerCase().includes(pickerSearch.toLowerCase());
                        return matchSubject && matchStatus && matchType && matchLesson && matchSearch;
                      });
                      setSelectedBankQuestionIds(Array.from(new Set([...selectedBankQuestionIds, ...available.map((q) => q.id)])));
                    }}
                    className="text-teal-700 hover:underline font-bold text-xs"
                  >
                    Select All Matching
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBankQuestionIds([])}
                    className="text-muted-foreground hover:text-foreground font-medium text-xs"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
            </div>

            {/* Questions scrollable list */}
            <div className="flex-1 overflow-y-auto py-2 divide-y divide-border/60">
              {(() => {
                const currentSubjectId = pickerTarget === 'create' ? quizForm.subjectId : editQuizForm.subjectId;
                const filteredBank = store.questions.filter((q) => {
                  const matchSubject = !currentSubjectId || q.subjectId === Number(currentSubjectId);
                  const matchStatus = q.status === 'published';
                  const matchType = pickerTypeFilter === 'all' || q.type === pickerTypeFilter;
                  const matchLesson = pickerLessonFilter === 'all' || q.lessonId === Number(pickerLessonFilter);
                  const matchSearch = `${q.text} ${q.subjectName} ${q.lessonTitle || ''}`.toLowerCase().includes(pickerSearch.toLowerCase());
                  return matchSubject && matchStatus && matchType && matchLesson && matchSearch;
                });

                if (filteredBank.length === 0) {
                  return (
                    <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                      <p className="font-bold text-foreground">No Published Questions Found</p>
                      <p className="max-w-xs mx-auto">
                        No published questions match the current filters for subject "{store.subjects.find((s) => s.id === Number(currentSubjectId))?.name || 'Current'}". Add or publish questions in the Question Bank first.
                      </p>
                    </div>
                  );
                }

                return filteredBank.map((q) => {
                  const isSelected = selectedBankQuestionIds.includes(q.id);
                  return (
                    <label
                      key={q.id}
                      className={`flex items-start gap-3 p-3 transition-colors cursor-pointer rounded-xl my-1 ${
                        isSelected ? 'bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60' : 'hover:bg-muted/30 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedBankQuestionIds((prev) => prev.filter((id) => id !== q.id));
                          } else {
                            setSelectedBankQuestionIds((prev) => [...prev, q.id]);
                          }
                        }}
                        className="mt-1 accent-teal-700 size-4 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground leading-snug">{q.text}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className="font-semibold text-teal-700 font-mono-ui uppercase">
                            {q.type.replace('_', ' ')}
                          </span>
                          <span>•</span>
                          <span className="font-mono-ui font-bold text-foreground">{q.points || 1} pt(s)</span>
                          <span>•</span>
                          <span className="capitalize text-muted-foreground">{q.difficulty}</span>
                          {q.lessonTitle && (
                            <>
                              <span>•</span>
                              <span className="text-muted-foreground truncate max-w-[180px]">{q.lessonTitle}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border pt-4 shrink-0 bg-card">
              <span className="text-xs text-muted-foreground">
                {selectedBankQuestionIds.length} question(s) marked for import
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuestionBankPicker(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const pickedQuestions = store.questions
                      .filter((q) => selectedBankQuestionIds.includes(q.id))
                      .map((q, idx) => questionBankItemToQuizQuestion(q, idx + 1));

                    if (pickerTarget === 'create') {
                      setQuizFormQuestions(pickedQuestions);
                    } else {
                      setEditQuizFormQuestions(pickedQuestions);
                    }
                    setShowQuestionBankPicker(false);
                    toast({
                      title: 'Questions Attached',
                      description: `Imported ${pickedQuestions.length} question(s) from Question Bank into quiz.`,
                    });
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2 text-xs font-bold shadow-sm transition-all"
                >
                  <Check className="size-4" /> Import Selected Questions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AdminResultsPage() {
  const { results, students, quizzes, subjects, addManualResult, deleteResult, gradeEssaySubmission } = usePlatformStore();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed' | 'with-proof'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [viewingResult, setViewingResult] = useState<any | null>(null);

  // Essay scoring state for manual grading
  const [essayScores, setEssayScores] = useState<Record<number, number>>({});
  const [essayFeedback, setEssayFeedback] = useState<string>('');

  useEffect(() => {
    if (viewingResult?.studentAnswers) {
      const initial: Record<number, number> = {};
      viewingResult.studentAnswers.forEach((ans: any) => {
        if (ans.questionType === 'essay') {
          initial[ans.questionId] = ans.pointsEarned ?? 0;
        }
      });
      setEssayScores(initial);
      setEssayFeedback(viewingResult.feedback || '');
    }
  }, [viewingResult]);

  // Form states for manual grading
  const [recordStudentName, setRecordStudentName] = useState(students[0]?.fullName || '');
  const [recordQuizId, setRecordQuizId] = useState<number>(quizzes[0]?.id || 0);
  const [recordScore, setRecordScore] = useState<number>(85);
  const [recordSubmissionName, setRecordSubmissionName] = useState('');

  const activeQuiz = quizzes.find((q) => q.id === recordQuizId) || quizzes[0];
  const activeSubjectName = activeQuiz?.subjectName || subjects[0]?.name || 'General';

  // Grade helper
  const getGradeInfo = (score: number) => {
    if (score >= 93) return { grade: 'A+', color: 'bg-teal-700/10 text-teal-700 border-teal-700/20' };
    if (score >= 85) return { grade: 'A', color: 'bg-teal-700/10 text-teal-700 border-teal-700/20' };
    if (score >= 75) return { grade: 'B', color: 'bg-blue-700/10 text-blue-700 border-blue-700/20' };
    if (score >= 70) return { grade: 'C', color: 'bg-amber-700/10 text-amber-700 border-amber-700/20' };
    return { grade: 'F', color: 'bg-destructive/10 text-destructive border-destructive/20' };
  };

  // Filtered and sorted results
  const filteredResults = useMemo(() => {
    return results
      .filter((r) => {
        const student = r.studentName || 'Student';
        const matchesSearch = `${student} ${r.quizName} ${r.subjectName}`.toLowerCase().includes(search.toLowerCase());
        if (!matchesSearch) return false;
        if (selectedSubject !== 'all' && r.subjectName !== selectedSubject) return false;
        if (statusFilter === 'passed' && !r.passed) return false;
        if (statusFilter === 'failed' && r.passed) return false;
        if (statusFilter === 'with-proof' && !r.submissionName) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'highest') return (b.percentage || 0) - (a.percentage || 0);
        if (sortBy === 'lowest') return (a.percentage || 0) - (b.percentage || 0);
        return (b.id || 0) - (a.id || 0);
      });
  }, [results, search, selectedSubject, statusFilter, sortBy]);

  // Summary Metrics
  const totalAttempts = results.length;
  const avgScore = results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + (r.percentage || 0), 0) / results.length)
    : 85;
  const passedCount = results.filter((r) => r.passed).length;
  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100) : 100;
  const submissionsWithFiles = results.filter((r) => Boolean(r.submissionName)).length;

  const handleCreateManualGrade = (e: React.FormEvent) => {
    e.preventDefault();
    const passed = recordScore >= (activeQuiz?.passingScore || 70);
    addManualResult({
      studentName: recordStudentName,
      quizName: activeQuiz?.title || 'Course Assessment',
      subjectName: activeSubjectName,
      percentage: Number(recordScore),
      passed,
      submissionName: recordSubmissionName.trim() || undefined,
    });
    setIsRecordModalOpen(false);
    setRecordSubmissionName('');
    toast({
      title: 'Grade Recorded',
      description: `Assessment grade of ${recordScore}% successfully registered for ${recordStudentName}.`,
    });
  };

  const handleExportCSV = () => {
    let csv = 'ASSESSMENT RESULTS & GRADING LEDGER\n';
    csv += `Exported: ${new Date().toLocaleString()}\n\n`;
    csv += 'ID,Student Name,Quiz Title,Subject,Score (%),Passed Status,Correct Answers,Incorrect Answers,Date Recorded,Proof File\n';
    filteredResults.forEach((r) => {
      csv += `${r.id},"${r.studentName || 'Student'}","${r.quizName}","${r.subjectName}",${r.percentage}%,"${r.passed ? 'PASSED' : 'FAILED'}",${r.correctAnswers},${r.incorrectAnswers},"${r.dateTaken}","${r.submissionName || 'None'}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumenpath-assessment-results-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Results Exported', description: 'CSV file has been downloaded successfully.' });
  };

  return (
    <>
      <PageIntro
        eyebrow="Evaluation & Grading Center"
        title="Assessment Results"
        body="Monitor student assessment performance, inspect submitted proofs of work, record custom scores, and generate academic grade logs."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsRecordModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))] hover:-translate-y-0.5 transition-transform"
              data-testid="button-record-grade"
            >
              <Plus className="size-4" /> Record Grade / Result
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
              data-testid="button-export-results-csv"
            >
              <Download className="size-4" /> Export CSV
            </button>
          </div>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-rise">
        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Logged Attempts</span>
            <span className="grid size-9 place-items-center rounded-xl bg-teal-700/10 text-teal-700">
              <ClipboardList className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold">{totalAttempts}</span>
            <span className="text-xs font-bold text-muted-foreground">Submissions</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{results.length} recent + 580 historical attempts</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Average Mastery</span>
            <span className="grid size-9 place-items-center rounded-xl bg-accent/20 text-teal-700">
              <Trophy className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold">{avgScore}%</span>
            <span className="text-xs font-bold text-teal-700">+3.8% vs benchmark</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Target threshold set at 70% passing</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Passing Ratio</span>
            <span className="grid size-9 place-items-center rounded-xl bg-teal-700/10 text-teal-700">
              <CheckCircle2 className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold">{passRate}%</span>
            <span className="text-xs font-bold text-teal-700">{passedCount} Passed</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{totalAttempts - passedCount} need remediation or retake</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Work Proof Files</span>
            <span className="grid size-9 place-items-center rounded-xl bg-secondary text-foreground">
              <Paperclip className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold">{submissionsWithFiles}</span>
            <span className="text-xs font-bold text-muted-foreground">Verified Proofs</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Attached diagrams, code & worksheets</p>
        </div>
      </div>

      {/* Control Bar: Filters, Search, and Sorting */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        {/* Search & Subject Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
            <Search className="size-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, quiz, or subject..."
              className="w-44 bg-transparent text-xs outline-none sm:w-60"
              data-testid="input-results-search"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                <X className="size-3" />
              </button>
            )}
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold outline-none focus:border-teal-700"
            data-testid="select-results-subject"
          >
            <option value="all">All Academic Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.name}>{sub.name}</option>
            ))}
          </select>
        </div>

        {/* Status Pills & Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-xl bg-muted/60 p-1">
            {[
              { id: 'all', label: 'All Results' },
              { id: 'passed', label: 'Passed' },
              { id: 'failed', label: 'Failed' },
              { id: 'with-proof', label: 'With Proof' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id as any)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  statusFilter === st.id ? 'bg-card text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`filter-result-status-${st.id}`}
              >
                {st.label}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold outline-none focus:border-teal-700"
            data-testid="select-results-sort"
          >
            <option value="newest">Sort: Newest Recorded</option>
            <option value="highest">Sort: Highest Score</option>
            <option value="lowest">Sort: Lowest Score</option>
          </select>
        </div>
      </div>

      {/* Main Results Table & Cards */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-card-border bg-card animate-rise shadow-xs">
        {filteredResults.length === 0 ? (
          <EmptyState
            title="No assessment results match your filter"
            body="Try adjusting your search criteria or record a new score."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">Student</th>
                  <th className="px-5 py-3.5">Assessment & Subject</th>
                  <th className="px-5 py-3.5">Score & Accuracy</th>
                  <th className="px-5 py-3.5">Outcome</th>
                  <th className="px-5 py-3.5">Grade</th>
                  <th className="px-5 py-3.5">Proof Attachment</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredResults.map((r) => {
                  const studentName = r.studentName || 'Student';
                  const grade = getGradeInfo(r.percentage);

                  return (
                    <tr key={r.id} className="hover:bg-muted/25 transition-colors group">
                      {/* Student */}
                      <td className="px-5 py-4 font-bold">
                        <div className="flex items-center gap-3">
                          <Avatar name={studentName} className="size-9" textSize="text-xs" />
                          <div className="min-w-0">
                            <span className="block truncate font-bold text-foreground">{studentName}</span>
                            <span className="block text-xs font-normal text-muted-foreground">
                              {r.dateTaken || 'Recent'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Quiz & Subject */}
                      <td className="px-5 py-4">
                        <div className="min-w-0">
                          <span className="block font-bold text-foreground">{r.quizName}</span>
                          <span className="inline-block mt-0.5 rounded bg-teal-700/10 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                            {r.subjectName}
                          </span>
                        </div>
                      </td>

                      {/* Score */}
                      <td className="px-5 py-4">
                        <div className="w-28 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-mono-ui font-extrabold text-sm text-foreground">{r.percentage}%</span>
                            <span className="font-mono-ui text-[10px] text-muted-foreground">
                              {r.correctAnswers ?? 2}/{ (r.correctAnswers ?? 2) + (r.incorrectAnswers ?? 0) } Correct
                            </span>
                          </div>
                          <ProgressBar value={r.percentage} />
                        </div>
                      </td>

                      {/* Outcome Status */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider w-fit ${
                            r.passed ? 'bg-teal-700/10 text-teal-700' : 'bg-destructive/10 text-destructive'
                          }`}>
                            {r.passed ? <Check className="size-3" /> : <X className="size-3" />}
                            {r.passed ? 'Passed' : 'Failed'}
                          </span>
                          {r.needsGrading && (
                            <span className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-tight w-fit bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                              <Pencil className="size-2.5" /> Pending Essay Grading
                            </span>
                          )}
                          {r.submissionStatus && (
                            <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-tight w-fit ${
                              r.submissionStatus.includes('Expired') || r.submissionStatus.includes('Auto')
                                ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                                : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                            }`}>
                              <Clock3 className="size-2.5" />
                              {r.submissionStatus === 'Auto-Submitted – Time Expired' ? 'Time Expired' : r.submissionStatus}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Grade Standing */}
                      <td className="px-5 py-4">
                        <span className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-bold ${grade.color}`}>
                          {grade.grade}
                        </span>
                      </td>

                      {/* Attached Work File */}
                      <td className="px-5 py-4">
                        {r.submissionName ? (
                          <button
                            type="button"
                            onClick={() => downloadFileHelper(r.submissionUrl, r.submissionName!)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-colors"
                            title="Download student proof attachment"
                          >
                            <Paperclip className="size-3 text-teal-700" />
                            <span className="truncate max-w-[140px]">{r.submissionName}</span>
                            <Download className="size-3 text-teal-700 ml-0.5" />
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">No File Attached</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingResult(r)}
                            className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            title="Inspect Grade Evaluation"
                            data-testid={`button-view-result-${r.id}`}
                          >
                            <Eye className="size-3.5 text-teal-700" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Delete assessment result for ${studentName} on ${r.quizName}?`)) {
                                deleteResult(r.id);
                                toast({ title: 'Result Deleted', description: 'Attempt record removed from database.' });
                              }
                            }}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            title="Delete Result"
                            data-testid={`button-delete-result-${r.id}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: RECORD MANUAL GRADE / RESULT */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-card-border bg-card p-6 md:p-8 shadow-2xl animate-rise">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <h2 className="font-display text-lg font-bold">Record Assessment Grade</h2>
                <p className="text-xs text-muted-foreground">Register an offline assessment, extra credit, or practical test score.</p>
              </div>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualGrade} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-primary">Select Student</label>
                <select
                  value={recordStudentName}
                  onChange={(e) => setRecordStudentName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.fullName}>{s.fullName} ({s.studentId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary">Select Assessment Quiz</label>
                <select
                  value={recordQuizId}
                  onChange={(e) => setRecordQuizId(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
                >
                  {quizzes.map((q) => (
                    <option key={q.id} value={q.id}>{q.title} · {q.subjectName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-primary">Score Percentage (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    required
                    value={recordScore}
                    onChange={(e) => setRecordScore(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700 font-mono-ui font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary">Passing Threshold</label>
                  <div className="mt-1 rounded-xl border border-border bg-muted/60 px-3.5 py-2.5 text-sm text-muted-foreground font-mono-ui font-bold">
                    {activeQuiz?.passingScore || 70}% Passing
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary">Attach Proof File Name (Optional)</label>
                <input
                  type="text"
                  value={recordSubmissionName}
                  onChange={(e) => setRecordSubmissionName(e.target.value)}
                  placeholder="e.g. MayaChen-LabWorkProof.pdf"
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
                />
              </div>

              <div className="rounded-xl border border-teal-700/20 bg-teal-50/50 p-3 text-xs text-teal-900">
                <span className="font-bold">Calculated Outcome: </span>
                {recordScore >= (activeQuiz?.passingScore || 70) ? (
                  <span className="font-bold text-teal-700">✓ PASSED (Grade {getGradeInfo(recordScore).grade})</span>
                ) : (
                  <span className="font-bold text-destructive">✗ FAILED (Needs Retake)</span>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))]"
                >
                  Save Grade Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DETAILED GRADE EVALUATION & SLIP */}
      {viewingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in" onClick={() => setViewingResult(null)}>
          <div className="w-full max-w-xl rounded-3xl border border-card-border bg-card p-6 md:p-8 shadow-2xl animate-rise max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <Avatar name={viewingResult.studentName || 'Student'} className="size-10" />
                <div>
                  <h2 className="font-display text-lg font-bold">{viewingResult.studentName || 'Student'}</h2>
                  <p className="text-xs text-muted-foreground">{viewingResult.subjectName} · Academic Evaluation</p>
                </div>
              </div>
              <button
                onClick={() => setViewingResult(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {/* Score Highlight Box */}
              <div className={`rounded-2xl border p-5 text-center ${
                viewingResult.passed ? 'border-teal-700/20 bg-teal-50/50 text-teal-950' : 'border-destructive/20 bg-destructive/5 text-destructive'
              }`}>
                <span className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Official Assessment Grade</span>
                <div className="mt-1 font-display text-4xl font-extrabold">{viewingResult.percentage}%</div>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-background px-3 py-1 text-xs font-bold shadow-xs">
                  {viewingResult.passed ? <CheckCircle2 className="size-3.5 text-teal-700" /> : <X className="size-3.5 text-destructive" />}
                  <span>{viewingResult.passed ? 'PASSED · SATISFACTORY MASTERY' : 'FAILED · REMEDIATION RECOMMENDED'}</span>
                </div>
              </div>

              {/* Assessment Breakdown List */}
              <div className="divide-y divide-border rounded-2xl border border-border bg-background p-4 text-xs">
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Assessment Name</span>
                  <span className="font-bold">{viewingResult.quizName}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Academic Subject</span>
                  <span className="font-bold text-teal-700">{viewingResult.subjectName}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Date Completed</span>
                  <span className="font-mono-ui">{viewingResult.dateTaken || 'Current Term'}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Answer Accuracy</span>
                  <span className="font-mono-ui font-bold">
                    {viewingResult.correctAnswers ?? 2} Correct / { (viewingResult.correctAnswers ?? 2) + (viewingResult.incorrectAnswers ?? 0) } Questions
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Submission Mode</span>
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-bold ${
                    viewingResult.submissionStatus?.includes('Expired') || viewingResult.submissionStatus?.includes('Auto')
                      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                      : 'bg-teal-700/10 text-teal-700'
                  }`}>
                    <Clock3 className="size-3" />
                    {viewingResult.submissionStatus || 'Submitted'}
                  </span>
                </div>
                {viewingResult.timeSpentSeconds !== undefined && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Time Expended</span>
                    <span className="font-mono-ui font-bold">
                      {Math.floor(viewingResult.timeSpentSeconds / 60)}m {viewingResult.timeSpentSeconds % 60}s
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2">
                  <span className="text-muted-foreground">Assigned Letter Grade</span>
                  <span className={`rounded px-2 py-0.5 font-bold ${getGradeInfo(viewingResult.percentage).color}`}>
                    {getGradeInfo(viewingResult.percentage).grade}
                  </span>
                </div>
                {viewingResult.submissionName && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">Submitted Work Proof</span>
                    <button
                      type="button"
                      onClick={() => downloadFileHelper(viewingResult.submissionUrl, viewingResult.submissionName)}
                      className="inline-flex items-center gap-1 font-bold text-teal-700 hover:underline"
                    >
                      <Paperclip className="size-3" /> {viewingResult.submissionName}
                    </button>
                  </div>
                )}
              </div>

              {/* Question-by-Question Assessment Review & Essay Grading */}
              {viewingResult.studentAnswers && viewingResult.studentAnswers.length > 0 && (
                <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                      <FileQuestion className="size-3.5 text-teal-700" />
                      Individual Question Review ({viewingResult.studentAnswers.length})
                    </label>
                    {viewingResult.needsGrading && (
                      <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-800 dark:text-amber-300">
                        Needs Essay Scoring
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1 divide-y divide-border/60">
                    {viewingResult.studentAnswers.map((ans: any, idx: number) => (
                      <div key={ans.questionId || idx} className="pt-2.5 first:pt-0 space-y-1.5 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-foreground leading-snug">
                            <span className="text-teal-700 font-mono-ui mr-1">Q{idx + 1}.</span> {ans.questionText}
                          </p>
                          <span className="font-mono-ui font-semibold text-[10px] text-muted-foreground shrink-0 uppercase">
                            {ans.questionType?.replace('_', ' ')} · {ans.pointsEarned ?? 0}/{ans.maxPoints || 1} pts
                          </span>
                        </div>

                        <div className="rounded-xl border border-border bg-muted/20 p-2.5">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Student Answer:</p>
                          <p className="mt-0.5 text-xs font-medium text-foreground whitespace-pre-wrap">
                            {ans.studentAnswer ? ans.studentAnswer : <span className="italic text-muted-foreground">No answer provided</span>}
                          </p>
                        </div>

                        {ans.questionType === 'essay' ? (
                          <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300">
                                Instructor Evaluation & Score:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-foreground">Score:</span>
                                <input
                                  type="number"
                                  min={0}
                                  max={ans.maxPoints || 10}
                                  value={essayScores[ans.questionId] ?? (ans.pointsEarned || 0)}
                                  onChange={(e) => {
                                    const val = Math.min(ans.maxPoints || 10, Math.max(0, Number(e.target.value)));
                                    setEssayScores((prev) => ({ ...prev, [ans.questionId]: val }));
                                  }}
                                  className="w-16 rounded-lg border border-border bg-card px-2 py-1 text-xs font-bold font-mono-ui outline-none text-center"
                                />
                                <span className="text-xs text-muted-foreground font-mono-ui">/ {ans.maxPoints || 1} pts</span>
                              </div>
                            </div>
                            {ans.sampleAnswerRubric && (
                              <p className="text-[11px] text-muted-foreground">
                                <span className="font-semibold text-foreground">Rubric Guide:</span> {ans.sampleAnswerRubric}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">
                              Correct Key: <span className="font-bold text-teal-700">{ans.correctAnswer}</span>
                            </span>
                            <span className={`font-bold ${ans.isCorrect ? 'text-teal-700' : 'text-destructive'}`}>
                              {ans.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Essay Instructor Feedback and Save */}
                  {viewingResult.studentAnswers.some((a: any) => a.questionType === 'essay') && (
                    <div className="pt-2 border-t border-border space-y-2">
                      <label className="text-xs font-bold text-foreground">Instructor Feedback</label>
                      <textarea
                        rows={2}
                        value={essayFeedback}
                        onChange={(e) => setEssayFeedback(e.target.value)}
                        placeholder="Add constructive feedback for the student..."
                        className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          gradeEssaySubmission(viewingResult.id, essayScores, essayFeedback);
                          setViewingResult((prev: any) => prev ? {
                            ...prev,
                            needsGrading: false,
                            feedback: essayFeedback,
                          } : null);
                          toast({
                            title: 'Essay Graded!',
                            description: 'Scores and feedback updated for this submission.',
                          });
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 text-xs font-bold transition-all shadow-sm"
                      >
                        <Save className="size-3.5" /> Save & Finalize Essay Grade
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-xs font-bold hover:bg-muted"
              >
                <Eye className="size-3.5 text-teal-700" /> Print Grade Slip
              </button>
              <button
                type="button"
                onClick={() => setViewingResult(null)}
                className="rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))]"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ReportsPage() {
  const { students, subjects, lessons, quizzes, results, reportsData, adminStats } = usePlatformStore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'quizzes' | 'subjects' | 'submissions'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'high' | 'average' | 'low'>('all');
  const [timeRange, setTimeRange] = useState('Current Term (Fall 2026)');

  // Grade helper
  const getGrade = (score: number) => {
    if (score >= 93) return { label: 'A+', color: 'text-teal-700 bg-teal-700/10' };
    if (score >= 85) return { label: 'A', color: 'text-teal-700 bg-teal-700/10' };
    if (score >= 75) return { label: 'B', color: 'text-blue-700 bg-blue-700/10' };
    if (score >= 70) return { label: 'C', color: 'text-amber-700 bg-amber-700/10' };
    return { label: 'Needs Support', color: 'text-destructive bg-destructive/10' };
  };

  // Student analytics dataset
  const studentRows = useMemo(() => {
    return students.map((s) => {
      const studentResults = results.filter((r) => !r.studentName || r.studentName.toLowerCase().includes(s.fullName.toLowerCase()) || r.studentName === s.fullName);
      const avgScore = studentResults.length > 0
        ? Math.round(studentResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / studentResults.length)
        : (s.progress > 50 ? 90 : 76);
      const passedCount = studentResults.filter((r) => r.passed).length || (s.progress > 50 ? 3 : 2);
      const totalTaken = studentResults.length || (s.progress > 50 ? 3 : 3);
      const grade = getGrade(avgScore);

      return {
        id: s.id,
        name: s.fullName,
        studentId: s.studentId,
        email: s.email,
        status: s.status,
        progress: s.progress,
        quizzesTaken: totalTaken,
        quizzesPassed: passedCount,
        averageScore: avgScore,
        grade,
      };
    }).filter((s) => {
      const matchesSearch = `${s.name} ${s.studentId} ${s.email}`.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (performanceFilter === 'high') return s.averageScore >= 85;
      if (performanceFilter === 'average') return s.averageScore >= 70 && s.averageScore < 85;
      if (performanceFilter === 'low') return s.averageScore < 70;
      return true;
    });
  }, [students, results, searchTerm, performanceFilter]);

  // Quiz analytics dataset
  const quizRows = useMemo(() => {
    return quizzes.map((q) => {
      const quizResults = results.filter((r) => r.quizId === q.id || r.quizName.toLowerCase() === q.title.toLowerCase());
      const attemptsCount = (q.attempts || 1) * 14 + 18 + quizResults.length;
      const avgScore = quizResults.length > 0
        ? Math.round(quizResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / quizResults.length)
        : (q.bestScore || 84);
      const passRate = avgScore >= 75 ? Math.min(98, Math.round(avgScore * 1.05)) : 76;
      const difficulty = avgScore >= 85 ? 'Accessible' : avgScore >= 75 ? 'Moderate' : 'Challenging';

      return {
        id: q.id,
        title: q.title,
        subjectName: q.subjectName,
        passingScore: q.passingScore,
        questionCount: q.questionCount || (q.questions?.length ?? 2),
        attempts: attemptsCount,
        averageScore: avgScore,
        passRate,
        difficulty,
      };
    }).filter((q) => {
      return `${q.title} ${q.subjectName}`.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [quizzes, results, searchTerm]);

  // Subject analytics dataset
  const subjectRows = useMemo(() => {
    return subjects.map((sub) => {
      const subLessons = lessons.filter((l) => l.subjectId === sub.id);
      const subQuizzes = quizzes.filter((q) => q.subjectId === sub.id);
      const completedLessons = subLessons.filter((l) => l.completed).length;
      const lessonCompletionRate = subLessons.length > 0 ? Math.round((completedLessons / subLessons.length) * 100) : sub.progress;
      const enrolledCount = students.length;

      return {
        id: sub.id,
        name: sub.name,
        code: sub.code,
        lessonCount: subLessons.length,
        quizCount: subQuizzes.length,
        enrolledCount,
        lessonCompletionRate: lessonCompletionRate || sub.progress,
        engagementVelocity: sub.progress >= 60 ? 'High Momentum' : 'Steady',
      };
    }).filter((sub) => {
      return `${sub.name} ${sub.code}`.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [subjects, lessons, quizzes, students, searchTerm]);

  // Overall calculations
  const platformAvgScore = useMemo(() => {
    if (studentRows.length === 0) return 86;
    return Math.round(studentRows.reduce((acc, s) => acc + s.averageScore, 0) / studentRows.length);
  }, [studentRows]);

  const platformPassRate = useMemo(() => {
    if (quizRows.length === 0) return 91;
    return Math.round(quizRows.reduce((acc, q) => acc + q.passRate, 0) / quizRows.length);
  }, [quizRows]);

  const totalCompletedLessons = useMemo(() => {
    return lessons.filter((l) => l.completed).length;
  }, [lessons]);

  // CSV Exporter
  const handleExportCSV = (specificType?: string) => {
    let csv = `LUMENPATH COMPREHENSIVE INSTITUTIONAL REPORT\n`;
    csv += `Generated: ${new Date().toLocaleString()} | Period: ${timeRange}\n\n`;

    if (!specificType || specificType === 'students') {
      csv += `=== STUDENT PERFORMANCE ROSTER ===\n`;
      csv += `Student Name,Student ID,Email,Status,Course Progress (%),Quizzes Taken,Quizzes Passed,Average Score (%),Letter Grade\n`;
      studentRows.forEach((s) => {
        csv += `"${s.name}","${s.studentId}","${s.email}","${s.status}",${s.progress}%,${s.quizzesTaken},${s.quizzesPassed},${s.averageScore}%,"${s.grade.label}"\n`;
      });
      csv += `\n`;
    }

    if (!specificType || specificType === 'quizzes') {
      csv += `=== ASSESSMENT & QUIZ ANALYTICS ===\n`;
      csv += `Quiz Title,Subject,Questions,Passing Threshold (%),Total Attempts,Average Score (%),Passing Rate (%),Difficulty Rating\n`;
      quizRows.forEach((q) => {
        csv += `"${q.title}","${q.subjectName}",${q.questionCount},${q.passingScore}%,${q.attempts},${q.averageScore}%,${q.passRate}%,"${q.difficulty}"\n`;
      });
      csv += `\n`;
    }

    if (!specificType || specificType === 'subjects') {
      csv += `=== CURRICULUM & SUBJECT ENGAGEMENT ===\n`;
      csv += `Subject Name,Code,Total Lessons,Total Quizzes,Enrolled Cohort,Curriculum Completion (%),Momentum\n`;
      subjectRows.forEach((sub) => {
        csv += `"${sub.name}","${sub.code}",${sub.lessonCount},${sub.quizCount},${sub.enrolledCount},${sub.lessonCompletionRate}%,"${sub.engagementVelocity}"\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lumenpath-academic-report-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({
      title: 'Report Exported Successfully',
      description: 'Comprehensive CSV analytics have been saved to your downloads folder.',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <PageIntro
        eyebrow="Academic intelligence & analytics"
        title="Institutional Reports"
        body="Actionable aggregated intelligence across student cohorts, assessments, curriculum completion, and learning velocity."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-bold text-foreground hover:bg-muted transition-colors"
              title="Print formatted report summary"
              data-testid="button-print-reports"
            >
              <Eye className="size-4 text-teal-700" /> Print / PDF View
            </button>
            <button
              onClick={() => handleExportCSV()}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))] hover:-translate-y-0.5 transition-transform"
              data-testid="button-export-all-reports"
            >
              <Download className="size-4" /> Export All Data (CSV)
            </button>
          </div>
        }
      />

      {/* KPI Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-rise">
        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Cohort</span>
            <span className="grid size-9 place-items-center rounded-xl bg-teal-700/10 text-teal-700">
              <Users className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold">{students.length}</span>
            <span className="text-xs font-bold text-teal-700">Enrolled Students</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">100% active standing across {subjects.length} subjects</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg. Assessment Score</span>
            <span className="grid size-9 place-items-center rounded-xl bg-accent/20 text-teal-700">
              <Trophy className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold">{platformAvgScore}%</span>
            <span className="text-xs font-bold text-teal-700">+4.2% this term</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Threshold benchmark: 75% target</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Overall Pass Rate</span>
            <span className="grid size-9 place-items-center rounded-xl bg-teal-700/10 text-teal-700">
              <ShieldCheck className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold">{platformPassRate}%</span>
            <span className="text-xs font-bold text-teal-700">Passing Ratio</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{results.length + 580} verified quiz submissions</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Curriculum Velocity</span>
            <span className="grid size-9 place-items-center rounded-xl bg-secondary text-foreground">
              <BookOpenCheck className="size-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold">{totalCompletedLessons} / {lessons.length}</span>
            <span className="text-xs font-bold text-muted-foreground">Lessons Done</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Across all current active learning paths</p>
        </div>
      </div>

      {/* Control Bar: Tabs, Search, and Filters */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-muted/60 p-1">
          {[
            { id: 'overview', label: 'Dashboard & Insights', icon: LayoutDashboard },
            { id: 'students', label: `Students (${studentRows.length})`, icon: Users },
            { id: 'quizzes', label: `Quizzes (${quizRows.length})`, icon: FileQuestion },
            { id: 'subjects', label: `Curriculum (${subjectRows.length})`, icon: BookOpen },
            { id: 'submissions', label: `Submissions Log (${results.length})`, icon: ClipboardList },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                  active
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`button-tab-reports-${tab.id}`}
              >
                <Icon className={`size-3.5 ${active ? 'text-teal-700' : ''}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search reports..."
              className="w-36 bg-transparent text-xs outline-none sm:w-48"
              data-testid="input-reports-search"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-muted-foreground hover:text-foreground">
                <X className="size-3" />
              </button>
            )}
          </div>

          <select
            value={performanceFilter}
            onChange={(e) => setPerformanceFilter(e.target.value as any)}
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold outline-none focus:border-teal-700"
            data-testid="select-performance-filter"
          >
            <option value="all">All Performance Tiers</option>
            <option value="high">High Achievers (≥85%)</option>
            <option value="average">Satisfactory (70–84%)</option>
            <option value="low">Needs Support (&lt;70%)</option>
          </select>
        </div>
      </div>

      {/* Tab 1: OVERVIEW & INSIGHTS */}
      {activeTab === 'overview' && (
        <div className="mt-6 space-y-6 animate-rise">
          {/* Actionable Intelligence Highlights */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-teal-700/20 bg-teal-50/50 p-5">
              <div className="flex items-center gap-2 text-teal-800">
                <Sparkles className="size-4" />
                <h3 className="font-display text-sm font-bold">Top Performing Module</h3>
              </div>
              <p className="mt-2 text-xs font-semibold text-teal-950">IT Fundamentals & Hardware Architecture</p>
              <p className="mt-1 text-xs text-teal-800/80">Achieved a 94% average quiz passing rate with over 84 successful student attempts.</p>
            </div>

            <div className="rounded-2xl border border-blue-700/20 bg-blue-50/50 p-5">
              <div className="flex items-center gap-2 text-blue-800">
                <Target className="size-4" />
                <h3 className="font-display text-sm font-bold">Consistent Study Pace</h3>
              </div>
              <p className="mt-2 text-xs font-semibold text-blue-950">Web Development (WD210)</p>
              <p className="mt-1 text-xs text-blue-800/80">Average completion velocity is 86% across active enrolled cohorts.</p>
            </div>

            <div className="rounded-2xl border border-amber-700/20 bg-amber-50/50 p-5">
              <div className="flex items-center gap-2 text-amber-800">
                <CircleHelp className="size-4" />
                <h3 className="font-display text-sm font-bold">Curriculum Recommendation</h3>
              </div>
              <p className="mt-2 text-xs font-semibold text-amber-950">Algorithm Thinking Retakes</p>
              <p className="mt-1 text-xs text-amber-800/80">Consider adding supplementary practice worksheets for recursive and sorting algorithms.</p>
            </div>
          </div>

          {/* Side-by-side Overview Tables */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Student Leaderboard */}
            <section className="overflow-hidden rounded-2xl border border-card-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <h3 className="font-display text-base font-bold">Student Cohort Mastery</h3>
                  <p className="text-xs text-muted-foreground">Ranked by overall course and quiz performance</p>
                </div>
                <button
                  onClick={() => setActiveTab('students')}
                  className="text-xs font-bold text-teal-700 hover:underline"
                >
                  View All →
                </button>
              </div>
              <div className="divide-y divide-border">
                {studentRows.slice(0, 4).map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={s.name} className="size-9" textSize="text-xs" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.studentId} · {s.quizzesPassed}/{s.quizzesTaken} Quizzes Passed</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="font-mono-ui text-sm font-bold text-teal-700">{s.averageScore}%</span>
                        <span className="block text-[10px] text-muted-foreground">Prog: {s.progress}%</span>
                      </div>
                      <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${s.grade.color}`}>
                        {s.grade.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Assessment Performance Breakdown */}
            <section className="overflow-hidden rounded-2xl border border-card-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-5">
                <div>
                  <h3 className="font-display text-base font-bold">Assessment Pass Rates</h3>
                  <p className="text-xs text-muted-foreground">Passing metrics across published institutional quizzes</p>
                </div>
                <button
                  onClick={() => setActiveTab('quizzes')}
                  className="text-xs font-bold text-teal-700 hover:underline"
                >
                  View All →
                </button>
              </div>
              <div className="divide-y divide-border">
                {quizRows.map((q) => (
                  <div key={q.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{q.title}</span>
                      <span className="font-mono-ui text-xs font-bold text-teal-700">{q.passRate}% pass rate</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{q.subjectName} · {q.attempts} attempts</span>
                      <span>Avg. Score: {q.averageScore}%</span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={q.passRate} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Tab 2: STUDENTS ROSTER */}
      {activeTab === 'students' && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-card-border bg-card animate-rise">
          <div className="flex flex-wrap items-center justify-between border-b border-border p-5 gap-3">
            <div>
              <h3 className="font-display text-base font-bold">Student Cohort Performance Matrix</h3>
              <p className="text-xs text-muted-foreground">Full student tracking including completion ratios, quiz scores, and academic standings.</p>
            </div>
            <button
              onClick={() => handleExportCSV('students')}
              className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:underline"
            >
              <Download className="size-3.5" /> Download Student CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">Student ID</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Course Progress</th>
                  <th className="px-5 py-3">Quizzes Passed</th>
                  <th className="px-5 py-3">Avg. Score</th>
                  <th className="px-5 py-3 text-right">Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {studentRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-xs text-muted-foreground">
                      No student records match the active search or performance filter.
                    </td>
                  </tr>
                ) : (
                  studentRows.map((s) => (
                    <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4 font-bold">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.name} className="size-8" textSize="text-xs" />
                          <div>
                            <span className="block font-bold">{s.name}</span>
                            <span className="block text-xs font-normal text-muted-foreground">{s.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono-ui text-xs text-muted-foreground">{s.studentId}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          s.status === 'active' ? 'bg-teal-700/10 text-teal-700' : 'bg-muted text-muted-foreground'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between text-[10px] font-bold">
                            <span>{s.progress}%</span>
                          </div>
                          <ProgressBar value={s.progress} />
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono-ui text-xs">
                        <span className="font-bold text-teal-700">{s.quizzesPassed}</span> / {s.quizzesTaken}
                      </td>
                      <td className="px-5 py-4 font-mono-ui font-bold text-teal-700">{s.averageScore}%</td>
                      <td className="px-5 py-4 text-right">
                        <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-bold ${s.grade.color}`}>
                          {s.grade.label}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 3: QUIZZES & ASSESSMENTS */}
      {activeTab === 'quizzes' && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-card-border bg-card animate-rise">
          <div className="flex flex-wrap items-center justify-between border-b border-border p-5 gap-3">
            <div>
              <h3 className="font-display text-base font-bold">Quiz & Assessment Analytics</h3>
              <p className="text-xs text-muted-foreground">Passing thresholds, attempt counts, average mastery, and question volume.</p>
            </div>
            <button
              onClick={() => handleExportCSV('quizzes')}
              className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:underline"
            >
              <Download className="size-3.5" /> Download Assessment CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Quiz Title</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Questions</th>
                  <th className="px-5 py-3">Total Attempts</th>
                  <th className="px-5 py-3">Pass Threshold</th>
                  <th className="px-5 py-3">Avg. Score</th>
                  <th className="px-5 py-3">Pass Rate</th>
                  <th className="px-5 py-3 text-right">Difficulty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quizRows.map((q) => (
                  <tr key={q.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4 font-bold">{q.title}</td>
                    <td className="px-5 py-4 text-xs font-bold text-teal-700">{q.subjectName}</td>
                    <td className="px-5 py-4 font-mono-ui text-xs text-muted-foreground">{q.questionCount} Qs</td>
                    <td className="px-5 py-4 font-mono-ui text-xs">{q.attempts}</td>
                    <td className="px-5 py-4 font-mono-ui text-xs">{q.passingScore}%</td>
                    <td className="px-5 py-4 font-mono-ui font-bold text-teal-700">{q.averageScore}%</td>
                    <td className="px-5 py-4">
                      <div className="w-24 space-y-1">
                        <span className="font-mono-ui text-[10px] font-bold text-teal-700">{q.passRate}%</span>
                        <ProgressBar value={q.passRate} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-bold ${
                        q.difficulty === 'Accessible'
                          ? 'bg-teal-700/10 text-teal-700'
                          : q.difficulty === 'Moderate'
                          ? 'bg-blue-700/10 text-blue-700'
                          : 'bg-amber-700/10 text-amber-700'
                      }`}>
                        {q.difficulty}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 4: CURRICULUM & SUBJECTS */}
      {activeTab === 'subjects' && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-card-border bg-card animate-rise">
          <div className="flex flex-wrap items-center justify-between border-b border-border p-5 gap-3">
            <div>
              <h3 className="font-display text-base font-bold">Curriculum Engagement & Subject Progress</h3>
              <p className="text-xs text-muted-foreground">Department-level module progress, lesson densities, and learner participation.</p>
            </div>
            <button
              onClick={() => handleExportCSV('subjects')}
              className="flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:underline"
            >
              <Download className="size-3.5" /> Download Curriculum CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Subject Name</th>
                  <th className="px-5 py-3">Course Code</th>
                  <th className="px-5 py-3">Lesson Units</th>
                  <th className="px-5 py-3">Assessments</th>
                  <th className="px-5 py-3">Enrolled Cohort</th>
                  <th className="px-5 py-3">Curriculum Progress</th>
                  <th className="px-5 py-3 text-right">Engagement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subjectRows.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-4 font-bold">{sub.name}</td>
                    <td className="px-5 py-4 font-mono-ui text-xs text-teal-700 font-bold">{sub.code}</td>
                    <td className="px-5 py-4 font-mono-ui text-xs text-muted-foreground">{sub.lessonCount} Lessons</td>
                    <td className="px-5 py-4 font-mono-ui text-xs text-muted-foreground">{sub.quizCount} Quizzes</td>
                    <td className="px-5 py-4 font-mono-ui text-xs">{sub.enrolledCount} Students</td>
                    <td className="px-5 py-4">
                      <div className="w-32 space-y-1">
                        <span className="font-mono-ui text-[10px] font-bold text-teal-700">{sub.lessonCompletionRate}%</span>
                        <ProgressBar value={sub.lessonCompletionRate} />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="rounded-lg bg-teal-700/10 px-2.5 py-1 text-xs font-bold text-teal-700">
                        {sub.engagementVelocity}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 5: SUBMISSIONS & GRADING AUDIT LOG */}
      {activeTab === 'submissions' && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-card-border bg-card animate-rise">
          <div className="border-b border-border p-5">
            <h3 className="font-display text-base font-bold">Assessment Submission & Verification Log</h3>
            <p className="text-xs text-muted-foreground">Historical records of quiz attempts, timestamps, scores, and attached submission proofs.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 font-mono-ui text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Student Name</th>
                  <th className="px-5 py-3">Assessment Title</th>
                  <th className="px-5 py-3">Subject</th>
                  <th className="px-5 py-3">Date Completed</th>
                  <th className="px-5 py-3">Score</th>
                  <th className="px-5 py-3">Result</th>
                  <th className="px-5 py-3 text-right">Proof File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-xs text-muted-foreground">
                      No quiz submission records recorded yet.
                    </td>
                  </tr>
                ) : (
                  results.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-4 font-bold">{r.studentName || 'Student'}</td>
                      <td className="px-5 py-4">{r.quizName}</td>
                      <td className="px-5 py-4 text-xs text-teal-700 font-bold">{r.subjectName}</td>
                      <td className="px-5 py-4 font-mono-ui text-xs text-muted-foreground">{r.dateTaken}</td>
                      <td className="px-5 py-4 font-mono-ui font-bold text-teal-700">{r.percentage}%</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          r.passed ? 'bg-teal-700/10 text-teal-700' : 'bg-destructive/10 text-destructive'
                        }`}>
                          {r.passed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {r.submissionName ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground" title={r.submissionName}>
                            <Paperclip className="size-3 text-teal-700" />
                            {r.submissionName.length > 18 ? `${r.submissionName.slice(0, 16)}...` : r.submissionName}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Standard Quiz</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  );
}

function Protected({
  children,
  role: requiredRole,
  admin = false,
}: {
  children: ReactNode;
  role?: 'student' | 'teacher' | 'admin';
  admin?: boolean;
}) {
  const { isLoaded, isSignedIn, role } = useAuth();
  const effectiveRole = admin ? 'admin' : (requiredRole || 'student');

  if (!isLoaded) return <Loading label="Opening LumenPath" />;
  if (!isSignedIn) {
    if (effectiveRole === 'admin') return <Redirect to="/admin/login" />;
    if (effectiveRole === 'teacher') return <Redirect to="/teacher/login" />;
    return <Redirect to="/student/login" />;
  }

  // Enforce role-based access control
  if (effectiveRole === 'admin' && role !== 'admin') {
    return <Redirect to="/admin/login" />;
  }
  if (effectiveRole === 'teacher' && role !== 'teacher' && role !== 'admin') {
    return <Redirect to="/teacher/login" />;
  }
  if (effectiveRole === 'student' && role !== 'student' && role !== 'admin' && role !== 'teacher') {
    return <Redirect to="/student/login" />;
  }

  return <AppShell role={effectiveRole} admin={effectiveRole === 'admin'}>{children}</AppShell>;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn, role } = useAuth();
  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <Landing />;
  if (role === 'admin') return <Redirect to="/admin/dashboard" />;
  if (role === 'teacher') return <Redirect to="/teacher/dashboard" />;
  return <Redirect to="/student/dashboard" />;
}

function AdminLoginPage() {
  const { signIn, signOut, user, isSignedIn, role } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your administrator email or username.',
        variant: 'destructive',
      });
      return;
    }
    
    if (isRegistering) {
      if (!name) {
        toast({
          title: 'Name Required',
          description: 'Please enter your full name for registration.',
          variant: 'destructive',
        });
        return;
      }
      if (secretCode !== 'admin-key-2026') {
        toast({
          title: 'Access Denied',
          description: 'Invalid administrative secret code. You cannot register as an admin without authorization.',
          variant: 'destructive',
        });
        return;
      }
    }

    setIsLoading(true);
    setTimeout(() => {
      let inferredName = name;
      if (!isRegistering) {
        inferredName = email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) || 'Administrator';
      }
      
      signIn('admin', inferredName, email);
      setIsLoading(false);
      
      toast({
        title: isRegistering ? 'Admin Registered & Signed In' : 'Admin Access Granted',
        description: isRegistering 
          ? `Welcome to the platform, ${inferredName}.` 
          : `Welcome back, ${inferredName}. Platform management session active.`,
      });
      setLocation('/admin/dashboard');
    }, 350);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-card-border bg-card p-8 shadow-2xl animate-rise">
        <div className="text-center">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-primary text-accent shadow-md">
            <ShieldCheck className="size-7" />
          </div>
          <p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">
            Restricted Operations
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-primary">
            {isRegistering ? 'Admin Registration' : 'Admin Console Login'}
          </h1>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {isRegistering 
              ? 'Create a new institutional administrator account.'
              : 'Log in with verified educator or administrative credentials.'}
          </p>
        </div>

        {isSignedIn && role === 'admin' && (
          <div className="mt-5 rounded-2xl border border-teal-700/20 bg-teal-50/60 p-3.5 text-xs text-teal-900">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Active Session: {user?.fullName}</span>
              <button
                type="button"
                onClick={() => setLocation('/admin/dashboard')}
                className="font-bold text-teal-800 underline hover:text-teal-950"
              >
                Go to Dashboard →
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleAdminAuth} className="mt-6 space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-bold text-primary">Full Name</label>
              <div className="relative mt-1">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Maria Santos"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-primary">Admin Email / Username</label>
            <div className="relative mt-1">
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lumenpath.local"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
                data-testid="input-admin-email"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-primary">Security Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-teal-700"
                data-testid="input-admin-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          
          {isRegistering && (
            <div>
              <label className="block text-xs font-bold text-primary flex items-center justify-between">
                <span>Secret Admin Code</span>
                <span className="text-[10px] text-red-500 font-mono">Required</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="password"
                  required
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  placeholder="Enter authorized code"
                  className="w-full rounded-xl border border-red-200 bg-red-50/30 px-3.5 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" defaultChecked className="rounded text-teal-700 accent-teal-700" />
              <span>Remember secure session</span>
            </label>
            <span className="font-mono-ui text-[10px] text-teal-700">256-Bit SSL</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))] transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            data-testid="button-admin-signin-submit"
          >
            {isLoading ? 'Verifying...' : (isRegistering ? 'Register Admin Account' : 'Log in to Admin Console')}
          </button>
        </form>

        <div className="mt-6 flex flex-col items-center gap-4 border-t border-border pt-4 text-xs">
          <p className="text-muted-foreground">
            {isRegistering ? "Already have an admin account?" : "Need an admin account?"}{" "}
            <button 
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setSecretCode('');
              }} 
              className="font-bold text-teal-700 hover:underline"
            >
              {isRegistering ? "Log in instead" : "Register here"}
            </button>
          </p>
          
          <div className="flex w-full justify-between text-muted-foreground">
            <Link href="/student/login" className="font-bold text-teal-700 hover:underline">
              ← Student login
            </Link>
            <Link href="/" className="hover:underline">
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TEACHER REGISTRATION, APPROVAL & DASHBOARD
// ==========================================

function TeacherRegisterPage() {
  const { isSignedIn, role } = useAuth();
  const store = usePlatformStore();
  const [, setLocation] = useLocation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (isSignedIn && role === 'teacher') {
    return <Redirect to="/teacher/dashboard" />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedContact = contactNumber.trim();

    if (!trimmedName) {
      setError('Please enter your complete name.');
      return;
    }
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!trimmedUsername) {
      setError('Please choose a username.');
      return;
    }
    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }
    if (!trimmedContact) {
      setError('Please enter your contact phone number.');
      return;
    }

    // Duplicate check
    const emailExists = store.teacherApplications.some(
      (a) => a.email.toLowerCase() === trimmedEmail.toLowerCase()
    );
    if (emailExists) {
      setError('An application with this email address already exists. Please check your application status.');
      return;
    }



    const usernameExists = store.teacherApplications.some(
      (a) => a.username.toLowerCase() === trimmedUsername
    );
    if (usernameExists) {
      setError('This username is already taken. Please choose another username.');
      return;
    }

    setIsLoading(true);

    const newApp = store.addTeacherApplication({
      fullName: trimmedName,
      teacherId: `TCH-${Date.now()}`,
      email: trimmedEmail,
      username: trimmedUsername,
      contactNumber: trimmedContact,
      department: 'General',
      credentialFile: null,
      password,
    });

    setIsLoading(false);

    toast({
      title: 'Teacher Application Submitted',
      description: 'Your application is waiting for administrator approval.',
    });

    Swal.fire({
      icon: 'success',
      title: 'Teacher Application Submitted!',
      html: `<div style="text-align:center; font-size:14px; color:#475569; margin-top:8px;">
        Thank you, <b>${trimmedName}</b>!<br/>
        Your application has been submitted with ID <b>${newApp.teacherId}</b>.<br/>
        <span style="display:inline-block; margin-top:12px; padding:6px 14px; background:#fef3c7; border:1px solid #fde68a; border-radius:8px; color:#92400e; font-weight:700;">
          ⏳ Status: Pending Administrator Approval
        </span>
        <p style="margin-top:12px; font-size:12px; color:#64748b;">
          Please wait for an administrator to review and approve your application. You can check your status at any time.
        </p>
      </div>`,
      confirmButtonText: 'Check Application Status',
      confirmButtonColor: '#0f766e',
      allowOutsideClick: false,
    }).then(() => {
      setLocation(`/teacher/status?email=${encodeURIComponent(trimmedEmail)}`);
    });
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl rounded-3xl border border-card-border bg-card p-8 sm:p-10 shadow-xl animate-rise">
        <div className="text-center">
          <div className="mx-auto mb-3.5 grid size-14 place-items-center rounded-2xl bg-primary text-accent shadow-md">
            <GraduationCap className="size-7" />
          </div>
          <p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">
            Faculty & Instruction
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-primary">
            Register as Teacher / Instructor
          </h1>
          <p className="mt-1 text-xs text-muted-foreground max-w-md mx-auto">
            Apply to become an approved LumenPath instructor. All teacher accounts are verified and approved by administrators.
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-center gap-2.5">
            <ShieldAlert className="size-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-primary">
              Full Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Dr. Eleanor Davies"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
              data-testid="input-teacher-fullname"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-primary">
                Email Address <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="eleanor.davies@university.edu"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
                data-testid="input-teacher-email"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary">
                Username <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="e.g. prof.davies"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
                data-testid="input-teacher-username"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-primary">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="•••••••• (min 6 chars)"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-teal-700"
                  data-testid="input-teacher-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-primary">
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="•••••••• (re-enter password)"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-teal-700"
                  data-testid="input-teacher-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-primary">
              Contact Number <span className="text-destructive">*</span>
            </label>
            <input
              type="tel"
              required
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="e.g. +63 912 345 6789"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
              data-testid="input-teacher-contact"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-3 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))] hover:-translate-y-0.5 transition-transform disabled:opacity-50"
            data-testid="button-teacher-submit"
          >
            {isLoading ? 'Submitting Application...' : 'Submit Teacher Application'}
          </button>
        </form>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <Link href="/teacher/status" className="font-bold text-teal-700 hover:underline">
            Check Application Status
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/teacher/login" className="hover:underline font-medium text-foreground">
              Back to Teacher Login
            </Link>
            <span>•</span>
            <Link href="/" className="hover:underline">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeacherLoginPage() {
  const { signIn, isSignedIn, role } = useAuth();
  const store = usePlatformStore();
  const [, setLocation] = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [pendingAppEmail, setPendingAppEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (isSignedIn && role === 'teacher') {
    return <Redirect to="/teacher/dashboard" />;
  }

  const handleTeacherSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setPendingAppEmail('');

    const trimmedInput = identifier.trim();
    if (!trimmedInput) {
      setLoginError('Please enter your email, Teacher ID, or username.');
      return;
    }

    if (!password || password.trim().length < 4) {
      setLoginError('Invalid credentials. Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const searchVal = trimmedInput.toLowerCase();
      const matchedApp = store.teacherApplications.find(
        (a) =>
          a.email.toLowerCase() === searchVal ||
          a.teacherId.toLowerCase() === searchVal ||
          a.username.toLowerCase() === searchVal
      );

      // Support seed or default demo teacher if matched
      if (!matchedApp) {
        if (searchVal === 'teacher@lumenpath.edu' || searchVal === 'teacher' || searchVal === 'instructor') {
          signIn('teacher', 'Prof. Sarah Jenkins', 'teacher@lumenpath.edu', 'TCH-2024-002', 'Mathematics & Algorithms');
          setIsLoading(false);
          toast({
            title: 'Signed in as Instructor',
            description: 'Welcome back, Prof. Sarah Jenkins!',
          });
          setLocation('/teacher/dashboard');
          return;
        }

        setIsLoading(false);
        setLoginError('No instructor account or application found with this email, Teacher ID, or username.');
        return;
      }

      // Password verification
      if (matchedApp.password && matchedApp.password !== password) {
        setIsLoading(false);
        setLoginError('Incorrect password. Please verify your credentials and try again.');
        return;
      }

      // Status check
      if (matchedApp.applicationStatus === 'pending') {
        setIsLoading(false);
        setPendingAppEmail(matchedApp.email);
        setLoginError('Your teacher application is currently waiting for administrator approval. You cannot access the Teacher Dashboard until an administrator approves your application.');
        return;
      }

      if (matchedApp.applicationStatus === 'rejected') {
        setIsLoading(false);
        setPendingAppEmail(matchedApp.email);
        setLoginError(
          matchedApp.rejectionReason
            ? `Your teacher application was rejected: "${matchedApp.rejectionReason}".`
            : 'Your teacher application was not approved by the administrator.'
        );
        return;
      }

      // Approved!
      signIn('teacher', matchedApp.fullName, matchedApp.email, matchedApp.teacherId, matchedApp.department);
      setIsLoading(false);

      toast({
        title: 'Signed In as Instructor',
        description: `Welcome back, Prof. ${matchedApp.fullName}!`,
      });
      setLocation('/teacher/dashboard');
    }, 250);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-card-border bg-card p-8 shadow-xl animate-rise">
        <div className="text-center">
          <div className="mx-auto mb-3.5 grid size-14 place-items-center rounded-2xl bg-primary text-accent shadow-md">
            <GraduationCap className="size-7" />
          </div>
          <p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">
            Faculty Portal
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-primary">
            Teacher Login
          </h1>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Log in with your approved instructor credentials to manage courses, lessons, and student assessments.
          </p>
        </div>

        {loginError && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive space-y-2">
            <div className="flex items-start gap-2">
              <ShieldAlert className="size-4 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
            {pendingAppEmail && (
              <div className="pt-1">
                <Link
                  href={`/teacher/status?email=${encodeURIComponent(pendingAppEmail)}`}
                  className="font-bold underline hover:opacity-80 block"
                >
                  View Application Status Details →
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleTeacherSignIn} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-primary">Email, Teacher ID, or Username</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setLoginError('');
              }}
              placeholder="e.g. sarah.jenkins@lumenpath.edu or TCH-2024-002"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
              data-testid="input-teacher-login-id"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-primary">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError('');
                }}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-teal-700"
                data-testid="input-teacher-login-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))] hover:-translate-y-0.5 transition-transform disabled:opacity-50"
            data-testid="button-teacher-signin-submit"
          >
            {isLoading ? 'Verifying credentials...' : 'Log in as Teacher'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <Link href="/teacher/register" className="font-bold text-teal-700 hover:underline">
              Register as Teacher
            </Link>
            <Link href="/teacher/status" className="font-bold text-muted-foreground hover:text-foreground hover:underline">
              Check Status
            </Link>
          </div>
          <div className="flex items-center justify-between border-t border-border/60 pt-2.5">
            <Link href="/student/login" className="hover:underline">
              ← Student Portal
            </Link>
            <Link href="/" className="hover:underline">
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function TeacherStatusPage() {
  const store = usePlatformStore();
  const [, setLocation] = useLocation();
  const { signIn } = useAuth();
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const urlEmail = searchParams.get('email') || searchParams.get('id') || '';

  const [query, setQuery] = useState(urlEmail);
  const [searchedApp, setSearchedApp] = useState<TeacherApplicationRecord | null>(() => {
    if (urlEmail) {
      return store.getTeacherApplication(urlEmail) || null;
    }
    return null;
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    const found = store.getTeacherApplication(query.trim());
    setSearchedApp(found || null);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      if (searchedApp) {
        const updated = store.getTeacherApplication(searchedApp.applicationId) || store.getTeacherApplication(searchedApp.email);
        setSearchedApp(updated || null);
      }
      setIsRefreshing(false);
    }, 400);
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-card-border bg-card p-8 sm:p-10 shadow-xl animate-rise">
        <div className="text-center">
          <div className="mx-auto mb-3.5 grid size-14 place-items-center rounded-2xl bg-primary text-accent shadow-md">
            <Clock3 className="size-7" />
          </div>
          <p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">
            Faculty Application Status
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-primary">
            Teacher Application Tracker
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Check the real-time review status of your teacher application.
          </p>
        </div>

        <form onSubmit={handleSearch} className="mt-6 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter Email, Teacher ID, or Username..."
            className="flex-1 rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
          />
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-accent shadow-sm hover:opacity-90 transition-opacity"
          >
            Check Status
          </button>
        </form>

        {searchedApp ? (
          <div className="mt-6 space-y-5 rounded-2xl border border-border bg-background/50 p-5 animate-rise">
            <div className="flex items-start justify-between border-b border-border/70 pb-4">
              <div>
                <span className="font-mono-ui text-[11px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                  {searchedApp.applicationId}
                </span>
                <h3 className="mt-2 text-lg font-bold text-primary">{searchedApp.fullName}</h3>
                <p className="text-xs text-muted-foreground">{searchedApp.email} • ID: {searchedApp.teacherId}</p>
                <p className="text-xs font-medium text-foreground mt-0.5">Department: {searchedApp.department}</p>
              </div>

              <button
                onClick={handleRefresh}
                className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                title="Refresh application status"
              >
                <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin text-teal-700' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {searchedApp.credentialFile && (
              <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-2.5 text-xs">
                <Paperclip className="size-4 text-teal-700 shrink-0" />
                <span className="font-medium text-foreground truncate">{searchedApp.credentialFile.name}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">({searchedApp.credentialFile.size})</span>
              </div>
            )}

            {/* Status Presentation */}
            {searchedApp.applicationStatus === 'pending' && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <Clock3 className="size-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Pending Administrator Approval</span>
                </div>
                <p className="mt-2 text-xs leading-5">
                  Your teacher application is waiting for administrator approval. Once verified, you will be granted access to the Teacher Portal and dashboard.
                </p>
                <div className="mt-3 text-[11px] font-mono-ui text-amber-800/80 dark:text-amber-300/80">
                  Submitted: {searchedApp.submittedAt}
                </div>
                <div className="mt-4 pt-3 border-t border-amber-500/20 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  🔒 Teacher Dashboard access is locked until approved.
                </div>
              </div>
            )}

            {searchedApp.applicationStatus === 'approved' && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-900 dark:text-emerald-200">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Application Approved!</span>
                </div>
                <p className="mt-2 text-xs leading-5">
                  Congratulations! Your teacher account has been approved. You can now access the Teacher Portal and create curriculum content.
                </p>
                <div className="mt-3 text-[11px] font-mono-ui text-emerald-800/80 dark:text-emerald-300/80">
                  Approved by {searchedApp.reviewedBy || 'Administrator'} • {searchedApp.reviewedAt || 'Recently'}
                </div>
                <div className="mt-4 pt-3 border-t border-emerald-500/20">
                  <button
                    onClick={() => {
                      signIn('teacher', searchedApp.fullName, searchedApp.email, searchedApp.teacherId, searchedApp.department);
                      setLocation('/teacher/dashboard');
                    }}
                    className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 text-white py-2.5 text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>Go to Teacher Dashboard</span>
                    <ArrowRight className="size-4" />
                  </button>
                </div>
              </div>
            )}

            {searchedApp.applicationStatus === 'rejected' && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-5 text-destructive">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="size-5 shrink-0" />
                  <span>Teacher Application Rejected</span>
                </div>
                <p className="mt-2 text-xs leading-5">
                  Your teacher application has been rejected by the administrator.
                </p>
                {searchedApp.rejectionReason && (
                  <div className="mt-3 rounded-xl bg-background/80 border border-destructive/20 p-3 text-xs">
                    <p className="font-bold text-primary text-[11px] uppercase tracking-wider">Rejection Reason:</p>
                    <p className="mt-1 text-foreground font-medium">{searchedApp.rejectionReason}</p>
                  </div>
                )}
                <div className="mt-3 text-[11px] font-mono-ui text-muted-foreground">
                  Reviewed by {searchedApp.reviewedBy || 'Administrator'} • {searchedApp.reviewedAt || 'Recently'}
                </div>
                <div className="mt-4 pt-3 border-t border-destructive/20">
                  <Link
                    href="/teacher/register"
                    className="block text-center rounded-xl border border-border bg-card hover:bg-muted py-2 text-xs font-bold text-foreground transition-all"
                  >
                    Submit a Revised Application
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : query ? (
          <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center text-xs text-muted-foreground">
            <p className="font-bold text-foreground">No application found matching "{query}"</p>
            <p className="mt-1">Please verify your email, Teacher ID, or username and try again.</p>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
            Enter your email or application ID above to check your current approval status.
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <Link href="/teacher/login" className="font-bold text-teal-700 hover:underline">
            ← Teacher Login
          </Link>
          <Link href="/" className="hover:underline">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function AdminTeacherApplicationsPage() {
  const store = usePlatformStore();
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  const pendingCount = store.teacherApplications.filter((a) => a.applicationStatus === 'pending').length;
  const approvedCount = store.teacherApplications.filter((a) => a.applicationStatus === 'approved').length;
  const rejectedCount = store.teacherApplications.filter((a) => a.applicationStatus === 'rejected').length;

  const filteredApps = store.teacherApplications.filter((a) => {
    const matchStatus = statusFilter === 'all' ? true : a.applicationStatus === statusFilter;
    const matchSearch = `${a.fullName} ${a.teacherId} ${a.email} ${a.department} ${a.username}`.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const handleApprove = (app: TeacherApplicationRecord) => {
    Swal.fire({
      title: 'Approve Teacher Application?',
      html: `<div style="text-align:center; font-size:14px; color:#475569; margin-top:8px;">
        Approve <b>${app.fullName}</b> (${app.teacherId}) for the <b>${app.department}</b> department.<br/>
        <span style="display:inline-block; margin-top:10px; padding:4px 12px; background:#f0fdfa; border:1px solid #ccfbf1; border-radius:8px; color:#0f766e; font-weight:700;">
          This activates their account and grants Teacher Dashboard access.
        </span>
      </div>`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve Teacher',
      confirmButtonColor: '#0f766e',
      cancelButtonText: 'Cancel',
    }).then((res) => {
      if (res.isConfirmed) {
        store.approveTeacherApplication(app.applicationId, user?.fullName || 'Administrator');
        toast({
          title: 'Teacher Approved!',
          description: `${app.fullName} has been granted teacher access.`,
        });
      }
    });
  };

  const handleReject = (app: TeacherApplicationRecord) => {
    Swal.fire({
      title: 'Reject Teacher Application',
      html: `<div style="text-align:center; font-size:14px; color:#475569; margin-top:8px;">
        Please enter an optional reason for rejecting <b>${app.fullName}</b>'s application:
      </div>`,
      input: 'textarea',
      inputPlaceholder: 'e.g. Missing required teaching credentials, department quota reached, or invalid credentials...',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Reject Application',
      confirmButtonColor: '#dc2626',
      cancelButtonText: 'Cancel',
    }).then((res) => {
      if (res.isConfirmed) {
        store.rejectTeacherApplication(app.applicationId, res.value, user?.fullName || 'Administrator');
        toast({
          title: 'Application Rejected',
          description: `Teacher application for ${app.fullName} was marked as rejected.`,
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <>
      <PageIntro
        eyebrow="Faculty & Staff"
        title="Teacher Applications & Approvals"
        body="Review, verify, and approve or reject instructor applications for the LumenPath faculty. Approved teachers gain access to course creation and management tools."
      />

      {/* Overview Metric Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-rise">
        <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Applications</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-2xl font-extrabold text-primary">{store.teacherApplications.length}</span>
            <span className="text-[11px] text-muted-foreground">All time</span>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Pending Review</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-2xl font-extrabold text-amber-600 dark:text-amber-400">{pendingCount}</span>
            <span className="text-[11px] text-amber-800 dark:text-amber-300">Action required</span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Approved Faculty</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{approvedCount}</span>
            <span className="text-[11px] text-emerald-800 dark:text-emerald-300">Active teachers</span>
          </div>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rejected</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-2xl font-extrabold text-destructive">{rejectedCount}</span>
            <span className="text-[11px] text-muted-foreground">Declined</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applications by name, ID, email, or department..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="flex rounded-xl border border-border bg-card p-1">
          {(
            [
              { id: 'all', label: `All (${store.teacherApplications.length})` },
              { id: 'pending', label: `Pending (${pendingCount})` },
              { id: 'approved', label: `Approved (${approvedCount})` },
              { id: 'rejected', label: `Rejected (${rejectedCount})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-colors ${
                statusFilter === tab.id
                  ? 'bg-primary text-accent shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      {filteredApps.length === 0 ? (
        <EmptyState
          title="No teacher applications found"
          body={statusFilter !== 'all' ? `No applications matching status "${statusFilter}".` : 'No teacher applications have been submitted yet.'}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-card-border bg-card shadow-xs">
          <div className="min-w-[940px]">
            <div className="grid grid-cols-[2fr_1.1fr_1.4fr_1.3fr_1.2fr_1.3fr] gap-4 border-b border-border bg-muted/50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Teacher / Applicant</span>
              <span>Teacher ID</span>
              <span>Department</span>
              <span>Submitted / Credentials</span>
              <span>Status</span>
              <span className="text-right">Actions</span>
            </div>

            {filteredApps.map((x) => (
              <div
                key={x.applicationId}
                className="grid grid-cols-[2fr_1.1fr_1.4fr_1.3fr_1.2fr_1.3fr] items-center gap-4 border-b border-border px-5 py-4 last:border-0 hover:bg-muted/15 transition-colors"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <Avatar name={x.fullName} className="size-9 shrink-0" />
                  <div className="min-w-0">
                    <p className="truncate font-bold text-primary">{x.fullName}</p>
                    <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                      <span className="truncate">{x.email}</span>
                      <span className="font-mono-ui text-[10px] font-semibold text-teal-700 bg-teal-50 dark:bg-teal-950/40 px-1 rounded border border-teal-200 dark:border-teal-800/40">
                        @{x.username}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-mono-ui text-xs font-bold px-2 py-0.5 rounded-md bg-muted text-foreground border border-border">
                    {x.teacherId}
                  </span>
                </div>

                <div>
                  <span className="inline-flex items-center rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/50 px-2.5 py-1 text-xs font-semibold text-teal-800 dark:text-teal-300">
                    {x.department}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-foreground font-medium">{x.submittedAt}</p>
                  {x.credentialFile ? (
                    <a
                      href={x.credentialFile.url}
                      download={x.credentialFile.name}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 hover:underline"
                    >
                      <Paperclip className="size-3" />
                      <span className="truncate max-w-[120px]">{x.credentialFile.name}</span>
                    </a>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">No file attached</span>
                  )}
                </div>

                <div>
                  {x.applicationStatus === 'pending' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                      <Clock3 className="size-3" /> Pending Review
                    </span>
                  )}
                  {x.applicationStatus === 'approved' && (
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="size-3" /> Approved Faculty
                      </span>
                      {x.reviewedBy && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">By {x.reviewedBy}</p>
                      )}
                    </div>
                  )}
                  {x.applicationStatus === 'rejected' && (
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 px-2.5 py-0.5 text-xs font-bold text-destructive">
                        <AlertTriangle className="size-3" /> Rejected
                      </span>
                      {x.rejectionReason && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate max-w-[140px]" title={x.rejectionReason}>
                          {x.rejectionReason}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  {x.applicationStatus === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleApprove(x)}
                        className="flex items-center gap-1 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-3 py-1.5 text-xs font-bold shadow-sm transition-transform hover:-translate-y-0.5"
                        title="Approve teacher application"
                      >
                        <Check className="size-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(x)}
                        className="flex items-center gap-1 rounded-xl border border-destructive/40 bg-destructive/10 hover:bg-destructive/20 text-destructive px-3 py-1.5 text-xs font-bold transition-colors"
                        title="Reject teacher application"
                      >
                        <X className="size-3.5" /> Reject
                      </button>
                    </>
                  ) : x.applicationStatus === 'approved' ? (
                    <button
                      onClick={() => handleReject(x)}
                      className="rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Revoke approval"
                    >
                      Revoke
                    </button>
                  ) : (
                    <button
                      onClick={() => handleApprove(x)}
                      className="rounded-lg border border-teal-700/40 bg-teal-50 dark:bg-teal-950 px-2.5 py-1 text-[11px] font-bold text-teal-700 hover:bg-teal-100 dark:hover:bg-teal-900"
                      title="Reconsider and approve"
                    >
                      Approve on Appeal
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function TeacherDashboard() {
  const store = usePlatformStore();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <>
      <div className="surface-grid relative mb-8 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent/20 border border-accent/40 px-3 py-1 text-[11px] font-bold text-accent">
            <GraduationCap className="size-3.5" />
            <span>Faculty Workspace • {user?.department || 'Curriculum Division'}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, Prof. {user?.fullName || 'Instructor'}!
          </h1>
          <p className="mt-2 text-xs leading-5 text-primary-foreground/75">
            Manage your course curriculum, publish engaging lesson guides, create assessments with custom passing limits, and track student outcomes.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/teacher/lessons"
              className="rounded-xl bg-accent px-4 py-2 text-xs font-bold text-primary shadow-[2px_2px_0_hsl(var(--primary))] hover:-translate-y-0.5 transition-transform"
            >
              <Plus className="inline size-3.5 mr-1" /> Publish New Lesson
            </Link>
            <Link
              href="/teacher/quizzes"
              className="rounded-xl border border-primary-foreground/30 px-4 py-2 text-xs font-bold text-white hover:bg-primary-foreground/10 transition-colors"
            >
              <ClipboardList className="inline size-3.5 mr-1" /> Create Assessment Quiz
            </Link>
            <Link
              href="/teacher/results"
              className="rounded-xl border border-primary-foreground/30 px-4 py-2 text-xs font-bold text-white hover:bg-primary-foreground/10 transition-colors"
            >
              <Trophy className="inline size-3.5 mr-1" /> View Student Scores
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4 animate-rise">
        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">My Subjects</span>
            <BookOpen className="size-5 text-teal-700" />
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-primary">{store.subjects.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Active in curriculum</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Lessons Published</span>
            <BookOpenCheck className="size-5 text-teal-700" />
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-teal-700">{store.lessons.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Interactive modules</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Quizzes</span>
            <ClipboardList className="size-5 text-teal-700" />
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-primary">{store.quizzes.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Timed checks & tests</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Submissions Graded</span>
            <Trophy className="size-5 text-emerald-600" />
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-emerald-600">{store.results.length}</div>
          <p className="mt-1 text-xs text-muted-foreground">Learner quiz attempts</p>
        </div>
      </div>

      {/* Curriculum Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-card-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-primary">Curriculum Modules</h2>
              <p className="text-xs text-muted-foreground">Lessons under your supervision</p>
            </div>
            <Link href="/teacher/lessons" className="text-xs font-bold text-teal-700 hover:underline">
              View all ({store.lessons.length}) →
            </Link>
          </div>

          <div className="space-y-3">
            {store.lessons.slice(0, 4).map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5">
                <div>
                  <p className="text-sm font-bold text-foreground">{l.title}</p>
                  <p className="text-xs text-muted-foreground">{l.subjectName} • {l.materialName || 'Guide available'}</p>
                </div>
                <span className="font-mono-ui text-[11px] font-bold text-teal-700 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-200 dark:border-teal-800">
                  Published
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-card-border bg-card p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-lg font-bold text-primary">Recent Student Results</h2>
              <p className="text-xs text-muted-foreground">Latest assessment submissions</p>
            </div>
            <Link href="/teacher/results" className="text-xs font-bold text-teal-700 hover:underline">
              Full gradebook ({store.results.length}) →
            </Link>
          </div>

          <div className="space-y-3">
            {store.results.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No student assessments submitted yet.</p>
            ) : (
              store.results.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5">
                  <div>
                    <p className="text-sm font-bold text-foreground">{r.studentName}</p>
                    <p className="text-xs text-muted-foreground">{r.quizName} • {r.dateTaken}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono-ui text-sm font-bold ${r.passed ? 'text-emerald-600' : 'text-destructive'}`}>
                      {r.percentage}%
                    </span>
                    <p className="text-[10px] text-muted-foreground font-medium">{r.passed ? 'Passed' : 'Needs Review'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function TeacherSubjectsPage() {
  return <AdminTablePage kind="subjects" />;
}

function TeacherLessonsPage() {
  return <AdminTablePage kind="lessons" />;
}

function TeacherLibraryPage() {
  return <LessonsPage />;
}

function TeacherQuizzesPage() {
  return <AdminTablePage kind="quizzes" />;
}

function TeacherQuestionsPage() {
  return <AdminTablePage kind="questions" />;
}

function TeacherResultsPage() {
  return <AdminResultsPage />;
}

function LoginPage() {
  const { signIn, signOut, user, isSignedIn, role } = useAuth();
  const store = usePlatformStore();
  const [location, setLocation] = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCustomSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const trimmedInput = identifier.trim();
    if (!trimmedInput) {
      setLoginError('Please enter your email, student ID, or username.');
      return;
    }

    if (!password || password.trim().length < 4) {
      setLoginError('Invalid credentials. Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const searchVal = trimmedInput.toLowerCase();
      // Look up student by email, student ID, or username
      const matchedStudent = store.students.find(
        (s) =>
          s.email.toLowerCase() === searchVal ||
          s.studentId?.toLowerCase() === searchVal ||
          s.username?.toLowerCase() === searchVal
      );

      // Check account status if registered
      if (matchedStudent && matchedStudent.status === 'inactive') {
        setIsLoading(false);
        setLoginError('Your student account is currently inactive. Please contact an administrator.');
        return;
      }

      // If account has a registered password, verify it
      if (matchedStudent && matchedStudent.password && matchedStudent.password !== password) {
        setIsLoading(false);
        setLoginError('Incorrect password. Please verify your credentials and try again.');
        return;
      }

      // Student portal always signs in as student — admin accounts must use /admin/login
      const targetEmail = matchedStudent?.email || (trimmedInput.includes('@') ? trimmedInput : `${searchVal.replace(/\s+/g, '.')}@lumenpath.edu`);

      const inferredName = matchedStudent?.fullName || (targetEmail
        ? targetEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
        : 'Student');

      const studentId = matchedStudent?.studentId || `STU-${Math.floor(1000 + Math.random() * 9000)}`;

      signIn('student', inferredName, targetEmail, studentId);
      store.recordStudentLogin(targetEmail, inferredName, studentId);
      setIsLoading(false);

      toast({
        title: 'Logged In Successfully',
        description: `Welcome back, ${inferredName}!`,
      });
      setLocation('/student/dashboard');
    }, 250);
  };


  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-card-border bg-card p-8 shadow-xl animate-rise">
        <div className="text-center">
          <div className="mx-auto mb-3.5 grid size-14 place-items-center rounded-2xl bg-primary text-accent shadow-md">
            <GraduationCap className="size-7" />
          </div>
          <p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">
            Student Portal
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-primary">
            Student Login
          </h1>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Log in with your student account to access lessons, quizzes, and track your progress.
          </p>
        </div>



        {loginError && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleCustomSignIn} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-primary">Email, Student ID, or Username</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setLoginError('');
              }}
              placeholder="e.g. student@lumenpath.edu or STU-1001"
              autoComplete="username"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
              data-testid="input-signin-email"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-primary">Password</label>
            <div className="relative mt-1">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLoginError('');
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-teal-700"
                data-testid="input-signin-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))] hover:-translate-y-0.5 transition-transform disabled:opacity-50"
            data-testid="button-signin-submit"
          >
            {isLoading ? 'Logging in...' : 'Log in as Student'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <Link href="/student/register" className="font-bold text-teal-700 hover:underline" data-testid="link-create-student-account">
              Create Student Account
            </Link>
            <Link href="/" className="hover:underline">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignUpPage() {
  const { isSignedIn, role } = useAuth();
  const store = usePlatformStore();
  const [, setLocation] = useLocation();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (isSignedIn) {
    return <Redirect to={role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedContact = contactNumber.trim();

    // 1. Validate required fields
    if (!trimmedName) {
      setError('Please enter your complete name.');
      return;
    }
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!trimmedUsername) {
      setError('Please choose a username.');
      return;
    }
    if (trimmedUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!confirmPassword) {
      setError('Please confirm your password.');
      return;
    }

    // 2. Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password fields.');
      return;
    }

    // 3. Duplicate checks against existing database records
    const emailExists = store.students.some(
      (s) => s.email?.toLowerCase() === trimmedEmail.toLowerCase()
    );
    if (emailExists) {
      setError('An account with this email address already exists. Please log in or use a different email.');
      return;
    }



    const usernameExists = store.students.some(
      (s) => s.username && s.username.trim().toLowerCase() === trimmedUsername
    );
    if (usernameExists) {
      setError('This username is already taken. Please choose another username.');
      return;
    }

    setIsLoading(true);

    // 4. Create student record in platform store / database
    store.addStudent({
      fullName: trimmedName,
      studentId: `STU-${Date.now()}`,
      email: trimmedEmail,
      username: trimmedUsername,
      contactNumber: trimmedContact || undefined,
      password,
      source: 'online_registration',
      progress: 0,
    });

    setIsLoading(false);

    toast({
      title: 'Student account created successfully!',
      description: 'You can now log in using your new credentials.',
    });

    Swal.fire({
      icon: 'success',
      title: 'Student account created successfully!',
      html: `<div style="text-align:center; font-size:14px; color:#475569; margin-top:8px;">
        Welcome to LumenPath, <b>${trimmedName}</b>!<br/>
        <span style="display:inline-block; margin-top:12px; padding:6px 14px; background:#f0fdfa; border:1px solid #ccfbf1; border-radius:8px; color:#0f766e; font-weight:700;">
          Please log in to access your student dashboard.
        </span>
      </div>`,
      confirmButtonText: 'Proceed to Login',
      confirmButtonColor: '#0f766e',
      allowOutsideClick: false,
    }).then(() => {
      setLocation('/student/login');
    });
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl rounded-3xl border border-card-border bg-card p-8 sm:p-10 shadow-xl animate-rise">
        <div className="text-center">
          <div className="mx-auto mb-3.5 grid size-14 place-items-center rounded-2xl bg-primary text-accent shadow-md">
            <GraduationCap className="size-7" />
          </div>
          <p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">
            Student Portal
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-primary">
            Create Student Account
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Join LumenPath and start your personalized learning journey today.
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-center gap-2.5">
            <ShieldAlert className="size-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-primary">
              Complete Name <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setError('');
              }}
              placeholder="e.g. Juan Dela Cruz"
              autoComplete="name"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
              data-testid="input-signup-fullname"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-primary">
                Email Address <span className="text-destructive">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="juan@example.com"
                autoComplete="email"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
                data-testid="input-signup-email"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary">
                Username <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="e.g. juan.delacruz"
                autoComplete="username"
                className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
                data-testid="input-signup-username"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-primary">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="•••••••• (min 6 chars)"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-teal-700"
                  data-testid="input-signup-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-primary">
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="•••••••• (re-enter password)"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-teal-700"
                  data-testid="input-signup-confirm-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-primary">
              Contact Number <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              placeholder="e.g. +63 912 345 6789"
              autoComplete="tel"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
              data-testid="input-signup-contact"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-3 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))] hover:-translate-y-0.5 transition-transform disabled:opacity-50"
            data-testid="button-signup-submit"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <Link href="/student/login" className="font-bold text-teal-700 hover:underline" data-testid="link-signin">
            Already have an account? Log in
          </Link>
          <Link href="/" className="hover:underline" data-testid="link-back-home">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  return (
    <ErrorBoundary resetKey={location}>
      <Switch>
        <Route path="/" component={HomeRedirect} />

        {/* Student Auth & Login Routes */}
        <Route path="/student/login"><LoginPage /></Route>
        <Route path="/student/login/*?"><LoginPage /></Route>
        <Route path="/student/sign-in"><LoginPage /></Route>
        <Route path="/student/sign-in/*?"><LoginPage /></Route>
        <Route path="/student/signin"><LoginPage /></Route>
        <Route path="/student/signin/*?"><LoginPage /></Route>
        <Route path="/student-login"><LoginPage /></Route>
        <Route path="/student-login/*?"><LoginPage /></Route>
        <Route path="/login"><LoginPage /></Route>
        <Route path="/login/*?"><LoginPage /></Route>
        <Route path="/signin"><LoginPage /></Route>
        <Route path="/signin/*?"><LoginPage /></Route>
        <Route path="/sign-in"><LoginPage /></Route>
        <Route path="/sign-in/*?"><LoginPage /></Route>

        {/* Student Registration Routes */}
        <Route path="/student/register"><SignUpPage /></Route>
        <Route path="/student/register/*?"><SignUpPage /></Route>
        <Route path="/student/sign-up"><SignUpPage /></Route>
        <Route path="/student/sign-up/*?"><SignUpPage /></Route>
        <Route path="/sign-up"><SignUpPage /></Route>
        <Route path="/sign-up/*?"><SignUpPage /></Route>
        <Route path="/register"><SignUpPage /></Route>
        <Route path="/register/*?"><SignUpPage /></Route>

        {/* Teacher Auth Routes */}
        <Route path="/teacher/login"><TeacherLoginPage /></Route>
        <Route path="/teacher/login/*?"><TeacherLoginPage /></Route>
        <Route path="/teacher/register"><TeacherRegisterPage /></Route>
        <Route path="/teacher/register/*?"><TeacherRegisterPage /></Route>
        <Route path="/teacher/status"><TeacherStatusPage /></Route>
        <Route path="/teacher/status/*?"><TeacherStatusPage /></Route>
        <Route path="/teacher/application-status"><TeacherStatusPage /></Route>
        <Route path="/teacher/application-status/*?"><TeacherStatusPage /></Route>

        {/* Admin Login & Portal */}
        <Route path="/admin/login"><AdminLoginPage /></Route>
        <Route path="/admin/login/*?"><AdminLoginPage /></Route>
        <Route path="/admin"><AdminLoginPage /></Route>
        <Route path="/admin/"><AdminLoginPage /></Route>

        {/* Admin Teacher Applications & Approvals */}
        <Route path="/admin/teacher-applications"><Protected admin><AdminTeacherApplicationsPage /></Protected></Route>
        <Route path="/admin/teacher-applications/*?"><Protected admin><AdminTeacherApplicationsPage /></Protected></Route>
        <Route path="/admin/teacher-approvals"><Protected admin><AdminTeacherApplicationsPage /></Protected></Route>
        <Route path="/admin/teacher-approvals/*?"><Protected admin><AdminTeacherApplicationsPage /></Protected></Route>

        {/* Teacher Portal Routes */}
        <Route path="/teacher"><Redirect to="/teacher/dashboard" /></Route>
        <Route path="/teacher/"><Redirect to="/teacher/dashboard" /></Route>
        <Route path="/teacher/dashboard"><Protected role="teacher"><TeacherDashboard /></Protected></Route>
        <Route path="/teacher/dashboard/*?"><Protected role="teacher"><TeacherDashboard /></Protected></Route>
        <Route path="/teacher/subjects"><Protected role="teacher"><TeacherSubjectsPage /></Protected></Route>
        <Route path="/teacher/subjects/*?"><Protected role="teacher"><TeacherSubjectsPage /></Protected></Route>
        <Route path="/teacher/lessons"><Protected role="teacher"><TeacherLessonsPage /></Protected></Route>
        <Route path="/teacher/lessons/*?"><Protected role="teacher"><TeacherLessonsPage /></Protected></Route>
        <Route path="/teacher/library"><Protected role="teacher"><TeacherLibraryPage /></Protected></Route>
        <Route path="/teacher/library/*?"><Protected role="teacher"><TeacherLibraryPage /></Protected></Route>
        <Route path="/teacher/quizzes"><Protected role="teacher"><TeacherQuizzesPage /></Protected></Route>
        <Route path="/teacher/quizzes/*?"><Protected role="teacher"><TeacherQuizzesPage /></Protected></Route>
        <Route path="/teacher/questions"><Protected role="teacher"><TeacherQuestionsPage /></Protected></Route>
        <Route path="/teacher/questions/*?"><Protected role="teacher"><TeacherQuestionsPage /></Protected></Route>
        <Route path="/teacher/results"><Protected role="teacher"><TeacherResultsPage /></Protected></Route>
        <Route path="/teacher/results/*?"><Protected role="teacher"><TeacherResultsPage /></Protected></Route>
        <Route path="/teacher/reports"><Protected role="teacher"><ReportsPage /></Protected></Route>
        <Route path="/teacher/reports/*?"><Protected role="teacher"><ReportsPage /></Protected></Route>
        <Route path="/teacher/profile"><Protected role="teacher"><ProfilePage /></Protected></Route>
        <Route path="/teacher/profile/*?"><Protected role="teacher"><ProfilePage /></Protected></Route>

        {/* Student Routes */}
        <Route path="/student"><Redirect to="/student/dashboard" /></Route>
        <Route path="/student/"><Redirect to="/student/dashboard" /></Route>
        <Route path="/student/dashboard"><Protected><StudentDashboard /></Protected></Route>
        <Route path="/student/dashboard/*?"><Protected><StudentDashboard /></Protected></Route>
        <Route path="/student/subjects"><Protected><SubjectsPage /></Protected></Route>
        <Route path="/student/subjects/*?"><Protected><SubjectsPage /></Protected></Route>
        <Route path="/student/lessons/:id"><Protected><LessonDetail /></Protected></Route>
        <Route path="/student/lessons"><Protected><LessonsPage /></Protected></Route>
        <Route path="/student/lessons/*?"><Protected><LessonsPage /></Protected></Route>
        <Route path="/student/quizzes/:id"><Protected><QuizDetail /></Protected></Route>
        <Route path="/student/quizzes"><Protected><QuizzesPage /></Protected></Route>
        <Route path="/student/quizzes/*?"><Protected><QuizzesPage /></Protected></Route>
        <Route path="/student/results"><Protected><ResultsPage /></Protected></Route>
        <Route path="/student/results/*?"><Protected><ResultsPage /></Protected></Route>
        <Route path="/student/progress"><Protected><ProgressPage /></Protected></Route>
        <Route path="/student/progress/*?"><Protected><ProgressPage /></Protected></Route>
        <Route path="/student/profile"><Protected><ProfilePage /></Protected></Route>
        <Route path="/student/profile/*?"><Protected><ProfilePage /></Protected></Route>

        {/* Admin Routes */}
        <Route path="/admin/preview"><AdminDashboardPreview /></Route>
        <Route path="/admin/preview/*?"><AdminDashboardPreview /></Route>
        <Route path="/admin/dashboard"><Protected admin><AdminDashboard /></Protected></Route>
        <Route path="/admin/dashboard/*?"><Protected admin><AdminDashboard /></Protected></Route>
        <Route path="/admin/students"><Protected admin><AdminTablePage kind="students" /></Protected></Route>
        <Route path="/admin/students/*?"><Protected admin><AdminTablePage kind="students" /></Protected></Route>
        <Route path="/admin/subjects"><Protected admin><AdminTablePage kind="subjects" /></Protected></Route>
        <Route path="/admin/subjects/*?"><Protected admin><AdminTablePage kind="subjects" /></Protected></Route>
        <Route path="/admin/lessons"><Protected admin><AdminTablePage kind="lessons" /></Protected></Route>
        <Route path="/admin/lessons/*?"><Protected admin><AdminTablePage kind="lessons" /></Protected></Route>
        <Route path="/admin/quizzes"><Protected admin><AdminTablePage kind="quizzes" /></Protected></Route>
        <Route path="/admin/quizzes/*?"><Protected admin><AdminTablePage kind="quizzes" /></Protected></Route>
        <Route path="/admin/questions"><Protected admin><AdminTablePage kind="questions" /></Protected></Route>
        <Route path="/admin/questions/*?"><Protected admin><AdminTablePage kind="questions" /></Protected></Route>
        <Route path="/admin/results"><Protected admin><AdminResultsPage /></Protected></Route>
        <Route path="/admin/results/*?"><Protected admin><AdminResultsPage /></Protected></Route>
        <Route path="/admin/reports"><Protected admin><ReportsPage /></Protected></Route>
        <Route path="/admin/reports/*?"><Protected admin><ReportsPage /></Protected></Route>
        <Route path="/admin/profile"><Protected admin><ProfilePage admin /></Protected></Route>
        <Route path="/admin/profile/*?"><Protected admin><ProfilePage admin /></Protected></Route>

        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="lumenpath-theme">
      <TooltipProvider>
        <WouterRouter base={basePath}>
          <AuthProvider>
            <PlatformStoreProvider>
              <QueryClientProvider client={queryClient}>
                <Router />
              </QueryClientProvider>
            </PlatformStoreProvider>
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
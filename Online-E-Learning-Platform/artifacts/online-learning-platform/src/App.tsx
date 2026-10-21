import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { AuthProvider, useAuth, DEFAULT_STUDENT, DEFAULT_ADMIN } from '@/lib/auth-context';
import { PlatformStoreProvider, usePlatformStore, type ActiveQuizSession } from '@/lib/platform-store';
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
  ['/student/dashboard', 'Overview', LayoutDashboard],
  ['/student/subjects', 'Subjects', BookOpen],
  ['/student/lessons', 'Lessons', BookOpenCheck],
  ['/student/quizzes', 'Quizzes', ClipboardList],
  ['/student/results', 'Results', Trophy],
  ['/student/progress', 'Progress', LineChart],
  ['/student/profile', 'Profile', UserRound],
];

const adminNav = [
  ['/admin/dashboard', 'Overview', LayoutDashboard],
  ['/admin/students', 'Students', Users],
  ['/admin/subjects', 'Subjects', BookOpen],
  ['/admin/lessons', 'Lessons', BookOpenCheck],
  ['/admin/quizzes', 'Quizzes', ClipboardList],
  ['/admin/questions', 'Question bank', FileQuestion],
  ['/admin/results', 'Results', Trophy],
  ['/admin/reports', 'Reports', BarChart3],
  ['/admin/profile', 'Settings', Settings],
];

function AppShell({ children, admin = false, preview = false }: { children: ReactNode; admin?: boolean; preview?: boolean }) {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, signOut, switchRole } = useAuth();
  const me = user || (admin ? DEFAULT_ADMIN : DEFAULT_STUDENT);
  const nav = (admin ? adminNav : studentNav) as [string, string, any][];

  const handleSignOut = () => {
    signOut();
    setLocation(admin ? '/admin/login' : '/student/login');
  };

  const isItemActive = (href: string) => {
    if (href === '/student/dashboard' || href === '/admin/dashboard') {
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
          {admin ? 'Operations & Admin' : 'My Learning Space'}
        </div>

        {/* Scrollable nav area */}
        <nav className="mt-2 flex-1 overflow-y-auto px-5 pb-2 space-y-1" aria-label={admin ? 'Admin navigation' : 'Student navigation'}>
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
              href={admin ? '/admin/profile' : '/student/profile'}
              onClick={() => setOpen(false)}
              className="group flex items-center gap-3 transition-opacity hover:opacity-95"
              data-testid="link-sidebar-profile-card"
            >
              <Avatar name={me?.fullName ?? (admin ? 'Administrator' : 'Student')} src={me?.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-sidebar-foreground group-hover:text-accent" data-testid="text-shell-name">
                  {me?.fullName ?? (admin ? 'Admin User' : 'Student')}
                </p>
                <p className="text-xs text-sidebar-foreground/55">{admin ? 'Administrator' : me?.studentId ?? 'Student'}</p>
              </div>
            </Link>
            <div className="mt-3 flex items-center justify-between border-t border-sidebar-border pt-3">
              {admin ? (
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
  const activeLessons = selectedSubjectId ? lessons.filter((l) => l.subjectId === selectedSubjectId) : [];
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
          <div className="rounded-2xl border border-card-border bg-card p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="rounded-lg bg-secondary px-2.5 py-1 font-mono-ui text-xs font-bold text-secondary-foreground">
                  {activeSubject.code}
                </span>
                <h2 className="mt-3 font-display text-2xl font-extrabold">{activeSubject.name}</h2>
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{activeSubject.description}</p>
              </div>
              <Link
                href={`/student/lessons?subject=${activeSubject.id}`}
                className="rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-accent"
              >
                Explore all lessons in this subject →
              </Link>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-card-border bg-card p-6">
              <h3 className="font-display text-lg font-bold">Lessons ({activeLessons.length})</h3>
              <div className="mt-4 divide-y divide-border">
                {activeLessons.length === 0 ? (
                  <p className="py-4 text-xs text-muted-foreground">No lessons currently scheduled in this subject.</p>
                ) : (
                  activeLessons.map((l) => (
                    <div key={l.id} className="flex items-center justify-between py-3">
                      <div>
                        <Link href={`/student/lessons/${l.id}`} className="text-sm font-bold hover:text-teal-700">
                          {l.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{l.completed ? 'Completed' : `${l.progress}% progress`}</p>
                      </div>
                      <Link href={`/student/lessons/${l.id}`} className="text-xs font-bold text-teal-700">
                        {l.completed ? 'Review' : 'Study →'}
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>

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
  const { toast } = useToast();
  const [filter, setFilter] = useState<'all' | 'incomplete' | 'completed'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const shown = lessons.filter((l) => {
    const matchFilter = filter === 'all' || (filter === 'completed' ? l.completed : !l.completed);
    const matchSubject = subjectFilter === 'all' || l.subjectId === Number(subjectFilter);
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

        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-bold text-primary outline-none"
          data-testid="select-lessons-subject"
        >
          <option value="all">All subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
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
  const nextLesson = lessons.find((item) => item.id > lessonId) || null;

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
                <p className="font-bold leading-6">{question.text}</p>
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
              </div>
            </div>
          </fieldset>
        ))}
      </div>

      {/* Optional Student Work / Scratchpad / Proof Upload */}
      <div className={`rounded-2xl border border-dashed border-border bg-card p-6 space-y-3 ${isLocked ? 'opacity-60 pointer-events-none' : ''}`}>
        <div>
          <h3 className="font-display text-sm font-bold flex items-center gap-2">
            <UploadCloud className="size-4 text-teal-700" /> Upload Your Work / Solutions (Optional)
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Attach handwritten calculations, diagrams, or code file to accompany your quiz submission.
          </p>
        </div>
        <FileUploadDropZone
          label="Attach work proof"
          hint="Upload PDF, Image, Code, or Text file (Max 25MB)"
          file={quizSubmission}
          onFileChange={isLocked ? () => {} : setQuizSubmission}
          id="quiz-student-upload"
          compact
        />
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
              Platform Operations & Overview
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
  const { toast } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'registered' | 'active' | 'inactive'>('all');
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
  const [lessonForm, setLessonForm] = useState({ title: '', subjectId: store.subjects[0]?.id || 1, description: '' });
  const [lessonFile, setLessonFile] = useState<{ name: string; url: string; size: string; type: string } | null>(null);

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

  const [questionForm, setQuestionForm] = useState({ text: '', type: 'multiple_choice', points: 1 });

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
          const matchSearch = `${s.fullName} ${s.studentId} ${s.email} ${s.source || ''}`.toLowerCase().includes(search.toLowerCase());
          return matchStatus && matchSearch;
        });
      case 'subjects':
        return store.subjects.filter((s) => `${s.name} ${s.code} ${s.description}`.toLowerCase().includes(search.toLowerCase()));
      case 'lessons':
        return store.lessons.filter((l) => `${l.title} ${l.subjectName} ${l.description} ${l.materialName || ''}`.toLowerCase().includes(search.toLowerCase()));
      case 'quizzes':
        return store.quizzes.filter((q) => `${q.title} ${q.subjectName} ${q.attachmentName || ''}`.toLowerCase().includes(search.toLowerCase()));
      case 'questions':
        return store.questions.filter((q) => `${q.text} ${q.type}`.toLowerCase().includes(search.toLowerCase()));
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
      if (!lessonForm.title) return;
      store.addLesson({
        ...lessonForm,
        materialName: lessonFile?.name || null,
        materialUrl: lessonFile?.url || null,
        materialSize: lessonFile?.size || null,
        materialType: lessonFile?.type || null,
      });
      const publishedTitle = lessonForm.title;
      setLessonForm({ title: '', subjectId: store.subjects[0]?.id || 1, description: '' });
      setLessonFile(null);
      Swal.fire({
        icon: 'success',
        title: 'Lesson Published',
        text: `${publishedTitle} has been published successfully.`,
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
      });
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
      if (!questionForm.text) return;
      store.addQuestion(questionForm);
      setQuestionForm({ text: '', type: 'multiple_choice', points: 1 });
      Swal.fire({
        icon: 'success',
        title: 'Question Added',
        text: 'Question bank has been updated.',
        confirmButtonColor: '#0f766e',
        timer: 2000,
      });
    }
    setShowModal(false);
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
                    placeholder="e.g. Binary Search Trees"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Subject</label>
                  <select
                    value={lessonForm.subjectId}
                    onChange={(e) => setLessonForm({ ...lessonForm, subjectId: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    {store.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">Description</label>
                  <textarea
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                    placeholder="Summary of this lesson..."
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
              </div>
            )}

            {kind === 'questions' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-foreground">Question Text</label>
                  <input
                    required
                    value={questionForm.text}
                    onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                    placeholder="What is the time complexity of binary search?"
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Type</label>
                  <select
                    value={questionForm.type}
                    onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="true_false">True / False</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground">Points</label>
                  <input
                    type="number"
                    value={questionForm.points}
                    onChange={(e) => setQuestionForm({ ...questionForm, points: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all"
                data-testid={`button-save-add-${kind}`}
              >
                <Save className="size-4" /> Save {kind.slice(0, -1)}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setLessonFile(null);
                  setQuizFile(null);
                }}
                className="rounded-xl border border-border px-4 py-2.5 text-xs font-bold text-foreground hover:bg-muted"
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

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <Search className="size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${kind === 'students' ? 'students by name, email, ID, or date' : kind}...`}
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
                    <p className="truncate text-xs text-muted-foreground">{x.email}</p>
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
                  ) : (
                    <span className="rounded bg-teal-700/10 px-2 py-0.5 text-[10px] font-bold text-teal-700">
                      Published
                    </span>
                  )}
                </div>

                <div className="flex justify-end items-center gap-1">
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
                  : 'As students sign in to their learning dashboard, their login timestamps, dates, and email addresses will automatically be recorded here.'}
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
    </>
  );
}

function AdminResultsPage() {
  const { results, students, quizzes, subjects, addManualResult, deleteResult } = usePlatformStore();
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed' | 'with-proof'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [viewingResult, setViewingResult] = useState<any | null>(null);

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-card-border bg-card p-6 md:p-8 shadow-2xl animate-rise">
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
            { id: 'overview', label: 'Overview & Insights', icon: LayoutDashboard },
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

function Protected({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { isLoaded, isSignedIn, role } = useAuth();
  if (!isLoaded) return <Loading label="Opening LumenPath" />;
  if (!isSignedIn) return <Redirect to={admin ? "/admin/login" : "/student/login"} />;
  if (admin && role !== 'admin') {
    return <Redirect to="/admin/login" />;
  }
  return <AppShell admin={admin}>{children}</AppShell>;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn, role } = useAuth();
  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <Landing />;
  return <Redirect to={role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} />;
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
              : 'Sign in with verified educator or administrative credentials.'}
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
            {isLoading ? 'Verifying...' : (isRegistering ? 'Register Admin Account' : 'Sign in to Admin Console')}
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
              {isRegistering ? "Sign in instead" : "Register here"}
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

function SignInPage() {
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

      const isInputAdmin = trimmedInput.toLowerCase().includes('admin');
      const targetRole = isInputAdmin ? 'admin' : 'student';

      const targetEmail = matchedStudent?.email || (trimmedInput.includes('@') ? trimmedInput : `${searchVal.replace(/\s+/g, '.')}@lumenpath.edu`);

      const inferredName = matchedStudent?.fullName || (targetEmail
        ? targetEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
        : targetRole === 'admin' ? 'Administrator' : 'Student');

      const studentId = matchedStudent?.studentId || (targetRole === 'student' ? `STU-${Math.floor(1000 + Math.random() * 9000)}` : undefined);

      signIn(targetRole, inferredName, targetEmail, studentId);
      setIsLoading(false);

      if (targetRole === 'student') {
        store.recordStudentLogin(targetEmail, inferredName, studentId);
        toast({
          title: 'Signed In Successfully',
          description: `Welcome back, ${inferredName}!`,
        });
        setLocation('/student/dashboard');
      } else {
        toast({
          title: 'Admin Session Active',
          description: `Welcome, ${inferredName}.`,
        });
        setLocation('/admin/dashboard');
      }
    }, 250);
  };

  const handleQuickDemo = () => {
    setIdentifier('student@lumenpath.edu');
    setPassword('student123');
    setLoginError('');
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
            Sign in with your student account to access lessons, quizzes, and track your progress.
          </p>
        </div>

        {isSignedIn && (
          <div className="mt-5 rounded-2xl border border-teal-700/20 bg-teal-50/60 p-3.5 text-xs text-teal-900">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold truncate">
                Active {role === 'admin' ? 'Admin' : 'Student'}: {user?.fullName || user?.email}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setLocation(role === 'admin' ? '/admin/dashboard' : '/student/dashboard')}
                  className="font-bold text-teal-800 underline hover:text-teal-950"
                >
                  Dashboard →
                </button>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="text-muted-foreground hover:text-destructive underline text-[11px]"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demo Student Quick Fill Helper */}
        <div className="mt-4 rounded-2xl border border-border bg-muted/40 p-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <GraduationCap className="size-4 text-teal-700" />
              <span>Demo: <strong className="text-foreground">student@lumenpath.edu</strong></span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemo}
              className="rounded-lg bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-teal-800 hover:bg-primary/20 transition-colors"
              data-testid="button-fill-demo-student"
            >
              Fill Demo
            </button>
          </div>
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
            {isLoading ? 'Signing in...' : 'Sign in as Student'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <Link href="/sign-up" className="font-bold text-teal-700 hover:underline">
              Create student account
            </Link>
            <Link href="/admin/login" className="font-semibold text-muted-foreground hover:text-foreground">
              Admin console login →
            </Link>
          </div>
          <div className="text-center">
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
  const { signUp, isSignedIn, role } = useAuth();
  const store = usePlatformStore();
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const { toast } = useToast();

  if (isSignedIn) {
    return <Redirect to={role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const studentName = name.trim() || 'New Learner';
    const studentEmail = email.trim() || 'learner@lumenpath.local';
    const studentId = `STU-${Math.floor(1000 + Math.random() * 9000)}`;

    // Add student to store/database automatically
    store.addStudent({
      fullName: studentName,
      email: studentEmail,
      studentId,
      source: 'online_registration',
      progress: 0,
    });

    // Create session and record successful initial login
    signUp(studentName, studentEmail, 'student');
    store.recordStudentLogin(studentEmail, studentName, studentId);

    toast({
      title: 'Registration Successful',
      description: `Welcome ${studentName}! Your student account is active.`,
    });

    setLocation('/student/dashboard');
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-card-border bg-card p-8 shadow-xl">
        <div className="text-center">
          <div className="inline-block mb-3">
            <Brand />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-primary">Join LumenPath</h1>
          <p className="mt-1 text-xs text-muted-foreground">Create your student account to track progress and earn milestones</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-primary">Full Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Taylor Swift"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
              data-testid="input-signup-name"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-primary">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="taylor@example.com"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
              data-testid="input-signup-email"
            />
          </div>

          <button
            type="submit"
            className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))] hover:-translate-y-0.5 transition-transform"
            data-testid="button-signup-submit"
          >
            Create My Student Account
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
          <Link href="/student/login" className="font-bold text-teal-700 hover:underline">
            Already have an account? Sign in
          </Link>
          <Link href="/" className="hover:underline">
            ← Back to home
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
        <Route path="/student/login"><SignInPage /></Route>
        <Route path="/student/login/*?"><SignInPage /></Route>
        <Route path="/student/sign-in"><SignInPage /></Route>
        <Route path="/student/sign-in/*?"><SignInPage /></Route>
        <Route path="/student/signin"><SignInPage /></Route>
        <Route path="/student/signin/*?"><SignInPage /></Route>
        <Route path="/student-login"><SignInPage /></Route>
        <Route path="/student-login/*?"><SignInPage /></Route>
        <Route path="/login"><SignInPage /></Route>
        <Route path="/login/*?"><SignInPage /></Route>
        <Route path="/signin"><SignInPage /></Route>
        <Route path="/signin/*?"><SignInPage /></Route>
        <Route path="/sign-in"><SignInPage /></Route>
        <Route path="/sign-in/*?"><SignInPage /></Route>

        {/* Student Registration Routes */}
        <Route path="/student/register"><SignUpPage /></Route>
        <Route path="/student/register/*?"><SignUpPage /></Route>
        <Route path="/student/sign-up"><SignUpPage /></Route>
        <Route path="/student/sign-up/*?"><SignUpPage /></Route>
        <Route path="/sign-up"><SignUpPage /></Route>
        <Route path="/sign-up/*?"><SignUpPage /></Route>
        <Route path="/register"><SignUpPage /></Route>
        <Route path="/register/*?"><SignUpPage /></Route>

        {/* Admin Login & Portal */}
        <Route path="/admin/login"><AdminLoginPage /></Route>
        <Route path="/admin/login/*?"><AdminLoginPage /></Route>
        <Route path="/admin"><AdminLoginPage /></Route>
        <Route path="/admin/"><AdminLoginPage /></Route>

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
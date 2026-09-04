import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  ArrowRight, BarChart3, Bell, BookOpen, BookOpenCheck, Check, CheckCircle2,
  ChevronRight, CircleHelp, ClipboardList, Clock3, FileQuestion, Filter,
  GraduationCap, LayoutDashboard, LineChart, ListFilter, LogOut, Menu, MoreHorizontal,
  Pencil, Plus, Search, Settings, ShieldCheck, Sparkles, Target, Trash2, Trophy,
  UserRound, Users, X, Zap,
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

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#182338', colorForeground: '#182338', colorMutedForeground: '#6d7481',
    colorDanger: '#cc5149', colorBackground: '#fffdf8', colorInput: '#faf6ed',
    colorInputForeground: '#182338', colorNeutral: '#ded8cb', fontFamily: 'DM Sans', borderRadius: '0.85rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center', cardBox: 'bg-[#fffdf8] rounded-2xl w-[440px] max-w-full overflow-hidden',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none', footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#182338] font-bold', headerSubtitle: 'text-[#6d7481]', socialButtonsBlockButtonText: 'text-[#182338]',
    formFieldLabel: 'text-[#182338]', footerActionLink: 'text-[#176b61] font-bold', footerActionText: 'text-[#6d7481]',
    dividerText: 'text-[#6d7481]', identityPreviewEditButton: 'text-[#176b61]', formFieldSuccessText: 'text-[#176b61]',
    alertText: 'text-[#182338]', logoBox: 'h-12', logoImage: 'h-10', socialButtonsBlockButton: 'border-[#ded8cb] bg-[#faf6ed]',
    formButtonPrimary: 'bg-[#182338] text-[#ffd64d] hover:bg-[#263754]', formFieldInput: 'bg-[#faf6ed] border-[#ded8cb] text-[#182338]',
    footerAction: 'bg-transparent', dividerLine: 'bg-[#ded8cb]', alert: 'bg-[#f8e4df]', otpCodeFieldInput: 'bg-[#faf6ed]',
    formFieldRow: 'gap-2', main: 'bg-transparent',
  },
};

function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" className={`flex items-center gap-2.5 ${compact ? '' : 'group'}`} data-testid="link-brand">
    <span className="grid size-9 place-items-center rounded-xl bg-accent shadow-[3px_3px_0_hsl(var(--primary))] transition-transform group-hover:-translate-y-0.5">
      <GraduationCap className="size-5 text-primary" />
    </span>
    {!compact && <span className="font-display text-lg font-extrabold tracking-tight text-primary">Lumen<span className="text-teal-700">Path</span></span>}
  </Link>;
}

function Avatar({ name = 'Student', src }: { name?: string; src?: string | null }) {
  return src ? <img src={src} alt="" className="size-9 rounded-full object-cover" data-testid="img-avatar" /> :
    <span className="grid size-9 place-items-center rounded-full bg-secondary font-display text-sm font-bold text-secondary-foreground" data-testid="img-avatar">{name.split(' ').map((x) => x[0]).join('').slice(0, 2)}</span>;
}

function Loading({ label = 'Loading your learning space' }: { label?: string }) {
  return <div className="space-y-5 animate-pulse" data-testid="status-loading">
    <div className="h-10 w-2/5 rounded-xl bg-muted" /><div className="h-4 w-3/5 rounded bg-muted" />
    <div className="grid gap-4 md:grid-cols-3"><div className="h-32 rounded-2xl bg-muted" /><div className="h-32 rounded-2xl bg-muted" /><div className="h-32 rounded-2xl bg-muted" /></div>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>;
}

function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center" data-testid="status-error">
    <CircleHelp className="mx-auto mb-3 size-8 text-destructive" /><h3 className="font-display text-lg font-bold">That page took a wrong turn</h3>
    <p className="mt-1 text-sm text-muted-foreground">We couldn't load this space. Your progress is safe.</p>
    {onRetry && <button onClick={onRetry} className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground" data-testid="button-retry">Try again</button>}
  </div>;
}

function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center" data-testid="status-empty">
    <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground"><BookOpen className="size-5" /></div>
    <h3 className="font-display text-lg font-bold">{title}</h3><p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>{action && <div className="mt-5">{action}</div>}
  </div>;
}

const studentNav = [
  ['/student/dashboard', 'Overview', LayoutDashboard], ['/student/subjects', 'Subjects', BookOpen],
  ['/student/lessons', 'Lessons', BookOpenCheck], ['/student/quizzes', 'Quizzes', ClipboardList],
  ['/student/results', 'Results', Trophy], ['/student/progress', 'Progress', LineChart],
];
const adminNav = [
  ['/admin/dashboard', 'Overview', LayoutDashboard], ['/admin/students', 'Students', Users],
  ['/admin/subjects', 'Subjects', BookOpen], ['/admin/lessons', 'Lessons', BookOpenCheck],
  ['/admin/quizzes', 'Quizzes', ClipboardList], ['/admin/questions', 'Question bank', FileQuestion],
  ['/admin/results', 'Results', Trophy], ['/admin/reports', 'Reports', BarChart3],
];

function AppShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { signOut } = useClerk();
  const meQuery = useGetMe();
  const me = meQuery.data as any;
  const nav = (admin ? adminNav : studentNav) as any[];
  return <div className="min-h-[100dvh] bg-background">
    <aside className={`fixed inset-y-0 left-0 z-40 w-[250px] -translate-x-full border-r border-sidebar-border bg-sidebar p-5 transition-transform md:translate-x-0 ${open ? 'translate-x-0' : ''}`}>
      <div className="flex items-center justify-between"><Brand /><button onClick={() => setOpen(false)} className="text-sidebar-foreground md:hidden" data-testid="button-close-menu"><X className="size-5" /></button></div>
      <div className="mt-10 px-2 text-[10px] font-bold uppercase tracking-[.18em] text-sidebar-foreground/50">{admin ? 'Operations' : 'My learning'}</div>
      <nav className="mt-3 space-y-1" aria-label={admin ? 'Admin navigation' : 'Student navigation'}>
        {nav.map(([href, label, Icon]) => <Link key={href} href={href} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${location === href ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-[3px_3px_0_hsl(var(--sidebar-border))]' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon className="size-[18px]" /><span>{label}</span>{location === href && <ChevronRight className="ml-auto size-4" />}</Link>)}
      </nav>
      <div className="absolute inset-x-5 bottom-5 rounded-2xl border border-sidebar-border bg-sidebar-accent p-4">
        <div className="flex items-center gap-2"><Avatar name={me?.fullName ?? 'Student'} src={me?.avatarUrl} /><div className="min-w-0"><p className="truncate text-sm font-bold text-sidebar-foreground" data-testid="text-shell-name">{me?.fullName ?? 'Your account'}</p><p className="text-xs text-sidebar-foreground/55">{admin ? 'Administrator' : me?.studentId ?? 'Student'}</p></div></div>
        <button onClick={() => signOut({ redirectUrl: basePath || '/' })} className="mt-4 flex w-full items-center gap-2 border-t border-sidebar-border pt-3 text-xs font-bold text-sidebar-foreground/70 hover:text-accent" data-testid="button-sign-out"><LogOut className="size-3.5" /> Sign out</button>
      </div>
    </aside>
    <div className="md:pl-[250px]">
      <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur-md md:px-9">
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-muted md:hidden" data-testid="button-open-menu"><Menu className="size-5" /></button>
        <div className="hidden text-sm font-semibold text-muted-foreground md:block">{admin ? 'LumenPath / Operations' : 'LumenPath / Your learning space'}</div>
        <div className="ml-auto flex items-center gap-4"><button className="relative rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid="button-notifications"><Bell className="size-5" /><span className="absolute right-1 top-1 size-1.5 rounded-full bg-accent" /></button><Link href={admin ? '/admin/profile' : '/student/profile'} data-testid="link-header-profile"><Avatar name={me?.fullName ?? 'Student'} src={me?.avatarUrl} /></Link></div>
      </header>
      <main className="mx-auto max-w-[1440px] p-5 md:p-9">{children}</main>
    </div>
  </div>;
}

function PageIntro({ eyebrow, title, body, action }: { eyebrow?: string; title: string; body?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-teal-700">{eyebrow}</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-primary md:text-4xl" data-testid="text-page-title">{title}</h1>{body && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{body}</p>}</div>{action}</div>;
}

function Stat({ label, value, note, icon: Icon, accent = false }: { label: string; value: ReactNode; note?: string; icon: any; accent?: boolean }) {
  return <div className={`rounded-2xl border p-5 ${accent ? 'border-primary bg-primary text-primary-foreground' : 'border-card-border bg-card'}`} data-testid={`stat-${label.toLowerCase().replaceAll(' ', '-')}`}><div className="flex items-center justify-between"><span className={`text-xs font-bold uppercase tracking-wider ${accent ? 'text-primary-foreground/65' : 'text-muted-foreground'}`}>{label}</span><Icon className={`size-5 ${accent ? 'text-accent' : 'text-teal-700'}`} /></div><div className="mt-3 font-display text-3xl font-extrabold">{value}</div>{note && <p className={`mt-1 text-xs ${accent ? 'text-primary-foreground/65' : 'text-muted-foreground'}`}>{note}</p>}</div>;
}

function ProgressBar({ value, dark = false }: { value: number; dark?: boolean }) {
  return <div className={`h-2 overflow-hidden rounded-full ${dark ? 'bg-primary-foreground/15' : 'bg-muted'}`}><div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>;
}

function Landing() {
  return <div className="min-h-[100dvh] overflow-hidden bg-background">
    <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 md:px-8"><Brand /><div className="flex items-center gap-3"><Link href="/sign-in" className="hidden rounded-xl px-4 py-2 text-sm font-bold text-primary hover:bg-muted sm:block" data-testid="link-sign-in">Sign in</Link><Link href="/sign-up" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))] transition-transform hover:-translate-y-0.5" data-testid="link-sign-up">Start learning <ArrowRight className="ml-1 inline size-4" /></Link></div></header>
    <section className="surface-grid relative mx-4 overflow-hidden rounded-[2rem] bg-primary px-6 py-16 text-primary-foreground md:mx-8 md:px-16 md:py-24 lg:px-24"><div className="relative z-10 max-w-3xl animate-rise"><div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-bold text-accent"><Sparkles className="size-3.5" /> Make progress you can feel</div><h1 className="max-w-4xl font-display text-5xl font-extrabold leading-[.96] tracking-[-.045em] md:text-7xl">A clearer path to<br /><span className="text-accent">what's next.</span></h1><p className="mt-7 max-w-xl text-base leading-7 text-primary-foreground/70 md:text-lg">LumenPath gives every lesson a place, every question a purpose, and every small win room to count.</p><div className="mt-9 flex flex-wrap gap-3"><Link href="/sign-up" className="rounded-xl bg-accent px-5 py-3 font-bold text-primary transition-transform hover:-translate-y-0.5" data-testid="link-hero-start">Build your learning rhythm <ArrowRight className="ml-2 inline size-4" /></Link><Link href="/sign-in" className="rounded-xl border border-primary-foreground/25 px-5 py-3 font-bold text-primary-foreground hover:bg-primary-foreground/10" data-testid="link-hero-sign-in">I already have an account</Link></div></div><div className="absolute -right-20 -top-16 hidden size-[420px] rounded-full border-[50px] border-accent/20 md:block" /><div className="absolute -bottom-40 right-24 hidden size-[360px] rounded-full border-[50px] border-teal-400/20 md:block" /></section>
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28"><div className="grid gap-10 md:grid-cols-[.8fr_1.2fr]"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-teal-700">A better study loop</p><h2 className="mt-4 max-w-md font-display text-4xl font-extrabold leading-tight text-primary">Less hunting.<br />More learning.</h2></div><div className="grid gap-4 sm:grid-cols-3"><Feature n="01" icon={Target} title="Know the next move" body="A focused dashboard turns your goals into a short, doable queue." /><Feature n="02" icon={Zap} title="Practice with purpose" body="Quizzes reveal what to revisit, not just what you got wrong." /><Feature n="03" icon={Trophy} title="See your momentum" body="Progress is measured in the moments you keep showing up." /></div></div></section>
    <section className="border-y border-border bg-secondary/40 px-5 py-20 md:px-8 md:py-24"><div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-teal-700">Designed for real days</p><h2 className="mt-4 font-display text-4xl font-extrabold leading-tight text-primary">A study space that<br />keeps its promise.</h2><p className="mt-5 max-w-md leading-7 text-muted-foreground">No noisy feed. No endless dashboard. Just the right context, a calm place to work, and a record of the progress you earned.</p><div className="mt-7 flex items-center gap-3 text-sm font-bold text-primary"><span className="grid size-8 place-items-center rounded-full bg-accent"><Check className="size-4" /></span> Save your place across every session</div></div><div className="rounded-3xl border border-card-border bg-card p-5 shadow-[10px_10px_0_hsl(var(--secondary))]"><div className="flex items-center justify-between border-b border-border pb-4"><div><p className="text-xs font-bold text-muted-foreground">THIS WEEK</p><p className="mt-1 font-display text-xl font-bold">Your learning rhythm</p></div><span className="rounded-lg bg-accent px-2 py-1 font-mono-ui text-[10px] font-bold">+4.2%</span></div><div className="mt-6 flex h-40 items-end gap-3 px-2">{[38, 52, 45, 72, 61, 86, 94].map((x, i) => <div key={i} className="group flex flex-1 flex-col items-center gap-2"><div className={`w-full rounded-t-lg transition-all group-hover:opacity-80 ${i === 6 ? 'bg-accent' : 'bg-teal-700/70'}`} style={{ height: `${x}%` }} /><span className="font-mono-ui text-[9px] text-muted-foreground">{['M','T','W','T','F','S','S'][i]}</span></div>)}</div></div></div></section>
    <footer className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8"><Brand /><span>Learning is a direction, not a deadline.</span></footer>
  </div>;
}

function Feature({ n, icon: Icon, title, body }: { n: string; icon: any; title: string; body: string }) {
  return <div className="rounded-2xl border border-card-border bg-card p-5 transition-transform hover:-translate-y-1"><div className="flex items-center justify-between"><span className="font-mono-ui text-[10px] text-muted-foreground">{n}</span><Icon className="size-5 text-teal-700" /></div><h3 className="mt-8 font-display text-lg font-bold text-primary">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></div>;
}

function StudentDashboard() {
  const q = useGetStudentDashboard(); const dashboard = q.data as any;
  if (q.isLoading) return <Loading />; if (q.isError || !dashboard) return <ErrorState onRetry={() => q.refetch()} />;
  const stats = dashboard.stats ?? {};
  return <><PageIntro eyebrow="Monday, a fresh start" title={`Good morning, ${dashboard.profile?.fullName?.split(' ')[0] ?? 'there'}.`} body="A little direction goes a long way. Here's your learning space for today." action={<Link href="/student/lessons" className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))]" data-testid="link-dashboard-browse">Browse lessons <ArrowRight className="ml-1 inline size-4" /></Link>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-rise"><Stat label="Overall progress" value={`${stats.progress ?? 0}%`} note="Keep your streak alive" icon={LineChart} accent /><Stat label="Subjects" value={stats.totalSubjects ?? 0} note="In your curriculum" icon={BookOpen} /><Stat label="Lessons done" value={stats.lessonsCompleted ?? 0} note="One idea at a time" icon={BookOpenCheck} /><Stat label="Average score" value={`${stats.averageScore ?? 0}%`} note={`${stats.quizzesTaken ?? 0} quizzes taken`} icon={Trophy} /></div>
    <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_.65fr]"><section className="rounded-2xl border border-card-border bg-card p-6"><div className="flex items-center justify-between"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">Continue where you left off</p><h2 className="mt-1 font-display text-xl font-bold">Recent lessons</h2></div><Link href="/student/lessons" className="text-xs font-bold text-teal-700" data-testid="link-dashboard-lessons">View all</Link></div><div className="mt-5 divide-y divide-border">{(dashboard.recentLessons ?? []).slice(0, 4).map((l: any) => <Link href={`/student/lessons/${l.id}`} key={l.id} className="group flex items-center gap-4 py-4 first:pt-0 last:pb-0" data-testid={`link-recent-lesson-${l.id}`}><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-teal-700"><BookOpenCheck className="size-5" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-teal-700">{l.subjectName}</span><span className="mt-1 block truncate font-bold">{l.title}</span><span className="mt-2 block"><ProgressBar value={l.progress ?? 0} /></span></span><span className="font-mono-ui text-xs text-muted-foreground">{l.completed ? 'Done' : `${l.progress ?? 0}%`}</span><ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></Link>)}</div></section><section className="rounded-2xl bg-primary p-6 text-primary-foreground"><div className="flex items-center justify-between"><p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-accent">A nudge for you</p><Sparkles className="size-4 text-accent" /></div><h2 className="mt-6 max-w-xs font-display text-2xl font-bold">Small sessions add up.</h2><p className="mt-3 text-sm leading-6 text-primary-foreground/65">Your next recommended lesson is a great 15-minute win.</p>{dashboard.recommendedLessons?.[0] && <Link href={`/student/lessons/${dashboard.recommendedLessons[0].id}`} className="mt-8 flex items-center justify-between rounded-xl bg-primary-foreground/10 p-3 text-sm font-bold hover:bg-primary-foreground/15" data-testid="link-recommended-lesson"><span className="truncate">{dashboard.recommendedLessons[0].title}</span><ArrowRight className="ml-2 size-4 shrink-0 text-accent" /></Link>}</section></div>
  </>;
}

function SubjectsPage() {
  const q = useListSubjects(); const subjects = (q.data as any[]) ?? []; const [search, setSearch] = useState('');
  if (q.isLoading) return <Loading label="Gathering your subjects" />; if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const filtered = subjects.filter((s) => `${s.name} ${s.code}`.toLowerCase().includes(search.toLowerCase()));
  return <><PageIntro eyebrow="Your curriculum" title="Subjects" body="A map of the ideas you're building, one subject at a time." /><div className="mb-6 flex max-w-md items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"><Search className="size-4 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a subject" className="w-full bg-transparent text-sm outline-none" data-testid="input-subject-search" /></div>{filtered.length === 0 ? <EmptyState title="No subjects found" body="Try a different search or check back when your curriculum is published." /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filtered.map((s) => <Link key={s.id} href={`/student/subjects?subject=${s.id}`} className="group rounded-2xl border border-card-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-teal-700/40 hover:shadow-[5px_5px_0_hsl(var(--secondary))]" data-testid={`card-subject-${s.id}`}><div className="flex items-start justify-between"><span className="rounded-lg bg-secondary px-2 py-1 font-mono-ui text-[10px] font-bold text-secondary-foreground">{s.code}</span><ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></div><h2 className="mt-7 font-display text-xl font-bold">{s.name}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{s.description}</p><div className="mt-7 flex items-end justify-between text-xs"><span className="text-muted-foreground">{s.lessonCount} lessons · {s.quizCount} quizzes</span><span className="font-mono-ui font-bold text-teal-700">{s.progress}%</span></div><div className="mt-2"><ProgressBar value={s.progress} /></div></Link>)}</div>}</>;
}

function LessonsPage() {
  const q = useListLessons(); const lessons = (q.data as any[]) ?? []; const complete = useCompleteLesson(); const [filter, setFilter] = useState('all');
  if (q.isLoading) return <Loading label="Lining up your lessons" />; if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const shown = lessons.filter((l) => filter === 'all' || (filter === 'completed' ? l.completed : !l.completed));
  return <><PageIntro eyebrow="Build your rhythm" title="Lessons" body="Pick a lesson, make a little progress, and leave a note for tomorrow." action={<div className="flex rounded-xl border border-border bg-card p-1">{['all','incomplete','completed'].map((x) => <button key={x} onClick={() => setFilter(x)} className={`rounded-lg px-3 py-2 text-xs font-bold capitalize ${filter === x ? 'bg-primary text-accent' : 'text-muted-foreground'}`} data-testid={`button-filter-${x}`}>{x}</button>)}</div>} />{shown.length === 0 ? <EmptyState title="A clear page" body="Nothing matches this filter yet. Your next lesson is waiting when you're ready." /> : <div className="space-y-3">{shown.map((l) => <div key={l.id} className="group flex flex-col gap-4 rounded-2xl border border-card-border bg-card p-5 transition-all hover:border-teal-700/40 sm:flex-row sm:items-center" data-testid={`row-lesson-${l.id}`}><span className={`grid size-11 shrink-0 place-items-center rounded-xl ${l.completed ? 'bg-accent text-primary' : 'bg-secondary text-teal-700'}`}>{l.completed ? <CheckCircle2 className="size-5" /> : <BookOpenCheck className="size-5" />}</span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-teal-700">{l.subjectName}</p><Link href={`/student/lessons/${l.id}`} className="mt-1 block truncate font-display text-lg font-bold hover:text-teal-700" data-testid={`link-lesson-${l.id}`}>{l.title}</Link><p className="mt-1 truncate text-sm text-muted-foreground">{l.description}</p></div><div className="w-full sm:w-32"><div className="mb-1 flex justify-between text-[10px] font-bold text-muted-foreground"><span>Progress</span><span>{l.progress ?? 0}%</span></div><ProgressBar value={l.progress ?? 0} /></div>{!l.completed && <button onClick={() => complete.mutate({ id: l.id }, { onSuccess: () => q.refetch() })} disabled={complete.isPending} className="rounded-xl border border-border px-3 py-2 text-xs font-bold hover:bg-accent disabled:opacity-50" data-testid={`button-complete-lesson-${l.id}`}>{complete.isPending ? 'Saving…' : 'Mark done'}</button>}</div>)}</div>}</>;
}

function LessonDetail() {
  const { id } = useParams<{ id: string }>(); const lessonId = Number(id); const q = useGetLesson(lessonId, { query: { queryKey: getGetLessonQueryKey(lessonId), enabled: !!lessonId } }); const complete = useCompleteLesson();
  if (q.isLoading) return <Loading />; if (q.isError || !q.data) return <ErrorState onRetry={() => q.refetch()} />; const l = q.data as any;
  return <><Link href="/student/lessons" className="mb-7 inline-flex items-center gap-2 text-xs font-bold text-teal-700" data-testid="link-back-lessons">← All lessons</Link><div className="grid gap-8 xl:grid-cols-[1fr_320px]"><article className="rounded-2xl border border-card-border bg-card p-6 md:p-10"><p className="font-mono-ui text-[10px] font-bold uppercase tracking-[.2em] text-teal-700">{l.subjectName}</p><h1 className="mt-4 font-display text-4xl font-extrabold leading-tight text-primary" data-testid="text-lesson-title">{l.title}</h1><p className="mt-4 text-lg leading-8 text-muted-foreground">{l.description}</p><div className="my-8 h-px bg-border" /><div className="prose prose-stone max-w-none text-[15px] leading-8" dangerouslySetInnerHTML={{ __html: l.content ?? '<p>Your lesson content will appear here.</p>' }} /><h2 className="mt-10 font-display text-xl font-bold">By the end, you'll be able to</h2><ul className="mt-4 space-y-3">{(l.objectives ?? []).map((o: string, i: number) => <li key={i} className="flex gap-3 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-teal-700" />{o}</li>)}</ul></article><aside className="h-fit rounded-2xl bg-primary p-6 text-primary-foreground xl:sticky xl:top-24"><p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-accent">Lesson progress</p><div className="mt-5 flex items-baseline justify-between"><span className="font-display text-4xl font-extrabold">{l.completed ? 100 : l.progress ?? 0}%</span><span className="text-xs text-primary-foreground/55">{l.completed ? 'Complete' : 'In progress'}</span></div><div className="mt-3"><ProgressBar value={l.completed ? 100 : l.progress ?? 0} dark /></div>{l.materialUrl && <a href={l.materialUrl} target="_blank" rel="noreferrer" className="mt-6 block rounded-xl border border-primary-foreground/20 p-3 text-sm font-bold hover:bg-primary-foreground/10" data-testid="link-lesson-material">{l.materialName ?? 'Download material'} <ArrowRight className="float-right size-4 text-accent" /></a>}<button onClick={() => complete.mutate({ id: lessonId }, { onSuccess: () => q.refetch() })} disabled={l.completed || complete.isPending} className="mt-6 w-full rounded-xl bg-accent px-4 py-3 text-sm font-bold text-primary disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-detail-complete">{l.completed ? 'Lesson complete' : complete.isPending ? 'Saving progress…' : 'Mark lesson complete'}</button></aside></div></>;
}

function QuizzesPage() {
  const q = useListQuizzes(); const quizzes = (q.data as any[]) ?? [];
  if (q.isLoading) return <Loading label="Finding your next challenge" />; if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  return <><PageIntro eyebrow="Practice with purpose" title="Quizzes" body="A quiz is a conversation with what you know. Take your time and use the result as a map." />{quizzes.length === 0 ? <EmptyState title="No quizzes just yet" body="Your teachers are still preparing the next set. Check back soon." /> : <div className="grid gap-4 lg:grid-cols-2">{quizzes.map((qz) => <Link href={`/student/quizzes/${qz.id}`} key={qz.id} className="group flex gap-5 rounded-2xl border border-card-border bg-card p-6 hover:-translate-y-0.5 hover:border-teal-700/40" data-testid={`card-quiz-${qz.id}`}><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent text-primary"><ClipboardList className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-xs font-bold text-teal-700">{qz.subjectName}</p><h2 className="mt-1 font-display text-xl font-bold">{qz.title}</h2><div className="mt-5 flex flex-wrap gap-3 text-xs text-muted-foreground"><span>{qz.questionCount} questions</span><span>Pass at {qz.passingScore}%</span>{qz.timeLimit && <span><Clock3 className="mr-1 inline size-3.5" />{qz.timeLimit} min</span>}</div></div><div className="text-right"><span className="block font-mono-ui text-xs text-muted-foreground">{qz.attempts} attempts</span><span className="mt-6 block font-bold text-teal-700">{qz.bestScore ? `${qz.bestScore}% best` : 'Start →'}</span></div></Link>)}</div>}</>;
}

function QuizDetail() {
  const { id } = useParams<{ id: string }>(); const quizId = Number(id); const q = useGetQuiz(quizId, { query: { enabled: !!quizId, queryKey: getGetQuizQueryKey(quizId) } }); const submit = useSubmitQuizAttempt(); const [answers, setAnswers] = useState<Record<number, string>>({}); const [result, setResult] = useState<any>(null);
  if (q.isLoading) return <Loading label="Opening your quiz" />; if (q.isError || !q.data) return <ErrorState onRetry={() => q.refetch()} />; const quiz = q.data as any;
  if (result) return <div className="mx-auto max-w-2xl rounded-3xl border border-card-border bg-card p-8 text-center md:p-12"><div className="mx-auto grid size-16 place-items-center rounded-full bg-accent"><Trophy className="size-7 text-primary" /></div><p className="mt-6 font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">Quiz complete</p><h1 className="mt-2 font-display text-4xl font-extrabold">{result.percentage}%</h1><p className="mt-2 text-muted-foreground">{result.passed ? 'You passed. Nice work.' : 'Not quite this time. Now you know what to revisit.'}</p><div className="mt-8 grid grid-cols-2 gap-3 text-left"><div className="rounded-xl bg-secondary p-4"><p className="text-xs text-muted-foreground">Correct</p><p className="mt-1 font-display text-xl font-bold">{result.correctAnswers}</p></div><div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Passing score</p><p className="mt-1 font-display text-xl font-bold">{result.passingScore}%</p></div></div><Link href="/student/quizzes" className="mt-8 inline-block rounded-xl bg-primary px-5 py-3 text-sm font-bold text-accent" data-testid="link-quiz-results">Back to quizzes</Link></div>;
  const answered = Object.keys(answers).length;
  return <div className="mx-auto max-w-3xl"><Link href="/student/quizzes" className="mb-7 inline-flex text-xs font-bold text-teal-700" data-testid="link-back-quizzes">← All quizzes</Link><div className="mb-8"><p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">{quiz.subjectName}</p><h1 className="mt-2 font-display text-4xl font-extrabold">{quiz.title}</h1><p className="mt-3 text-muted-foreground">{quiz.description}</p><div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground"><span>{answered} of {quiz.questions?.length ?? 0} answered</span><div className="flex-1"><ProgressBar value={(answered / (quiz.questions?.length || 1)) * 100} /></div></div></div><div className="space-y-4">{(quiz.questions ?? []).map((question: any, i: number) => <fieldset key={question.id} className="rounded-2xl border border-card-border bg-card p-6"><legend className="sr-only">Question {i + 1}</legend><div className="flex gap-3"><span className="font-mono-ui text-xs font-bold text-teal-700">0{question.number ?? i + 1}</span><div className="flex-1"><p className="font-bold leading-6">{question.text}</p><div className="mt-5 grid gap-2">{(question.choices ?? []).map((choice: any) => <label key={choice.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition-colors ${answers[question.id] === choice.value ? 'border-primary bg-secondary' : 'border-border hover:bg-muted'}`}><input type="radio" name={`q-${question.id}`} value={choice.value} checked={answers[question.id] === choice.value} onChange={() => setAnswers({ ...answers, [question.id]: choice.value })} className="accent-teal-700" data-testid={`input-answer-${question.id}-${choice.id}`} />{choice.label}</label>)}</div></div></div></fieldset>)}</div><button onClick={() => submit.mutate({ id: quizId, data: { answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId: Number(questionId), answer })) } }, { onSuccess: setResult })} disabled={submit.isPending || answered < (quiz.questions?.length ?? 0)} className="mt-7 w-full rounded-xl bg-primary px-5 py-3.5 font-bold text-accent disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-submit-quiz">{submit.isPending ? 'Checking your answers…' : answered < (quiz.questions?.length ?? 0) ? `Answer ${quiz.questions.length - answered} more to submit` : 'Submit quiz'}</button>{submit.isError && <p className="mt-3 text-center text-sm text-destructive" data-testid="status-submit-error">We couldn't submit that attempt. Please try again.</p>}</div>;
}

function ResultsPage() {
  const q = useListMyResults(); const results = (q.data as any[]) ?? [];
  if (q.isLoading) return <Loading label="Gathering your results" />; if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  return <><PageIntro eyebrow="Your evidence of progress" title="Results" body="Every result is useful information. Notice the pattern, then choose the next small step." />{results.length === 0 ? <EmptyState title="Your results will live here" body="Complete a quiz and you'll see your score, your wins, and what to revisit." action={<Link href="/student/quizzes" className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-accent" data-testid="link-empty-results-quizzes">Find a quiz</Link>} /> : <div className="overflow-hidden rounded-2xl border border-card-border bg-card"><div className="hidden grid-cols-[1.5fr_1fr_100px_120px] gap-4 border-b border-border bg-muted/50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground md:grid"><span>Quiz</span><span>Subject</span><span>Score</span><span>Date</span></div>{results.map((r) => <div key={r.id} className="grid gap-2 border-b border-border p-5 last:border-0 md:grid-cols-[1.5fr_1fr_100px_120px] md:items-center md:gap-4"><div><p className="font-bold">{r.quizName}</p><p className="text-xs text-muted-foreground">{r.correctAnswers} correct · {r.incorrectAnswers} missed</p></div><p className="text-sm text-muted-foreground">{r.subjectName}</p><p className={`font-mono-ui text-lg font-bold ${r.passed ? 'text-teal-700' : 'text-destructive'}`}>{r.percentage}%</p><p className="text-xs text-muted-foreground">{new Date(r.dateTaken).toLocaleDateString()}</p></div>)}</div>}</>;
}

function ProgressPage() {
  const q = useGetMyProgress(); const p = q.data as any;
  if (q.isLoading) return <Loading label="Plotting your progress" />; if (q.isError || !p) return <ErrorState onRetry={() => q.refetch()} />;
  return <><PageIntro eyebrow="Zoom out" title="Progress" body="The long view is made of small, completed things." /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Overall progress" value={`${p.overallProgress}%`} note="Across all subjects" icon={LineChart} accent /><Stat label="Lessons completed" value={p.lessonsCompleted} note={`${p.lessonsRemaining} remaining`} icon={BookOpenCheck} /><Stat label="Quizzes completed" value={p.quizzesCompleted} note="Keep practicing" icon={ClipboardList} /><Stat label="Average score" value={`${p.averageScore}%`} note="Your current average" icon={Trophy} /></div><section className="mt-8 rounded-2xl border border-card-border bg-card p-6 md:p-8"><div className="flex items-center justify-between"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">By subject</p><h2 className="mt-1 font-display text-xl font-bold">Your map is taking shape</h2></div><Target className="size-5 text-accent" /></div><div className="mt-8 space-y-6">{(p.subjects ?? []).map((s: any) => <div key={s.subjectId}><div className="mb-2 flex justify-between text-sm"><span className="font-bold">{s.subjectName}</span><span className="font-mono-ui text-xs text-teal-700">{s.percentage}% <span className="text-muted-foreground">· {s.completed}/{s.total}</span></span></div><ProgressBar value={s.percentage} /></div>)}</div></section></>;
}

function ProfilePage({ admin = false }: { admin?: boolean }) {
  const q = admin ? useGetAdminProfile() : useGetMe(); const me = q.data as any; const update = admin ? useUpdateAdminProfile() : useUpdateMe(); const [name, setName] = useState(''); const [username, setUsername] = useState(''); const init = useRef(false);
  useEffect(() => { if (me && !init.current) { init.current = true; setName(me.fullName ?? ''); setUsername(me.username ?? ''); } }, [me]);
  if (q.isLoading) return <Loading />; if (q.isError || !me) return <ErrorState onRetry={() => q.refetch()} />;
  const save = () => update.mutate({ data: { fullName: name, username } } as any, { onSuccess: () => q.refetch() });
  return <><PageIntro eyebrow="Your account" title="Profile" body="Keep your details current so your learning space stays yours." /><div className="grid gap-6 lg:grid-cols-[280px_1fr]"><aside className="rounded-2xl border border-card-border bg-card p-6 text-center"><Avatar name={me.fullName} src={me.avatarUrl} /><h2 className="mt-4 font-display text-xl font-bold">{me.fullName}</h2><p className="mt-1 text-sm text-muted-foreground">{me.email}</p><span className="mt-4 inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground">{admin ? 'Administrator' : me.studentId}</span></aside><section className="rounded-2xl border border-card-border bg-card p-6 md:p-8"><div className="max-w-xl space-y-5"><label className="block text-sm font-bold">Full name<input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-teal-700" data-testid="input-profile-name" /></label><label className="block text-sm font-bold">Username<input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none focus:border-teal-700" data-testid="input-profile-username" /></label><label className="block text-sm font-bold text-muted-foreground">Email address<input value={me.email} disabled className="mt-2 w-full rounded-xl border border-border bg-muted px-3 py-3 text-sm" data-testid="input-profile-email" /></label><button onClick={save} disabled={update.isPending} className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-accent disabled:opacity-50" data-testid="button-save-profile">{update.isPending ? 'Saving changes…' : update.isSuccess ? 'Saved' : 'Save changes'}</button>{update.isError && <p className="text-sm text-destructive" data-testid="status-profile-error">Could not save your changes.</p>}</div></section></div></>;
}

function AdminDashboard() {
  const q = useGetAdminDashboard(); const d = q.data as any;
  if (q.isLoading) return <Loading label="Preparing operations overview" />; if (q.isError || !d) return <ErrorState onRetry={() => q.refetch()} />;
  const s = d.stats ?? {};
  return <><PageIntro eyebrow="Operations overview" title="Good morning, admin." body="A clear view of the learning system, from the people in it to the progress they make." /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Students" value={s.totalStudents ?? 0} note="Active learners" icon={Users} accent /><Stat label="Subjects" value={s.totalSubjects ?? 0} note="Across curriculum" icon={BookOpen} /><Stat label="Lessons" value={s.totalLessons ?? 0} note="Published content" icon={BookOpenCheck} /><Stat label="Quiz attempts" value={s.totalAttempts ?? 0} note={`Avg. score ${s.averageScore ?? 0}%`} icon={ClipboardList} /></div><div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_.8fr]"><section className="rounded-2xl border border-card-border bg-card p-6"><div className="flex items-center justify-between"><div><p className="font-mono-ui text-[10px] font-bold uppercase tracking-widest text-teal-700">Performance</p><h2 className="mt-1 font-display text-xl font-bold">Score trend</h2></div><span className="rounded-lg bg-secondary px-2 py-1 text-xs font-bold text-secondary-foreground">Last 6 months</span></div><div className="mt-8 flex h-48 items-end gap-2 border-b border-border px-2">{(d.performance ?? []).map((p: any, i: number) => <div key={i} className="group relative flex flex-1 flex-col items-center justify-end gap-2"><div className="absolute -top-6 hidden rounded bg-primary px-1.5 py-1 font-mono-ui text-[9px] text-accent group-hover:block">{p.value}%</div><div className="w-full max-w-10 rounded-t-lg bg-teal-700/75 transition-all group-hover:bg-accent" style={{ height: `${Math.max(8, p.value)}%` }} /><span className="font-mono-ui text-[9px] text-muted-foreground">{p.label}</span></div>)}</div></section><section className="rounded-2xl bg-primary p-6 text-primary-foreground"><p className="font-mono-ui text-[10px] uppercase tracking-widest text-accent">Recent activity</p><div className="mt-6 space-y-4">{(d.recentActivity ?? []).slice(0, 4).map((n: any) => <div key={n.id} className="flex gap-3 border-b border-primary-foreground/10 pb-4 last:border-0"><span className="mt-0.5 size-2 shrink-0 rounded-full bg-accent" /><div><p className="text-sm font-bold">{n.title}</p><p className="mt-1 text-xs text-primary-foreground/55">{n.message}</p></div></div>)}</div></section></div></>;
}

function AdminTablePage({ kind }: { kind: 'students' | 'subjects' | 'lessons' | 'quizzes' | 'questions' | 'results' }) {
  const configs: any = {
    students: { title: 'Students', eyebrow: 'People', body: 'Keep a pulse on enrollment and learner momentum.', query: useListAdminStudents, create: useCreateAdminStudent, del: useDeleteAdminStudent, key: getListAdminStudentsQueryKey, columns: ['Name', 'Student ID', 'Status', 'Progress'] },
    subjects: { title: 'Subjects', eyebrow: 'Curriculum', body: 'Shape the curriculum your learners move through.', query: useListAdminSubjects, create: useCreateSubject, del: useDeleteSubject, key: getListAdminSubjectsQueryKey, columns: ['Subject', 'Code', 'Lessons', 'Status'] },
    lessons: { title: 'Lessons', eyebrow: 'Content', body: 'Publish clear, useful steps through every subject.', query: useListAdminLessons, create: useCreateLesson, del: useDeleteLesson, key: getListAdminLessonsQueryKey, columns: ['Lesson', 'Subject', 'Progress', 'Status'] },
    quizzes: { title: 'Quizzes', eyebrow: 'Assessment', body: 'Give learners a useful way to check their understanding.', query: useListAdminQuizzes, create: useCreateQuiz, del: useDeleteQuiz, key: getListAdminQuizzesQueryKey, columns: ['Quiz', 'Subject', 'Questions', 'Status'] },
    questions: { title: 'Question bank', eyebrow: 'Assessment', body: 'Maintain the questions behind every meaningful check-in.', query: useListQuestions, create: useCreateQuestion, del: useDeleteQuestion, key: getListQuestionsQueryKey, columns: ['Question', 'Type', 'Points', 'Answer'] },
    results: { title: 'Results', eyebrow: 'Performance', body: 'Review outcomes and spot where support can make a difference.', query: useListAdminResults, columns: ['Student', 'Quiz', 'Score', 'Date'] },
  };
  const c = configs[kind]; const q = kind === 'questions' ? useListQuestions(1, { query: { enabled: true, queryKey: getListQuestionsQueryKey(1) } }) : c.query(); const list = (q.data as any[]) ?? []; const [show, setShow] = useState(false); const [search, setSearch] = useState(''); const [material, setMaterial] = useState<File | null>(null); const create = c.create?.(); const del = c.del?.(); const upload = useRequestUploadUrl(); const qc = useQueryClient();
  const fields = kind === 'students' ? { fullName: '', studentId: '', email: '', username: '' } : kind === 'subjects' ? { name: '', code: '', description: '' } : kind === 'lessons' ? { title: '', description: '' } : { title: '' };
  const [form, setForm] = useState(fields);
  if (q.isLoading) return <Loading label={`Loading ${c.title.toLowerCase()}`} />; if (q.isError) return <ErrorState onRetry={() => q.refetch()} />;
  const shown = list.filter((x) => JSON.stringify(x).toLowerCase().includes(search.toLowerCase()));
  const submit = async () => {
    if (!create) return;
    let materialUrl: string | null = null;
    let materialName: string | null = null;
    if (kind === 'lessons' && material) {
      const uploadResult = await upload.mutateAsync({ data: { name: material.name, size: material.size, contentType: material.type || 'application/octet-stream' } });
      await fetch(uploadResult.uploadURL, { method: 'PUT', headers: { 'Content-Type': material.type || 'application/octet-stream' }, body: material });
      materialUrl = uploadResult.objectPath.replace('/objects/', '/api/storage/objects/');
      materialName = material.name;
    }
    const data: any = kind === 'students' ? { ...form, status: 'active' } : kind === 'subjects' ? { ...form, status: 'published' } : kind === 'lessons' ? { ...form, subjectId: 1, content: form.description, objectives: [], materialUrl, materialName, status: 'published' } : { ...form, subjectId: 1, description: '', passingScore: 70, status: 'published' };
    create.mutate({ data } as any, { onSuccess: () => { setShow(false); setMaterial(null); q.refetch(); qc.invalidateQueries({ queryKey: kind === 'questions' ? getListQuestionsQueryKey(1) : c.key() }); } });
  };
  return <><PageIntro eyebrow={c.eyebrow} title={c.title} body={c.body} action={c.create && <button onClick={() => setShow(!show)} className="rounded-xl bg-primary px-4 py-3 text-sm font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))]" data-testid={`button-add-${kind}`}><Plus className="mr-1 inline size-4" /> Add {kind === 'students' ? 'student' : kind === 'questions' ? 'question' : kind.slice(0, -1)}</button>} />{show && <div className="mb-6 rounded-2xl border border-accent bg-accent/20 p-5"><div className="grid gap-3 sm:grid-cols-2">{Object.entries(form).map(([key, value]) => <label key={key} className="text-xs font-bold capitalize">{key.replaceAll(/([A-Z])/g, ' $1')}<input value={value as string} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none" data-testid={`input-new-${key}`} /></label>)}</div>{kind === 'lessons' && <label className="mt-3 block text-xs font-bold">Learning material<span className="mt-1 flex items-center rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-normal"><input type="file" onChange={(e) => setMaterial(e.target.files?.[0] ?? null)} className="w-full text-xs" data-testid="input-new-material" /></span></label>}<div className="mt-4 flex gap-2"><button onClick={submit} disabled={create?.isPending || upload.isPending} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-accent" data-testid={`button-save-${kind}`}>{create?.isPending || upload.isPending ? 'Saving…' : 'Save'}</button><button onClick={() => setShow(false)} className="rounded-xl border border-border px-4 py-2 text-sm font-bold" data-testid={`button-cancel-${kind}`}>Cancel</button></div></div>}<div className="mb-5 flex items-center gap-3"><div className="flex max-w-md flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2"><Search className="size-4 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${c.title.toLowerCase()}`} className="w-full bg-transparent text-sm outline-none" data-testid={`input-search-${kind}`} /></div><button className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground" data-testid={`button-filter-${kind}`}><ListFilter className="size-4" /></button></div>{shown.length === 0 ? <EmptyState title={`No ${c.title.toLowerCase()} yet`} body="Try another search or add the first record to this workspace." /> : <div className="overflow-x-auto rounded-2xl border border-card-border bg-card"><div className="min-w-[680px]"><div className="grid grid-cols-[1.5fr_1fr_110px_110px_40px] gap-4 border-b border-border bg-muted/50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{c.columns.map((x: string) => <span key={x}>{x}</span>)}<span /></div>{shown.map((x, i) => <div key={x.id ?? i} className="grid grid-cols-[1.5fr_1fr_110px_110px_40px] items-center gap-4 border-b border-border px-5 py-4 last:border-0" data-testid={`row-admin-${kind}-${x.id ?? i}`}><div><p className="truncate font-bold">{x.fullName ?? x.title ?? x.name ?? x.text ?? x.quizName ?? 'Untitled'}</p><p className="text-xs text-muted-foreground">{x.email ?? x.subjectName ?? x.studentId ?? ''}</p></div><p className="text-sm text-muted-foreground">{x.code ?? x.subjectName ?? x.type ?? x.quizName ?? '—'}</p><p className={`font-mono-ui text-sm ${x.passed === false ? 'text-destructive' : 'text-teal-700'}`}>{x.percentage != null ? `${x.percentage}%` : x.progress != null ? `${x.progress}%` : x.questionCount ?? x.points ?? x.status ?? '—'}</p><p className="text-xs text-muted-foreground">{x.dateTaken ? new Date(x.dateTaken).toLocaleDateString() : x.status ?? 'Published'}</p><div className="flex justify-end">{del && <button onClick={() => { if (window.confirm('Delete this record?')) del.mutate({ id: x.id } as any, { onSuccess: () => { q.refetch(); qc.invalidateQueries({ queryKey: kind === 'questions' ? getListQuestionsQueryKey(1) : c.key() }); } }); }} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" data-testid={`button-delete-${kind}-${x.id}`}><Trash2 className="size-4" /></button>}</div></div>)}</div></div>}</>;
}

function ReportsPage() {
  const q = useGetAdminReports(); const r = q.data as any;
  if (q.isLoading) return <Loading label="Compiling reports" />; if (q.isError || !r) return <ErrorState onRetry={() => q.refetch()} />;
  return <><PageIntro eyebrow="Make informed decisions" title="Reports" body="Patterns become useful when you can see them together." /><div className="grid gap-6 xl:grid-cols-2"><ReportBlock title="Student performance" columns={['Student', 'Quizzes', 'Average', 'Passed']} rows={r.studentPerformance ?? []} values={['studentName', 'totalQuizzes', 'averageScore', 'passed']} /><ReportBlock title="Quiz performance" columns={['Quiz', 'Attempts', 'Average', 'Pass rate']} rows={r.quizPerformance ?? []} values={['quizName', 'attempts', 'averageScore', 'passingRate']} /><ReportBlock title="Learning progress" columns={['Student', 'Subject', 'Completed', 'Progress']} rows={r.learningProgress ?? []} values={['student', 'subject', 'lessonsCompleted', 'percentage']} /></div></>;
}
function ReportBlock({ title, columns, rows, values }: { title: string; columns: string[]; rows: any[]; values: string[] }) {
  return <section className="overflow-hidden rounded-2xl border border-card-border bg-card"><div className="border-b border-border p-5"><h2 className="font-display text-lg font-bold">{title}</h2></div><div className="overflow-x-auto"><div className="min-w-[480px]"><div className="grid grid-cols-4 gap-3 bg-muted/50 px-5 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{columns.map((c) => <span key={c}>{c}</span>)}</div>{rows.slice(0, 6).map((row, i) => <div key={i} className="grid grid-cols-4 gap-3 border-b border-border px-5 py-3 text-sm last:border-0">{values.map((v) => <span key={v} className={v.includes('average') || v.includes('percentage') || v === 'passingRate' ? 'font-mono-ui font-bold text-teal-700' : ''}>{typeof row[v] === 'number' && (v.includes('average') || v.includes('percentage') || v === 'passingRate') ? `${row[v]}%` : row[v]}</span>)}</div>)}</div></div></section>;
}

function Protected({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { isLoaded, isSignedIn } = useUser(); const me = useGetMe({ query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() } }); const profile = me.data as any;
  if (!isLoaded || (isSignedIn && me.isLoading)) return <Loading label="Opening LumenPath" />;
  if (!isSignedIn) return <Redirect to="/sign-in" />; if (admin && profile?.role !== 'admin') return <Redirect to="/student/dashboard" />; if (!admin && profile?.role === 'admin') return <Redirect to="/admin/dashboard" />;
  return <AppShell admin={admin}>{children}</AppShell>;
}

function HomeRedirect() {
  const { isLoaded, isSignedIn } = useUser(); const me = useGetMe({ query: { enabled: !!isSignedIn, queryKey: getGetMeQueryKey() } }); const p = me.data as any;
  if (!isLoaded || (isSignedIn && me.isLoading)) return <Loading />;
  if (!isSignedIn) return <Landing />; return <Redirect to={p?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} />;
}

function SignInPage() { return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>; }
function SignUpPage() { return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>; }

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch>
    <Route path="/" component={HomeRedirect} /><Route path="/sign-in/*?" component={SignInPage} /><Route path="/sign-up/*?" component={SignUpPage} />
    <Route path="/student/dashboard"><Protected><StudentDashboard /></Protected></Route><Route path="/student/subjects"><Protected><SubjectsPage /></Protected></Route>
    <Route path="/student/lessons/:id"><Protected><LessonDetail /></Protected></Route><Route path="/student/lessons"><Protected><LessonsPage /></Protected></Route>
    <Route path="/student/quizzes/:id"><Protected><QuizDetail /></Protected></Route><Route path="/student/quizzes"><Protected><QuizzesPage /></Protected></Route>
    <Route path="/student/results"><Protected><ResultsPage /></Protected></Route><Route path="/student/progress"><Protected><ProgressPage /></Protected></Route><Route path="/student/profile"><Protected><ProfilePage /></Protected></Route>
    <Route path="/admin/dashboard"><Protected admin><AdminDashboard /></Protected></Route><Route path="/admin/students"><Protected admin><AdminTablePage kind="students" /></Protected></Route><Route path="/admin/subjects"><Protected admin><AdminTablePage kind="subjects" /></Protected></Route><Route path="/admin/lessons"><Protected admin><AdminTablePage kind="lessons" /></Protected></Route><Route path="/admin/quizzes"><Protected admin><AdminTablePage kind="quizzes" /></Protected></Route><Route path="/admin/questions"><Protected admin><AdminTablePage kind="questions" /></Protected></Route><Route path="/admin/results"><Protected admin><AdminTablePage kind="results" /></Protected></Route><Route path="/admin/reports"><Protected admin><ReportsPage /></Protected></Route><Route path="/admin/profile"><Protected admin><ProfilePage admin /></Protected></Route>
    <Route component={NotFound} />
  </Switch></ErrorBoundary>;
}

function ClerkCacheInvalidator() {
  const { addListener } = useClerk(); const qc = useQueryClient(); const prev = useRef<string | null | undefined>(undefined);
  useEffect(() => addListener(({ user }: any) => { const id = user?.id ?? null; if (prev.current !== undefined && prev.current !== id) qc.clear(); prev.current = id; }), [addListener, qc]);
  return null;
}

function AppWithClerk() {
  const [, setLocation] = useLocation();
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Your next step is waiting.' } }, signUp: { start: { title: 'Make your path', subtitle: 'A little progress starts here.' } } }} routerPush={(to: string) => setLocation(stripBase(to))} routerReplace={(to: string) => setLocation(stripBase(to), { replace: true })}><QueryClientProvider client={queryClient}><ClerkCacheInvalidator /><Router /></QueryClientProvider></ClerkProvider>;
}

function App() {
  return <TooltipProvider><WouterRouter base={basePath}><AppWithClerk /></WouterRouter><Toaster /></TooltipProvider>;
}

export default App;
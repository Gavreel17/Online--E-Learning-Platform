import { useState, useMemo } from 'react';
import {
  usePlatformStore,
  type AssignmentItem,
  type AssignmentSubmissionItem,
  type AssignmentAuditEvent,
} from '@/lib/platform-store';
import { useAuth, DEFAULT_ADMIN } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, Download, Eye, Filter, Calendar, Users, CheckCircle2,
  Clock3, RotateCcw, AlertTriangle, Layers, BookOpen, ChevronRight,
  Printer, ArrowUpDown, X, Search, Check, Sparkles
} from 'lucide-react';

export function AssignmentReportsSection() {
  const store = usePlatformStore();
  const { assignments, assignmentSubmissions, students, subjects, assignmentAuditLogs } = store;
  const { user } = useAuth();
  const { toast } = useToast();

  const currentAdmin = user || DEFAULT_ADMIN;

  // Active Category (A-E)
  const [activeCategory, setActiveCategory] = useState<
    'overview' | 'submissions' | 'teachers' | 'students' | 'performance'
  >('overview');

  // Filters
  const [dateRange, setDateRange] = useState<string>('current_term');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<string>('all');
  const [gradingStatusFilter, setGradingStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Selected Item for Details Modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // Distinct teachers list
  const teachersList = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach((a) => {
      if (a.teacherName) map.set(a.teacherName, a.teacherName);
    });
    subjects.forEach((s) => {
      if (s.instructor) map.set(s.instructor, s.instructor);
    });
    return Array.from(map.values());
  }, [assignments, subjects]);

  // Reset Filters
  const handleResetFilters = () => {
    setDateRange('all');
    setTeacherFilter('all');
    setStudentFilter('all');
    setSubjectFilter('all');
    setAssignmentFilter('all');
    setSubmissionStatusFilter('all');
    setGradingStatusFilter('all');
    setSearchTerm('');
    toast({ title: 'Filters Reset', description: 'All report filters restored to defaults.' });
  };

  // Base filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (teacherFilter !== 'all' && a.teacherName !== teacherFilter) return false;
      if (subjectFilter !== 'all' && a.subjectId !== Number(subjectFilter)) return false;
      if (assignmentFilter !== 'all' && a.id !== assignmentFilter) return false;
      if (searchTerm && !a.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [assignments, teacherFilter, subjectFilter, assignmentFilter, searchTerm]);

  // Base filtered submissions
  const filteredSubmissions = useMemo(() => {
    return assignmentSubmissions.filter((s) => {
      if (studentFilter !== 'all' && s.studentName !== studentFilter && s.studentId !== studentFilter) return false;
      if (subjectFilter !== 'all' && s.subjectId !== Number(subjectFilter)) return false;
      if (assignmentFilter !== 'all' && s.assignmentId !== assignmentFilter) return false;

      if (submissionStatusFilter !== 'all') {
        if (submissionStatusFilter === 'late' && !s.isLate) return false;
        if (submissionStatusFilter !== 'late' && s.status !== submissionStatusFilter) return false;
      }

      if (gradingStatusFilter !== 'all') {
        if (gradingStatusFilter === 'graded' && s.status !== 'graded') return false;
        if (gradingStatusFilter === 'pending' && s.status === 'graded') return false;
      }

      if (searchTerm) {
        const matches = `${s.studentName} ${s.studentId} ${s.assignmentTitle} ${s.subjectName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        if (!matches) return false;
      }

      return true;
    });
  }, [assignmentSubmissions, studentFilter, subjectFilter, assignmentFilter, submissionStatusFilter, gradingStatusFilter, searchTerm]);

  // ----------------------------------------------------
  // CATEGORY A: Assignment Overview Metrics
  // ----------------------------------------------------
  const overviewStats = useMemo(() => {
    const totalCreated = assignments.length;
    const totalPublished = assignments.filter((a) => a.status === 'published').length;
    const totalDraft = assignments.filter((a) => a.status === 'draft').length;

    const bySubject = subjects.map((sub) => {
      const count = assignments.filter((a) => a.subjectId === sub.id).length;
      return { subjectName: sub.name, code: sub.code, count };
    });

    const byTeacher = teachersList.map((t) => {
      const count = assignments.filter((a) => a.teacherName === t).length;
      return { teacherName: t, count };
    });

    const now = Date.now();
    const activeAssignments = assignments.filter((a) => {
      if (a.status !== 'published') return false;
      const due = new Date(a.dueDateTime).getTime();
      return isNaN(due) || due >= now;
    }).length;

    const closedOrExpired = assignments.filter((a) => {
      if (a.status === 'closed') return true;
      const due = new Date(a.dueDateTime).getTime();
      return !isNaN(due) && due < now;
    }).length;

    return {
      totalCreated,
      totalPublished,
      totalDraft,
      bySubject,
      byTeacher,
      activeAssignments,
      closedOrExpired,
    };
  }, [assignments, subjects, teachersList]);

  // ----------------------------------------------------
  // CATEGORY B: Student Submission Report Metrics
  // ----------------------------------------------------
  const submissionReportStats = useMemo(() => {
    const totalSubmissions = assignmentSubmissions.length;
    const onTime = assignmentSubmissions.filter((s) => !s.isLate).length;
    const late = assignmentSubmissions.filter((s) => s.isLate).length;
    const pending = assignmentSubmissions.filter((s) => s.status === 'submitted').length;
    const graded = assignmentSubmissions.filter((s) => s.status === 'graded').length;
    const returned = assignmentSubmissions.filter((s) => s.status === 'returned_for_revision').length;

    const publishedCount = assignments.filter((a) => a.status === 'published').length;
    const totalExpected = publishedCount * (students.length || 1);
    const missing = Math.max(0, totalExpected - totalSubmissions);

    return {
      totalSubmissions,
      onTime,
      late,
      pending,
      missing,
      graded,
      returned,
    };
  }, [assignmentSubmissions, assignments, students]);

  // ----------------------------------------------------
  // CATEGORY C: Teacher Activity Report Rows
  // ----------------------------------------------------
  const teacherActivityRows = useMemo(() => {
    return teachersList.map((teacherName) => {
      const teacherAssignments = assignments.filter((a) => a.teacherName === teacherName);
      const createdCount = teacherAssignments.length;
      const publishedCount = teacherAssignments.filter((a) => a.status === 'published').length;

      const assignmentIds = new Set(teacherAssignments.map((a) => a.id));
      const teacherSubmissions = assignmentSubmissions.filter((s) => assignmentIds.has(s.assignmentId));

      const totalSubs = teacherSubmissions.length;
      const pendingGrading = teacherSubmissions.filter((s) => s.status === 'submitted').length;
      const gradedSubs = teacherSubmissions.filter((s) => s.status === 'graded').length;
      const completionRate = totalSubs > 0 ? Math.round((gradedSubs / totalSubs) * 100) : 100;

      const subjectNames = Array.from(new Set(teacherAssignments.map((a) => a.subjectName))).join(', ') || 'General Faculty';

      return {
        teacherName,
        subject: subjectNames,
        createdCount,
        publishedCount,
        totalSubs,
        pendingGrading,
        completionRate,
      };
    }).filter((t) => teacherFilter === 'all' || t.teacherName === teacherFilter);
  }, [teachersList, assignments, assignmentSubmissions, teacherFilter]);

  // ----------------------------------------------------
  // CATEGORY D: Student Assignment Report Rows
  // ----------------------------------------------------
  const studentAssignmentRows = useMemo(() => {
    return filteredSubmissions.map((s) => {
      return {
        id: s.id,
        studentName: s.studentName,
        studentId: s.studentId,
        subject: s.subjectName,
        assignmentTitle: s.assignmentTitle,
        submissionDate: s.submittedAt,
        submissionStatus: s.isLate ? 'Submitted (Late)' : 'Submitted (On-Time)',
        scoreEarned: s.score !== null && s.score !== undefined ? s.score : '—',
        maxScore: s.maxScore,
        gradingStatus: s.status === 'graded' ? 'Graded' : s.status === 'returned_for_revision' ? 'Revision' : 'Pending',
        feedback: s.feedback,
      };
    });
  }, [filteredSubmissions]);

  // ----------------------------------------------------
  // CATEGORY E: Assignment Performance Report Rows
  // ----------------------------------------------------
  const assignmentPerformanceRows = useMemo(() => {
    const totalEnrolled = students.length || 1;

    return filteredAssignments.map((a) => {
      const subs = assignmentSubmissions.filter((s) => s.assignmentId === a.id);
      const graded = subs.filter((s) => s.score !== null && s.score !== undefined);
      const lateSubs = subs.filter((s) => s.isLate).length;

      const scores = graded.map((s) => Number(s.score));
      const avgScore = scores.length > 0 ? Math.round(scores.reduce((acc, sc) => acc + sc, 0) / scores.length) : 0;
      const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
      const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

      const submissionRate = Math.min(100, Math.round((subs.length / totalEnrolled) * 100));
      const missingCount = Math.max(0, totalEnrolled - subs.length);

      return {
        id: a.id,
        assignmentTitle: a.title,
        subject: a.subjectName,
        assignedStudents: totalEnrolled,
        submissionsCount: subs.length,
        submissionRate,
        avgScore,
        highestScore,
        lowestScore,
        lateSubmissions: lateSubs,
        missingSubmissions: missingCount,
      };
    });
  }, [filteredAssignments, assignmentSubmissions, students]);

  // ----------------------------------------------------
  // CSV EXPORT HANDLER
  // ----------------------------------------------------
  const handleExportCSV = () => {
    const timestamp = new Date().toLocaleString();
    const authorizedUser = currentAdmin.fullName || 'Administrator';

    let csv = `LUMENPATH ACADEMIC AUDIT - ASSIGNMENT REPORTS SYSTEM\n`;
    csv += `Report Category: ${activeCategory.toUpperCase()} | Generated By: ${authorizedUser} | Timestamp: ${timestamp}\n`;
    csv += `Period: ${dateRange} | Subject: ${subjectFilter} | Teacher: ${teacherFilter}\n\n`;

    if (activeCategory === 'overview') {
      csv += `=== A. ASSIGNMENT OVERVIEW SUMMARY ===\n`;
      csv += `Metric,Value\n`;
      csv += `Total Assignments Created,${overviewStats.totalCreated}\n`;
      csv += `Total Published Assignments,${overviewStats.totalPublished}\n`;
      csv += `Total Draft Assignments,${overviewStats.totalDraft}\n`;
      csv += `Active Assignments,${overviewStats.activeAssignments}\n`;
      csv += `Closed or Expired Assignments,${overviewStats.closedOrExpired}\n\n`;
      csv += `SUBJECT BREAKDOWN\nSubject Name,Code,Assignments Count\n`;
      overviewStats.bySubject.forEach((b) => {
        csv += `"${b.subjectName}",${b.code},${b.count}\n`;
      });
    } else if (activeCategory === 'submissions') {
      csv += `=== B. STUDENT SUBMISSION REPORT SUMMARY ===\n`;
      csv += `Metric,Value\n`;
      csv += `Total Student Submissions,${submissionReportStats.totalSubmissions}\n`;
      csv += `Total Submitted On Time,${submissionReportStats.onTime}\n`;
      csv += `Total Late Submissions,${submissionReportStats.late}\n`;
      csv += `Total Pending Submissions,${submissionReportStats.pending}\n`;
      csv += `Total Missing Submissions,${submissionReportStats.missing}\n`;
      csv += `Total Graded Submissions,${submissionReportStats.graded}\n`;
      csv += `Total Returned for Revision,${submissionReportStats.returned}\n`;
    } else if (activeCategory === 'teachers') {
      csv += `=== C. TEACHER ACTIVITY ROSTER ===\n`;
      csv += `Teacher Name,Subject,Assignments Created,Assignments Published,Total Submissions Received,Pending Grading,Grading Completion (%)\n`;
      teacherActivityRows.forEach((t) => {
        csv += `"${t.teacherName}","${t.subject}",${t.createdCount},${t.publishedCount},${t.totalSubs},${t.pendingGrading},${t.completionRate}%\n`;
      });
    } else if (activeCategory === 'students') {
      csv += `=== D. STUDENT ASSIGNMENT ROSTER ===\n`;
      csv += `Student Name,Student ID,Subject,Assignment Title,Submission Date,Submission Status,Score Earned,Max Score,Grading Status\n`;
      studentAssignmentRows.forEach((r) => {
        csv += `"${r.studentName}","${r.studentId}","${r.subject}","${r.assignmentTitle}","${r.submissionDate}","${r.submissionStatus}",${r.scoreEarned},${r.maxScore},"${r.gradingStatus}"\n`;
      });
    } else if (activeCategory === 'performance') {
      csv += `=== E. ASSIGNMENT PERFORMANCE METRICS ===\n`;
      csv += `Assignment Title,Subject,Assigned Students,Submissions,Submission Rate (%),Average Score,Highest Score,Lowest Score,Late Turn-Ins,Missing Submissions\n`;
      assignmentPerformanceRows.forEach((p) => {
        csv += `"${p.assignmentTitle}","${p.subject}",${p.assignedStudents},${p.submissionsCount},${p.submissionRate}%,${p.avgScore},${p.highestScore},${p.lowestScore},${p.lateSubmissions},${p.missingSubmissions}\n`;
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lumenpath-assignment-report-${activeCategory}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'CSV Report Exported',
      description: `Assignment ${activeCategory.toUpperCase()} data has been downloaded.`,
    });
  };

  // Print / PDF View
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-rise">
      {/* Category Sub-Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-muted/60 p-1">
          {[
            { id: 'overview', label: 'A. Assignment Overview' },
            { id: 'submissions', label: 'B. Submissions Report' },
            { id: 'teachers', label: 'C. Teacher Activity' },
            { id: 'students', label: 'D. Student Assignments' },
            { id: 'performance', label: 'E. Performance Analytics' },
          ].map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`button-tab-cat-${cat.id}`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground hover:bg-muted"
            title="Print or Save as PDF"
            data-testid="button-print-assignment-report"
          >
            <Printer className="size-3.5 text-teal-700" /> Print / PDF
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-accent shadow-xs hover:-translate-y-0.5 transition-transform"
            data-testid="button-export-assignment-csv"
          >
            <Download className="size-3.5" /> Export to CSV
          </button>
        </div>
      </div>

      {/* COMPREHENSIVE FILTER STRIP */}
      <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-teal-700" />
            <span className="text-xs font-bold text-foreground">Report Filtering & Parameters</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-[11px] font-bold text-muted-foreground hover:text-foreground hover:underline"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {/* Date Range */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-teal-700"
            >
              <option value="current_term">Current Term</option>
              <option value="today">Today</option>
              <option value="last_7_days">Last 7 Days</option>
              <option value="last_30_days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>

          {/* Teacher */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Teacher</label>
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-teal-700"
            >
              <option value="all">All Teachers</option>
              {teachersList.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Student */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Student</label>
            <select
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-teal-700"
            >
              <option value="all">All Students</option>
              {students.map((st) => (
                <option key={st.id} value={st.fullName}>{st.fullName}</option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-teal-700"
            >
              <option value="all">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Assignment */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Assignment</label>
            <select
              value={assignmentFilter}
              onChange={(e) => setAssignmentFilter(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-teal-700"
            >
              <option value="all">All Assignments</option>
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          {/* Submission Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Submission Status</label>
            <select
              value={submissionStatusFilter}
              onChange={(e) => setSubmissionStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-teal-700"
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="graded">Graded</option>
              <option value="returned_for_revision">Revision</option>
              <option value="late">Late</option>
            </select>
          </div>

          {/* Grading Status */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-muted-foreground mb-1">Grading Status</label>
            <select
              value={gradingStatusFilter}
              onChange={(e) => setGradingStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs font-semibold outline-none focus:border-teal-700"
            >
              <option value="all">All Grades</option>
              <option value="graded">Graded</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* CATEGORY A: ASSIGNMENT OVERVIEW VIEW */}
      {/* ======================================================== */}
      {activeCategory === 'overview' && (
        <div className="space-y-6">
          {/* Top 7 Metrics Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Created</span>
              <div className="mt-2 font-display text-2xl font-extrabold text-primary">{overviewStats.totalCreated}</div>
              <p className="text-[10px] text-muted-foreground">All assignments on record</p>
            </div>
            <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-emerald-600">Published</span>
              <div className="mt-2 font-display text-2xl font-extrabold text-emerald-600">{overviewStats.totalPublished}</div>
              <p className="text-[10px] text-muted-foreground">Active for student access</p>
            </div>
            <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-amber-600">Drafts</span>
              <div className="mt-2 font-display text-2xl font-extrabold text-amber-600">{overviewStats.totalDraft}</div>
              <p className="text-[10px] text-muted-foreground">Unpublished teacher drafts</p>
            </div>
            <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-teal-700">Active Non-Expired</span>
              <div className="mt-2 font-display text-2xl font-extrabold text-teal-700">{overviewStats.activeAssignments}</div>
              <p className="text-[10px] text-muted-foreground">Currently open for turn-in</p>
            </div>
          </div>

          {/* Subject & Teacher Distribution Tables */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
              <h3 className="font-display text-sm font-bold text-primary mb-3">Assignments by Subject</h3>
              <div className="divide-y divide-border">
                {overviewStats.bySubject.map((sub, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-xs">
                    <span className="font-bold text-foreground">{sub.subjectName} ({sub.code})</span>
                    <span className="font-mono-ui font-extrabold text-teal-700">{sub.count} modules</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
              <h3 className="font-display text-sm font-bold text-primary mb-3">Assignments by Faculty Instructor</h3>
              <div className="divide-y divide-border">
                {overviewStats.byTeacher.map((t, i) => (
                  <div key={i} className="flex items-center justify-between py-2 text-xs">
                    <span className="font-bold text-foreground">{t.teacherName}</span>
                    <span className="font-mono-ui font-extrabold text-primary">{t.count} tasks</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CATEGORY B: STUDENT SUBMISSION REPORT */}
      {/* ======================================================== */}
      {activeCategory === 'submissions' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Total Turn-Ins</span>
              <div className="mt-2 font-display text-2xl font-extrabold text-primary">{submissionReportStats.totalSubmissions}</div>
              <p className="text-[10px] text-muted-foreground">Student uploads received</p>
            </div>
            <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-emerald-600">On Time Submissions</span>
              <div className="mt-2 font-display text-2xl font-extrabold text-emerald-600">{submissionReportStats.onTime}</div>
              <p className="text-[10px] text-muted-foreground">Submitted before deadline</p>
            </div>
            <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-amber-600">Late Submissions</span>
              <div className="mt-2 font-display text-2xl font-extrabold text-amber-600">{submissionReportStats.late}</div>
              <p className="text-[10px] text-muted-foreground">Turned in past deadline</p>
            </div>
            <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-destructive">Missing Turn-Ins</span>
              <div className="mt-2 font-display text-2xl font-extrabold text-destructive">{submissionReportStats.missing}</div>
              <p className="text-[10px] text-muted-foreground">Enrolled students yet to submit</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-amber-600">Pending Review</span>
              <div className="mt-2 font-display text-2xl font-extrabold text-amber-600">{submissionReportStats.pending}</div>
              <p className="text-[10px] text-muted-foreground">Awaiting teacher grading</p>
            </div>
            <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-emerald-600">Graded Submissions</span>
              <div className="mt-2 font-display text-2xl font-extrabold text-emerald-600">{submissionReportStats.graded}</div>
              <p className="text-[10px] text-muted-foreground">Scored & feedback delivered</p>
            </div>
            <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-rose-600">Returned for Revision</span>
              <div className="mt-2 font-display text-2xl font-extrabold text-rose-600">{submissionReportStats.returned}</div>
              <p className="text-[10px] text-muted-foreground">Sent back to students for edits</p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CATEGORY C: TEACHER ACTIVITY REPORT TABLE */}
      {/* ======================================================== */}
      {activeCategory === 'teachers' && (
        <div className="overflow-hidden rounded-3xl border border-card-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-5">Teacher Name</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4 text-center">Created</th>
                  <th className="py-3.5 px-4 text-center">Published</th>
                  <th className="py-3.5 px-4 text-center">Submissions</th>
                  <th className="py-3.5 px-4 text-center">Pending Grading</th>
                  <th className="py-3.5 px-4 text-center">Grading Completion</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {teacherActivityRows.map((t, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-5 font-bold text-foreground">{t.teacherName}</td>
                    <td className="py-4 px-4 text-muted-foreground">{t.subject}</td>
                    <td className="py-4 px-4 text-center font-mono-ui">{t.createdCount}</td>
                    <td className="py-4 px-4 text-center font-mono-ui text-emerald-600 font-bold">{t.publishedCount}</td>
                    <td className="py-4 px-4 text-center font-mono-ui">{t.totalSubs}</td>
                    <td className="py-4 px-4 text-center font-mono-ui text-amber-600 font-bold">{t.pendingGrading}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-700/10 px-2 py-0.5 font-mono-ui font-extrabold text-teal-700 text-[11px]">
                        {t.completionRate}%
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => setSelectedItem({ type: 'teacher', ...t })}
                        className="rounded-lg bg-secondary px-2.5 py-1 font-bold text-[11px] text-foreground hover:bg-muted"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CATEGORY D: STUDENT ASSIGNMENT REPORT TABLE */}
      {/* ======================================================== */}
      {activeCategory === 'students' && (
        <div className="overflow-hidden rounded-3xl border border-card-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-5">Student Name & ID</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4">Assignment Title</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Submission Status</th>
                  <th className="py-3.5 px-4">Score</th>
                  <th className="py-3.5 px-4">Grading Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {studentAssignmentRows.map((r, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-5">
                      <p className="font-bold text-foreground">{r.studentName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono-ui">{r.studentId}</p>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{r.subject}</td>
                    <td className="py-4 px-4 font-bold text-foreground max-w-[200px] truncate">{r.assignmentTitle}</td>
                    <td className="py-4 px-4 text-muted-foreground whitespace-nowrap">{r.submissionDate}</td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                        r.submissionStatus.includes('Late') ? 'text-amber-600' : 'text-emerald-700'
                      }`}>
                        {r.submissionStatus}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono-ui font-extrabold text-foreground">
                      {r.scoreEarned} / {r.maxScore}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        r.gradingStatus === 'Graded' ? 'bg-emerald-500/15 text-emerald-700' :
                        r.gradingStatus === 'Revision' ? 'bg-rose-500/15 text-rose-700' : 'bg-amber-500/15 text-amber-700'
                      }`}>
                        {r.gradingStatus}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => setSelectedItem({ type: 'submission', ...r })}
                        className="rounded-lg bg-secondary px-2.5 py-1 font-bold text-[11px] text-foreground hover:bg-muted"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CATEGORY E: ASSIGNMENT PERFORMANCE REPORT TABLE */}
      {/* ======================================================== */}
      {activeCategory === 'performance' && (
        <div className="overflow-hidden rounded-3xl border border-card-border bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-5">Assignment Title</th>
                  <th className="py-3.5 px-4">Subject</th>
                  <th className="py-3.5 px-4 text-center">Assigned</th>
                  <th className="py-3.5 px-4 text-center">Submissions</th>
                  <th className="py-3.5 px-4 text-center">Submission Rate</th>
                  <th className="py-3.5 px-4 text-center">Avg Score</th>
                  <th className="py-3.5 px-4 text-center">High / Low</th>
                  <th className="py-3.5 px-4 text-center">Late Turn-Ins</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {assignmentPerformanceRows.map((p, i) => (
                  <tr key={i} className="hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-5 font-bold text-foreground max-w-[220px] truncate">{p.assignmentTitle}</td>
                    <td className="py-4 px-4 text-muted-foreground">{p.subject}</td>
                    <td className="py-4 px-4 text-center font-mono-ui">{p.assignedStudents}</td>
                    <td className="py-4 px-4 text-center font-mono-ui font-bold text-foreground">{p.submissionsCount}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-teal-700/10 px-2 py-0.5 font-mono-ui font-extrabold text-teal-700 text-[11px]">
                        {p.submissionRate}%
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono-ui font-extrabold text-foreground">{p.avgScore}</td>
                    <td className="py-4 px-4 text-center font-mono-ui text-[11px] text-muted-foreground">
                      <span className="text-emerald-600 font-bold">{p.highestScore}</span> / <span className="text-rose-600 font-bold">{p.lowestScore}</span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono-ui text-amber-600 font-bold">{p.lateSubmissions}</td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => setSelectedItem({ type: 'performance', ...p })}
                        className="rounded-lg bg-secondary px-2.5 py-1 font-bold text-[11px] text-foreground hover:bg-muted"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILS INSPECTION MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-card-border bg-card shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="font-display text-base font-bold text-primary">Report Record Details</h3>
                <p className="text-xs text-muted-foreground">Comprehensive database audit entry</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 text-xs">
              {Object.entries(selectedItem).map(([key, val]) => (
                <div key={key} className="flex items-start justify-between py-1.5 border-b border-border/50">
                  <span className="font-bold text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-semibold text-foreground max-w-[280px] text-right break-words">
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex shrink-0 justify-end border-t border-border p-4 bg-muted/20">
              <button
                onClick={() => setSelectedItem(null)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-accent"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

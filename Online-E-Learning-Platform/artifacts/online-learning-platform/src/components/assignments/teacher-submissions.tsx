import { useState, useMemo } from 'react';
import { usePlatformStore, type AssignmentSubmissionItem, type AssignmentItem } from '@/lib/platform-store';
import { useAuth, DEFAULT_TEACHER } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import Swal from 'sweetalert2';
import {
  Inbox, Search, Filter, Calendar, CheckCircle2, Clock3, RotateCcw,
  Video, Play, FileText, Layers, FileCode, ExternalLink, Download,
  Eye, Check, X, Trophy, MessageSquare, AlertCircle, ArrowUpDown, ChevronRight, User
} from 'lucide-react';

export function TeacherSubmissionsPage() {
  const store = usePlatformStore();
  const { assignmentSubmissions, assignments, subjects, gradeAssignmentSubmission, returnSubmissionForRevision } = store;
  const { user } = useAuth();
  const { toast } = useToast();

  const currentTeacher = user || DEFAULT_TEACHER;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'graded' | 'returned_for_revision' | 'late'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Modals
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmissionItem | null>(null);
  const [viewingSubmission, setViewingSubmission] = useState<AssignmentSubmissionItem | null>(null);
  const [videoModalSubmission, setVideoModalSubmission] = useState<AssignmentSubmissionItem | null>(null);

  // Grading form state
  const [scoreInput, setScoreInput] = useState<number>(0);
  const [feedbackInput, setFeedbackInput] = useState<string>('');

  // Filtered submissions list
  const filteredSubmissions = useMemo(() => {
    return assignmentSubmissions.filter((sub) => {
      const searchMatch = `${sub.studentName} ${sub.studentId} ${sub.assignmentTitle} ${sub.subjectName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      if (!searchMatch) return false;

      if (subjectFilter !== 'all' && sub.subjectId !== Number(subjectFilter)) return false;
      if (assignmentFilter !== 'all' && sub.assignmentId !== assignmentFilter) return false;

      if (statusFilter === 'late') {
        if (!sub.isLate) return false;
      } else if (statusFilter !== 'all') {
        if (sub.status !== statusFilter) return false;
      }

      return true;
    });
  }, [assignmentSubmissions, searchTerm, subjectFilter, assignmentFilter, statusFilter]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = assignmentSubmissions.length;
    const pending = assignmentSubmissions.filter((s) => s.status === 'submitted').length;
    const graded = assignmentSubmissions.filter((s) => s.status === 'graded').length;
    const revision = assignmentSubmissions.filter((s) => s.status === 'returned_for_revision').length;
    const late = assignmentSubmissions.filter((s) => s.isLate).length;
    return { total, pending, graded, revision, late };
  }, [assignmentSubmissions]);

  // Handle open grading modal
  const handleOpenGradeModal = (sub: AssignmentSubmissionItem) => {
    setGradingSubmission(sub);
    setScoreInput(sub.score ?? sub.maxScore ?? 100);
    setFeedbackInput(sub.feedback || '');
  };

  // Submit grade
  const handleSaveGrade = () => {
    if (!gradingSubmission) return;

    if (scoreInput < 0 || scoreInput > gradingSubmission.maxScore) {
      toast({
        title: 'Invalid score',
        description: `Score must be between 0 and ${gradingSubmission.maxScore}.`,
      });
      return;
    }

    gradeAssignmentSubmission(gradingSubmission.id, {
      score: Number(scoreInput),
      feedback: feedbackInput.trim() || 'Well done on completing this deliverable.',
      status: 'graded',
      teacherName: currentTeacher.fullName || 'Prof. Sarah Jenkins',
    });

    toast({
      title: 'Submission Graded',
      description: `Awarded ${scoreInput}/${gradingSubmission.maxScore} to ${gradingSubmission.studentName}.`,
    });

    setGradingSubmission(null);
  };

  // Return for revision
  const handleReturnRevision = () => {
    if (!gradingSubmission) return;

    if (!feedbackInput.trim()) {
      toast({
        title: 'Feedback Required',
        description: 'Please write notes explaining what the student must revise before resubmitting.',
      });
      return;
    }

    returnSubmissionForRevision(gradingSubmission.id, {
      feedback: feedbackInput.trim(),
      teacherName: currentTeacher.fullName || 'Prof. Sarah Jenkins',
    });

    toast({
      title: 'Returned for Revision',
      description: `${gradingSubmission.studentName} has been notified to revise their submission.`,
    });

    setGradingSubmission(null);
  };

  // Download submitted file
  const handleDownloadFile = (sub: AssignmentSubmissionItem) => {
    const fileName = sub.file?.name || `${sub.studentName.replace(/\s+/g, '_')}_submission.txt`;
    const content = sub.textAnswer || `LumenPath Student Submission\nStudent: ${sub.studentName} (${sub.studentId})\nAssignment: ${sub.assignmentTitle}\nSubject: ${sub.subjectName}\nSubmitted: ${sub.submittedAt}\nType: ${sub.submissionType}\nStatus: ${sub.status}\n`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'File Downloaded',
      description: `Downloaded ${fileName}`,
    });
  };

  return (
    <>
      {/* Page Header */}
      <div className="surface-grid relative mb-8 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent/20 border border-accent/40 px-3 py-1 text-[11px] font-bold text-accent">
            <Inbox className="size-3.5" />
            <span>Grading Deck • Student Submissions</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            Student Submissions & Assessment
          </h1>
          <p className="mt-2 text-xs leading-5 text-primary-foreground/75">
            Evaluate learner submissions across video demonstrations, presentations, code archives, and documents.
            Play videos, provide line-item feedback, award scores, and request revisions.
          </p>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-5 animate-rise">
        <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Submissions</span>
            <Inbox className="size-4 text-teal-700" />
          </div>
          <div className="mt-2 font-display text-2xl font-extrabold text-primary">{stats.total}</div>
          <p className="text-[10px] text-muted-foreground">Platform-wide uploads</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending Review</span>
            <Clock3 className="size-4 text-amber-600" />
          </div>
          <div className="mt-2 font-display text-2xl font-extrabold text-amber-600">{stats.pending}</div>
          <p className="text-[10px] text-muted-foreground">Awaiting teacher grading</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Graded</span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <div className="mt-2 font-display text-2xl font-extrabold text-emerald-600">{stats.graded}</div>
          <p className="text-[10px] text-muted-foreground">Scores & feedback saved</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Needs Revision</span>
            <RotateCcw className="size-4 text-rose-600" />
          </div>
          <div className="mt-2 font-display text-2xl font-extrabold text-rose-600">{stats.revision}</div>
          <p className="text-[10px] text-muted-foreground">Returned to learner</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-4 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Late Submissions</span>
            <AlertCircle className="size-4 text-amber-500" />
          </div>
          <div className="mt-2 font-display text-2xl font-extrabold text-foreground">{stats.late}</div>
          <p className="text-[10px] text-muted-foreground">Turned in after deadline</p>
        </div>
      </div>

      {/* Control Bar: Search & Filter Suite */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-card-border bg-card p-4 shadow-xs">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, ID, or assignment..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            data-testid="input-search-submissions"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => {
              setSubjectFilter(e.target.value);
              setAssignmentFilter('all');
            }}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-teal-700"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Assignment Filter */}
          <select
            value={assignmentFilter}
            onChange={(e) => setAssignmentFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-teal-700 max-w-[200px]"
          >
            <option value="all">All Assignments</option>
            {assignments
              .filter((a) => subjectFilter === 'all' || a.subjectId === Number(subjectFilter))
              .map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-teal-700"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Pending Review</option>
            <option value="graded">Graded</option>
            <option value="returned_for_revision">Revision Requested</option>
            <option value="late">Late Submissions</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="overflow-hidden rounded-3xl border border-card-border bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-muted/30 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="py-3.5 px-5">Student</th>
                <th className="py-3.5 px-4">Assignment & Subject</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Submitted Deliverable</th>
                <th className="py-3.5 px-4">Submitted Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Score</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <Inbox className="mx-auto size-8 text-muted-foreground/40 mb-2" />
                    <p className="font-semibold">No submissions matching criteria</p>
                    <p className="text-[11px] mt-0.5">Try resetting your search or filter settings.</p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-muted/30 transition-colors"
                      data-testid={`row-submission-${sub.id}`}
                    >
                      {/* Student */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-2.5">
                          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                            {sub.studentName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate">{sub.studentName}</p>
                            <p className="text-[10px] text-muted-foreground font-mono-ui">{sub.studentId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Assignment & Subject */}
                      <td className="py-4 px-4 max-w-[220px]">
                        <p className="font-bold text-foreground truncate" title={sub.assignmentTitle}>
                          {sub.assignmentTitle}
                        </p>
                        <p className="text-[10px] text-teal-700 font-semibold truncate">{sub.subjectName}</p>
                      </td>

                      {/* Type */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-bold text-muted-foreground capitalize">
                          {sub.submissionType === 'video' && <Video className="size-3 text-teal-700" />}
                          {sub.submissionType === 'presentation' && <Layers className="size-3 text-amber-600" />}
                          {sub.submissionType === 'code' && <FileCode className="size-3 text-blue-600" />}
                          {sub.submissionType === 'pdf' && <FileText className="size-3 text-rose-600" />}
                          {sub.submissionType}
                        </span>
                      </td>

                      {/* Deliverable File / Text */}
                      <td className="py-4 px-4 max-w-[200px]">
                        {sub.file ? (
                          <div className="flex items-center gap-1.5 truncate">
                            {sub.submissionType === 'video' ? (
                              <button
                                onClick={() => setVideoModalSubmission(sub)}
                                className="inline-flex items-center gap-1 font-bold text-teal-700 hover:underline truncate"
                              >
                                <Play className="size-3 shrink-0" /> {sub.file.name}
                              </button>
                            ) : (
                              <button
                                onClick={() => setViewingSubmission(sub)}
                                className="inline-flex items-center gap-1 font-bold text-primary hover:underline truncate"
                              >
                                <FileText className="size-3 text-muted-foreground shrink-0" /> {sub.file.name}
                              </button>
                            )}
                          </div>
                        ) : sub.textAnswer ? (
                          <button
                            onClick={() => setViewingSubmission(sub)}
                            className="font-semibold text-muted-foreground hover:text-foreground line-clamp-1 text-left"
                          >
                            "{sub.textAnswer.slice(0, 30)}..."
                          </button>
                        ) : (
                          <span className="text-muted-foreground italic">No file attached</span>
                        )}
                      </td>

                      {/* Submission Date */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <p className="font-semibold text-foreground">{sub.submittedAt}</p>
                        {sub.isLate && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600">
                            <Clock3 className="size-2.5" /> Late Turn-In
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                            sub.status === 'graded'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                              : sub.status === 'returned_for_revision'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          <span className={`size-1.5 rounded-full ${
                            sub.status === 'graded' ? 'bg-emerald-500' :
                            sub.status === 'returned_for_revision' ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                          {sub.status === 'submitted' ? 'Needs Review' :
                           sub.status === 'returned_for_revision' ? 'Revision' : 'Graded'}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="py-4 px-4 whitespace-nowrap font-mono-ui font-bold">
                        {sub.score !== null && sub.score !== undefined ? (
                          <span className="text-teal-700">
                            {sub.score} / {sub.maxScore}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {sub.submissionType === 'video' && (
                            <button
                              onClick={() => setVideoModalSubmission(sub)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-teal-700 transition-colors"
                              title="Play Video Submission"
                            >
                              <Play className="size-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setViewingSubmission(sub)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            title="View Full Details"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownloadFile(sub)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            title="Download Submission File"
                          >
                            <Download className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenGradeModal(sub)}
                            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-accent shadow-xs hover:-translate-y-0.5 transition-transform"
                            data-testid={`button-grade-submission-${sub.id}`}
                          >
                            {sub.status === 'graded' ? 'Re-Grade' : 'Grade'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* GRADING & FEEDBACK MODAL */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-card-border bg-card shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="font-display text-lg font-bold text-primary">
                  Grade Student Submission
                </h3>
                <p className="text-xs text-muted-foreground">
                  {gradingSubmission.studentName} ({gradingSubmission.studentId}) • {gradingSubmission.assignmentTitle}
                </p>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Submission Work Preview Banner */}
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground mb-2">
                  <span>Submitted Work ({gradingSubmission.submissionType})</span>
                  <span>{gradingSubmission.submittedAt}</span>
                </div>

                {gradingSubmission.file && (
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3 text-xs mb-2">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="size-4 text-teal-700 shrink-0" />
                      <span className="font-bold text-foreground truncate">{gradingSubmission.file.name}</span>
                      <span className="text-muted-foreground text-[10px]">({gradingSubmission.file.size || '2.0 MB'})</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {gradingSubmission.submissionType === 'video' && (
                        <button
                          onClick={() => setVideoModalSubmission(gradingSubmission)}
                          className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline"
                        >
                          <Play className="size-3" /> Play Video
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadFile(gradingSubmission)}
                        className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        <Download className="size-3" /> Download
                      </button>
                    </div>
                  </div>
                )}

                {gradingSubmission.textAnswer && (
                  <div className="mt-2 rounded-xl border border-border bg-background p-3 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Student Text Answer:</p>
                    {gradingSubmission.textAnswer}
                  </div>
                )}
              </div>

              {/* Scoring Form */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Score Earned (Max: {gradingSubmission.maxScore}) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={gradingSubmission.maxScore}
                      value={scoreInput}
                      onChange={(e) => setScoreInput(Number(e.target.value))}
                      className="w-32 rounded-xl border border-border bg-background px-3.5 py-2.5 text-base font-bold outline-none focus:border-teal-700"
                      data-testid="input-grade-score"
                    />
                    <span className="text-sm font-bold text-muted-foreground">/ {gradingSubmission.maxScore} pts</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Calculated Percentage
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-2xl font-extrabold text-teal-700">
                      {Math.round((scoreInput / gradingSubmission.maxScore) * 100)}%
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground">
                      {scoreInput >= gradingSubmission.maxScore * 0.9 ? 'Grade A' :
                       scoreInput >= gradingSubmission.maxScore * 0.8 ? 'Grade B' :
                       scoreInput >= gradingSubmission.maxScore * 0.7 ? 'Grade C' : 'Needs Support'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Feedback Textarea */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Written Feedback & Rubric Notes *
                </label>
                <textarea
                  rows={4}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Provide constructive commentary, highlight strengths, and mention areas for enhancement..."
                  className="w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none focus:border-teal-700 leading-relaxed"
                  data-testid="textarea-grade-feedback"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReturnRevision}
                  className="rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
                  data-testid="button-return-revision"
                >
                  <RotateCcw className="inline size-3.5 mr-1" /> Return for Revision
                </button>
                <button
                  type="button"
                  onClick={handleSaveGrade}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-accent shadow-[2px_2px_0_hsl(var(--accent))] hover:-translate-y-0.5 transition-transform"
                  data-testid="button-save-grade-submit"
                >
                  Save Grade & Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULL SUBMISSION VIEW MODAL */}
      {viewingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-card-border bg-card shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="font-display text-lg font-bold text-primary">Submission Inspection</h3>
                <p className="text-xs text-muted-foreground">{viewingSubmission.assignmentTitle}</p>
              </div>
              <button
                onClick={() => setViewingSubmission(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-4">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-muted-foreground">Student</span>
                  <span className="font-bold text-foreground text-sm">{viewingSubmission.studentName}</span>
                  <p className="text-[10px] text-muted-foreground font-mono-ui">{viewingSubmission.studentId} · {viewingSubmission.studentEmail}</p>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-muted-foreground">Subject</span>
                  <span className="font-bold text-teal-700 text-sm">{viewingSubmission.subjectName}</span>
                  <p className="text-[10px] text-muted-foreground">Turned in: {viewingSubmission.submittedAt}</p>
                </div>
              </div>

              {viewingSubmission.file && (
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Uploaded File Deliverable
                  </span>
                  <div className="flex items-center justify-between rounded-xl border border-border bg-background p-3.5">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className="size-5 text-teal-700 shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-foreground truncate">{viewingSubmission.file.name}</p>
                        <p className="text-[10px] text-muted-foreground">{viewingSubmission.file.size || '3.5 MB'} · {viewingSubmission.submissionType.toUpperCase()}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadFile(viewingSubmission)}
                      className="flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 font-bold text-foreground hover:bg-muted"
                    >
                      <Download className="size-3.5" /> Download
                    </button>
                  </div>
                </div>
              )}

              {viewingSubmission.textAnswer && (
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Text Answer Submission
                  </span>
                  <div className="rounded-xl border border-border bg-background p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {viewingSubmission.textAnswer}
                  </div>
                </div>
              )}

              {viewingSubmission.status === 'graded' && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">Grade Awarded</span>
                    <span className="font-mono-ui text-base font-extrabold text-emerald-700">
                      {viewingSubmission.score} / {viewingSubmission.maxScore} pts
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Graded by {viewingSubmission.gradedBy} on {viewingSubmission.gradedAt}</p>
                  {viewingSubmission.feedback && (
                    <div className="mt-2 text-xs text-foreground italic border-t border-emerald-500/20 pt-2">
                      "{viewingSubmission.feedback}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex shrink-0 justify-end border-t border-border p-4 bg-muted/20">
              <button
                onClick={() => setViewingSubmission(null)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-accent"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO PLAYER MODAL */}
      {videoModalSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
              <div>
                <h3 className="font-display text-base font-bold text-primary flex items-center gap-2">
                  <Video className="size-4 text-teal-700" /> {videoModalSubmission.file?.name || 'Video Presentation'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Submitted by {videoModalSubmission.studentName} ({videoModalSubmission.studentId})
                </p>
              </div>
              <button
                onClick={() => setVideoModalSubmission(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="bg-black p-4 flex items-center justify-center">
              <video
                controls
                autoPlay
                className="w-full max-h-[60vh] rounded-xl"
                src={videoModalSubmission.file?.url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'}
              >
                Your browser does not support HTML5 video playback.
              </video>
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-border p-4 bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Assignment: {videoModalSubmission.assignmentTitle}
              </span>
              <button
                onClick={() => {
                  setVideoModalSubmission(null);
                  handleOpenGradeModal(videoModalSubmission);
                }}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-accent"
              >
                Grade This Video
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

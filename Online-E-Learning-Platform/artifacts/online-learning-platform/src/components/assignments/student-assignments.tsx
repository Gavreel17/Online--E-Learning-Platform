import { useState, useMemo } from 'react';
import { usePlatformStore, type AssignmentItem, type AssignmentSubmissionType, type AssignmentSubmissionItem } from '@/lib/platform-store';
import { useAuth, DEFAULT_STUDENT } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import Swal from 'sweetalert2';
import {
  FileText, Search, Clock3, Calendar, CheckCircle2, AlertCircle,
  Video, Layers, FileCode, Upload, Download, ExternalLink, X,
  Check, ArrowRight, RotateCcw, AlertTriangle, Paperclip, Trophy,
  FileCheck, FileUp, Sparkles, FolderOpen
} from 'lucide-react';

export function StudentAssignmentsPage() {
  const store = usePlatformStore();
  const { assignments, assignmentSubmissions, submitAssignment } = store;
  const { user } = useAuth();
  const { toast } = useToast();

  const currentStudent = user || DEFAULT_STUDENT;
  const studentEmail = currentStudent.email || 'alex.morgan@lumenpath.edu';
  const studentId = currentStudent.studentId || 'STU-1001';
  const studentName = currentStudent.fullName || 'Alex Morgan';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'due_soon' | 'submitted' | 'graded' | 'overdue'>('all');

  // Selected assignment for viewing / submitting
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentItem | null>(null);

  // Submission Form State
  const [selectedType, setSelectedType] = useState<AssignmentSubmissionType>('pdf');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; url: string; size: string; type: string } | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccessMsg, setSubmissionSuccessMsg] = useState('');

  // Find student's submission for an assignment
  const getStudentSubmission = (assignmentId: string): AssignmentSubmissionItem | undefined => {
    return assignmentSubmissions.find(
      (s) => s.assignmentId === assignmentId && (s.studentEmail === studentEmail || s.studentId === studentId)
    );
  };

  // Only published assignments are shown to students
  const publishedAssignments = useMemo(() => {
    return assignments.filter((a) => a.status === 'published');
  }, [assignments]);

  // Filtered dataset
  const filteredAssignments = useMemo(() => {
    const now = Date.now();
    const in48Hours = now + 48 * 3600 * 1000;

    return publishedAssignments.filter((a) => {
      const matchSearch = `${a.title} ${a.description} ${a.subjectName} ${a.teacherName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      if (!matchSearch) return false;

      const sub = getStudentSubmission(a.id);
      const dueDate = new Date(a.dueDateTime).getTime();
      const isPastDue = !isNaN(dueDate) && now > dueDate;

      if (activeTab === 'submitted') {
        return !!sub && sub.status === 'submitted';
      }
      if (activeTab === 'graded') {
        return !!sub && sub.status === 'graded';
      }
      if (activeTab === 'overdue') {
        return isPastDue && (!sub || sub.status === 'returned_for_revision');
      }
      if (activeTab === 'due_soon') {
        return !isPastDue && dueDate <= in48Hours && (!sub || sub.status === 'returned_for_revision');
      }
      if (activeTab === 'upcoming') {
        return !isPastDue && (!sub || sub.status === 'returned_for_revision');
      }

      return true;
    });
  }, [publishedAssignments, assignmentSubmissions, searchTerm, activeTab, studentEmail, studentId]);

  // Student assignment statistics
  const stats = useMemo(() => {
    const total = publishedAssignments.length;
    let submitted = 0;
    let graded = 0;
    let pendingDue = 0;
    let totalScore = 0;
    let gradedCount = 0;

    publishedAssignments.forEach((a) => {
      const sub = getStudentSubmission(a.id);
      if (sub) {
        if (sub.status === 'graded') {
          graded++;
          if (sub.score !== null && sub.score !== undefined) {
            totalScore += (sub.score / a.maxScore) * 100;
            gradedCount++;
          }
        } else {
          submitted++;
        }
      } else {
        pendingDue++;
      }
    });

    const avgScore = gradedCount > 0 ? Math.round(totalScore / gradedCount) : 0;
    return { total, submitted, graded, pendingDue, avgScore };
  }, [publishedAssignments, assignmentSubmissions, studentEmail, studentId]);

  // Open assignment detail modal
  const handleOpenAssignment = (assignment: AssignmentItem) => {
    setSelectedAssignment(assignment);
    const existing = getStudentSubmission(assignment.id);

    // Default to first allowed submission type
    setSelectedType(assignment.acceptedSubmissionTypes[0] || 'pdf');
    setUploadedFile(null);
    setTextAnswer('');
    setExternalLink('');
    setSubmissionSuccessMsg('');
  };

  // Mock File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedAssignment) return;

    // Validate file size
    const maxSizeBytes = (selectedAssignment.maxFileSizeMB || 50) * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      toast({
        title: 'File too large',
        description: `Maximum file size permitted is ${selectedAssignment.maxFileSizeMB} MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)} MB.`,
      });
      return;
    }

    // Format size string
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    // Create object URL for preview
    const fileUrl = URL.createObjectURL(file);

    setUploadedFile({
      name: file.name,
      url: fileUrl,
      size: sizeStr,
      type: file.type || 'application/octet-stream',
    });

    toast({
      title: 'File Selected',
      description: `Ready to submit: ${file.name} (${sizeStr})`,
    });
  };

  // Submit Assignment
  const handleSubmitAssignment = () => {
    if (!selectedAssignment) return;

    // Validation
    const requiresFile = ['video', 'presentation', 'pdf', 'document', 'image', 'code'].includes(selectedType);
    if (requiresFile && !uploadedFile) {
      toast({
        title: 'File Required',
        description: `Please select and upload a ${selectedType} file before submitting.`,
      });
      return;
    }

    if (selectedType === 'text' && !textAnswer.trim()) {
      toast({
        title: 'Text Answer Required',
        description: 'Please write your response in the text area provided.',
      });
      return;
    }

    if (selectedType === 'link' && !externalLink.trim()) {
      toast({
        title: 'Link Required',
        description: 'Please enter a valid link for your assignment submission.',
      });
      return;
    }

    Swal.fire({
      title: 'Confirm Submission?',
      text: `Submit your ${selectedType} for "${selectedAssignment.title}"?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0F172A',
      cancelButtonColor: '#94A3B8',
      confirmButtonText: 'Yes, Submit Assignment',
      cancelButtonText: 'Review Work',
    }).then((res) => {
      if (res.isConfirmed) {
        setIsSubmitting(true);

        setTimeout(() => {
          const result = submitAssignment({
            assignmentId: selectedAssignment.id,
            studentId,
            studentName,
            studentEmail,
            submissionType: selectedType,
            file: uploadedFile,
            textAnswer: textAnswer.trim() || undefined,
            externalLink: externalLink.trim() || undefined,
          });

          setIsSubmitting(false);

          if (result.success) {
            setSubmissionSuccessMsg(result.message);
            Swal.fire({
              title: 'Submitted!',
              text: result.message,
              icon: 'success',
              confirmButtonColor: '#0F172A',
            });
          } else {
            toast({
              title: 'Submission Failed',
              description: result.message,
            });
          }
        }, 500);
      }
    });
  };

  return (
    <>
      {/* Header Banner */}
      <div className="surface-grid relative mb-8 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent/20 border border-accent/40 px-3 py-1 text-[11px] font-bold text-accent">
            <FileText className="size-3.5" />
            <span>Coursework Hub • Student Workspace</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            Assignments & Coursework
          </h1>
          <p className="mt-2 text-xs leading-5 text-primary-foreground/75">
            Review assignment instructions, download instructor reference guides, upload videos, presentations,
            PDFs, or source code, and track your grades and written feedback.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4 animate-rise">
        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Assigned Tasks</span>
            <FileText className="size-5 text-teal-700" />
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-primary">{stats.total}</div>
          <p className="mt-1 text-xs text-muted-foreground">{stats.pendingDue} tasks awaiting submission</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Turned In</span>
            <Clock3 className="size-5 text-amber-600" />
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-amber-600">{stats.submitted}</div>
          <p className="mt-1 text-xs text-muted-foreground">Submitted, awaiting teacher review</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Graded Work</span>
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-emerald-600">{stats.graded}</div>
          <p className="mt-1 text-xs text-muted-foreground">Scored with faculty commentary</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Average Mastery</span>
            <Trophy className="size-5 text-teal-700" />
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-teal-700">{stats.avgScore}%</div>
          <p className="mt-1 text-xs text-muted-foreground">Overall assignment grade ratio</p>
        </div>
      </div>

      {/* Control Bar: Tabs & Search */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-muted/60 p-1">
          {[
            { id: 'all', label: 'All Assignments' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'due_soon', label: 'Due Soon' },
            { id: 'submitted', label: 'Submitted' },
            { id: 'graded', label: 'Graded' },
            { id: 'overdue', label: 'Overdue' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  active
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`button-tab-student-assignment-${tab.id}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5">
          <Search className="size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search coursework..."
            className="w-40 bg-transparent text-xs outline-none sm:w-56"
            data-testid="input-student-search-assignments"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-muted-foreground hover:text-foreground">
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Assignment Cards List */}
      {filteredAssignments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <FileText className="mx-auto size-12 text-muted-foreground/40" />
          <h3 className="mt-3 font-display text-base font-bold text-foreground">No assignments match this filter</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Check another tab or clear your search to explore other deliverables.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssignments.map((assignment) => {
            const sub = getStudentSubmission(assignment.id);
            const dueDate = new Date(assignment.dueDateTime);
            const now = Date.now();
            const isPastDue = now > dueDate.getTime();
            const hoursLeft = Math.round((dueDate.getTime() - now) / (3600 * 1000));

            return (
              <div
                key={assignment.id}
                className="group flex flex-col justify-between rounded-3xl border border-card-border bg-card p-6 shadow-xs hover:border-teal-700/50 hover:shadow-md transition-all"
                data-testid={`card-student-assignment-${assignment.id}`}
              >
                <div>
                  {/* Subject and Status Pill */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="rounded-full bg-teal-700/10 px-2.5 py-0.5 text-[10px] font-bold text-teal-700">
                      {assignment.subjectName}
                    </span>

                    {/* Submission status pill */}
                    {sub ? (
                      sub.status === 'graded' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="size-3" /> Graded: {sub.score}/{assignment.maxScore}
                        </span>
                      ) : sub.status === 'returned_for_revision' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400">
                          <RotateCcw className="size-3" /> Needs Revision
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400">
                          <Clock3 className="size-3" /> Submitted
                        </span>
                      )
                    ) : isPastDue ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 px-2.5 py-0.5 text-[10px] font-bold text-destructive">
                        <AlertCircle className="size-3" /> Overdue
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400">
                        <Clock3 className="size-3" />
                        {hoursLeft > 0 && hoursLeft <= 48 ? `Due in ${hoursLeft}h` : 'Pending'}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display text-base font-bold text-primary group-hover:text-teal-700 transition-colors line-clamp-1">
                    {assignment.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {assignment.description}
                  </p>

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">Teacher:</span> {assignment.teacherName}
                  </p>

                  {/* Accepted Types */}
                  <div className="mt-4 flex flex-wrap gap-1">
                    {assignment.acceptedSubmissionTypes.map((t) => (
                      <span key={t} className="rounded-lg border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground capitalize">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Due Date & Max Score */}
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-muted-foreground/75">Deadline</span>
                      <span className="font-semibold text-foreground">
                        {dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-muted-foreground/75">Points</span>
                      <span className="font-semibold text-foreground">{assignment.maxScore} max</span>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-5 border-t border-border pt-4">
                  <button
                    onClick={() => handleOpenAssignment(assignment)}
                    className={`w-full flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-bold transition-all ${
                      sub
                        ? 'border border-border bg-card text-foreground hover:bg-muted'
                        : 'bg-primary text-accent shadow-[2px_2px_0_hsl(var(--accent))] hover:-translate-y-0.5'
                    }`}
                    data-testid={`button-open-student-assignment-${assignment.id}`}
                  >
                    {sub ? (
                      sub.status === 'graded' ? (
                        <>View Grade & Commentary <ArrowRight className="size-3.5" /></>
                      ) : (
                        <>View Submission Details <ArrowRight className="size-3.5" /></>
                      )
                    ) : (
                      <>Open & Submit Assignment <ArrowRight className="size-3.5" /></>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STUDENT SUBMISSION / DETAILS MODAL */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-card-border bg-card shadow-2xl">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
              <div>
                <span className="rounded-full bg-teal-700/10 px-2.5 py-0.5 text-[10px] font-bold text-teal-700">
                  {selectedAssignment.subjectName}
                </span>
                <h2 className="mt-1 font-display text-lg font-bold text-primary">
                  {selectedAssignment.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Submission Success Alert if just submitted */}
              {submissionSuccessMsg && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle2 className="size-5 text-emerald-600" />
                    <span>Your assignment has been submitted successfully.</span>
                  </div>
                  <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-300/80">
                    Your deliverable is safely stored in our repository and has been routed to Prof. {selectedAssignment.teacherName} for evaluation.
                  </p>
                </div>
              )}

              {/* Assignment Meta Card */}
              <div className="grid gap-3 sm:grid-cols-3 rounded-2xl bg-muted/40 p-4 text-xs">
                <div>
                  <span className="block text-[10px] font-bold uppercase text-muted-foreground">Instructor</span>
                  <span className="font-bold text-foreground">{selectedAssignment.teacherName}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-muted-foreground">Deadline</span>
                  <span className="font-bold text-foreground">
                    {new Date(selectedAssignment.dueDateTime).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase text-muted-foreground">Scoring Threshold</span>
                  <span className="font-bold text-teal-700">{selectedAssignment.maxScore} Max Points</span>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Instructions</h4>
                <div className="rounded-2xl border border-border bg-background p-4 text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                  {selectedAssignment.description}
                </div>
              </div>

              {/* Reference Materials */}
              {selectedAssignment.referenceMaterials && selectedAssignment.referenceMaterials.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Instructor Learning Guides</h4>
                  <div className="space-y-2">
                    {selectedAssignment.referenceMaterials.map((mat, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-background p-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Paperclip className="size-4 text-teal-700" />
                          <span className="font-semibold text-foreground">{mat.name}</span>
                          <span className="text-[10px] text-muted-foreground">({mat.size || '2.0 MB'})</span>
                        </div>
                        <a
                          href={mat.url}
                          download={mat.name}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 font-bold text-teal-700 hover:underline"
                        >
                          <Download className="size-3.5" /> Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* EXISTING SUBMISSION RECORD (If submitted) */}
              {(() => {
                const sub = getStudentSubmission(selectedAssignment.id);
                if (!sub) return null;

                return (
                  <div className="rounded-2xl border border-border bg-muted/20 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Current Submission Status</h4>
                        <p className="text-[11px] text-muted-foreground">Turned in on {sub.submittedAt}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          sub.status === 'graded'
                            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                            : sub.status === 'returned_for_revision'
                            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400'
                            : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                        }`}
                      >
                        {sub.status === 'graded' ? 'Graded' :
                         sub.status === 'returned_for_revision' ? 'Revision Requested' : 'Awaiting Grade'}
                      </span>
                    </div>

                    {/* Deliverable File / Answer */}
                    <div className="rounded-xl border border-border bg-background p-3.5 text-xs">
                      {sub.file && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="size-4 text-teal-700" />
                            <span className="font-bold text-foreground">{sub.file.name}</span>
                            <span className="text-[10px] text-muted-foreground">({sub.file.size || '3.5 MB'})</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-teal-700 bg-teal-700/10 px-2 py-0.5 rounded">
                            {sub.submissionType}
                          </span>
                        </div>
                      )}
                      {sub.textAnswer && (
                        <p className="mt-2 text-foreground italic whitespace-pre-wrap">"{sub.textAnswer}"</p>
                      )}
                    </div>

                    {/* Grade & Feedback if Graded */}
                    {sub.status === 'graded' && (
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">Score Earned</span>
                          <span className="font-mono-ui text-lg font-extrabold text-emerald-700">
                            {sub.score} / {sub.maxScore} ({Math.round(((sub.score || 0) / sub.maxScore) * 100)}%)
                          </span>
                        </div>
                        {sub.feedback && (
                          <div className="mt-2 text-xs text-foreground border-t border-emerald-500/20 pt-2">
                            <strong className="text-emerald-800 dark:text-emerald-300">Teacher Feedback:</strong>
                            <p className="mt-0.5 italic">"{sub.feedback}"</p>
                          </div>
                        )}
                        <p className="mt-2 text-[10px] text-muted-foreground">Evaluated by {sub.gradedBy} on {sub.gradedAt}</p>
                      </div>
                    )}

                    {/* Revision Request Note */}
                    {sub.status === 'returned_for_revision' && sub.feedback && (
                      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs">
                        <strong className="text-rose-800 dark:text-rose-300">Revision Required:</strong>
                        <p className="mt-1 italic text-foreground">"{sub.feedback}"</p>
                        <p className="mt-2 text-[10px] text-muted-foreground">Please re-upload an updated deliverable below.</p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* SUBMISSION FORM (If not submitted or if resubmission allowed) */}
              {(() => {
                const sub = getStudentSubmission(selectedAssignment.id);
                const canSubmit = !sub || selectedAssignment.allowResubmission || sub.status === 'returned_for_revision';

                if (!canSubmit) {
                  return (
                    <div className="rounded-2xl border border-border bg-muted/30 p-4 text-center text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">Submissions Closed for This Assignment</p>
                      <p className="text-[11px] mt-0.5">Resubmissions are disabled for this task once submitted.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4 rounded-2xl border border-teal-700/20 bg-teal-700/5 p-5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                        {sub ? 'Upload Revised Deliverable' : 'Upload Your Work'}
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        Max: {selectedAssignment.maxFileSizeMB} MB
                      </span>
                    </div>

                    {/* Choose Submission Type */}
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground mb-1.5">
                        Submission Format
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedAssignment.acceptedSubmissionTypes.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setSelectedType(type);
                              setUploadedFile(null);
                            }}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                              selectedType === type
                                ? 'bg-primary text-accent shadow-xs'
                                : 'border border-border bg-card text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* File Upload Dropzone (for file formats) */}
                    {['video', 'presentation', 'pdf', 'document', 'image', 'code'].includes(selectedType) && (
                      <div>
                        {uploadedFile ? (
                          <div className="flex items-center justify-between rounded-xl border border-teal-700/40 bg-card p-4">
                            <div className="flex items-center gap-3 truncate">
                              <FileCheck className="size-6 text-teal-700 shrink-0" />
                              <div className="truncate">
                                <p className="text-xs font-bold text-foreground truncate">{uploadedFile.name}</p>
                                <p className="text-[10px] text-muted-foreground">{uploadedFile.size} • Ready for submission</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setUploadedFile(null)}
                              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                              title="Replace or Remove File"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-teal-700/30 bg-card p-6 text-center cursor-pointer hover:border-teal-700 hover:bg-muted/30 transition-all">
                            <Upload className="size-8 text-teal-700 mb-2" />
                            <p className="text-xs font-bold text-foreground">
                              Click or drag & drop to attach your {selectedType}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              Permitted: {selectedType.toUpperCase()} (Up to {selectedAssignment.maxFileSizeMB} MB)
                            </p>
                            <input
                              type="file"
                              onChange={handleFileUpload}
                              className="hidden"
                              data-testid="input-student-file-upload"
                            />
                          </label>
                        )}
                      </div>
                    )}

                    {/* Text Answer Input */}
                    {selectedType === 'text' && (
                      <div>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                          Your Text Response
                        </label>
                        <textarea
                          rows={4}
                          value={textAnswer}
                          onChange={(e) => setTextAnswer(e.target.value)}
                          placeholder="Type or paste your completed response..."
                          className="w-full rounded-xl border border-border bg-background p-3 text-xs outline-none focus:border-teal-700"
                          data-testid="textarea-student-text-answer"
                        />
                      </div>
                    )}

                    {/* External Link Input */}
                    {selectedType === 'link' && (
                      <div>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                          External Link (Video or Portfolio URL)
                        </label>
                        <input
                          type="url"
                          value={externalLink}
                          onChange={(e) => setExternalLink(e.target.value)}
                          placeholder="https://..."
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-teal-700"
                        />
                      </div>
                    )}

                    {/* Optional Submission Notes */}
                    {['video', 'presentation', 'pdf', 'document', 'image', 'code'].includes(selectedType) && (
                      <div>
                        <label className="block text-[11px] font-bold text-muted-foreground mb-1">
                          Optional Notes to Instructor
                        </label>
                        <input
                          type="text"
                          value={textAnswer}
                          onChange={(e) => setTextAnswer(e.target.value)}
                          placeholder="Any context or remarks about your deliverable..."
                          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-teal-700"
                        />
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSubmitAssignment}
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-xs font-bold text-accent shadow-[3px_3px_0_hsl(var(--accent))] hover:-translate-y-0.5 transition-transform disabled:opacity-50"
                        data-testid="button-submit-assignment-final"
                      >
                        <FileUp className="size-4" />
                        {isSubmitting ? 'Submitting...' : sub ? 'Submit Revised Assignment' : 'Submit Assignment'}
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 justify-end border-t border-border p-4 bg-muted/20">
              <button
                onClick={() => setSelectedAssignment(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

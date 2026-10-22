import { useState, useMemo } from 'react';
import { usePlatformStore, type AssignmentItem, type AssignmentSubmissionType } from '@/lib/platform-store';
import { useAuth, DEFAULT_TEACHER } from '@/lib/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import Swal from 'sweetalert2';
import {
  FileText, Plus, Search, Filter, Calendar, Clock3, Eye, Pencil, Trash2,
  CheckCircle2, AlertCircle, FileCode, Video, Image as ImageIcon,
  Paperclip, ExternalLink, X, ChevronRight, Layers, Sparkles, FolderOpen,
  ArrowRight, Download, Users, Check
} from 'lucide-react';

const SUBMISSION_TYPE_OPTIONS: { id: AssignmentSubmissionType; label: string; icon: any; ext: string }[] = [
  { id: 'video', label: 'Video Files', icon: Video, ext: 'MP4, WebM, MOV' },
  { id: 'presentation', label: 'PowerPoint Presentations', icon: Layers, ext: 'PPT, PPTX' },
  { id: 'pdf', label: 'PDF Documents', icon: FileText, ext: 'PDF' },
  { id: 'document', label: 'Word Documents', icon: FileText, ext: 'DOC, DOCX' },
  { id: 'image', label: 'Images & Diagrams', icon: ImageIcon, ext: 'JPG, JPEG, PNG' },
  { id: 'text', label: 'Text Answers', icon: Pencil, ext: 'Direct text entry' },
  { id: 'code', label: 'ZIP / Source-Code', icon: FileCode, ext: 'ZIP, TAR, JS, PY, TS' },
  { id: 'link', label: 'External Links', icon: ExternalLink, ext: 'Permitted URL / Video Link' },
];

export function TeacherAssignmentsPage() {
  const store = usePlatformStore();
  const { assignments, assignmentSubmissions, subjects, lessons, createAssignment, updateAssignment, publishAssignment, deleteAssignment } = store;
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const currentTeacher = user || DEFAULT_TEACHER;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'closed'>('all');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentItem | null>(null);
  const [previewAssignment, setPreviewAssignment] = useState<AssignmentItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    subjectId: number;
    relatedLessonId: number | null;
    assignedClassOrStudents: string;
    startDateTime: string;
    dueDateTime: string;
    maxScore: number;
    acceptedSubmissionTypes: AssignmentSubmissionType[];
    maxFileSizeMB: number;
    allowLateSubmissions: boolean;
    allowResubmission: boolean;
    referenceMaterials: { name: string; url: string; size?: string; type?: string }[];
  }>({
    title: '',
    description: '',
    subjectId: subjects[0]?.id || 1,
    relatedLessonId: null,
    assignedClassOrStudents: 'All Enrolled Students',
    startDateTime: new Date().toISOString().slice(0, 16),
    dueDateTime: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
    maxScore: 100,
    acceptedSubmissionTypes: ['pdf', 'document'],
    maxFileSizeMB: 50,
    allowLateSubmissions: true,
    allowResubmission: true,
    referenceMaterials: [],
  });

  const [refMaterialName, setRefMaterialName] = useState('');
  const [refMaterialUrl, setRefMaterialUrl] = useState('');

  // Filtered lessons based on selected subject in modal
  const subjectLessons = useMemo(() => {
    return lessons.filter((l) => l.subjectId === formData.subjectId);
  }, [lessons, formData.subjectId]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingAssignment(null);
    setFormData({
      title: '',
      description: '',
      subjectId: subjects[0]?.id || 1,
      relatedLessonId: null,
      assignedClassOrStudents: 'All Enrolled Students',
      startDateTime: new Date().toISOString().slice(0, 16),
      dueDateTime: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
      maxScore: 100,
      acceptedSubmissionTypes: ['pdf', 'presentation', 'video'],
      maxFileSizeMB: 50,
      allowLateSubmissions: true,
      allowResubmission: true,
      referenceMaterials: [],
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (assignment: AssignmentItem) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      description: assignment.description,
      subjectId: assignment.subjectId,
      relatedLessonId: assignment.relatedLessonId || null,
      assignedClassOrStudents: assignment.assignedClassOrStudents || 'All Enrolled Students',
      startDateTime: assignment.startDateTime?.slice(0, 16) || new Date().toISOString().slice(0, 16),
      dueDateTime: assignment.dueDateTime?.slice(0, 16) || new Date().toISOString().slice(0, 16),
      maxScore: assignment.maxScore || 100,
      acceptedSubmissionTypes: assignment.acceptedSubmissionTypes || ['pdf'],
      maxFileSizeMB: assignment.maxFileSizeMB || 50,
      allowLateSubmissions: assignment.allowLateSubmissions ?? true,
      allowResubmission: assignment.allowResubmission ?? true,
      referenceMaterials: assignment.referenceMaterials || [],
    });
    setIsCreateModalOpen(true);
  };

  const toggleSubmissionType = (type: AssignmentSubmissionType) => {
    setFormData((prev) => {
      const exists = prev.acceptedSubmissionTypes.includes(type);
      if (exists) {
        if (prev.acceptedSubmissionTypes.length === 1) {
          toast({ title: 'At least one type required', description: 'Assignments must accept at least one submission type.' });
          return prev;
        }
        return { ...prev, acceptedSubmissionTypes: prev.acceptedSubmissionTypes.filter((t) => t !== type) };
      } else {
        return { ...prev, acceptedSubmissionTypes: [...prev.acceptedSubmissionTypes, type] };
      }
    });
  };

  const handleAddRefMaterial = () => {
    if (!refMaterialName.trim()) {
      toast({ title: 'Material title required', description: 'Please provide a name for the reference material.' });
      return;
    }
    const newMaterial = {
      name: refMaterialName.trim(),
      url: refMaterialUrl.trim() || '#',
      size: '2.5 MB',
      type: 'application/pdf',
    };
    setFormData((prev) => ({
      ...prev,
      referenceMaterials: [...prev.referenceMaterials, newMaterial],
    }));
    setRefMaterialName('');
    setRefMaterialUrl('');
  };

  const handleRemoveRefMaterial = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      referenceMaterials: prev.referenceMaterials.filter((_, i) => i !== index),
    }));
  };

  // Save Assignment (Draft or Published)
  const handleSaveAssignment = (status: 'draft' | 'published') => {
    if (!formData.title.trim()) {
      toast({ title: 'Title required', description: 'Please enter an assignment title.' });
      return;
    }
    if (!formData.description.trim()) {
      toast({ title: 'Instructions required', description: 'Please enter instructions for students.' });
      return;
    }
    if (formData.acceptedSubmissionTypes.length === 0) {
      toast({ title: 'Submission type required', description: 'Select at least one accepted submission type.' });
      return;
    }

    const selectedSubject = subjects.find((s) => s.id === Number(formData.subjectId));
    const selectedLesson = lessons.find((l) => l.id === Number(formData.relatedLessonId));

    if (editingAssignment) {
      updateAssignment(editingAssignment.id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subjectId: Number(formData.subjectId),
        subjectName: selectedSubject?.name || 'Curriculum Subject',
        relatedLessonId: formData.relatedLessonId ? Number(formData.relatedLessonId) : null,
        relatedLessonTitle: selectedLesson?.title || null,
        assignedClassOrStudents: formData.assignedClassOrStudents,
        startDateTime: formData.startDateTime,
        dueDateTime: formData.dueDateTime,
        maxScore: Number(formData.maxScore),
        acceptedSubmissionTypes: formData.acceptedSubmissionTypes,
        maxFileSizeMB: Number(formData.maxFileSizeMB),
        allowLateSubmissions: formData.allowLateSubmissions,
        allowResubmission: formData.allowResubmission,
        referenceMaterials: formData.referenceMaterials,
        status,
      });
      toast({
        title: status === 'published' ? 'Assignment Published' : 'Assignment Saved as Draft',
        description: `"${formData.title}" has been updated successfully.`,
      });
    } else {
      createAssignment({
        title: formData.title.trim(),
        description: formData.description.trim(),
        subjectId: Number(formData.subjectId),
        subjectName: selectedSubject?.name || 'Curriculum Subject',
        relatedLessonId: formData.relatedLessonId ? Number(formData.relatedLessonId) : null,
        relatedLessonTitle: selectedLesson?.title || null,
        teacherId: currentTeacher.id || 'TCH-CURRENT',
        teacherName: currentTeacher.fullName || 'Prof. Sarah Jenkins',
        assignedClassOrStudents: formData.assignedClassOrStudents,
        startDateTime: formData.startDateTime,
        dueDateTime: formData.dueDateTime,
        maxScore: Number(formData.maxScore),
        acceptedSubmissionTypes: formData.acceptedSubmissionTypes,
        maxFileSizeMB: Number(formData.maxFileSizeMB),
        allowLateSubmissions: formData.allowLateSubmissions,
        allowResubmission: formData.allowResubmission,
        referenceMaterials: formData.referenceMaterials,
        status,
      });
      toast({
        title: status === 'published' ? 'Assignment Published' : 'Assignment Saved as Draft',
        description: `"${formData.title}" is now ${status === 'published' ? 'visible to students' : 'saved in your drafts'}.`,
      });
    }

    setIsCreateModalOpen(false);
  };

  const handleDeleteAssignment = (assignment: AssignmentItem) => {
    Swal.fire({
      title: 'Delete Assignment?',
      text: `Are you sure you want to delete "${assignment.title}"? Associated student submissions will also be archived.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0F172A',
      cancelButtonColor: '#94A3B8',
      confirmButtonText: 'Yes, delete assignment',
    }).then((result) => {
      if (result.isConfirmed) {
        deleteAssignment(assignment.id);
        toast({
          title: 'Assignment Deleted',
          description: `"${assignment.title}" was permanently removed.`,
        });
      }
    });
  };

  // Filtered List
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      const matchesSearch = `${a.title} ${a.description} ${a.subjectName}`.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;
      if (subjectFilter !== 'all' && a.subjectId !== Number(subjectFilter)) return false;
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      return true;
    });
  }, [assignments, searchTerm, subjectFilter, statusFilter]);

  // Overall statistics
  const stats = useMemo(() => {
    const total = assignments.length;
    const published = assignments.filter((a) => a.status === 'published').length;
    const drafts = assignments.filter((a) => a.status === 'draft').length;
    const totalSubmissions = assignmentSubmissions.length;
    const pendingGrading = assignmentSubmissions.filter((s) => s.status === 'submitted').length;
    return { total, published, drafts, totalSubmissions, pendingGrading };
  }, [assignments, assignmentSubmissions]);

  return (
    <>
      {/* Page Header */}
      <div className="surface-grid relative mb-8 overflow-hidden rounded-3xl bg-primary p-6 text-primary-foreground sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent/20 border border-accent/40 px-3 py-1 text-[11px] font-bold text-accent">
            <FileText className="size-3.5" />
            <span>Faculty Deliverables • Assignment Command Center</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
            Assignment Management
          </h1>
          <p className="mt-2 text-xs leading-5 text-primary-foreground/75">
            Create, schedule, and publish coursework tasks supporting multi-format submissions (Video, PPTX, PDF, Code, Word).
            Review student uploads and deliver constructive assessments.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2.5 text-xs font-bold text-primary shadow-[2px_2px_0_hsl(var(--primary))] hover:-translate-y-0.5 transition-transform"
              data-testid="button-create-assignment"
            >
              <Plus className="size-4" /> Create Assignment
            </button>
            <Link
              href="/teacher/submissions"
              className="flex items-center gap-1.5 rounded-xl border border-primary-foreground/30 px-4 py-2.5 text-xs font-bold text-white hover:bg-primary-foreground/10 transition-colors"
            >
              <Eye className="size-3.5" /> View Submissions ({stats.totalSubmissions})
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4 animate-rise">
        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Assignments</span>
            <FileText className="size-5 text-teal-700" />
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-primary">{stats.total}</div>
          <p className="mt-1 text-xs text-muted-foreground">Coursework modules created</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Published</span>
            <CheckCircle2 className="size-5 text-emerald-600" />
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-emerald-600">{stats.published}</div>
          <p className="mt-1 text-xs text-muted-foreground">Live for enrolled students</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Drafts</span>
            <Clock3 className="size-5 text-amber-600" />
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-amber-600">{stats.drafts}</div>
          <p className="mt-1 text-xs text-muted-foreground">Work-in-progress drafts</p>
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Submissions</span>
            <Users className="size-5 text-teal-700" />
          </div>
          <div className="mt-3 font-display text-3xl font-extrabold text-teal-700">{stats.totalSubmissions}</div>
          <p className="mt-1 text-xs text-muted-foreground">{stats.pendingGrading} awaiting grading</p>
        </div>
      </div>

      {/* Control Bar: Search & Filters */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-card-border bg-card p-4 shadow-xs">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search assignments by title or instructions..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            data-testid="input-search-assignments"
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
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-teal-700"
          >
            <option value="all">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold outline-none focus:border-teal-700"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Assignment List */}
      {filteredAssignments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <FileText className="mx-auto size-12 text-muted-foreground/50" />
          <h3 className="mt-3 font-display text-lg font-bold text-foreground">No assignments found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {searchTerm || subjectFilter !== 'all' || statusFilter !== 'all'
              ? 'Try adjusting your filters or search keywords.'
              : 'Create your first assignment to assign deliverables to your students.'}
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-accent"
          >
            <Plus className="size-3.5" /> Create Assignment
          </button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredAssignments.map((assignment) => {
            const submissionCount = assignmentSubmissions.filter((s) => s.assignmentId === assignment.id).length;
            const gradedCount = assignmentSubmissions.filter((s) => s.assignmentId === assignment.id && s.status === 'graded').length;

            return (
              <div
                key={assignment.id}
                className="group flex flex-col justify-between rounded-3xl border border-card-border bg-card p-6 shadow-xs hover:border-teal-700/50 hover:shadow-md transition-all"
                data-testid={`card-assignment-${assignment.id}`}
              >
                <div>
                  {/* Subject and Status Pill */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-700/10 px-2.5 py-0.5 text-[10px] font-bold text-teal-700">
                      {assignment.subjectName}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        assignment.status === 'published'
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <span className={`size-1.5 rounded-full ${assignment.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {assignment.status}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-display text-base font-bold text-primary group-hover:text-teal-700 transition-colors line-clamp-1">
                    {assignment.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {assignment.description}
                  </p>

                  {/* Related Lesson if any */}
                  {assignment.relatedLessonTitle && (
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">Lesson:</span> {assignment.relatedLessonTitle}
                    </div>
                  )}

                  {/* Allowed submission types badges */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {assignment.acceptedSubmissionTypes.map((type) => {
                      const opt = SUBMISSION_TYPE_OPTIONS.find((o) => o.id === type);
                      const Icon = opt?.icon || FileText;
                      return (
                        <span
                          key={type}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                          title={opt?.label}
                        >
                          <Icon className="size-2.5 text-teal-700" />
                          <span className="capitalize">{type}</span>
                        </span>
                      );
                    })}
                  </div>

                  {/* Schedule Details */}
                  <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-3 text-[11px] text-muted-foreground">
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-muted-foreground/75">Due Date</span>
                      <span className="font-semibold text-foreground">
                        {new Date(assignment.dueDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase text-muted-foreground/75">Max Score</span>
                      <span className="font-semibold text-foreground">{assignment.maxScore} pts</span>
                    </div>
                  </div>
                </div>

                {/* Submissions & Action Buttons */}
                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-muted-foreground">
                      <strong className="text-foreground">{submissionCount}</strong> submissions ({gradedCount} graded)
                    </span>
                    <Link
                      href={`/teacher/submissions`}
                      className="font-bold text-teal-700 hover:underline inline-flex items-center gap-1 text-[11px]"
                    >
                      View all →
                    </Link>
                  </div>

                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(assignment)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Edit Assignment"
                        data-testid={`button-edit-assignment-${assignment.id}`}
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setPreviewAssignment(assignment)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Preview Student View"
                        data-testid={`button-preview-assignment-${assignment.id}`}
                      >
                        <Eye className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteAssignment(assignment)}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Delete Assignment"
                        data-testid={`button-delete-assignment-${assignment.id}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    {assignment.status === 'draft' ? (
                      <button
                        onClick={() => publishAssignment(assignment.id)}
                        className="rounded-xl bg-teal-700 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition-colors"
                        data-testid={`button-publish-assignment-${assignment.id}`}
                      >
                        Publish Now
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          updateAssignment(assignment.id, { status: 'draft' });
                          toast({ title: 'Unpublished', description: `"${assignment.title}" moved to draft status.` });
                        }}
                        className="rounded-xl border border-border px-2.5 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors"
                      >
                        Unpublish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT ASSIGNMENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-card-border bg-card shadow-2xl">
            {/* Modal Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="font-display text-lg font-bold text-primary">
                  {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Define submission parameters, allowed file formats, scoring limits, and deadlines.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Title & Subject */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Enterprise Relational Schema Design"
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
                    data-testid="input-assignment-title"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Subject *
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: Number(e.target.value), relatedLessonId: null })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name} ({sub.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Related Lesson (Optional)
                  </label>
                  <select
                    value={formData.relatedLessonId || ''}
                    onChange={(e) => setFormData({ ...formData, relatedLessonId: e.target.value ? Number(e.target.value) : null })}
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
                  >
                    <option value="">None / General Subject Task</option>
                    {subjectLessons.map((l) => (
                      <option key={l.id} value={l.id}>{l.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Instructions & Description *
                </label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide clear guidelines, problem statement, required deliverables, and evaluation rubric criteria..."
                  className="w-full rounded-xl border border-border bg-background p-3.5 text-sm outline-none focus:border-teal-700 leading-relaxed"
                  data-testid="textarea-assignment-instructions"
                />
              </div>

              {/* Target Class or Students */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Assigned Class or Students
                </label>
                <input
                  type="text"
                  value={formData.assignedClassOrStudents}
                  onChange={(e) => setFormData({ ...formData, assignedClassOrStudents: e.target.value })}
                  placeholder="e.g. All Enrolled Students, BSIT 3-A, or specific student IDs"
                  className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm outline-none focus:border-teal-700"
                />
              </div>

              {/* Accepted Submission Types */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Accepted Submission Types *
                  </label>
                  <span className="text-[11px] text-teal-700 font-semibold">Select one or multiple</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {SUBMISSION_TYPE_OPTIONS.map((opt) => {
                    const isSelected = formData.acceptedSubmissionTypes.includes(opt.id);
                    const Icon = opt.icon;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => toggleSubmissionType(opt.id)}
                        className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-all ${
                          isSelected
                            ? 'border-teal-700 bg-teal-700/10 text-teal-900 dark:text-teal-100 shadow-xs'
                            : 'border-border bg-background hover:bg-muted/50 text-muted-foreground'
                        }`}
                      >
                        <div className={`grid size-7 shrink-0 place-items-center rounded-lg ${isSelected ? 'bg-teal-700 text-white' : 'bg-muted text-muted-foreground'}`}>
                          <Icon className="size-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground">{opt.label}</p>
                          <p className="text-[10px] text-muted-foreground">{opt.ext}</p>
                        </div>
                        {isSelected && <Check className="size-4 text-teal-700 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schedule, Max Score & File Size */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDateTime}
                    onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Due Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dueDateTime}
                    onChange={(e) => setFormData({ ...formData, dueDateTime: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Maximum Score
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Max File Size (MB)
                  </label>
                  <select
                    value={formData.maxFileSizeMB}
                    onChange={(e) => setFormData({ ...formData, maxFileSizeMB: Number(e.target.value) })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-teal-700"
                  >
                    <option value={10}>10 MB</option>
                    <option value={25}>25 MB</option>
                    <option value={50}>50 MB</option>
                    <option value={100}>100 MB</option>
                    <option value={250}>250 MB</option>
                  </select>
                </div>
              </div>

              {/* Policies: Late & Resubmission Toggles */}
              <div className="grid gap-3 sm:grid-cols-2 rounded-2xl border border-border bg-muted/20 p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-foreground">Allow Late Submissions</p>
                    <p className="text-[10px] text-muted-foreground">Students can submit past the deadline (marked as Late)</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.allowLateSubmissions}
                    onChange={(e) => setFormData({ ...formData, allowLateSubmissions: e.target.checked })}
                    className="size-4 accent-teal-700 rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-foreground">Allow Resubmissions</p>
                    <p className="text-[10px] text-muted-foreground">Students can replace their upload prior to grading or revision</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.allowResubmission}
                    onChange={(e) => setFormData({ ...formData, allowResubmission: e.target.checked })}
                    className="size-4 accent-teal-700 rounded"
                  />
                </label>
              </div>

              {/* Reference Materials */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                  Attached Reference Materials (Optional)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={refMaterialName}
                    onChange={(e) => setRefMaterialName(e.target.value)}
                    placeholder="Material Title, e.g. Assignment Rubric & Specification.pdf"
                    className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-teal-700"
                  />
                  <button
                    type="button"
                    onClick={handleAddRefMaterial}
                    className="rounded-xl bg-secondary px-3.5 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors shrink-0"
                  >
                    Attach File
                  </button>
                </div>

                {formData.referenceMaterials.length > 0 && (
                  <div className="divide-y divide-border rounded-xl border border-border bg-background">
                    {formData.referenceMaterials.map((mat, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 text-xs">
                        <div className="flex items-center gap-2">
                          <Paperclip className="size-3.5 text-teal-700" />
                          <span className="font-semibold text-foreground">{mat.name}</span>
                          <span className="text-[10px] text-muted-foreground">({mat.size || '2.0 MB'})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRefMaterial(i)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveAssignment('draft')}
                  className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors"
                  data-testid="button-save-draft-assignment"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAssignment('published')}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-accent shadow-[2px_2px_0_hsl(var(--accent))] hover:-translate-y-0.5 transition-transform"
                  data-testid="button-publish-assignment-modal"
                >
                  Publish Assignment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREVIEW ASSIGNMENT MODAL (Showing Student's View) */}
      {previewAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-card-border bg-card shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-accent/30 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  Student Preview Mode
                </span>
                <span className="text-xs text-muted-foreground">What enrolled learners will see</span>
              </div>
              <button
                onClick={() => setPreviewAssignment(null)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-teal-700/10 px-3 py-1 text-xs font-bold text-teal-700">
                  {previewAssignment.subjectName}
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  Max: {previewAssignment.maxScore} points
                </span>
              </div>

              <h2 className="font-display text-xl font-bold text-primary">
                {previewAssignment.title}
              </h2>

              <div className="rounded-2xl bg-muted/40 p-4 text-xs text-muted-foreground space-y-1">
                <p><strong className="text-foreground">Instructor:</strong> {previewAssignment.teacherName}</p>
                <p><strong className="text-foreground">Due Date:</strong> {new Date(previewAssignment.dueDateTime).toLocaleString()}</p>
                <p><strong className="text-foreground">Late Submissions:</strong> {previewAssignment.allowLateSubmissions ? 'Permitted' : 'Strictly Not Allowed'}</p>
                <p><strong className="text-foreground">Max File Size:</strong> {previewAssignment.maxFileSizeMB} MB</p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Instructions</h4>
                <div className="rounded-2xl border border-border bg-background p-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {previewAssignment.description}
                </div>
              </div>

              {previewAssignment.referenceMaterials && previewAssignment.referenceMaterials.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Attached Learning Materials</h4>
                  <div className="space-y-2">
                    {previewAssignment.referenceMaterials.map((mat, i) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-border bg-background p-3 text-xs">
                        <div className="flex items-center gap-2">
                          <Paperclip className="size-4 text-teal-700" />
                          <span className="font-semibold text-foreground">{mat.name}</span>
                        </div>
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:underline"
                        >
                          <Download className="size-3.5" /> Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Permitted Submission Formats</h4>
                <div className="flex flex-wrap gap-2">
                  {previewAssignment.acceptedSubmissionTypes.map((type) => (
                    <span key={type} className="rounded-lg bg-teal-700/10 border border-teal-700/20 px-2.5 py-1 text-xs font-semibold text-teal-700 capitalize">
                      ✓ {type}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 justify-end border-t border-border p-4 bg-muted/20">
              <button
                onClick={() => setPreviewAssignment(null)}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-accent"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

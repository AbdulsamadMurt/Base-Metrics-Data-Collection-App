import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  ClipboardList, 
  Plus, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  MapPin, 
  School, 
  Users, 
  Radio, 
  BookOpen, 
  ShieldAlert, 
  Calendar,
  Sparkles,
  FolderKanban,
  Eye,
  X,
  FileText,
  Search,
  Check,
  Wifi,
  WifiOff,
  CloudUpload,
  RotateCcw
} from 'lucide-react';
import { format } from 'date-fns';
import { ClassReport, Project, CustomSurveyQuestion } from '../types';
import PhotoCapture from '../components/PhotoCapture';
import { cn } from '../lib/utils';
import { saveOfflineClassReport, saveFormDraft, getFormDraft, clearFormDraft } from '../lib/offlineSync';
import OfflineSyncBanner from '../components/OfflineSyncBanner';

const facilitatorReportSchema = z.object({
  lga: z.string().min(2, "LGA is required (at least 2 characters)"),
  learningCenterName: z.string().min(2, "Learning Center Name is required"),
  facilitatorName: z.string().min(2, "Facilitator's Name is required"),
  date: z.string().min(1, "Date of lesson is required"),
  totalRegisteredLearners: z.number().min(0, "Total registered cannot be negative"),
  attendance: z.number().min(0, "Total present cannot be negative"),
  boysCount: z.number().min(0, "Boys count cannot be negative"),
  girlsCount: z.number().min(0, "Girls count cannot be negative"),
  lessonNumber: z.string().min(1, "Lesson Number is required"),
  topics: z.string().min(3, "Lesson Taught / Topic is required"),
  radioLessonDelivered: z.boolean(),
  radioLessonReasonNotDelivered: z.string().optional(),
  lessonCompleted: z.boolean(),
  workbookUsed: z.boolean(),
  engagementLevel: z.number().min(1).max(5),
  learnerUnderstanding: z.string().optional(),
  hasSafetyConcerns: z.boolean(),
  safetyConcernsDetails: z.string().optional(),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
}).refine((data) => {
  if (!data.radioLessonDelivered && (!data.radioLessonReasonNotDelivered || data.radioLessonReasonNotDelivered.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Please explain why the radio lesson was not delivered",
  path: ["radioLessonReasonNotDelivered"]
}).refine((data) => {
  if (data.hasSafetyConcerns && (!data.safetyConcernsDetails || data.safetyConcernsDetails.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Please describe the safety concerns",
  path: ["safetyConcernsDetails"]
});

type ReportFormValues = z.infer<typeof facilitatorReportSchema>;

const FacilitatorPortal: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'questions' | 'history'>('questions');
  const [reports, setReports] = useState<ClassReport[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('default');
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [selectedReport, setSelectedReport] = useState<ClassReport | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);
  const [draftAvailable, setDraftAvailable] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<ReportFormValues>({
    resolver: zodResolver(facilitatorReportSchema),
    defaultValues: {
      lga: '',
      learningCenterName: '',
      facilitatorName: profile?.name || '',
      date: new Date().toISOString().split('T')[0],
      totalRegisteredLearners: 0,
      attendance: 0,
      boysCount: 0,
      girlsCount: 0,
      lessonNumber: '',
      topics: '',
      radioLessonDelivered: true,
      radioLessonReasonNotDelivered: '',
      lessonCompleted: true,
      workbookUsed: true,
      engagementLevel: 4,
      learnerUnderstanding: 'Good - Most learners grasped the core concepts',
      hasSafetyConcerns: false,
      safetyConcernsDetails: '',
      notes: '',
      photoUrl: undefined,
    }
  });

  useEffect(() => {
    if (profile?.name) {
      setValue('facilitatorName', profile.name);
    }
  }, [profile, setValue]);

  // Check for unsaved draft from previous session
  useEffect(() => {
    const draft = getFormDraft<ReportFormValues>('facilitator_draft');
    if (draft && draft.data && (draft.data.learningCenterName || draft.data.topics)) {
      setDraftAvailable(true);
    }
  }, []);

  // Auto-save form draft as facilitator enters data (protects work if tab closes)
  const formValues = watch();
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formValues.learningCenterName || formValues.topics || formValues.lga) {
        saveFormDraft('facilitator_draft', formValues);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [formValues]);

  const handleRestoreDraft = () => {
    const draft = getFormDraft<ReportFormValues>('facilitator_draft');
    if (draft && draft.data) {
      reset(draft.data);
      setDraftAvailable(false);
    }
  };

  const handleDiscardDraft = () => {
    clearFormDraft('facilitator_draft');
    setDraftAvailable(false);
  };

  const watchedBoys = watch('boysCount') || 0;
  const watchedGirls = watch('girlsCount') || 0;
  const watchedAttendance = watch('attendance') || 0;
  const watchedRadioDelivered = watch('radioLessonDelivered');
  const watchedSafetyConcerns = watch('hasSafetyConcerns');

  const calculatedPresent = Number(watchedBoys) + Number(watchedGirls);

  const fetchReports = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'reports'),
        where('facilitatorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassReport)));
    } catch (error) {
      console.error("Fetch reports error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const fetchProjects = async () => {
      try {
        const snap = await getDocs(collection(db, 'projects'));
        setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
      } catch (e) {
        console.error('Error fetching projects:', e);
      }
    };
    fetchProjects();
  }, [user]);

  const activeProject = projects.find(p => p.id === selectedProjectId);

  const resetAfterSubmit = (data: ReportFormValues) => {
    reset({
      lga: data.lga,
      learningCenterName: data.learningCenterName,
      facilitatorName: profile?.name || '',
      date: new Date().toISOString().split('T')[0],
      totalRegisteredLearners: data.totalRegisteredLearners,
      attendance: 0,
      boysCount: 0,
      girlsCount: 0,
      lessonNumber: '',
      topics: '',
      radioLessonDelivered: true,
      radioLessonReasonNotDelivered: '',
      lessonCompleted: true,
      workbookUsed: true,
      engagementLevel: 4,
      learnerUnderstanding: 'Good - Most learners grasped the core concepts',
      hasSafetyConcerns: false,
      safetyConcernsDetails: '',
      notes: '',
      photoUrl: undefined,
    });
    setCustomAnswers({});
  };

  const onSubmit = async (data: ReportFormValues) => {
    if (!user || !profile) return;
    setSubmitting(true);
    setSuccess(false);
    setOfflineSaved(false);

    const reportData: ClassReport = {
      facilitatorId: user.uid,
      facilitatorName: data.facilitatorName || profile.name,
      projectId: selectedProjectId !== 'default' ? selectedProjectId : undefined,
      projectTitle: activeProject ? activeProject.name : 'Default Education Monitoring',
      customAnswers: Object.keys(customAnswers).length > 0 ? customAnswers : undefined,
      lga: data.lga,
      learningCenterName: data.learningCenterName,
      date: data.date,
      totalRegisteredLearners: Number(data.totalRegisteredLearners),
      attendance: Number(data.attendance),
      boysCount: Number(data.boysCount),
      girlsCount: Number(data.girlsCount),
      lessonNumber: data.lessonNumber,
      topics: data.topics,
      radioLessonDelivered: Boolean(data.radioLessonDelivered),
      radioLessonReasonNotDelivered: data.radioLessonReasonNotDelivered || '',
      lessonCompleted: Boolean(data.lessonCompleted),
      workbookUsed: Boolean(data.workbookUsed),
      engagementLevel: Number(data.engagementLevel),
      learnerUnderstanding: data.learnerUnderstanding || '',
      hasSafetyConcerns: Boolean(data.hasSafetyConcerns),
      safetyConcernsDetails: data.safetyConcernsDetails || '',
      notes: data.notes || '',
      photoUrl: data.photoUrl || '',
      createdAt: new Date().toISOString(),
    };

    // If device is offline, immediately save locally without network error
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      saveOfflineClassReport(reportData);
      setOfflineSaved(true);
      clearFormDraft('facilitator_draft');
      resetAfterSubmit(data);
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setOfflineSaved(false), 9000);
      return;
    }

    try {
      await addDoc(collection(db, 'reports'), reportData);
      setSuccess(true);
      clearFormDraft('facilitator_draft');
      resetAfterSubmit(data);
      fetchReports();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(false), 7000);
    } catch (error: any) {
      console.warn("Online save failed, auto-saving to local offline queue:", error);
      saveOfflineClassReport(reportData);
      setOfflineSaved(true);
      clearFormDraft('facilitator_draft');
      resetAfterSubmit(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setOfflineSaved(false), 9000);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredHistory = reports.filter(r => {
    const q = historySearch.toLowerCase();
    return (
      (r.topics && r.topics.toLowerCase().includes(q)) ||
      (r.learningCenterName && r.learningCenterName.toLowerCase().includes(q)) ||
      (r.lga && r.lga.toLowerCase().includes(q)) ||
      (r.lessonNumber && r.lessonNumber.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363d] pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#58a6ff]/10 border border-[#58a6ff]/30 text-[#58a6ff] text-xs font-semibold mb-2">
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Facilitator Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-[#f0f6fc]">Facilitator Class Questions & Activity</h1>
          <p className="text-xs text-[#8b949e] mt-1">
            Submit daily classroom lesson questions and review your activity report history.
          </p>
        </div>

        {/* Tab Switcher: Questions vs Activity Report History */}
        <div className="flex items-center space-x-1 bg-[#161b22] border border-[#30363d] p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('questions')}
            className={cn(
              "flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === 'questions'
                ? "bg-[#238636] text-white shadow-xs"
                : "text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]"
            )}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Set of Questions</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer",
              activeTab === 'history'
                ? "bg-[#238636] text-white shadow-xs"
                : "text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]"
            )}
          >
            <History className="w-4 h-4" />
            <span>Activity History</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#30363d] text-[10px] text-[#f0f6fc]">
              {reports.length}
            </span>
          </button>
        </div>
      </header>

      {/* Offline Status & Automatic Sync Banner */}
      <OfflineSyncBanner />

      {/* Offline Saved Confirmation Notification */}
      {offlineSaved && (
        <div className="flex items-center space-x-3 text-amber-300 bg-amber-500/15 border border-amber-500/30 p-4 rounded-2xl shadow-xs animate-fadeIn">
          <WifiOff className="w-5 h-5 shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="text-xs font-bold text-white">Saved to Device Offline Storage!</p>
            <p className="text-[11px] text-amber-200 mt-0.5">
              You are currently offline. Your class report is stored safely on this phone/computer and will automatically synchronize to the database as soon as internet connection is restored.
            </p>
          </div>
        </div>
      )}

      {/* Unsaved Form Draft Restoration Alert */}
      {draftAvailable && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#161b22] border border-[#58a6ff]/40 p-4 rounded-2xl text-xs shadow-xs animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <RotateCcw className="w-4 h-4 text-[#58a6ff] shrink-0" />
            <div>
              <p className="font-bold text-[#f0f6fc]">Unsaved draft found from your previous session</p>
              <p className="text-[11px] text-[#8b949e]">Would you like to restore your partially filled class report?</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleRestoreDraft}
              className="px-3 py-1.5 bg-[#58a6ff] hover:bg-[#58a6ff]/80 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
            >
              Restore Draft
            </button>
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="px-2.5 py-1.5 text-[#8b949e] hover:text-[#f0f6fc] text-xs cursor-pointer transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-3 text-[#2ea043] bg-[#238636]/15 border border-[#238636]/30 p-4 rounded-2xl shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-[#f0f6fc]">Class report submitted successfully!</p>
            <p className="text-[11px] text-[#8b949e] mt-0.5">
              The 15 answers and learner photo have been saved and synced to your activity report history.
            </p>
          </div>
        </div>
      )}

      {/* VIEW 1: SET OF QUESTIONS FORM */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Campaign / Project Selector */}
            <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FolderKanban className="w-4 h-4 text-[#58a6ff]" />
                  <label className="text-xs font-bold text-[#f0f6fc]">Assigned Project Campaign</label>
                </div>
                <span className="text-[10px] text-[#8b949e]">Select project to apply custom questions</span>
              </div>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] text-xs focus:border-[#58a6ff] outline-none font-medium"
              >
                <option value="default">Default Education Monitoring (15 Questions)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.lga ? `(${p.lga})` : ''}</option>
                ))}
              </select>

              {activeProject?.guide && (
                <div className="p-3 bg-[#58a6ff]/10 border border-[#58a6ff]/20 rounded-xl text-xs text-[#c9d1d9] space-y-1">
                  <p className="font-semibold uppercase tracking-wider text-[10px] text-[#58a6ff]">Project Field Guide:</p>
                  <p className="leading-relaxed text-[11px]">{activeProject.guide}</p>
                </div>
              )}
            </div>

            {/* Section 1: Location & Facilitator Info */}
            <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-[#21262d]">
                <MapPin className="w-4 h-4 text-[#58a6ff]" />
                <h2 className="text-sm font-bold text-[#f0f6fc]">1. Center & Facilitator Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    1. LGA (Local Government Area) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kano Municipal, Maiduguri, Jere..."
                    {...register('lga')}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] placeholder-[#8b949e] focus:border-[#58a6ff] outline-none text-xs"
                  />
                  {errors.lga && <p className="text-[11px] text-red-400">{errors.lga.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    2. Learning Center Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Al-Noor Learning Center"
                    {...register('learningCenterName')}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] placeholder-[#8b949e] focus:border-[#58a6ff] outline-none text-xs"
                  />
                  {errors.learningCenterName && (
                    <p className="text-[11px] text-red-400">{errors.learningCenterName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    3. Facilitator's Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Full name of facilitator"
                    {...register('facilitatorName')}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] placeholder-[#8b949e] focus:border-[#58a6ff] outline-none text-xs"
                  />
                  {errors.facilitatorName && (
                    <p className="text-[11px] text-red-400">{errors.facilitatorName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    4. Date of Lesson <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] focus:border-[#58a6ff] outline-none text-xs"
                  />
                  {errors.date && <p className="text-[11px] text-red-400">{errors.date.message}</p>}
                </div>
              </div>
            </div>

            {/* Section 2: Registered & Present Learners */}
            <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#21262d]">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#58a6ff]" />
                  <h2 className="text-sm font-bold text-[#f0f6fc]">2. Learners Attendance & Demographics</h2>
                </div>
                {calculatedPresent > 0 && (
                  <span className="text-[11px] font-mono px-2.5 py-0.5 bg-[#58a6ff]/10 text-[#58a6ff] border border-[#58a6ff]/30 rounded-lg">
                    Boys + Girls: {calculatedPresent}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    5. Total Registered <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('totalRegisteredLearners', { valueAsNumber: true })}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] font-mono focus:border-[#58a6ff] outline-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    6. Total Present Today <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('attendance', { valueAsNumber: true })}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] font-mono focus:border-[#58a6ff] outline-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    7. Number of Boys <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('boysCount', { valueAsNumber: true })}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] font-mono focus:border-[#58a6ff] outline-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    8. Number of Girls <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('girlsCount', { valueAsNumber: true })}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] font-mono focus:border-[#58a6ff] outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Curriculum & Radio Lesson Delivery */}
            <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-[#21262d]">
                <Radio className="w-4 h-4 text-[#58a6ff]" />
                <h2 className="text-sm font-bold text-[#f0f6fc]">3. Curriculum & Radio Lesson Questions</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    9. Lesson Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lesson 14, Literacy Unit 3"
                    {...register('lessonNumber')}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] placeholder-[#8b949e] focus:border-[#58a6ff] outline-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    10. Lesson Taught & Core Topics <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Phonetics & Basic Subtraction"
                    {...register('topics')}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] placeholder-[#8b949e] focus:border-[#58a6ff] outline-none text-xs"
                  />
                </div>
              </div>

              {/* 11. Was Radio Lesson Delivered? */}
              <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-semibold text-[#f0f6fc]">11. Was today's radio broadcast lesson delivered?</span>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setValue('radioLessonDelivered', true)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                        watchedRadioDelivered
                          ? "bg-[#238636]/20 border-[#238636] text-[#2ea043]"
                          : "border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc]"
                      )}
                    >
                      Yes, Delivered
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('radioLessonDelivered', false)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                        !watchedRadioDelivered
                          ? "bg-red-500/20 border-red-500 text-red-400"
                          : "border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc]"
                      )}
                    >
                      No, Not Delivered
                    </button>
                  </div>
                </div>

                {!watchedRadioDelivered && (
                  <div className="pt-2 border-t border-[#21262d] space-y-1">
                    <label className="text-[11px] font-semibold text-amber-400">
                      If Not Delivered, State Reason: <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Power failure, poor radio reception, battery depleted..."
                      {...register('radioLessonReasonNotDelivered')}
                      className="w-full p-2.5 rounded-lg border border-amber-500/40 bg-[#161b22] text-[#f0f6fc] outline-none text-xs"
                    />
                  </div>
                )}
              </div>

              {/* 12 & 13: Lesson Completed & Workbook Used */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#f0f6fc]">12. Was today's lesson completed?</p>
                    <p className="text-[10px] text-[#8b949e]">Planned syllabus fully covered</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setValue('lessonCompleted', true)}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer",
                        watch('lessonCompleted') ? "bg-[#238636]/20 border-[#238636] text-[#2ea043]" : "border-[#30363d] text-[#8b949e]"
                      )}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('lessonCompleted', false)}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer",
                        !watch('lessonCompleted') ? "bg-red-500/20 border-red-500 text-red-400" : "border-[#30363d] text-[#8b949e]"
                      )}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#f0f6fc]">13. Did learners use workbooks?</p>
                    <p className="text-[10px] text-[#8b949e]">Active student workbook practice</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setValue('workbookUsed', true)}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer",
                        watch('workbookUsed') ? "bg-[#238636]/20 border-[#238636] text-[#2ea043]" : "border-[#30363d] text-[#8b949e]"
                      )}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('workbookUsed', false)}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer",
                        !watch('workbookUsed') ? "bg-red-500/20 border-red-500 text-red-400" : "border-[#30363d] text-[#8b949e]"
                      )}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* 14. Learner Understanding */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#f0f6fc] block">
                  14. How did learners understand today's lesson?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: '5 - Excellent', desc: 'Full concept mastery' },
                    { label: '4 - Good', desc: 'Understood well' },
                    { label: '3 - Average', desc: 'Understood partly' },
                    { label: '2 - Struggling', desc: 'Needs remedial help' }
                  ].map((level, idx) => {
                    const score = 5 - idx;
                    const isSelected = watch('engagementLevel') === score;
                    return (
                      <button
                        type="button"
                        key={score}
                        onClick={() => {
                          setValue('engagementLevel', score);
                          setValue('learnerUnderstanding', `${level.label} (${level.desc})`);
                        }}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all cursor-pointer",
                          isSelected
                            ? "bg-[#58a6ff]/15 border-[#58a6ff] text-[#58a6ff]"
                            : "bg-[#0d1117] border-[#30363d] text-[#c9d1d9] hover:border-[#8b949e]"
                        )}
                      >
                        <p className="text-xs font-bold text-[#f0f6fc]">{level.label}</p>
                        <p className="text-[10px] text-[#8b949e] mt-0.5">{level.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 15. Any Safety Concerns? */}
              <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className={cn("w-4 h-4", watchedSafetyConcerns ? 'text-red-400' : 'text-[#8b949e]')} />
                    <span className="text-xs font-semibold text-[#f0f6fc]">15. Any safety concerns observed today?</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setValue('hasSafetyConcerns', false)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer",
                        !watchedSafetyConcerns ? "bg-[#238636]/20 border-[#238636] text-[#2ea043]" : "border-[#30363d] text-[#8b949e]"
                      )}
                    >
                      No Concerns
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('hasSafetyConcerns', true)}
                      className={cn(
                        "px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer",
                        watchedSafetyConcerns ? "bg-red-500/20 border-red-500 text-red-400" : "border-[#30363d] text-[#8b949e]"
                      )}
                    >
                      Yes, Safety Issue
                    </button>
                  </div>
                </div>

                {watchedSafetyConcerns && (
                  <div className="pt-2 border-t border-[#21262d] space-y-1">
                    <label className="text-[11px] font-semibold text-red-400">
                      Please describe safety concerns (hazards, weather, protection): <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Detail any hazards, community protection, or learner physical safety concerns..."
                      {...register('safetyConcernsDetails')}
                      className="w-full p-2.5 rounded-lg border border-red-500/40 bg-[#161b22] text-[#f0f6fc] outline-none text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Custom Project Survey Questions (if assigned) */}
            {activeProject?.customQuestions && activeProject.customQuestions.length > 0 && (
              <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-[#21262d]">
                  <Sparkles className="w-4 h-4 text-[#bc8cff]" />
                  <h2 className="text-sm font-bold text-[#f0f6fc]">
                    Project Specific Questions ({activeProject.name})
                  </h2>
                </div>

                <div className="space-y-4">
                  {activeProject.customQuestions.map((q) => (
                    <div key={q.id} className="space-y-1.5 p-3 rounded-xl bg-[#0d1117] border border-[#30363d]">
                      <label className="text-xs font-semibold text-[#f0f6fc] block">
                        {q.label} {q.required && <span className="text-red-400">*</span>}
                      </label>
                      {q.type === 'select' && q.options ? (
                        <select
                          value={customAnswers[q.id] || ''}
                          onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#161b22] text-[#f0f6fc] text-xs outline-none focus:border-[#bc8cff]"
                        >
                          <option value="">-- Select option --</option>
                          {q.options.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : q.type === 'boolean' ? (
                        <div className="flex items-center space-x-3">
                          <button
                            type="button"
                            onClick={() => setCustomAnswers(prev => ({ ...prev, [q.id]: true }))}
                            className={cn(
                              "px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer",
                              customAnswers[q.id] === true ? "bg-[#238636]/20 border-[#238636] text-[#2ea043]" : "border-[#30363d] text-[#8b949e]"
                            )}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomAnswers(prev => ({ ...prev, [q.id]: false }))}
                            className={cn(
                              "px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer",
                              customAnswers[q.id] === false ? "bg-red-500/20 border-red-500 text-red-400" : "border-[#30363d] text-[#8b949e]"
                            )}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <input
                          type={q.type === 'number' ? 'number' : 'text'}
                          value={customAnswers[q.id] || ''}
                          onChange={(e) => setCustomAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                          placeholder={`Enter ${q.label}`}
                          className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#161b22] text-[#f0f6fc] placeholder-[#8b949e] outline-none text-xs focus:border-[#bc8cff]"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 5: Student/Classroom Picture Capture */}
            <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] space-y-4">
              <div className="pb-3 border-b border-[#21262d]">
                <h2 className="text-sm font-bold text-[#f0f6fc]">5. Student & Classroom Picture Capture</h2>
              </div>

              <Controller
                control={control}
                name="photoUrl"
                render={({ field }) => (
                  <PhotoCapture
                    label="Student / Classroom Picture"
                    sublabel="Take a live photo of learners participating in the lesson using your phone camera or upload an image."
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-[#f0f6fc]">Additional Notes / Observations (Optional)</label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Any other observations about learner attendance, materials or facilitator reflections..."
                  className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] placeholder-[#8b949e] focus:border-[#58a6ff] outline-none text-xs"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center space-x-2 disabled:opacity-50 text-sm cursor-pointer shadow-md"
            >
              {submitting ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Class Report...</span>
                </div>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Submit Facilitator Class Report</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* VIEW 2: ACTIVITY REPORT HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#21262d] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[#f0f6fc]">My Activity Report History</h2>
                <p className="text-xs text-[#8b949e]">Review all classroom session submissions you have entered</p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by topic, center, or lesson..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] focus:outline-none focus:border-[#58a6ff]"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 animate-pulse p-4">
                <div className="h-16 bg-[#21262d] rounded-xl" />
                <div className="h-16 bg-[#21262d] rounded-xl" />
                <div className="h-16 bg-[#21262d] rounded-xl" />
              </div>
            ) : filteredHistory.length > 0 ? (
              <div className="divide-y divide-[#21262d] border border-[#21262d] rounded-xl overflow-hidden bg-[#0d1117]">
                {filteredHistory.map((report) => (
                  <div 
                    key={report.id} 
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#161b22] transition-colors"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#f0f6fc] truncate">{report.topics}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30 shrink-0">
                          {report.lessonNumber || 'Lesson'}
                        </span>
                        {report.radioLessonDelivered ? (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#238636]/20 text-[#2ea043] border border-[#238636]/30 shrink-0">
                            Radio: Yes
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 shrink-0">
                            Radio: No
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8b949e]">
                        {report.learningCenterName} • {report.lga} • Date: {format(new Date(report.date), 'MMM d, yyyy')}
                      </p>
                      <div className="flex items-center space-x-3 text-[11px] text-[#8b949e] pt-1">
                        <span>Attendance: <strong className="text-[#f0f6fc]">{report.attendance}</strong></span>
                        <span>Boys: <strong className="text-[#58a6ff]">{report.boysCount || 0}</strong></span>
                        <span>Girls: <strong className="text-pink-400">{report.girlsCount || 0}</strong></span>
                        {report.photoUrl && (
                          <span className="text-[10px] text-[#2ea043] bg-[#238636]/10 px-1.5 py-0.2 rounded border border-[#238636]/30">
                            Photo Attached
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] border border-[#30363d] rounded-xl text-xs font-medium cursor-pointer transition-colors inline-flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Answers</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-[#0d1117] rounded-xl border border-dashed border-[#30363d] text-xs text-[#8b949e]">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#8b949e]" />
                <p>No class reports found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL REPORT SUBMISSION DETAIL MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fc]">Class Report Submission Details</h3>
                <p className="text-[11px] text-[#8b949e]">
                  {selectedReport.learningCenterName} • {format(new Date(selectedReport.date), 'MMMM d, yyyy')}
                </p>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="text-[#8b949e] hover:text-[#f0f6fc] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                <span className="text-[#8b949e] block text-[10px]">1. Local Government Area</span>
                <span className="font-semibold text-[#f0f6fc]">{selectedReport.lga}</span>
              </div>
              <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                <span className="text-[#8b949e] block text-[10px]">2. Learning Center Name</span>
                <span className="font-semibold text-[#f0f6fc]">{selectedReport.learningCenterName}</span>
              </div>
              <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                <span className="text-[#8b949e] block text-[10px]">3. Facilitator Name</span>
                <span className="font-semibold text-[#f0f6fc]">{selectedReport.facilitatorName}</span>
              </div>
              <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                <span className="text-[#8b949e] block text-[10px]">4. Date of Lesson</span>
                <span className="font-semibold text-[#f0f6fc]">{selectedReport.date}</span>
              </div>
            </div>

            <div className="p-3.5 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-[#58a6ff]">Learners Demographics & Attendance</h4>
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="p-2 bg-[#161b22] rounded-lg">
                  <span className="text-[10px] text-[#8b949e] block">Registered</span>
                  <span className="font-bold text-[#f0f6fc] font-mono">{selectedReport.totalRegisteredLearners}</span>
                </div>
                <div className="p-2 bg-[#161b22] rounded-lg">
                  <span className="text-[10px] text-[#8b949e] block">Present</span>
                  <span className="font-bold text-[#2ea043] font-mono">{selectedReport.attendance}</span>
                </div>
                <div className="p-2 bg-[#161b22] rounded-lg">
                  <span className="text-[10px] text-[#8b949e] block">Boys</span>
                  <span className="font-bold text-[#58a6ff] font-mono">{selectedReport.boysCount || 0}</span>
                </div>
                <div className="p-2 bg-[#161b22] rounded-lg">
                  <span className="text-[10px] text-[#8b949e] block">Girls</span>
                  <span className="font-bold text-pink-400 font-mono">{selectedReport.girlsCount || 0}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-[#f0f6fc]">Curriculum & Lesson Questions</h4>
              <div className="space-y-1.5 text-[11px]">
                <p><strong className="text-[#8b949e]">Lesson Number:</strong> <span className="text-[#f0f6fc]">{selectedReport.lessonNumber}</span></p>
                <p><strong className="text-[#8b949e]">Topics Taught:</strong> <span className="text-[#f0f6fc]">{selectedReport.topics}</span></p>
                <p>
                  <strong className="text-[#8b949e]">Radio Lesson Delivered:</strong>{' '}
                  <span className={selectedReport.radioLessonDelivered ? "text-[#2ea043] font-bold" : "text-red-400 font-bold"}>
                    {selectedReport.radioLessonDelivered ? "Yes" : `No (${selectedReport.radioLessonReasonNotDelivered || 'No reason provided'})`}
                  </span>
                </p>
                <p><strong className="text-[#8b949e]">Lesson Completed:</strong> <span className="text-[#f0f6fc]">{selectedReport.lessonCompleted ? "Yes" : "No"}</span></p>
                <p><strong className="text-[#8b949e]">Workbook Used:</strong> <span className="text-[#f0f6fc]">{selectedReport.workbookUsed ? "Yes" : "No"}</span></p>
                <p><strong className="text-[#8b949e]">Learner Understanding:</strong> <span className="text-[#f0f6fc]">{selectedReport.learnerUnderstanding || 'Standard comprehension'}</span></p>
                <p>
                  <strong className="text-[#8b949e]">Safety Concerns:</strong>{' '}
                  <span className={selectedReport.hasSafetyConcerns ? "text-red-400 font-bold" : "text-[#2ea043]"}>
                    {selectedReport.hasSafetyConcerns ? `Yes: ${selectedReport.safetyConcernsDetails}` : "None observed"}
                  </span>
                </p>
              </div>
            </div>

            {selectedReport.photoUrl && (
              <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-2">
                <h4 className="font-bold text-xs text-[#f0f6fc]">Captured Student Photo</h4>
                <img 
                  src={selectedReport.photoUrl} 
                  alt="Student capture" 
                  className="rounded-lg max-h-56 w-auto mx-auto object-cover border border-[#30363d]"
                />
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] text-xs font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacilitatorPortal;

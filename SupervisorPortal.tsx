import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { collection, addDoc, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  MapPin, 
  Plus, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Clock, 
  School, 
  Users, 
  Radio, 
  BookOpen, 
  ShieldAlert, 
  Sparkles,
  ClipboardCheck,
  FolderKanban,
  Search,
  Eye,
  X,
  FileText,
  Navigation
} from 'lucide-react';
import { format } from 'date-fns';
import { VisitReport, UserProfile, Project } from '../types';
import PhotoCapture from '../components/PhotoCapture';
import GpsLocationCapture from '../components/GpsLocationCapture';
import { cn } from '../lib/utils';
import { saveOfflineVisit } from '../lib/offlineSync';
import OfflineSyncBanner from '../components/OfflineSyncBanner';
import { WifiOff } from 'lucide-react';

const supervisorVisitSchema = z.object({
  lga: z.string().min(2, "LGA is required (at least 2 characters)"),
  learningCenterName: z.string().min(2, "Learning Center Name is required"),
  supervisorName: z.string().min(2, "Supervisor Name is required"),
  facilitatorName: z.string().min(2, "Facilitator's Name is required"),
  facilitatorId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  gpsLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    accuracy: z.number().optional()
  }).optional(),
  totalRegisteredLearners: z.number().min(0, "Total registered learners cannot be negative"),
  attendance: z.number().min(0, "Total present cannot be negative"),
  boysCount: z.number().min(0, "Boys count cannot be negative"),
  girlsCount: z.number().min(0, "Girls count cannot be negative"),
  lessonNumber: z.string().min(1, "Lesson Number is required"),
  topics: z.string().min(3, "Lesson Taught / Topic is required"),
  radioLessonDelivered: z.boolean(),
  radioLessonReasonNotDelivered: z.string().optional(),
  lessonCompleted: z.boolean(),
  workbookUsed: z.boolean(),
  learnerUnderstanding: z.string().min(2, "Learner understanding rating/assessment is required"),
  hasSafetyConcerns: z.boolean(),
  safetyConcernsDetails: z.string().optional(),
  classroomCondition: z.string().min(3, "Classroom condition observation is required"),
  resourcesAvailable: z.boolean(),
  recommendations: z.string().optional(),
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
  message: "Please describe the safety concerns identified during the visit",
  path: ["safetyConcernsDetails"]
});

type VisitFormValues = z.infer<typeof supervisorVisitSchema>;

const SupervisorPortal: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'questions' | 'history'>('questions');
  const [visits, setVisits] = useState<VisitReport[]>([]);
  const [facilitators, setFacilitators] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('default');
  const [customAnswers, setCustomAnswers] = useState<Record<string, any>>({});
  const [selectedVisit, setSelectedVisit] = useState<VisitReport | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [offlineSaved, setOfflineSaved] = useState(false);

  const now = new Date();
  const currentDateStr = now.toISOString().split('T')[0];
  const currentTimeStr = now.toTimeString().slice(0, 5); // HH:mm

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<VisitFormValues>({
    resolver: zodResolver(supervisorVisitSchema),
    defaultValues: {
      lga: '',
      learningCenterName: '',
      supervisorName: profile?.name || '',
      facilitatorName: '',
      facilitatorId: '',
      date: currentDateStr,
      time: currentTimeStr,
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
      learnerUnderstanding: 'Good comprehension - Active participation & responses',
      hasSafetyConcerns: false,
      safetyConcernsDetails: '',
      classroomCondition: 'Adequate seating, ventilated, clean learning space',
      resourcesAvailable: true,
      recommendations: '',
      photoUrl: undefined,
      gpsLocation: undefined
    }
  });

  useEffect(() => {
    if (profile?.name) {
      setValue('supervisorName', profile.name);
    }
  }, [profile, setValue]);

  const watchedBoys = watch('boysCount') || 0;
  const watchedGirls = watch('girlsCount') || 0;
  const watchedAttendance = watch('attendance') || 0;
  const watchedRadioDelivered = watch('radioLessonDelivered');
  const watchedSafetyConcerns = watch('hasSafetyConcerns');
  const calculatedPresent = Number(watchedBoys) + Number(watchedGirls);

  const fetchData = async () => {
    if (!user) return;
    try {
      const facQuery = query(collection(db, 'users'), where('role', '==', 'facilitator'));
      const facSnap = await getDocs(facQuery);
      setFacilitators(facSnap.docs.map(doc => doc.data() as UserProfile));

      const visitQuery = query(
        collection(db, 'visits'),
        where('supervisorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const visitSnap = await getDocs(visitQuery);
      setVisits(visitSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VisitReport)));

      const projSnap = await getDocs(collection(db, 'projects'));
      setProjects(projSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project)));
    } catch (error) {
      console.error("Fetch supervisor data error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const activeProject = projects.find(p => p.id === selectedProjectId);

  const handleFacilitatorSelect = (uid: string) => {
    const selected = facilitators.find(f => f.uid === uid);
    if (selected) {
      setValue('facilitatorName', selected.name);
      setValue('facilitatorId', selected.uid);
    }
  };

  const onSubmit = async (data: VisitFormValues) => {
    if (!user || !profile) return;
    setSubmitting(true);
    setSuccess(false);
    try {
      const visitData: VisitReport = {
        supervisorId: user.uid,
        supervisorName: data.supervisorName || profile.name,
        projectId: selectedProjectId !== 'default' ? selectedProjectId : undefined,
        projectTitle: activeProject ? activeProject.name : 'Default Education Monitoring',
        customAnswers: Object.keys(customAnswers).length > 0 ? customAnswers : undefined,
        facilitatorId: data.facilitatorId || '',
        facilitatorName: data.facilitatorName,
        lga: data.lga,
        learningCenterName: data.learningCenterName,
        date: data.date,
        time: data.time,
        gpsLocation: data.gpsLocation,
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
        learnerUnderstanding: data.learnerUnderstanding,
        hasSafetyConcerns: Boolean(data.hasSafetyConcerns),
        safetyConcernsDetails: data.safetyConcernsDetails || '',
        classroomCondition: data.classroomCondition,
        resourcesAvailable: Boolean(data.resourcesAvailable),
        recommendations: data.recommendations || '',
        photoUrl: data.photoUrl || '',
        createdAt: new Date().toISOString(),
      };

      const isDeviceOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

      const resetForm = () => {
        reset({
          lga: data.lga,
          learningCenterName: '',
          supervisorName: profile.name,
          facilitatorName: '',
          facilitatorId: '',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
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
          learnerUnderstanding: 'Good comprehension - Active participation & responses',
          hasSafetyConcerns: false,
          safetyConcernsDetails: '',
          classroomCondition: 'Adequate seating, ventilated, clean learning space',
          resourcesAvailable: true,
          recommendations: '',
          photoUrl: undefined,
          gpsLocation: undefined
        });
        setCustomAnswers({});
      };

      if (!isDeviceOnline) {
        saveOfflineVisit(visitData);
        setOfflineSaved(true);
        resetForm();
        setSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setOfflineSaved(false), 9000);
        return;
      }

      try {
        await addDoc(collection(db, 'visits'), visitData);
        setSuccess(true);
        resetForm();
        fetchData();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setSuccess(false), 7000);
      } catch (err: any) {
        console.warn("Online visit submit failed, auto-saving to local offline queue:", err);
        saveOfflineVisit(visitData);
        setOfflineSaved(true);
        resetForm();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setTimeout(() => setOfflineSaved(false), 9000);
      } finally {
        setSubmitting(false);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'visits');
      setSubmitting(false);
    }
  };

  const filteredVisits = visits.filter(v => {
    const q = historySearch.toLowerCase();
    return (
      (v.learningCenterName && v.learningCenterName.toLowerCase().includes(q)) ||
      (v.facilitatorName && v.facilitatorName.toLowerCase().includes(q)) ||
      (v.lga && v.lga.toLowerCase().includes(q)) ||
      (v.topics && v.topics.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363d] pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#2ea043]/10 border border-[#238636]/30 text-[#2ea043] text-xs font-semibold mb-2">
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Supervisor Portal</span>
          </div>
          <h1 className="text-2xl font-bold text-[#f0f6fc]">Supervisor Visit Questions & Activity</h1>
          <p className="text-xs text-[#8b949e] mt-1">
            Conduct on-site facility visits with GPS verification, classroom assessments, and view your activity report history.
          </p>
        </div>

        {/* Tab Switcher: Questions vs Activity History */}
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
            <ClipboardCheck className="w-4 h-4" />
            <span>Set of Visit Questions</span>
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
              {visits.length}
            </span>
          </button>
        </div>
      </header>

      {/* Offline Status & Auto-Sync Banner */}
      <OfflineSyncBanner />

      {/* Offline Saved Alert */}
      {offlineSaved && (
        <div className="flex items-center space-x-3 text-amber-300 bg-amber-500/15 border border-amber-500/30 p-4 rounded-2xl shadow-xs animate-fadeIn">
          <WifiOff className="w-5 h-5 shrink-0 text-amber-400" />
          <div className="flex-1">
            <p className="text-xs font-bold text-white">Visit Stored in Device Offline Storage!</p>
            <p className="text-[11px] text-amber-200 mt-0.5">
              You are currently offline. Your facility visit audit has been safely stored locally and will sync automatically once an internet connection is established.
            </p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-3 text-[#2ea043] bg-[#238636]/15 border border-[#238636]/30 p-4 rounded-2xl shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-[#f0f6fc]">Facility visit report recorded successfully!</p>
            <p className="text-[11px] text-[#8b949e] mt-0.5">
              GPS coordinates, classroom quality metrics, and student photo are safely saved to your activity history.
            </p>
          </div>
        </div>
      )}

      {/* VIEW 1: SET OF VISIT QUESTIONS */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Campaign / Project Selector */}
            <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FolderKanban className="w-4 h-4 text-[#2ea043]" />
                  <label className="text-xs font-bold text-[#f0f6fc]">Assigned Project Campaign</label>
                </div>
                <span className="text-[10px] text-[#8b949e]">Select project to apply custom questions</span>
              </div>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] text-xs focus:border-[#2ea043] outline-none font-medium"
              >
                <option value="default">Default Education Monitoring (15 Questions)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} {p.lga ? `(${p.lga})` : ''}</option>
                ))}
              </select>

              {activeProject?.guide && (
                <div className="p-3 bg-[#238636]/10 border border-[#238636]/20 rounded-xl text-xs text-[#c9d1d9] space-y-1">
                  <p className="font-semibold uppercase tracking-wider text-[10px] text-[#2ea043]">Supervisor Protocol:</p>
                  <p className="leading-relaxed text-[11px]">{activeProject.guide}</p>
                </div>
              )}
            </div>

            {/* Section 1: Supervisor, Facilitator & Location */}
            <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-[#21262d]">
                <MapPin className="w-4 h-4 text-[#2ea043]" />
                <h2 className="text-sm font-bold text-[#f0f6fc]">1. Center, Supervisor & Facilitator Identification</h2>
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
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] placeholder-[#8b949e] focus:border-[#2ea043] outline-none text-xs"
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
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] placeholder-[#8b949e] focus:border-[#2ea043] outline-none text-xs"
                  />
                  {errors.learningCenterName && (
                    <p className="text-[11px] text-red-400">{errors.learningCenterName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    3. Name of Supervisor <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Supervisor's full name"
                    {...register('supervisorName')}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] placeholder-[#8b949e] focus:border-[#2ea043] outline-none text-xs"
                  />
                  {errors.supervisorName && (
                    <p className="text-[11px] text-red-400">{errors.supervisorName.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    Facilitator Observed / Visited <span className="text-red-400">*</span>
                  </label>
                  {facilitators.length > 0 && (
                    <div className="mb-1">
                      <select
                        onChange={(e) => handleFacilitatorSelect(e.target.value)}
                        className="w-full p-2 bg-[#0d1117] rounded-lg border border-[#30363d] text-xs text-[#c9d1d9] focus:outline-none focus:border-[#2ea043]"
                      >
                        <option value="">-- Quick select registered facilitator --</option>
                        {facilitators.map(f => (
                          <option key={f.uid} value={f.uid}>{f.name} ({f.email})</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Enter or confirm Facilitator Name"
                    {...register('facilitatorName')}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] placeholder-[#8b949e] focus:border-[#2ea043] outline-none text-xs"
                  />
                  {errors.facilitatorName && (
                    <p className="text-[11px] text-red-400">{errors.facilitatorName.message}</p>
                  )}
                </div>
              </div>

              {/* Time and Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#21262d]">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-[#2ea043]" />
                    <span>Visit Date <span className="text-red-400">*</span></span>
                  </label>
                  <input
                    type="date"
                    {...register('date')}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] focus:border-[#2ea043] outline-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-[#2ea043]" />
                    <span>Visit Time <span className="text-red-400">*</span></span>
                  </label>
                  <input
                    type="time"
                    {...register('time')}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] focus:border-[#2ea043] outline-none text-xs"
                  />
                </div>
              </div>

              {/* GPS Coordinates Capture */}
              <div className="pt-2 border-t border-[#21262d]">
                <Controller
                  control={control}
                  name="gpsLocation"
                  render={({ field }) => (
                    <GpsLocationCapture
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            {/* Section 2: Attendance Verification */}
            <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#21262d]">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-[#2ea043]" />
                  <h2 className="text-sm font-bold text-[#f0f6fc]">2. Attendance Headcount & Demographics</h2>
                </div>
                {calculatedPresent > 0 && (
                  <span className="text-[11px] font-mono px-2.5 py-0.5 bg-[#238636]/15 text-[#2ea043] border border-[#238636]/30 rounded-lg">
                    Present Verified: {calculatedPresent}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    Total Registered <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('totalRegisteredLearners', { valueAsNumber: true })}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] font-mono focus:border-[#2ea043] outline-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    Total Present Observed <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('attendance', { valueAsNumber: true })}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] font-mono focus:border-[#2ea043] outline-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    Boys Count <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('boysCount', { valueAsNumber: true })}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] font-mono focus:border-[#2ea043] outline-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    Girls Count <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    {...register('girlsCount', { valueAsNumber: true })}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] font-mono focus:border-[#2ea043] outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Lesson & Broadcast Observation */}
            <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-[#21262d]">
                <Radio className="w-4 h-4 text-[#2ea043]" />
                <h2 className="text-sm font-bold text-[#f0f6fc]">3. Lesson & Radio Broadcast Observation</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    Lesson Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lesson 14"
                    {...register('lessonNumber')}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] placeholder-[#8b949e] focus:border-[#2ea043] outline-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    Lesson Taught & Topic Observed <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Literacy & Basic Math"
                    {...register('topics')}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] placeholder-[#8b949e] focus:border-[#2ea043] outline-none text-xs"
                  />
                </div>
              </div>

              {/* Radio Lesson Delivered */}
              <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-semibold text-[#f0f6fc]">Was today's radio lesson broadcast delivered?</span>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setValue('radioLessonDelivered', true)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                        watchedRadioDelivered ? "bg-[#238636]/20 border-[#238636] text-[#2ea043]" : "border-[#30363d] text-[#8b949e]"
                      )}
                    >
                      Yes, Delivered
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('radioLessonDelivered', false)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                        !watchedRadioDelivered ? "bg-red-500/20 border-red-500 text-red-400" : "border-[#30363d] text-[#8b949e]"
                      )}
                    >
                      No, Not Delivered
                    </button>
                  </div>
                </div>

                {!watchedRadioDelivered && (
                  <div className="pt-2 border-t border-[#21262d] space-y-1">
                    <label className="text-[11px] font-semibold text-amber-400">
                      Reason Radio Lesson Not Delivered: <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Signal loss, radio malfunctioning, power cut..."
                      {...register('radioLessonReasonNotDelivered')}
                      className="w-full p-2.5 rounded-lg border border-amber-500/40 bg-[#161b22] text-[#f0f6fc] outline-none text-xs"
                    />
                  </div>
                )}
              </div>

              {/* Lesson Completed & Workbook */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#f0f6fc]">Was lesson completed?</p>
                    <p className="text-[10px] text-[#8b949e]">Full syllabus coverage</p>
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
                    <p className="text-xs font-semibold text-[#f0f6fc]">Did learners use workbook?</p>
                    <p className="text-[10px] text-[#8b949e]">Individual workbook engagement</p>
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

              {/* Learner Understanding */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#f0f6fc] block">
                  Learner Comprehension Rating & Quality Assessment <span className="text-red-400">*</span>
                </label>
                <select
                  {...register('learnerUnderstanding')}
                  className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] text-xs focus:border-[#2ea043] outline-none"
                >
                  <option value="Excellent comprehension - High learner confidence & complete task answers">5 - Excellent Comprehension</option>
                  <option value="Good comprehension - Active participation & responses">4 - Good Comprehension</option>
                  <option value="Moderate understanding - Needed repeated prompts & assistance">3 - Moderate Comprehension</option>
                  <option value="Struggling - Frequent confusion & incomplete tasks">2 - Struggling</option>
                </select>
              </div>
            </div>

            {/* Section 4: Learning Environment Quality & Safety */}
            <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-[#21262d]">
                <School className="w-4 h-4 text-[#2ea043]" />
                <h2 className="text-sm font-bold text-[#f0f6fc]">4. Facility Environment & Protection</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    Classroom Physical Conditions <span className="text-red-400">*</span>
                  </label>
                  <select
                    {...register('classroomCondition')}
                    className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] text-xs focus:border-[#2ea043] outline-none"
                  >
                    <option value="Clean, well-ventilated, adequate seating and lighting">Clean, ventilated, adequate seating & light</option>
                    <option value="Crowded learning space, limited seating benches">Crowded space, limited seating benches</option>
                    <option value="Severe roof leaks, poor ventilation, requires repairs">Damaged roof, poor ventilation, needs repairs</option>
                    <option value="Outdoor shade setting, vulnerable to weather conditions">Outdoor shade setting (weather vulnerable)</option>
                  </select>
                </div>

                <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#f0f6fc]">Are instructional resources available?</p>
                    <p className="text-[10px] text-[#8b949e]">Radios, chalkboards, notebooks</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setValue('resourcesAvailable', true)}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer",
                        watch('resourcesAvailable') ? "bg-[#238636]/20 border-[#238636] text-[#2ea043]" : "border-[#30363d] text-[#8b949e]"
                      )}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue('resourcesAvailable', false)}
                      className={cn(
                        "px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer",
                        !watch('resourcesAvailable') ? "bg-red-500/20 border-red-500 text-red-400" : "border-[#30363d] text-[#8b949e]"
                      )}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* Safety Concerns */}
              <div className="p-3.5 rounded-xl border border-[#30363d] bg-[#0d1117] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className={cn("w-4 h-4", watchedSafetyConcerns ? 'text-red-400' : 'text-[#8b949e]')} />
                    <span className="text-xs font-semibold text-[#f0f6fc]">Were any safety or child protection concerns observed?</span>
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
                      Yes, Flag Issue
                    </button>
                  </div>
                </div>

                {watchedSafetyConcerns && (
                  <div className="pt-2 border-t border-[#21262d] space-y-1">
                    <label className="text-[11px] font-semibold text-red-400">
                      Safety Concerns Details: <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Detail hazard, protection risk, or structural issues observed..."
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

            {/* Section 5: Photo Capture & Supervisor Recommendations */}
            <div className="bg-[#161b22] p-5 rounded-2xl border border-[#30363d] space-y-4">
              <div className="pb-3 border-b border-[#21262d]">
                <h2 className="text-sm font-bold text-[#f0f6fc]">5. Photo Verification & Supervisor Recommendations</h2>
              </div>

              <Controller
                control={control}
                name="photoUrl"
                render={({ field }) => (
                  <PhotoCapture
                    label="Facility Visit / Learner Photo"
                    sublabel="Take a photo of the classroom session in progress or students interacting with the radio."
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-[#f0f6fc] block">
                  Supervisor Recommendations & Remedial Guidance (Optional)
                </label>
                <textarea
                  {...register('recommendations')}
                  rows={2}
                  placeholder="Suggestions for facilitator pedagogical improvement, workbook utilization, or center support..."
                  className="w-full p-2.5 rounded-xl border border-[#30363d] bg-[#0d1117] text-[#f0f6fc] placeholder-[#8b949e] focus:border-[#2ea043] outline-none text-xs"
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
                  <span>Recording Supervisor Visit...</span>
                </div>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Submit Supervisor Facility Visit</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* VIEW 2: SUPERVISOR ACTIVITY REPORT HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#21262d] pb-3">
              <div>
                <h2 className="text-sm font-bold text-[#f0f6fc]">My Facility Visit Activity History</h2>
                <p className="text-xs text-[#8b949e]">Review all facility monitoring visits you have recorded</p>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8b949e] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search center, facilitator, LGA..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs text-[#f0f6fc] focus:outline-none focus:border-[#2ea043]"
                />
              </div>
            </div>

            {loading ? (
              <div className="space-y-3 animate-pulse p-4">
                <div className="h-16 bg-[#21262d] rounded-xl" />
                <div className="h-16 bg-[#21262d] rounded-xl" />
                <div className="h-16 bg-[#21262d] rounded-xl" />
              </div>
            ) : filteredVisits.length > 0 ? (
              <div className="divide-y divide-[#21262d] border border-[#21262d] rounded-xl overflow-hidden bg-[#0d1117]">
                {filteredVisits.map((visit) => (
                  <div 
                    key={visit.id} 
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#161b22] transition-colors"
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#f0f6fc] truncate">{visit.learningCenterName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#238636]/15 text-[#2ea043] border border-[#238636]/30 shrink-0">
                          Facilitator: {visit.facilitatorName}
                        </span>
                        {visit.gpsLocation && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30 shrink-0 flex items-center space-x-1">
                            <Navigation className="w-2.5 h-2.5 mr-0.5" />
                            <span>GPS Locked</span>
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#8b949e]">
                        {visit.lga} • Date: {format(new Date(visit.date), 'MMM d, yyyy')} • Time: {visit.time}
                      </p>
                      <div className="flex items-center space-x-3 text-[11px] text-[#8b949e] pt-1">
                        <span>Attendance: <strong className="text-[#f0f6fc]">{visit.attendance}</strong></span>
                        <span>Boys: <strong className="text-[#58a6ff]">{visit.boysCount || 0}</strong></span>
                        <span>Girls: <strong className="text-pink-400">{visit.girlsCount || 0}</strong></span>
                        {visit.photoUrl && (
                          <span className="text-[10px] text-[#2ea043] bg-[#238636]/10 px-1.5 py-0.2 rounded border border-[#238636]/30">
                            Photo Captured
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => setSelectedVisit(visit)}
                        className="px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#2ea043] border border-[#30363d] rounded-xl text-xs font-medium cursor-pointer transition-colors inline-flex items-center space-x-1"
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
                <p>No supervisor visits found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL VISIT REPORT DETAIL MODAL */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fc]">Facility Visit Details</h3>
                <p className="text-[11px] text-[#8b949e]">
                  {selectedVisit.learningCenterName} • {format(new Date(selectedVisit.date), 'MMMM d, yyyy')} ({selectedVisit.time})
                </p>
              </div>
              <button 
                onClick={() => setSelectedVisit(null)}
                className="text-[#8b949e] hover:text-[#f0f6fc] p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                <span className="text-[#8b949e] block text-[10px]">LGA</span>
                <span className="font-semibold text-[#f0f6fc]">{selectedVisit.lga}</span>
              </div>
              <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                <span className="text-[#8b949e] block text-[10px]">Learning Center</span>
                <span className="font-semibold text-[#f0f6fc]">{selectedVisit.learningCenterName}</span>
              </div>
              <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                <span className="text-[#8b949e] block text-[10px]">Supervisor</span>
                <span className="font-semibold text-[#f0f6fc]">{selectedVisit.supervisorName}</span>
              </div>
              <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                <span className="text-[#8b949e] block text-[10px]">Facilitator Visited</span>
                <span className="font-semibold text-[#f0f6fc]">{selectedVisit.facilitatorName}</span>
              </div>
            </div>

            {selectedVisit.gpsLocation && (
              <div className="p-3 bg-[#0d1117] border border-[#238636]/40 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Navigation className="w-4 h-4 text-[#2ea043]" />
                  <div>
                    <span className="text-[#8b949e] block text-[10px]">GPS Coordinates Verified</span>
                    <span className="font-mono text-[#f0f6fc]">{selectedVisit.gpsLocation.latitude}, {selectedVisit.gpsLocation.longitude}</span>
                  </div>
                </div>
                <a
                  href={`https://www.google.com/maps?q=${selectedVisit.gpsLocation.latitude},${selectedVisit.gpsLocation.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-[#161b22] border border-[#238636]/40 text-[#2ea043] rounded-lg text-xs"
                >
                  View on Google Maps
                </a>
              </div>
            )}

            <div className="p-3.5 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-[#2ea043]">Learners Attendance Headcount</h4>
              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="p-2 bg-[#161b22] rounded-lg">
                  <span className="text-[10px] text-[#8b949e] block">Registered</span>
                  <span className="font-bold text-[#f0f6fc] font-mono">{selectedVisit.totalRegisteredLearners}</span>
                </div>
                <div className="p-2 bg-[#161b22] rounded-lg">
                  <span className="text-[10px] text-[#8b949e] block">Present</span>
                  <span className="font-bold text-[#2ea043] font-mono">{selectedVisit.attendance}</span>
                </div>
                <div className="p-2 bg-[#161b22] rounded-lg">
                  <span className="text-[10px] text-[#8b949e] block">Boys</span>
                  <span className="font-bold text-[#58a6ff] font-mono">{selectedVisit.boysCount || 0}</span>
                </div>
                <div className="p-2 bg-[#161b22] rounded-lg">
                  <span className="text-[10px] text-[#8b949e] block">Girls</span>
                  <span className="font-bold text-pink-400 font-mono">{selectedVisit.girlsCount || 0}</span>
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-[#f0f6fc]">Classroom Observation & Feedback</h4>
              <div className="space-y-1.5 text-[11px]">
                <p><strong className="text-[#8b949e]">Lesson & Topic:</strong> <span className="text-[#f0f6fc]">{selectedVisit.lessonNumber} • {selectedVisit.topics}</span></p>
                <p>
                  <strong className="text-[#8b949e]">Radio Lesson Delivered:</strong>{' '}
                  <span className={selectedVisit.radioLessonDelivered ? "text-[#2ea043] font-bold" : "text-red-400 font-bold"}>
                    {selectedVisit.radioLessonDelivered ? "Yes" : `No (${selectedVisit.radioLessonReasonNotDelivered || 'No reason provided'})`}
                  </span>
                </p>
                <p><strong className="text-[#8b949e]">Classroom Condition:</strong> <span className="text-[#f0f6fc]">{selectedVisit.classroomCondition}</span></p>
                <p><strong className="text-[#8b949e]">Learner Comprehension:</strong> <span className="text-[#f0f6fc]">{selectedVisit.learnerUnderstanding}</span></p>
                <p><strong className="text-[#8b949e]">Resources Available:</strong> <span className="text-[#f0f6fc]">{selectedVisit.resourcesAvailable ? "Yes" : "No"}</span></p>
                {selectedVisit.recommendations && (
                  <p><strong className="text-[#8b949e]">Supervisor Recommendations:</strong> <span className="text-[#f0f6fc]">{selectedVisit.recommendations}</span></p>
                )}
              </div>
            </div>

            {selectedVisit.photoUrl && (
              <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-2">
                <h4 className="font-bold text-xs text-[#f0f6fc]">Captured Visit Photo</h4>
                <img 
                  src={selectedVisit.photoUrl} 
                  alt="Visit photo" 
                  className="rounded-lg max-h-56 w-auto mx-auto object-cover border border-[#30363d]"
                />
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedVisit(null)}
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

export default SupervisorPortal;

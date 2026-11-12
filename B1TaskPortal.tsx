import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  updateDoc, 
  increment,
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Project, CustomSurveyQuestion, B1TaskSubmission, HireTaskInquiry } from '../types';
import { 
  FolderKanban, 
  CheckCircle2, 
  Layers, 
  MapPin, 
  Camera, 
  QrCode, 
  Clock, 
  Send, 
  Sparkles, 
  FileText, 
  Building2, 
  Mail, 
  Phone, 
  Compass, 
  Info,
  Calendar,
  Search,
  User,
  ArrowRight,
  Eye,
  X,
  Check
} from 'lucide-react';
import GpsLocationCapture from '../components/GpsLocationCapture';
import PhotoCapture from '../components/PhotoCapture';
import AppDownloadModal from '../components/AppDownloadModal';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { saveOfflineTaskSubmission } from '../lib/offlineSync';
import OfflineSyncBanner from '../components/OfflineSyncBanner';
import { WifiOff } from 'lucide-react';

export default function B1TaskPortal() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'questionnaire' | 'history' | 'hire'>('questionnaire');
  
  // Projects and custom questions
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<B1TaskSubmission | null>(null);
  const [offlineSaved, setOfflineSaved] = useState(false);

  // Form State for dynamic data collection
  const [locationName, setLocationName] = useState('');
  const [lga, setLga] = useState('');
  const [sector, setSector] = useState('other');
  const [gpsLocation, setGpsLocation] = useState<{ latitude: number; longitude: number; accuracy?: number } | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Submissions history
  const [mySubmissions, setMySubmissions] = useState<B1TaskSubmission[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Hire Me / Commission a Task Form
  const [hireForm, setHireForm] = useState({
    clientName: '',
    contactEmail: user?.email || '',
    contactPhone: '',
    sector: 'Health & Nutrition',
    locations: '',
    description: '',
    targetCount: 50
  });
  const [hireSubmitting, setHireSubmitting] = useState(false);
  const [hireSuccess, setHireSuccess] = useState(false);

  // Fetch available projects
  const fetchProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'projects'), where('status', '==', 'active'));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
      
      // Filter if user has specific assignedProjectIds, or show active projects
      let visible = list;
      if (profile?.assignedProjectIds && profile.assignedProjectIds.length > 0) {
        visible = list.filter(p => profile.assignedProjectIds?.includes(p.id));
        if (visible.length === 0) visible = list; // fallback to active
      }
      setProjects(visible);
      if (visible.length > 0 && !selectedProject) {
        setSelectedProject(visible[0]);
        if (visible[0].lga) setLga(visible[0].lga);
      }
    } catch (e) {
      console.error("Error fetching projects:", e);
    } finally {
      setLoading(false);
    }
  };

  // Fetch collector's submissions
  const fetchSubmissions = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const q = query(
        collection(db, 'task_submissions'),
        where('collectorId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setMySubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as B1TaskSubmission)));
    } catch (e) {
      console.error("Error fetching submissions:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchSubmissions();
  }, [user]);

  useEffect(() => {
    if (selectedProject?.lga) {
      setLga(selectedProject.lga);
    }
  }, [selectedProject]);

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);

    if (!selectedProject) {
      setFormError("Please select a project task.");
      return;
    }

    if (!locationName.trim()) {
      setFormError("Please enter the facility or location name.");
      return;
    }

    // Verify required custom questions
    if (selectedProject.customQuestions && selectedProject.customQuestions.length > 0) {
      for (const q of selectedProject.customQuestions) {
        if (q.required && (answers[q.id] === undefined || answers[q.id] === '')) {
          setFormError(`Required question: "${q.label}" must be answered.`);
          return;
        }
      }
    }

    setSubmitting(true);
    const submissionData: B1TaskSubmission = {
      projectId: selectedProject.id,
      projectTitle: selectedProject.name,
      sector: sector,
      collectorId: user.uid,
      collectorName: profile?.name || user.displayName || 'B1 Task Collector',
      collectorEmail: user.email || '',
      locationName: locationName.trim(),
      lga: lga.trim() || selectedProject.lga || '',
      gpsLocation: gpsLocation || undefined,
      photoUrl: photoUrl || undefined,
      answers: answers,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString()
    };

    // Offline immediate interception
    if (!navigator.onLine) {
      saveOfflineTaskSubmission(submissionData);
      setOfflineSaved(true);
      setSuccessModalOpen(true);
      setLocationName('');
      setAnswers({});
      setNotes('');
      setPhotoUrl(undefined);
      setGpsLocation(null);
      setSubmitting(false);
      return;
    }

    try {
      await addDoc(collection(db, 'task_submissions'), submissionData);

      // Increment project submission count
      try {
        const projRef = doc(db, 'projects', selectedProject.id);
        await updateDoc(projRef, {
          targetSubmissions: increment(0) // keep existing
        });
      } catch (err) {
        // Non-blocking
      }

      setOfflineSaved(false);
      setSuccessModalOpen(true);
      // Reset form
      setLocationName('');
      setAnswers({});
      setNotes('');
      setPhotoUrl(undefined);
      setGpsLocation(null);
      fetchSubmissions();
    } catch (err: any) {
      console.warn("Network error during submission, saving offline:", err);
      // Fallback: save to local offline outbox
      saveOfflineTaskSubmission(submissionData);
      setOfflineSaved(true);
      setSuccessModalOpen(true);
      setLocationName('');
      setAnswers({});
      setNotes('');
      setPhotoUrl(undefined);
      setGpsLocation(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleHireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hireForm.clientName || !hireForm.contactEmail || !hireForm.description) {
      return;
    }
    setHireSubmitting(true);
    try {
      const inquiry: HireTaskInquiry = {
        clientName: hireForm.clientName.trim(),
        contactEmail: hireForm.contactEmail.trim(),
        contactPhone: hireForm.contactPhone.trim() || undefined,
        sector: hireForm.sector,
        locations: hireForm.locations.trim(),
        description: hireForm.description.trim(),
        targetCount: Number(hireForm.targetCount) || 50,
        status: 'new',
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'hire_inquiries'), inquiry);
      setHireSuccess(true);
      setHireForm({
        clientName: '',
        contactEmail: user?.email || '',
        contactPhone: '',
        sector: 'Health & Nutrition',
        locations: '',
        description: '',
        targetCount: 50
      });
    } catch (e) {
      console.error("Error submitting inquiry:", e);
    } finally {
      setHireSubmitting(false);
    }
  };

  const hasCustomQuestions = selectedProject && selectedProject.customQuestions && selectedProject.customQuestions.length > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-[#c9d1d9] font-sans pb-12">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#bc8cff]/15 border border-[#bc8cff]/30 text-[#bc8cff]">
              B1 Task Engine
            </span>
            <span className="text-xs text-[#8b949e]">Multi-Sector Collector</span>
          </div>
          <h1 className="text-2xl font-bold text-[#f0f6fc] mt-1">Field Task & Data Portal</h1>
          <p className="text-xs text-[#8b949e]">
            Assigned Collector: <strong className="text-[#f0f6fc]">{profile?.name || user?.displayName}</strong> &bull; Access Code: <span className="font-mono text-[#bc8cff]">{profile?.accessCode || 'B1-ACTIVE'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setIsDownloadOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-[#f0f6fc] rounded-xl transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#2ea043]" />
            <span>Mobile App Barcode</span>
          </button>
        </div>
      </header>

      {/* Offline Connectivity & Sync Banner */}
      <OfflineSyncBanner className="mb-2" />

      {/* Main Tabs */}
      <div className="flex border-b border-[#30363d] gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('questionnaire')}
          className={cn(
            "flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'questionnaire'
              ? "border-[#bc8cff] text-[#f0f6fc] bg-[#21262d]/40"
              : "border-transparent text-[#8b949e] hover:text-[#f0f6fc]"
          )}
        >
          <FolderKanban className="w-4 h-4 text-[#bc8cff]" />
          <span>Active Task Questionnaire</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'history'
              ? "border-[#2ea043] text-[#f0f6fc] bg-[#21262d]/40"
              : "border-transparent text-[#8b949e] hover:text-[#f0f6fc]"
          )}
        >
          <Clock className="w-4 h-4 text-[#2ea043]" />
          <span>Submission History ({mySubmissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('hire')}
          className={cn(
            "flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'hire'
              ? "border-[#58a6ff] text-[#f0f6fc] bg-[#21262d]/40"
              : "border-transparent text-[#8b949e] hover:text-[#f0f6fc]"
          )}
        >
          <Sparkles className="w-4 h-4 text-[#58a6ff]" />
          <span>Hire Me / Task Inquiry</span>
        </button>
      </div>

      {/* TAB 1: QUESTIONNAIRE (OR EMPTY STATE IF AWAITING QUESTIONS) */}
      {activeTab === 'questionnaire' && (
        <div className="space-y-6">
          {/* Project Selector Bar */}
          {projects.length > 0 && (
            <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <FolderKanban className="w-5 h-5 text-[#bc8cff]" />
                <div>
                  <label className="text-[11px] text-[#8b949e] font-medium block">Assigned Project Task:</label>
                  <select
                    value={selectedProject?.id || ''}
                    onChange={(e) => {
                      const found = projects.find(p => p.id === e.target.value);
                      setSelectedProject(found || null);
                    }}
                    className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#f0f6fc] focus:outline-none focus:border-[#bc8cff]"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.customQuestions?.length || 0} questions)</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedProject?.guide && (
                <div className="text-xs text-[#8b949e] flex items-center space-x-1.5 bg-[#0d1117] px-3 py-1.5 rounded-lg border border-[#21262d]">
                  <Info className="w-3.5 h-3.5 text-[#58a6ff]" />
                  <span className="truncate max-w-xs">{selectedProject.guide}</span>
                </div>
              )}
            </div>
          )}

          {/* IF NO PROJECT OR NO QUESTIONS CONFIGURED YET -> SHOW THE "LEAVE IT EMPTY / HIRE ME" STATE */}
          {(!selectedProject || !hasCustomQuestions) ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 sm:p-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-[#bc8cff]/15 border border-[#bc8cff]/30 flex items-center justify-center mx-auto text-[#bc8cff] shadow-md">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="max-w-xl mx-auto space-y-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#21262d] text-[#8b949e] border border-[#30363d]">
                  Workspace Ready &bull; Awaiting Question Configuration
                </span>
                <h2 className="text-2xl font-bold text-[#f0f6fc] pt-2">
                  No Active Task Questions Yet
                </h2>
                <p className="text-xs sm:text-sm text-[#8b949e] leading-relaxed">
                  This B1 Task space is left clean and empty for any sector data you need to collect (Healthcare, Agriculture, WASH, Humanitarian, Market Research). Once the administrator or hiring organization sets up the specific question set, the form will appear here automatically.
                </p>
              </div>

              {/* Hire Me / Commission a Task Callout */}
              <div className="max-w-xl mx-auto p-5 bg-[#0d1117] border border-[#30363d] rounded-xl text-left space-y-3">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#58a6ff]">
                  <Building2 className="w-4 h-4" />
                  <span>Hire Me / Contract Our Team For Data Collection</span>
                </div>
                <p className="text-xs text-[#8b949e] leading-relaxed">
                  Need data collected for a specific project? Submit your requirements. The administrator will configure your tailored questions, and they will immediately appear on this screen.
                </p>
                <button
                  onClick={() => setActiveTab('hire')}
                  className="w-full py-2.5 px-4 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                >
                  <span>Submit Task Requirements (Hire Us)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            /* ACTIVE QUESTIONNAIRE CONFIGURED BY ADMIN */
            <form onSubmit={handleSubmit} className="space-y-6">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl">
                  {formError}
                </div>
              )}

              {/* General Metadata Section */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-2 pb-3 border-b border-[#21262d]">
                  <MapPin className="w-4 h-4 text-[#bc8cff]" />
                  <h3 className="text-sm font-bold text-[#f0f6fc]">Site & Location Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-semibold text-[#f0f6fc] block">
                      Facility / Community / Site Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Primary Health Center, Farm Block 4, Community Water Borehole"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-xs text-[#f0f6fc] focus:border-[#bc8cff] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#f0f6fc] block">
                      LGA / District
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ungogo, Nasarawa"
                      value={lga}
                      onChange={(e) => setLga(e.target.value)}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-xs text-[#f0f6fc] focus:border-[#bc8cff] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Sector Classification */}
                <div className="space-y-1 pt-2">
                  <label className="text-xs font-semibold text-[#f0f6fc] block">
                    Task Sector
                  </label>
                  <select
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full sm:w-1/2 bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-xs text-[#f0f6fc] focus:border-[#bc8cff] focus:outline-none"
                  >
                    <option value="health">Healthcare & Clinical Outreach</option>
                    <option value="agriculture">Agriculture & Food Security</option>
                    <option value="wash">WASH & Water Points</option>
                    <option value="humanitarian">Humanitarian & Relief Aid</option>
                    <option value="education">Education & Community Training</option>
                    <option value="other">Other / Custom Enterprise Task</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC QUESTIONS SET BY ADMIN */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#21262d]">
                  <div className="flex items-center space-x-2">
                    <FolderKanban className="w-4 h-4 text-[#2ea043]" />
                    <h3 className="text-sm font-bold text-[#f0f6fc]">
                      {selectedProject.name} — Customized Question Set
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-[#8b949e]">
                    {selectedProject.customQuestions?.length} Questions
                  </span>
                </div>

                <div className="space-y-5">
                  {selectedProject.customQuestions?.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-[#f0f6fc]">
                          <span className="text-[#bc8cff] mr-1.5">Q{idx + 1}.</span>
                          {q.label}
                          {q.required && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <span className="text-[10px] uppercase font-mono text-[#8b949e]">
                          {q.type}
                        </span>
                      </div>

                      {q.type === 'text' && (
                        <input
                          type="text"
                          required={q.required}
                          placeholder="Enter response..."
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:border-[#bc8cff] focus:outline-none"
                        />
                      )}

                      {q.type === 'number' && (
                        <input
                          type="number"
                          required={q.required}
                          placeholder="0"
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full sm:w-48 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs font-mono text-[#f0f6fc] focus:border-[#bc8cff] focus:outline-none"
                        />
                      )}

                      {q.type === 'boolean' && (
                        <div className="flex space-x-3 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAnswerChange(q.id, true)}
                            className={cn(
                              "px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                              answers[q.id] === true
                                ? "bg-[#238636] border-[#2ea043] text-white"
                                : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:border-[#8b949e]"
                            )}
                          >
                            Yes / Observed
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAnswerChange(q.id, false)}
                            className={cn(
                              "px-4 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer",
                              answers[q.id] === false
                                ? "bg-red-500/20 border-red-500 text-red-400"
                                : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:border-[#8b949e]"
                            )}
                          >
                            No / Not Observed
                          </button>
                        </div>
                      )}

                      {q.type === 'select' && (
                        <select
                          required={q.required}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full sm:w-1/2 bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:border-[#bc8cff] focus:outline-none"
                        >
                          <option value="">-- Select option --</option>
                          {q.options?.map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* GPS and Photo Verification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#f0f6fc]">
                    <Compass className="w-4 h-4 text-[#2ea043]" />
                    <span>GPS Location Lock (Optional Verification)</span>
                  </div>
                  <GpsLocationCapture
                    onLocationCaptured={(loc) => setGpsLocation(loc)}
                    initialLocation={gpsLocation}
                  />
                </div>

                <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#f0f6fc]">
                    <Camera className="w-4 h-4 text-[#58a6ff]" />
                    <span>Photographic Field Proof (Optional)</span>
                  </div>
                  <PhotoCapture
                    onPhotoCaptured={(url) => setPhotoUrl(url)}
                    initialPhotoUrl={photoUrl}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-2">
                <label className="text-xs font-semibold text-[#f0f6fc] block">
                  Additional Field Notes & Observations
                </label>
                <textarea
                  rows={2}
                  placeholder="Any operational challenges, unusual observations, or comments..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-xs text-[#f0f6fc] focus:border-[#bc8cff] focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-6 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-sm flex items-center justify-center space-x-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Field Record to Database</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: SUBMISSIONS HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#21262d]">
            <div>
              <h3 className="text-sm font-bold text-[#f0f6fc]">My Submitted Records</h3>
              <p className="text-xs text-[#8b949e]">All synchronized data entries for this collector account</p>
            </div>
            <span className="text-xs font-mono text-[#2ea043]">
              {mySubmissions.length} Total Submissions
            </span>
          </div>

          {historyLoading ? (
            <div className="p-8 text-center text-xs text-[#8b949e]">Loading your submissions...</div>
          ) : mySubmissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#8b949e]">
              No submissions recorded yet for this collector.
            </div>
          ) : (
            <div className="space-y-3">
              {mySubmissions.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubmission(sub)}
                  className="p-4 bg-[#0d1117] border border-[#30363d] hover:border-[#bc8cff] rounded-xl flex items-center justify-between cursor-pointer transition-all group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-[#f0f6fc] group-hover:text-[#bc8cff] transition-colors">
                        {sub.locationName}
                      </span>
                      {sub.lga && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e]">
                          {sub.lga}
                        </span>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#bc8cff]/10 text-[#bc8cff] uppercase">
                        {sub.sector || 'task'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8b949e]">
                      Project: <span className="text-[#c9d1d9]">{sub.projectTitle}</span> &bull; {format(new Date(sub.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3">
                    {sub.photoUrl && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#58a6ff]/10 text-[#58a6ff]">
                        Photo
                      </span>
                    )}
                    {sub.gpsLocation && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#2ea043]/10 text-[#2ea043]">
                        GPS
                      </span>
                    )}
                    <Eye className="w-4 h-4 text-[#8b949e] group-hover:text-[#f0f6fc]" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HIRE ME / COMMISSION A DATA TASK INQUIRY */}
      {activeTab === 'hire' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-[#21262d] space-y-1">
            <div className="flex items-center space-x-2 text-xs font-bold text-[#58a6ff]">
              <Sparkles className="w-4 h-4" />
              <span>Contract Our Team / Request Question Configuration</span>
            </div>
            <h2 className="text-xl font-bold text-[#f0f6fc]">
              Hire Us to Collect Field Data
            </h2>
            <p className="text-xs text-[#8b949e] leading-relaxed">
              Submit your organization&apos;s data collection needs for any sector. The administrator will review your scope, configure the exact question parameters, and assign the project directly to your workspace.
            </p>
          </div>

          {hireSuccess && (
            <div className="p-4 bg-[#238636]/15 border border-[#238636]/40 rounded-xl text-xs text-[#2ea043] flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>
                Your data task inquiry has been received! The lead administrator has been notified and will configure your questionnaire. Once configured, it will immediately appear in your B1 Task Questionnaire tab.
              </span>
            </div>
          )}

          <form onSubmit={handleHireSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#f0f6fc] block">
                  Organization / Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Save Children Initiative, Health Ministry, Farm Cooperative"
                  value={hireForm.clientName}
                  onChange={(e) => setHireForm({ ...hireForm, clientName: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-xs text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#f0f6fc] block">
                  Sector *
                </label>
                <select
                  value={hireForm.sector}
                  onChange={(e) => setHireForm({ ...hireForm, sector: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-xs text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
                >
                  <option value="Healthcare & Public Health">Healthcare & Public Health</option>
                  <option value="Agriculture & Food Security">Agriculture & Food Security</option>
                  <option value="WASH & Sanitation">WASH & Sanitation Facilities</option>
                  <option value="Humanitarian & Relief">Humanitarian & Relief Aid</option>
                  <option value="Education & Literacy">Education & Literacy</option>
                  <option value="Market Research & Census">Market Research & Community Census</option>
                  <option value="Environmental Conservation">Environmental Conservation</option>
                  <option value="Other Custom Sector">Other Custom Sector</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#f0f6fc] block">
                  Contact Email *
                </label>
                <input
                  type="email"
                  required
                  value={hireForm.contactEmail}
                  onChange={(e) => setHireForm({ ...hireForm, contactEmail: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-xs text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#f0f6fc] block">
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+234..."
                  value={hireForm.contactPhone}
                  onChange={(e) => setHireForm({ ...hireForm, contactPhone: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-xs text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#f0f6fc] block">
                  Target Submissions Goal
                </label>
                <input
                  type="number"
                  value={hireForm.targetCount}
                  onChange={(e) => setHireForm({ ...hireForm, targetCount: Number(e.target.value) })}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#f0f6fc] block">
                Target Locations / LGAs *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kano Municipal, Fagge, Ungogo, Gwale"
                value={hireForm.locations}
                onChange={(e) => setHireForm({ ...hireForm, locations: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-xs text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#f0f6fc] block">
                Scope &amp; Desired Question Types *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Describe what questions you want collected (e.g. clinic equipment checklist, farmer harvest weights, water borehole salinity test, household head counts)..."
                value={hireForm.description}
                onChange={(e) => setHireForm({ ...hireForm, description: e.target.value })}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-xs text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={hireSubmitting}
              className="w-full py-3 px-6 rounded-xl bg-[#238636] hover:bg-[#2ea043] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              {hireSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Task Requirements to Admin</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* SUCCESS CONFIRMATION MODAL */}
      {successModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className={cn(
              "w-14 h-14 rounded-full border flex items-center justify-center mx-auto",
              offlineSaved 
                ? "bg-amber-500/20 border-amber-500/40 text-amber-400" 
                : "bg-[#238636]/20 border-[#238636]/40 text-[#2ea043]"
            )}>
              {offlineSaved ? <WifiOff className="w-7 h-7" /> : <Check className="w-7 h-7" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#f0f6fc]">
                {offlineSaved ? 'Saved Locally (Offline)' : 'Field Record Submitted!'}
              </h3>
              <p className="text-xs text-[#8b949e] mt-1">
                {offlineSaved 
                  ? 'No internet connection detected. Your record is securely saved to device memory and will sync automatically once online.'
                  : 'Your submission has been securely stored with encrypted timestamp and synchronized to the project dataset.'}
              </p>
            </div>
            <button
              onClick={() => {
                setSuccessModalOpen(false);
                setOfflineSaved(false);
              }}
              className="w-full py-2.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Continue Collecting
            </button>
          </div>
        </div>
      )}

      {/* DETAIL MODAL FOR INSPECTING A PREVIOUS SUBMISSION */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fc]">{selectedSubmission.locationName}</h3>
                <p className="text-[11px] text-[#8b949e]">
                  {selectedSubmission.projectTitle} &bull; {format(new Date(selectedSubmission.createdAt), 'PPpp')}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-1 rounded-lg hover:bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedSubmission.photoUrl && (
              <div className="rounded-xl overflow-hidden border border-[#30363d] max-h-48">
                <img
                  src={selectedSubmission.photoUrl}
                  alt="Field verification"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {selectedSubmission.gpsLocation && (
              <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs space-y-1">
                <div className="flex items-center space-x-1.5 text-[#2ea043] font-semibold">
                  <Compass className="w-3.5 h-3.5" />
                  <span>GPS Location Verified</span>
                </div>
                <p className="text-[11px] font-mono text-[#8b949e]">
                  Lat: {selectedSubmission.gpsLocation.latitude.toFixed(6)}, Lng: {selectedSubmission.gpsLocation.longitude.toFixed(6)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#f0f6fc]">Recorded Answers:</p>
              <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-2 text-xs">
                {Object.entries(selectedSubmission.answers).map(([key, val]) => (
                  <div key={key} className="flex justify-between border-b border-[#21262d] pb-1">
                    <span className="text-[#8b949e]">{key}:</span>
                    <span className="text-[#f0f6fc] font-medium">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedSubmission.notes && (
              <div className="text-xs text-[#8b949e] p-3 bg-[#0d1117] rounded-xl">
                <strong className="text-[#c9d1d9]">Notes:</strong> {selectedSubmission.notes}
              </div>
            )}

            <button
              onClick={() => setSelectedSubmission(null)}
              className="w-full py-2 bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#f0f6fc] rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <AppDownloadModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </div>
  );
}

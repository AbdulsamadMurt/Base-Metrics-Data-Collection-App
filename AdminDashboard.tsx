import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ClassReport, VisitReport, UserProfile, Project, CustomSurveyQuestion } from '../types';
import { 
  ShieldAlert, 
  Download, 
  Search, 
  FileText, 
  MapPin, 
  LayoutDashboard, 
  Users as UsersIcon,
  CheckCircle2, 
  XCircle, 
  FolderKanban, 
  Plus, 
  KeyRound, 
  BookOpen, 
  CheckSquare, 
  BarChart3, 
  Settings as SettingsIcon, 
  ExternalLink, 
  Calendar, 
  Clock, 
  X, 
  Check, 
  Trash2,
  HelpCircle,
  QrCode,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Share2
} from 'lucide-react';
import { generateUserAccessCode } from '../lib/accessCode';
import { format } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { cn } from '../lib/utils';
import AppDownloadModal from '../components/AppDownloadModal';

type AdminMainTab = 'projects' | 'approvals' | 'reports' | 'visits' | 'codes';
type ProjectSubTab = 'overview' | 'guide' | 'assignment' | 'questions' | 'results' | 'report' | 'settings';

const AdminDashboard: React.FC = () => {
  const [reports, setReports] = useState<ClassReport[]>([]);
  const [visits, setVisits] = useState<VisitReport[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [mainTab, setMainTab] = useState<AdminMainTab>('projects');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<{ type: 'report' | 'visit', data: any } | null>(null);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  // Selected project for the 7-subtab workflow
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectSubTab, setProjectSubTab] = useState<ProjectSubTab>('overview');

  // Modal to create new project
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectLga, setNewProjectLga] = useState('');
  const [newProjectTarget, setNewProjectTarget] = useState<number>(100);
  const [newProjectGuide, setNewProjectGuide] = useState('Ensure all learners are counted accurately. Verify workbook usage and radio lesson broadcast before submitting.');
  const [newProjectQuestions, setNewProjectQuestions] = useState<CustomSurveyQuestion[]>([]);

  // Access codes state (stored locally or in settings)
  const [accessCodes, setAccessCodes] = useState({
    facilitator: 'FAC-2026',
    supervisor: 'SUP-2026',
    admin: 'B1MERTICS'
  });
  const [showAdminCodes, setShowAdminCodes] = useState(false);
  const [codeSavedNotice, setCodeSavedNotice] = useState(false);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      // fallback below
    }
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      textArea.remove();
      return true;
    } catch (err) {
      console.error("Copy failed", err);
      return false;
    }
  };

  const handleCopyCode = async (code: string, userId: string, userName: string) => {
    await copyToClipboard(code);
    setCopiedUserId(userId);
    setCopyNotice(`Copied code "${code}" for ${userName}! You can now share it with them.`);
    setTimeout(() => {
      setCopiedUserId(null);
      setCopyNotice(null);
    }, 4000);
  };

  const handleCopyInvite = async (u: UserProfile) => {
    const inviteText = `Hello ${u.name}, your Base Metrics one-time activation code is: ${u.accessCode}. Open the web app at ${window.location.origin} and log in with your Google account (${u.email}) to unlock your ${u.role} dashboard permanently.`;
    await copyToClipboard(inviteText);
    setCopiedUserId(u.uid);
    setCopyNotice(`Copied full invite message for ${u.name}! Ready to send via WhatsApp or SMS.`);
    setTimeout(() => {
      setCopiedUserId(null);
      setCopyNotice(null);
    }, 4500);
  };

  const handleRegenerateUserCode = async (userId: string, role: string) => {
    const newCode = generateUserAccessCode(role);
    try {
      await updateDoc(doc(db, 'users', userId), { accessCode: newCode });
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, accessCode: newCode } : u));
      setCopyNotice(`Generated new activation code ${newCode}!`);
      setTimeout(() => setCopyNotice(null), 3500);
    } catch (err) {
      console.error('Failed to regenerate code:', err);
    }
  };

  const fetchAllData = async () => {
    try {
      const reportsSnap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc')));
      const visitsSnap = await getDocs(query(collection(db, 'visits'), orderBy('createdAt', 'desc')));
      const usersSnap = await getDocs(collection(db, 'users'));
      
      let fetchedProjects: Project[] = [];
      try {
        const projSnap = await getDocs(query(collection(db, 'projects'), orderBy('createdAt', 'desc')));
        fetchedProjects = projSnap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
      } catch (e) {
        console.error('Projects fetch error:', e);
      }

      const rawUsers = usersSnap.docs.map(doc => doc.data() as UserProfile);
      const populatedUsers: UserProfile[] = rawUsers.map(u => {
        if (!u.accessCode && u.role !== 'admin') {
          const generated = generateUserAccessCode(u.role || 'facilitator');
          updateDoc(doc(db, 'users', u.uid), { accessCode: generated }).catch(() => {});
          return { ...u, accessCode: generated };
        }
        return u;
      });

      setReports(reportsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ClassReport)));
      setVisits(visitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VisitReport)));
      setUsers(populatedUsers);
      setProjects(fetchedProjects);

      if (fetchedProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(fetchedProjects[0].id);
      }
    } catch (error) {
      console.error("Admin fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Approve a user account
  const handleApproveUser = async (userId: string, targetRole?: 'facilitator' | 'supervisor') => {
    try {
      const updatePayload: any = { 
        approvalStatus: 'approved',
        approvedAt: new Date().toISOString()
      };
      if (targetRole) updatePayload.role = targetRole;

      await updateDoc(doc(db, 'users', userId), updatePayload);
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, approvalStatus: 'approved', ...(targetRole ? { role: targetRole } : {}) } : u));
    } catch (err) {
      console.error('Failed to approve user:', err);
    }
  };

  // Reject or suspend a user account
  const handleRejectUser = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { approvalStatus: 'rejected' });
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, approvalStatus: 'rejected' } : u));
    } catch (err) {
      console.error('Failed to reject user:', err);
    }
  };

  // Create Project Task
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    try {
      const projectId = `proj-${Date.now()}`;
      const projectPayload: Project = {
        id: projectId,
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
        status: 'active',
        lga: newProjectLga.trim() || 'All LGAs',
        targetSubmissions: Number(newProjectTarget) || 50,
        guide: newProjectGuide.trim(),
        customQuestions: newProjectQuestions,
        assignedUserIds: [],
        createdAt: new Date().toISOString(),
        createdBy: 'Admin'
      };

      await setDoc(doc(db, 'projects', projectId), projectPayload);
      setProjects(prev => [projectPayload, ...prev]);
      setSelectedProjectId(projectId);
      setIsCreateProjectOpen(false);

      // Reset form
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectLga('');
      setNewProjectQuestions([]);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  // Toggle user assignment to selected project
  const handleToggleUserAssignment = async (userId: string) => {
    if (!selectedProjectId) return;
    const project = projects.find(p => p.id === selectedProjectId);
    if (!project) return;

    const currentAssigned = project.assignedUserIds || [];
    const isAssigned = currentAssigned.includes(userId);
    const updatedAssigned = isAssigned 
      ? currentAssigned.filter(id => id !== userId)
      : [...currentAssigned, userId];

    try {
      await updateDoc(doc(db, 'projects', selectedProjectId), {
        assignedUserIds: updatedAssigned
      });
      setProjects(prev => prev.map(p => p.id === selectedProjectId ? { ...p, assignedUserIds: updatedAssigned } : p));
    } catch (err) {
      console.error('Failed to update project assignment:', err);
    }
  };

  // Add custom question to new project
  const handleAddQuestionToNewProject = () => {
    const newQ: CustomSurveyQuestion = {
      id: `q_${Date.now()}`,
      label: 'New Assessment Question',
      type: 'text',
      required: false
    };
    setNewProjectQuestions(prev => [...prev, newQ]);
  };

  // CSV Export Utility
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const cleanData = data.map(item => {
      const copy: any = { ...item };
      if (copy.photoUrl) {
        copy.photoAttached = 'YES';
        delete copy.photoUrl;
      }
      if (copy.gpsLocation) {
        copy.gpsLatitude = copy.gpsLocation.latitude;
        copy.gpsLongitude = copy.gpsLocation.longitude;
        copy.gpsAccuracy = copy.gpsLocation.accuracy;
        delete copy.gpsLocation;
      }
      if (copy.customAnswers) {
        Object.entries(copy.customAnswers).forEach(([k, v]) => {
          copy[`custom_${k}`] = v;
        });
        delete copy.customAnswers;
      }
      return copy;
    });

    const headers = Object.keys(cleanData[0]);
    const csvRows = [
      headers.join(','),
      ...cleanData.map(row => 
        headers.map(field => {
          const val = row[field];
          if (val === null || val === undefined) return '""';
          const stringVal = String(val).replace(/"/g, '""');
          return `"${stringVal}"`;
        }).join(',')
      )
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BaseMetrics_${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Computed counts differentiating active personnel
  const activeFacilitators = users.filter(u => u.role === 'facilitator' && u.approvalStatus !== 'pending' && u.approvalStatus !== 'rejected');
  const activeSupervisors = users.filter(u => u.role === 'supervisor' && u.approvalStatus !== 'pending' && u.approvalStatus !== 'rejected');
  const pendingUsers = users.filter(u => u.approvalStatus === 'pending');

  const selectedProject = projects.find(p => p.id === selectedProjectId) || projects[0];
  const projectSubmissions = selectedProject 
    ? reports.filter(r => r.projectId === selectedProject.id)
    : [];

  const chartData = [
    { name: 'Active Facilitators', count: activeFacilitators.length, color: '#58a6ff' },
    { name: 'Active Supervisors', count: activeSupervisors.length, color: '#2ea043' },
    { name: 'Class Reports', count: reports.length, color: '#bc8cff' },
    { name: 'Supervisor Visits', count: visits.length, color: '#f0883e' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-[#2ea043] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto text-[#c9d1d9]">
      {/* Top Header - GitHub / Micro1 Style */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-[#bc8cff]/15 border border-[#bc8cff]/30 text-[#bc8cff]">
              Admin Mission Control
            </span>
            <span className="text-xs text-[#8b949e]">Base Metrics Enterprise</span>
          </div>
          <h1 className="text-2xl font-bold text-[#f0f6fc]">Program Administration & Project Tasks</h1>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Manage multi-task data collection campaigns, field personnel approvals, and download sanitized CSV datasets.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            to="/dashboard"
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-[#f0f6fc] rounded-xl transition-colors cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4 text-[#58a6ff]" />
            <span>Overview Dashboard</span>
          </Link>

          <button
            onClick={() => setIsDownloadOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs font-semibold text-[#f0f6fc] rounded-xl transition-colors cursor-pointer"
          >
            <QrCode className="w-4 h-4 text-[#2ea043]" />
            <span>Mobile App Barcode</span>
          </button>

          <button
            onClick={() => setIsCreateProjectOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project Task</span>
          </button>
        </div>
      </header>

      {/* Differentiated Personnel Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#8b949e]">Active Facilitators</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-[#58a6ff]">{activeFacilitators.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#58a6ff]/10 border border-[#58a6ff]/30 flex items-center justify-center text-[#58a6ff]">
            <UsersIcon className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#8b949e]">Active Supervisors</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-[#2ea043]">{activeSupervisors.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#238636]/10 border border-[#238636]/30 flex items-center justify-center text-[#2ea043]">
            <ShieldAlert className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#8b949e]">Pending Approvals</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-amber-400">{pendingUsers.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] p-4 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-[#8b949e]">Active Projects</p>
            <p className="text-2xl font-bold font-mono tabular-nums text-[#bc8cff]">{projects.length}</p>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#bc8cff]/10 border border-[#bc8cff]/30 flex items-center justify-center text-[#bc8cff]">
            <FolderKanban className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-[#30363d] overflow-x-auto gap-2">
        <button
          onClick={() => setMainTab('projects')}
          className={cn(
            "flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
            mainTab === 'projects' 
              ? "border-[#f78166] text-[#f0f6fc] bg-[#21262d]/40" 
              : "border-transparent text-[#8b949e] hover:text-[#f0f6fc]"
          )}
        >
          <FolderKanban className="w-4 h-4 text-[#f78166]" />
          <span>Projects & Data Tasks</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#21262d] text-[#8b949e]">
            {projects.length}
          </span>
        </button>

        <button
          onClick={() => setMainTab('approvals')}
          className={cn(
            "flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
            mainTab === 'approvals' 
              ? "border-[#58a6ff] text-[#f0f6fc] bg-[#21262d]/40" 
              : "border-transparent text-[#8b949e] hover:text-[#f0f6fc]"
          )}
        >
          <UsersIcon className="w-4 h-4 text-[#58a6ff]" />
          <span>User Approvals & Staff</span>
          {pendingUsers.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
              {pendingUsers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setMainTab('reports')}
          className={cn(
            "flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
            mainTab === 'reports' 
              ? "border-[#bc8cff] text-[#f0f6fc] bg-[#21262d]/40" 
              : "border-transparent text-[#8b949e] hover:text-[#f0f6fc]"
          )}
        >
          <FileText className="w-4 h-4 text-[#bc8cff]" />
          <span>Class Reports ({reports.length})</span>
        </button>

        <button
          onClick={() => setMainTab('visits')}
          className={cn(
            "flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
            mainTab === 'visits' 
              ? "border-[#2ea043] text-[#f0f6fc] bg-[#21262d]/40" 
              : "border-transparent text-[#8b949e] hover:text-[#f0f6fc]"
          )}
        >
          <MapPin className="w-4 h-4 text-[#2ea043]" />
          <span>Supervisor Visits ({visits.length})</span>
        </button>

        <button
          onClick={() => setMainTab('codes')}
          className={cn(
            "flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap",
            mainTab === 'codes' 
              ? "border-[#d29922] text-[#f0f6fc] bg-[#21262d]/40" 
              : "border-transparent text-[#8b949e] hover:text-[#f0f6fc]"
          )}
        >
          <KeyRound className="w-4 h-4 text-[#d29922]" />
          <span>Role Access Codes</span>
        </button>
      </div>

      {/* TAB 1: PROJECTS & DATA TASKS (7-Subtab Workflow) */}
      {mainTab === 'projects' && (
        <div className="space-y-6">
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Project Sidebar / Selector */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 space-y-3 h-fit">
                <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b949e]">Select Campaign</h3>
                  <button
                    onClick={() => setIsCreateProjectOpen(true)}
                    className="p-1 rounded bg-[#238636] text-white hover:bg-[#2ea043] transition-colors"
                    title="Create New Project"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {projects.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedProjectId(p.id)}
                      className={cn(
                        "w-full text-left p-2.5 rounded-xl transition-all cursor-pointer",
                        selectedProjectId === p.id 
                          ? "bg-[#21262d] border border-[#58a6ff] text-[#f0f6fc]" 
                          : "border border-transparent hover:bg-[#21262d]/50 text-[#8b949e]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold truncate">{p.name}</span>
                        <span className={cn(
                          "text-[9px] font-mono px-1 py-0.2 rounded uppercase",
                          p.status === 'active' ? "text-[#2ea043] bg-[#238636]/15" : "text-gray-400 bg-gray-500/15"
                        )}>
                          {p.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8b949e] truncate mt-0.5">{p.lga || 'All LGAs'}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 7-Subtab Workflow Container for Selected Project */}
              {selectedProject && (
                <div className="lg:col-span-3 bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden space-y-5">
                  {/* Project Header */}
                  <div className="p-5 border-b border-[#30363d] bg-[#0d1117] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-bold text-[#f0f6fc]">{selectedProject.name}</h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-[#238636]/20 text-[#2ea043] border border-[#238636]/30">
                          {selectedProject.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#8b949e] mt-1">{selectedProject.description}</p>
                    </div>

                    <button
                      onClick={() => exportToCSV(projectSubmissions.length > 0 ? projectSubmissions : reports, `${selectedProject.name.replace(/\s+/g, '_')}_Submissions`)}
                      className="px-3.5 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shrink-0 shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Project CSV</span>
                    </button>
                  </div>

                  {/* The 7 Workflow Sub-tabs requested by user */}
                  <div className="px-5 border-b border-[#21262d] flex space-x-1 overflow-x-auto">
                    {[
                      { id: 'overview', label: '1. Overview', icon: BarChart3 },
                      { id: 'guide', label: '2. Field Guide', icon: BookOpen },
                      { id: 'assignment', label: '3. Assignment', icon: UsersIcon },
                      { id: 'questions', label: '4. Survey Questions', icon: HelpCircle },
                      { id: 'results', label: '5. Results', icon: CheckSquare },
                      { id: 'report', label: '6. Report & Analytics', icon: Download },
                      { id: 'settings', label: '7. Settings', icon: SettingsIcon },
                    ].map(st => (
                      <button
                        key={st.id}
                        onClick={() => setProjectSubTab(st.id as ProjectSubTab)}
                        className={cn(
                          "flex items-center space-x-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap",
                          projectSubTab === st.id
                            ? "bg-[#21262d] text-[#f0f6fc] font-semibold"
                            : "text-[#8b949e] hover:text-[#f0f6fc]"
                        )}
                      >
                        <st.icon className="w-3.5 h-3.5" />
                        <span>{st.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Sub-tab Content Panels */}
                  <div className="p-5">
                    {/* 1. OVERVIEW */}
                    {projectSubTab === 'overview' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                            <span className="text-[11px] text-[#8b949e]">Target Submissions</span>
                            <p className="text-xl font-bold font-mono text-[#f0f6fc] mt-1">
                              {selectedProject.targetSubmissions || 100}
                            </p>
                          </div>
                          <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                            <span className="text-[11px] text-[#8b949e]">Collected Submissions</span>
                            <p className="text-xl font-bold font-mono text-[#2ea043] mt-1">
                              {projectSubmissions.length}
                            </p>
                          </div>
                          <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                            <span className="text-[11px] text-[#8b949e]">Assigned Field Staff</span>
                            <p className="text-xl font-bold font-mono text-[#58a6ff] mt-1">
                              {selectedProject.assignedUserIds?.length || 0}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 p-3.5 bg-[#0d1117] border border-[#21262d] rounded-xl">
                          <div className="flex justify-between text-xs">
                            <span className="text-[#8b949e]">Campaign Completion</span>
                            <span className="font-mono text-[#2ea043] font-semibold">
                              {Math.min(100, Math.round((projectSubmissions.length / (selectedProject.targetSubmissions || 100)) * 100))}%
                            </span>
                          </div>
                          <div className="w-full bg-[#21262d] h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-[#238636] h-full transition-all duration-300"
                              style={{ width: `${Math.min(100, (projectSubmissions.length / (selectedProject.targetSubmissions || 100)) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. FIELD GUIDE */}
                    {projectSubTab === 'guide' && (
                      <div className="space-y-3">
                        <div className="p-4 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#58a6ff]">
                            Enumerator & Supervisor Field Protocol
                          </h4>
                          <p className="text-xs leading-relaxed text-[#c9d1d9] whitespace-pre-wrap">
                            {selectedProject.guide || 'Standard education monitoring protocol applies. Ensure attendance is counted accurately and photos are taken when permitted.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* 3. ASSIGNMENT */}
                    {projectSubTab === 'assignment' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#f0f6fc]">
                            Assign Facilitators & Supervisors to this Task ({selectedProject.assignedUserIds?.length || 0} assigned)
                          </h4>
                        </div>
                        <div className="divide-y divide-[#21262d] bg-[#0d1117] border border-[#21262d] rounded-xl max-h-72 overflow-y-auto">
                          {users.map(u => {
                            const isAssigned = (selectedProject.assignedUserIds || []).includes(u.uid);
                            return (
                              <div key={u.uid} className="p-3 flex items-center justify-between hover:bg-[#161b22]">
                                <div>
                                  <p className="text-xs font-semibold text-[#f0f6fc]">{u.name}</p>
                                  <p className="text-[11px] text-[#8b949e]">{u.email} • <span className="capitalize">{u.role}</span></p>
                                </div>
                                <button
                                  onClick={() => handleToggleUserAssignment(u.uid)}
                                  className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-lg transition-colors cursor-pointer",
                                    isAssigned 
                                      ? "bg-[#238636]/20 text-[#2ea043] border border-[#238636]/40" 
                                      : "bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]"
                                  )}
                                >
                                  {isAssigned ? 'Assigned ✓' : '+ Assign'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4. QUESTIONS / SURVEY BUILDER */}
                    {projectSubTab === 'questions' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#f0f6fc]">
                            Custom Survey Questions ({selectedProject.customQuestions?.length || 0})
                          </h4>
                          <span className="text-[11px] text-[#8b949e]">
                            In addition to core 15 education metrics
                          </span>
                        </div>

                        {selectedProject.customQuestions && selectedProject.customQuestions.length > 0 ? (
                          <div className="space-y-2">
                            {selectedProject.customQuestions.map((q, idx) => (
                              <div key={q.id} className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl flex items-center justify-between">
                                <div>
                                  <p className="text-xs font-semibold text-[#f0f6fc]">{idx + 1}. {q.label}</p>
                                  <p className="text-[10px] text-[#8b949e] font-mono uppercase">Type: {q.type} {q.required ? '• Required' : ''}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 bg-[#0d1117] rounded-xl border border-dashed border-[#30363d] text-center text-xs text-[#8b949e]">
                            No custom questions configured. This task uses standard 15 education verification metrics.
                          </div>
                        )}
                      </div>
                    )}

                    {/* 5. RESULTS */}
                    {projectSubTab === 'results' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[#f0f6fc]">
                            Submissions for this Project ({projectSubmissions.length})
                          </h4>
                          <button
                            onClick={() => exportToCSV(projectSubmissions, `${selectedProject.name}_Results`)}
                            className="text-xs text-[#58a6ff] hover:underline flex items-center"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
                          </button>
                        </div>

                        {projectSubmissions.length > 0 ? (
                          <div className="divide-y divide-[#21262d] bg-[#0d1117] border border-[#21262d] rounded-xl overflow-hidden text-xs">
                            {projectSubmissions.map(r => (
                              <div key={r.id} className="p-3 flex items-center justify-between hover:bg-[#161b22]">
                                <div>
                                  <p className="font-semibold text-[#f0f6fc]">{r.learningCenterName} • {r.lga}</p>
                                  <p className="text-[11px] text-[#8b949e]">Facilitator: {r.facilitatorName} • Date: {r.date}</p>
                                </div>
                                <span className="font-mono text-[#58a6ff]">{r.attendance} Learners</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 bg-[#0d1117] rounded-xl border border-dashed border-[#30363d] text-center text-xs text-[#8b949e]">
                            No submissions recorded yet for this project task.
                          </div>
                        )}
                      </div>
                    )}

                    {/* 6. REPORT */}
                    {projectSubTab === 'report' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[#2ea043]">
                            Ready for Analysis
                          </h4>
                          <p className="text-xs text-[#8b949e]">
                            Download sanitized, analysis-ready CSV spreadsheets containing attendance numbers, gender breakdown, curriculum progress, and GPS verification status.
                          </p>
                          <button
                            onClick={() => exportToCSV(projectSubmissions.length > 0 ? projectSubmissions : reports, `${selectedProject.name}_Dataset`)}
                            className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl flex items-center space-x-2 transition-colors cursor-pointer"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Full Project Data (CSV)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* 7. SETTINGS */}
                    {projectSubTab === 'settings' && (
                      <div className="space-y-4">
                        <div className="p-4 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-3">
                          <h4 className="text-xs font-bold text-[#f0f6fc]">Campaign Status</h4>
                          <div className="flex space-x-2">
                            {(['active', 'completed', 'paused'] as const).map(st => (
                              <button
                                key={st}
                                onClick={async () => {
                                  await updateDoc(doc(db, 'projects', selectedProject.id), { status: st });
                                  setProjects(prev => prev.map(p => p.id === selectedProject.id ? { ...p, status: st } : p));
                                }}
                                className={cn(
                                  "px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer",
                                  selectedProject.status === st
                                    ? "bg-[#238636] text-white"
                                    : "bg-[#21262d] text-[#8b949e] hover:text-[#f0f6fc]"
                                )}
                              >
                                {st}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 bg-[#161b22] border border-[#30363d] rounded-2xl text-center space-y-4">
              <FolderKanban className="w-12 h-12 text-[#8b949e] mx-auto" />
              <div>
                <h3 className="text-base font-bold text-[#f0f6fc]">No Custom Project Tasks Yet</h3>
                <p className="text-xs text-[#8b949e] mt-1 max-w-md mx-auto">
                  Create different projects with custom question data, assign them to field enumerators, and download project-specific results.
                </p>
              </div>
              <button
                onClick={() => setIsCreateProjectOpen(true)}
                className="px-4 py-2.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Project Task</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USER APPROVALS & ACTIVE PERSONNEL */}
      {mainTab === 'approvals' && (
        <div className="space-y-6">
          {/* Notification banner for copy actions */}
          {copyNotice && (
            <div className="p-3.5 bg-[#238636]/15 border border-[#238636]/30 text-[#2ea043] rounded-xl text-xs flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="font-medium">{copyNotice}</span>
              </div>
              <button 
                onClick={() => setCopyNotice(null)} 
                className="text-[#8b949e] hover:text-[#f0f6fc] p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Pending Approvals Section */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#21262d] pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-[#f0f6fc]">
                  Pending Registrations Awaiting Approval ({pendingUsers.length})
                </h3>
              </div>
              <p className="text-[11px] text-[#8b949e]">
                Every registrant has their own individual access code. Share it with them or approve directly.
              </p>
            </div>

            {pendingUsers.length > 0 ? (
              <div className="divide-y divide-[#21262d] border border-[#21262d] rounded-xl overflow-hidden bg-[#0d1117]">
                {pendingUsers.map(u => (
                  <div key={u.uid} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[#161b22]/70 transition-colors">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-[#f0f6fc]">{u.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          {u.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8b949e]">
                        <span className="font-mono text-[#c9d1d9]">{u.email}</span> • Registered {u.createdAt ? format(new Date(u.createdAt), 'MMM d, yyyy • h:mm a') : 'Recently'}
                      </p>

                      {/* Individual Unique One-Time Access Code */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[11px] font-semibold text-[#8b949e]">Personal Access Code:</span>
                        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-[#58a6ff]/10 border border-[#58a6ff]/30 text-[#58a6ff] font-mono text-xs font-bold shadow-xs">
                          <KeyRound className="w-3.5 h-3.5" />
                          <span>{u.accessCode || 'Generating...'}</span>
                        </div>
                        <button
                          onClick={() => handleCopyCode(u.accessCode || '', u.uid, u.name)}
                          className="px-2.5 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] text-[11px] font-medium rounded-lg border border-[#30363d] inline-flex items-center space-x-1.5 cursor-pointer transition-colors shadow-xs"
                          title="Copy activation code to give to this user"
                        >
                          <Copy className="w-3 h-3 text-[#58a6ff]" />
                          <span>{copiedUserId === u.uid ? 'Copied!' : 'Copy Code'}</span>
                        </button>
                        <button
                          onClick={() => handleCopyInvite(u)}
                          className="px-2.5 py-1 bg-[#238636]/15 hover:bg-[#238636]/25 text-[#2ea043] text-[11px] font-medium rounded-lg border border-[#238636]/30 inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
                          title="Copy full WhatsApp or SMS invitation text"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Copy WhatsApp/SMS Message</span>
                        </button>
                        <button
                          onClick={() => handleRegenerateUserCode(u.uid, u.role)}
                          className="px-2 py-1 text-[#8b949e] hover:text-[#f0f6fc] text-[11px] inline-flex items-center space-x-1 cursor-pointer transition-colors"
                          title="Generate a fresh code for this user"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reset Code</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 pt-2 lg:pt-0">
                      <button
                        onClick={() => handleApproveUser(u.uid, 'facilitator')}
                        className="px-3 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shadow-xs inline-flex items-center space-x-1"
                        title="Directly activate as Facilitator without waiting for code"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Facilitator</span>
                      </button>
                      <button
                        onClick={() => handleApproveUser(u.uid, 'supervisor')}
                        className="px-3 py-2 bg-[#58a6ff]/20 hover:bg-[#58a6ff]/30 text-[#58a6ff] border border-[#58a6ff]/40 text-xs font-semibold rounded-xl transition-colors cursor-pointer inline-flex items-center space-x-1"
                        title="Directly activate as Supervisor without waiting for code"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Supervisor</span>
                      </button>
                      <button
                        onClick={() => handleRejectUser(u.uid)}
                        className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold rounded-xl transition-colors cursor-pointer inline-flex items-center space-x-1"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-[#0d1117] rounded-xl border border-dashed border-[#30363d] text-center text-xs text-[#8b949e]">
                No pending registrations right now. All staff are approved!
              </div>
            )}
          </div>

          {/* Active Staff Directory */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#f0f6fc]">Approved Field Personnel Directory</h3>
                <p className="text-xs text-[#8b949e] mt-0.5">Active team members authorized to collect and submit data</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#238636]/10 text-[#2ea043] border border-[#238636]/30 text-xs font-mono font-semibold">
                {users.filter(u => u.approvalStatus === 'approved' || !u.approvalStatus).length} Active
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0d1117] text-[#8b949e] text-[10px] uppercase font-mono tracking-wider border-b border-[#21262d]">
                  <tr>
                    <th className="px-4 py-3">Staff Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">One-Time Code</th>
                    <th className="px-4 py-3">Approval Status</th>
                    <th className="px-4 py-3">Quick Reassign</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#21262d]">
                  {users.map(u => (
                    <tr key={u.uid} className="hover:bg-[#21262d]/40">
                      <td className="px-4 py-3 font-semibold text-[#f0f6fc]">{u.name}</td>
                      <td className="px-4 py-3 text-[#8b949e] font-mono">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase",
                          u.role === 'supervisor' ? "bg-[#238636]/15 text-[#2ea043] border border-[#238636]/30" :
                          u.role === 'admin' ? "bg-[#bc8cff]/15 text-[#bc8cff] border border-[#bc8cff]/30" :
                          "bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30"
                        )}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.accessCode ? (
                          <div className="inline-flex items-center space-x-1.5 font-mono text-[11px] text-[#58a6ff] bg-[#58a6ff]/10 px-2 py-0.5 rounded border border-[#58a6ff]/20">
                            <span>{u.accessCode}</span>
                            <button
                              onClick={() => handleCopyCode(u.accessCode || '', u.uid, u.name)}
                              className="text-[#8b949e] hover:text-[#f0f6fc] cursor-pointer"
                              title="Copy code"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[#8b949e] font-mono text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-[10px] font-bold uppercase",
                          u.approvalStatus === 'approved' || !u.approvalStatus ? "text-[#2ea043]" :
                          u.approvalStatus === 'pending' ? "text-amber-400" : "text-red-400"
                        )}>
                          {u.approvalStatus || 'approved'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={async (e) => {
                            const newRole = e.target.value as any;
                            await updateDoc(doc(db, 'users', u.uid), { role: newRole });
                            setUsers(prev => prev.map(usr => usr.uid === u.uid ? { ...usr, role: newRole } : usr));
                          }}
                          className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1 text-[11px] text-[#f0f6fc] focus:outline-none"
                        >
                          <option value="facilitator">Facilitator</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="b1_task">B1 Task (Other Sectors)</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CLASS REPORTS */}
      {mainTab === 'reports' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden space-y-4">
          <div className="p-4 border-b border-[#21262d] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-[#f0f6fc]">All Facilitator Class Reports ({reports.length})</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Search LGA, Center, or Facilitator..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-1.5 text-xs text-[#f0f6fc] focus:outline-none"
              />
              <button
                onClick={() => exportToCSV(reports, 'All_Class_Reports')}
                className="px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl flex items-center space-x-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d1117] text-[#8b949e] text-[10px] uppercase font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3">LGA & Center</th>
                  <th className="px-4 py-3">Facilitator</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Lesson & Topic</th>
                  <th className="px-4 py-3">Learners</th>
                  <th className="px-4 py-3">Radio</th>
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {reports
                  .filter(r => (r.lga && r.lga.toLowerCase().includes(searchTerm.toLowerCase())) || (r.facilitatorName && r.facilitatorName.toLowerCase().includes(searchTerm.toLowerCase())))
                  .map(report => (
                    <tr key={report.id} className="hover:bg-[#21262d]/40">
                      <td className="px-4 py-3">
                        <p className="font-bold text-[#f0f6fc]">{report.learningCenterName}</p>
                        <p className="text-[10px] text-[#8b949e]">{report.lga}</p>
                      </td>
                      <td className="px-4 py-3 text-[#c9d1d9]">{report.facilitatorName}</td>
                      <td className="px-4 py-3 text-[#8b949e]">{format(new Date(report.date), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 max-w-xs truncate text-[#f0f6fc]">{report.topics}</td>
                      <td className="px-4 py-3 font-mono text-[#58a6ff]">{report.attendance}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                          report.radioLessonDelivered ? "bg-[#238636]/15 text-[#2ea043]" : "bg-red-500/15 text-red-400"
                        )}>
                          {report.radioLessonDelivered ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {report.photoUrl ? (
                          <img 
                            src={report.photoUrl} 
                            alt="Student capture" 
                            className="w-7 h-7 rounded object-cover cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => setSelectedItem({ type: 'report', data: report })}
                          />
                        ) : (
                          <span className="text-[#8b949e] text-[10px]">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedItem({ type: 'report', data: report })}
                          className="px-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#58a6ff] rounded text-[11px] font-medium cursor-pointer"
                        >
                          View 15 Qs
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SUPERVISOR VISITS */}
      {mainTab === 'visits' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden space-y-4">
          <div className="p-4 border-b border-[#21262d] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-[#f0f6fc]">All Supervisor Facility Visits ({visits.length})</h3>
            <button
              onClick={() => exportToCSV(visits, 'All_Supervisor_Visits')}
              className="px-3 py-1.5 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl flex items-center space-x-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0d1117] text-[#8b949e] text-[10px] uppercase font-mono tracking-wider">
                <tr>
                  <th className="px-4 py-3">LGA & Center</th>
                  <th className="px-4 py-3">Supervisor</th>
                  <th className="px-4 py-3">Facilitator Visited</th>
                  <th className="px-4 py-3">Date & Time</th>
                  <th className="px-4 py-3">GPS Location</th>
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#21262d]">
                {visits.map(visit => (
                  <tr key={visit.id} className="hover:bg-[#21262d]/40">
                    <td className="px-4 py-3">
                      <p className="font-bold text-[#f0f6fc]">{visit.learningCenterName}</p>
                      <p className="text-[10px] text-[#8b949e]">{visit.lga}</p>
                    </td>
                    <td className="px-4 py-3 text-[#f0f6fc]">{visit.supervisorName}</td>
                    <td className="px-4 py-3 text-[#8b949e]">{visit.facilitatorName}</td>
                    <td className="px-4 py-3 text-[#8b949e]">{format(new Date(visit.date), 'MMM d, yyyy')}</td>
                    <td className="px-4 py-3">
                      {visit.gpsLocation ? (
                        <a 
                          href={`https://www.google.com/maps?q=${visit.gpsLocation.latitude},${visit.gpsLocation.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 text-[#2ea043] hover:underline font-mono text-[10px]"
                        >
                          <MapPin className="w-3 h-3" />
                          <span>GPS Map</span>
                        </a>
                      ) : (
                        <span className="text-gray-500 text-[10px]">No GPS</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {visit.photoUrl ? (
                        <img 
                          src={visit.photoUrl} 
                          alt="Visit student capture" 
                          className="w-7 h-7 rounded object-cover cursor-pointer"
                          onClick={() => setSelectedItem({ type: 'visit', data: visit })}
                        />
                      ) : (
                        <span className="text-[#8b949e] text-[10px]">None</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedItem({ type: 'visit', data: visit })}
                        className="px-2 py-1 bg-[#21262d] hover:bg-[#30363d] text-[#2ea043] rounded text-[11px] font-medium cursor-pointer"
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

      {/* TAB 5: ROLE ACCESS CODES CONFIGURATION */}
      {mainTab === 'codes' && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-5 max-w-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#f0f6fc]">Security & Access Management</h3>
              <p className="text-xs text-[#8b949e] mt-0.5">
                Manage one-time activation codes and administrative credentials.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdminCodes(!showAdminCodes)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-[#30363d] bg-[#0d1117] hover:bg-[#21262d] text-xs text-[#c9d1d9] transition-colors cursor-pointer shrink-0"
            >
              {showAdminCodes ? (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-[#8b949e]" />
                  <span>Mask Password</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-[#8b949e]" />
                  <span>Reveal Password</span>
                </>
              )}
            </button>
          </div>

          {/* Individual Code Explanation Banner */}
          <div className="p-4 bg-[#58a6ff]/10 border border-[#58a6ff]/30 rounded-xl space-y-2">
            <div className="flex items-center space-x-2 text-[#58a6ff] text-xs font-bold">
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>Individual One-Time Codes per Registrant</span>
            </div>
            <p className="text-[11px] text-[#c9d1d9] leading-relaxed">
              Every Facilitator and Supervisor receives a unique personal code upon registration (e.g. <span className="font-mono text-[#58a6ff]">FAC-8421</span> or <span className="font-mono text-[#2ea043]">SUP-3194</span>). When they register, you can view their personal code and copy a WhatsApp/SMS invite message in the <strong>Approvals & Users</strong> tab.
            </p>
            <button
              onClick={() => setMainTab('approvals')}
              className="mt-1 px-3 py-1.5 bg-[#58a6ff] hover:bg-[#58a6ff]/80 text-[#0d1117] text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center space-x-1.5"
            >
              <UsersIcon className="w-3.5 h-3.5" />
              <span>Go to Approvals & User Codes ({pendingUsers.length} Pending)</span>
            </button>
          </div>

          <div className="space-y-4 text-xs pt-2">
            <div className="p-4 bg-[#0d1117] border border-[#21262d] rounded-xl space-y-2">
              <label className="font-semibold text-[#bc8cff] flex items-center justify-between">
                <span>Master Admin Gate Password:</span>
                <span className="font-mono text-[10px] text-[#8b949e]">Required to unlock /admin</span>
              </label>
              <input
                type={showAdminCodes ? 'text' : 'password'}
                value={accessCodes.admin}
                onChange={e => setAccessCodes(prev => ({ ...prev, admin: e.target.value.toUpperCase() }))}
                className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2 text-xs font-mono uppercase text-[#f0f6fc] focus:border-[#bc8cff] focus:outline-none"
              />
              <p className="text-[11px] text-[#8b949e]">
                This is the secure password needed to enter the administrative panel.
              </p>
            </div>

            <button
              onClick={() => {
                setCodeSavedNotice(true);
                setTimeout(() => setCodeSavedNotice(false), 3000);
              }}
              className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Save Admin Settings
            </button>

            {codeSavedNotice && (
              <span className="ml-3 text-xs text-[#2ea043]">Settings saved successfully!</span>
            )}
          </div>
        </div>
      )}


      {/* MODAL: Create New Project Task */}
      {isCreateProjectOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
              <div className="flex items-center space-x-2">
                <FolderKanban className="w-5 h-5 text-[#2ea043]" />
                <h3 className="font-bold text-[#f0f6fc]">Create New Data Collection Project Task</h3>
              </div>
              <button onClick={() => setIsCreateProjectOpen(false)} className="text-[#8b949e] hover:text-[#f0f6fc]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#f0f6fc]">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Q4 Primary Literacy Audit"
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  required
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#f0f6fc]">Project Description</label>
                <textarea
                  placeholder="Objective of this data collection task..."
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-[#f0f6fc]">Target LGA</label>
                  <input
                    type="text"
                    placeholder="e.g. Kano Municipal or All LGAs"
                    value={newProjectLga}
                    onChange={e => setNewProjectLga(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-[#f0f6fc]">Target Submissions Goal</label>
                  <input
                    type="number"
                    value={newProjectTarget}
                    onChange={e => setNewProjectTarget(Number(e.target.value))}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#f0f6fc]">Enumerator & Supervisor Field Guide Instructions</label>
                <textarea
                  value={newProjectGuide}
                  onChange={e => setNewProjectGuide(e.target.value)}
                  rows={3}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
                />
              </div>

              {/* Custom Questions list */}
              <div className="space-y-2 pt-2 border-t border-[#30363d]">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#f0f6fc]">Custom Project Questions ({newProjectQuestions.length})</label>
                  <button
                    type="button"
                    onClick={handleAddQuestionToNewProject}
                    className="px-2 py-1 bg-[#21262d] text-[#58a6ff] rounded text-[11px] font-semibold hover:bg-[#30363d]"
                  >
                    + Add Question
                  </button>
                </div>

                {newProjectQuestions.map((q, idx) => (
                  <div key={q.id} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={q.label}
                      onChange={e => {
                        const val = e.target.value;
                        setNewProjectQuestions(prev => prev.map((item, i) => i === idx ? { ...item, label: val } : item));
                      }}
                      className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-[#f0f6fc]"
                    />
                    <select
                      value={q.type}
                      onChange={e => {
                        const val = e.target.value as any;
                        setNewProjectQuestions(prev => prev.map((item, i) => i === idx ? { ...item, type: val } : item));
                      }}
                      className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-[#f0f6fc]"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="boolean">Yes/No</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setNewProjectQuestions(prev => prev.filter((_, i) => i !== idx))}
                      className="text-red-400 p-1 hover:text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-[#30363d] flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsCreateProjectOpen(false)}
                  className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#238636] hover:bg-[#2ea043] text-white text-xs font-semibold rounded-xl"
                >
                  Launch Project Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl text-[#c9d1d9]">
            <div className="p-4 border-b border-[#30363d] flex items-center justify-between sticky top-0 bg-[#161b22] z-10">
              <h3 className="font-bold text-[#f0f6fc] text-sm">
                {selectedItem.type === 'report' ? 'Facilitator Class Report Details' : 'Supervisor Visit Report Details'}
              </h3>
              <button onClick={() => setSelectedItem(null)} className="text-[#8b949e] hover:text-[#f0f6fc]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {selectedItem.data.photoUrl && (
                <div className="rounded-xl overflow-hidden border border-[#30363d] bg-black">
                  <img src={selectedItem.data.photoUrl} alt="Captured student" className="w-full max-h-72 object-contain" />
                  <div className="p-1.5 bg-[#0d1117] text-[#8b949e] text-[10px] text-center">Field Photo Capture</div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                  <span className="text-[#8b949e]">1. LGA</span>
                  <p className="font-bold text-[#f0f6fc] text-sm mt-0.5">{selectedItem.data.lga}</p>
                </div>
                <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                  <span className="text-[#8b949e]">2. Learning Center</span>
                  <p className="font-bold text-[#f0f6fc] text-sm mt-0.5">{selectedItem.data.learningCenterName}</p>
                </div>
                <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                  <span className="text-[#8b949e]">3. Staff Name</span>
                  <p className="font-bold text-[#f0f6fc] text-sm mt-0.5">
                    {selectedItem.type === 'report' ? selectedItem.data.facilitatorName : selectedItem.data.supervisorName}
                  </p>
                </div>
                <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                  <span className="text-[#8b949e]">4. Date & Time</span>
                  <p className="font-bold text-[#f0f6fc] text-sm mt-0.5">{selectedItem.data.date} {selectedItem.data.time || ''}</p>
                </div>
                <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                  <span className="text-[#8b949e]">5. Total Registered</span>
                  <p className="font-bold font-mono text-[#f0f6fc] text-sm mt-0.5">{selectedItem.data.totalRegisteredLearners || 0}</p>
                </div>
                <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                  <span className="text-[#8b949e]">6. Total Present Today</span>
                  <p className="font-bold font-mono text-[#58a6ff] text-sm mt-0.5">{selectedItem.data.attendance || 0}</p>
                </div>
                <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                  <span className="text-[#8b949e]">7. No. of Boys</span>
                  <p className="font-bold font-mono text-[#f0f6fc] text-sm mt-0.5">{selectedItem.data.boysCount || 0}</p>
                </div>
                <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                  <span className="text-[#8b949e]">8. No. of Girls</span>
                  <p className="font-bold font-mono text-[#f0f6fc] text-sm mt-0.5">{selectedItem.data.girlsCount || 0}</p>
                </div>
                <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                  <span className="text-[#8b949e]">9. Lesson Number</span>
                  <p className="font-bold text-[#f0f6fc] text-sm mt-0.5">{selectedItem.data.lessonNumber || 'N/A'}</p>
                </div>
                <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                  <span className="text-[#8b949e]">10. Lesson Taught</span>
                  <p className="font-bold text-[#f0f6fc] text-sm mt-0.5">{selectedItem.data.topics}</p>
                </div>
                <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl md:col-span-2">
                  <span className="text-[#8b949e]">11. Radio Lesson Delivered?</span>
                  <p className="font-bold text-[#f0f6fc] text-sm mt-0.5">
                    {selectedItem.data.radioLessonDelivered ? 'YES - Delivered' : `NO - ${selectedItem.data.radioLessonReasonNotDelivered || 'Not specified'}`}
                  </p>
                </div>
                <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                  <span className="text-[#8b949e]">12. Lesson Completed?</span>
                  <p className="font-bold text-[#f0f6fc] text-sm mt-0.5">{selectedItem.data.lessonCompleted ? 'YES' : 'NO'}</p>
                </div>
                <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl">
                  <span className="text-[#8b949e]">13. Workbook Used?</span>
                  <p className="font-bold text-[#f0f6fc] text-sm mt-0.5">{selectedItem.data.workbookUsed ? 'YES' : 'NO'}</p>
                </div>
                <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl md:col-span-2">
                  <span className="text-[#8b949e]">14. Learner Understanding</span>
                  <p className="font-bold text-[#f0f6fc] text-sm mt-0.5">{selectedItem.data.learnerUnderstanding || 'Standard comprehension'}</p>
                </div>
                <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-xl md:col-span-2">
                  <span className="text-[#8b949e]">15. Safety Concerns?</span>
                  <p className={cn("font-bold text-sm mt-0.5", selectedItem.data.hasSafetyConcerns ? "text-red-400" : "text-[#2ea043]")}>
                    {selectedItem.data.hasSafetyConcerns ? `YES: ${selectedItem.data.safetyConcernsDetails || 'Flagged'}` : 'NO - All Safe'}
                  </p>
                </div>

                {selectedItem.data.gpsLocation && (
                  <div className="p-3 bg-[#0d1117] border border-[#2ea043]/30 rounded-xl md:col-span-2">
                    <span className="text-[#2ea043] font-mono uppercase font-bold flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1" /> GPS Verification
                    </span>
                    <p className="font-mono text-xs text-[#f0f6fc] mt-1">
                      Lat: {selectedItem.data.gpsLocation.latitude}, Lng: {selectedItem.data.gpsLocation.longitude} (±{selectedItem.data.gpsLocation.accuracy || 10}m)
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${selectedItem.data.gpsLocation.latitude},${selectedItem.data.gpsLocation.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-xs text-[#58a6ff] underline mt-1"
                    >
                      Open in Google Maps <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3 bg-[#0d1117] border-t border-[#30363d] text-right">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <AppDownloadModal 
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </div>
  );
};

export default AdminDashboard;
